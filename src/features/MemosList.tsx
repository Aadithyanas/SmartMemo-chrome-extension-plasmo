import { useEffect, useState, useRef } from "react"
import { gsap } from "gsap"
import type { VoiceMemo, MemoListResponse,SaveResponse, DeleteResponse } from "../../types"
import { AudioPlayer } from "../components/AudioPlayer"

interface MemosListProps {
  onEditMemo?: (memo: VoiceMemo) => void
}

const MemosList = ({ onEditMemo }: MemosListProps) => {
  const [memos, setMemos] = useState<VoiceMemo[]>([])
  const [filteredMemos, setFilteredMemos] = useState<VoiceMemo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedMemo, setExpandedMemo] = useState<string | null>(null)
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  
  // Animation refs
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const memosRef = useRef<HTMLDivElement>(null)

  const fetchMemos = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await new Promise<MemoListResponse>((resolve) => {
        if (chrome?.runtime) {
          chrome.runtime.sendMessage({ type: "GET_ALL_MEMOS" }, (response: MemoListResponse) => {
            if (chrome.runtime.lastError) {
              resolve({
                success: false,
                error: chrome.runtime.lastError.message,
              })
            } else {
              resolve(response)
            }
          })
        } else {
          resolve({ success: false, error: "Extension runtime not available" })
        }
      })

      if (response.success && response.memos) {
        const processedMemos = response.memos.map((memo) => ({
          ...memo,
          transcription: memo.transcription?.replace(/\?/g, "(unclear)") || "",
          translation: memo.translation
            ? {
                ...memo.translation,
                text: memo.translation.text?.replace(/\?/g, "(unclear)") || "",
              }
            : undefined,
        }))

        setMemos(processedMemos)
        setFilteredMemos(processedMemos)
        console.log(`Loaded ${processedMemos.length} memos`)
      } else {
        setError(response.error || "Failed to fetch memos")
      }
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Failed to fetch memos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemos()
  }, [])

  useEffect(() => {
    const urls: Record<string, string> = {}

    memos.forEach((memo) => {
      if (memo.audioBlob && memo.audioBlob instanceof Blob) {
        urls[memo.id] = URL.createObjectURL(memo.audioBlob)
        console.log(`Created URL for memo ${memo.id}: ${memo.audioBlob.size} bytes`)
      } else {
        console.warn(`Memo ${memo.id} has invalid audioBlob:`, memo.audioBlob)
      }
    })

    setAudioUrls(urls)

    return () => {
      Object.values(urls).forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [memos])

  // Filter memos based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMemos(memos)
    } else {
      const filtered = memos.filter((memo) =>
        memo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.transcription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.translation?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memo.summary?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredMemos(filtered)
    }
  }, [searchQuery, memos])

  const handleRefresh = () => {
    fetchMemos()
  }

  const handleDeleteMemo = async (memoId: string) => {
    try {
      const response = await new Promise<DeleteResponse>((resolve) => {
        if (typeof window !== "undefined" && window.chrome && window.chrome.runtime) {
          window.chrome.runtime.sendMessage({ type: "DELETE_MEMO", id: memoId }, (response: DeleteResponse) => {
            resolve(response)
          })
        } else {
          resolve({ success: false, error: "Chrome runtime is not available." })
        }
      })

      if (response.success) {
        setMemos((prev) => prev.filter((memo) => memo.id !== memoId))
        
        if (audioUrls[memoId]) {
          URL.revokeObjectURL(audioUrls[memoId])
          setAudioUrls((prev) => {
            const newUrls = { ...prev }
            delete newUrls[memoId]
            return newUrls
          })
        }
      } else {
        setError(response.error || "Failed to delete memo")
      }
    } catch (err) {
      setError("Failed to delete memo")
      console.error("Delete memo error:", err)
    }
  }

  const handleEditMemo = (memo: VoiceMemo) => {
    if (onEditMemo) {
      onEditMemo(memo)
    }
  }

  const handleStartEditingName = (memo: VoiceMemo, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingMemoId(memo.id)
    setEditingName(memo.name)
  }

const handleSaveName = async (memoId: string) => {
  if (!editingName.trim()) return;

  try {
    // Find the original memo first
    const originalMemo = memos.find(memo => memo.id === memoId);
    if (!originalMemo) {
      throw new Error("Memo not found");
    }

    // Create updated memo with ALL original properties plus the new name
    const updatedMemo: VoiceMemo = {
      ...originalMemo,
      name: editingName.trim()
    };

    console.log("Sending updated memo:", updatedMemo);

    // Send update to background script
    const response: SaveResponse = await new Promise((resolve, reject) => {
      if (!chrome?.runtime) {
        reject(new Error("Chrome runtime not available"));
        return;
      }

      chrome.runtime.sendMessage(
        {
          type: "UPDATE_MEMO_NAME",
          updatedMemo: updatedMemo
        },
        (response: SaveResponse) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!response) {
            reject(new Error("No response received"));
          } else {
            resolve(response);
          }
        }
      );
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to update memo");
    }

    // Update local state with the saved memo (if returned) or our updated version
    const finalMemo = response.memo || updatedMemo;
    
    setMemos(prev =>
      prev.map(memo => 
        memo.id === memoId ? finalMemo : memo
      )
    );

    console.log("Memo name updated successfully:", finalMemo);
    setEditingMemoId(null);
    setEditingName("");

  } catch (err) {
    console.error("Failed to update memo name:", err);
    setError(`Failed to update memo name: ${err instanceof Error ? err.message : 'Unknown error'}`);
    
    // Revert optimistic update by refetching
    fetchMemos();
  }
};


  const handleCancelEdit = () => {
    setEditingMemoId(null)
    setEditingName("")
  }

  const toggleExpanded = (memoId: string) => {
    setExpandedMemo(expandedMemo === memoId ? null : memoId)
  }

  // GSAP animations
  useEffect(() => {
    if (memosRef.current && filteredMemos.length > 0) {
      const memoElements = memosRef.current.querySelectorAll('.memo-item')
      
      gsap.fromTo(memoElements, 
        { opacity: 0, y: 20, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.4, 
          stagger: 0.1,
          ease: "power2.out"
        }
      )
    }
  }, [filteredMemos])

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      )
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Today"
    if (diffDays === 2) return "Yesterday"
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm font-medium">Loading memos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6">
        <div className="text-center bg-gray-50 rounded-2xl p-8 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Memos</h3>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full">
      <div className="h-full flex flex-col">
        {/* Header with Search */}
        <div ref={searchRef} className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/30 px-6 py-5 z-10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Voice Memos</h1>
              <p className="text-gray-500 text-sm font-medium">{filteredMemos.length} memo{filteredMemos.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search memos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {filteredMemos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? `No memos found` : "No voice memos yet"}
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              {searchQuery ? `No memos match "${searchQuery}"` : "Start recording your first voice memo!"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-all duration-200"
              >
                Refresh
              </button>
            )}
          </div>
        ) : (
          <div ref={memosRef} className="space-y-2 p-4">
            {filteredMemos.map((memo) => (
              <div key={memo.id} className="memo-item group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
                <div
                  className="px-4 py-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
                  onClick={() => toggleExpanded(memo.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2a3 3 0 00-3 3v6a3 3 0 006 0V5a3 3 0 00-3-3z" />
                          <path d="M19 10v1a7 7 0 01-14 0v-1a1 1 0 112 0v1a5 5 0 0010 0v-1a1 1 0 012 0z" />
                          <path d="M12 18.5a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingMemoId === memo.id ? (
                          <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName(memo.id)
                                if (e.key === 'Escape') handleCancelEdit()
                              }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">{memo.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(memo.date)}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {memo.duration}s
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingMemoId === memo.id ? (
                      <>
                        {/* Save Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveName(memo.id)
                          }}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                          title="Save"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        
                        {/* Cancel Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelEdit()
                          }}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Cancel"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit Button */}
                        <button
                          onClick={(e) => handleStartEditingName(memo, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                          title="Edit memo name"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteMemo(memo.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete memo"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </>
                    )}

                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                          expandedMemo === memo.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {expandedMemo === memo.id && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200 fade-in-up">
                    <div className="space-y-3 pt-4">
                      {memo.transcription && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7" />
                              </svg>
                            </div>
                            <span className="text-sm">Transcription</span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{memo.transcription}</p>
                        </div>
                      )}

                      {memo.translation && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                              </svg>
                            </div>
                            <span className="text-sm">Translation ({memo.translation.language})</span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{memo.translation.text}</p>
                        </div>
                      )}

                      {memo.summary && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <span className="text-sm">Summary</span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">{memo.summary}</p>
                        </div>
                      )}

                      {/* Audio Player */}
                      {audioUrls[memo.id] && (
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                            </div>
                            <span className="text-sm">Audio Playback</span>
                          </div>
                          <AudioPlayer audioUrl={audioUrls[memo.id]} />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleEditMemo(memo)}
                        className="w-full px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Memo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style >{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default MemosList