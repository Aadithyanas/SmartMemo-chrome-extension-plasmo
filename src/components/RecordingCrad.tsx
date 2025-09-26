// "use client"

// import { useAudioRecorder } from "hooks/useAudioRecorder"
// import { useState, useRef, useEffect } from "react"
// import { AudioPlayer } from "./AudioPlayer"
// import type { VoiceMemo, SaveResponse, TranscriptionResponse } from "../../types"
// import TranslateText from "./TranslateText"
// import SummaryText from "./SummaryText"

// declare const chrome: any

// interface RecordingCardProps {
//   editingMemo?: VoiceMemo | null
//   onEditComplete?: () => void
// }

// export const RecordingCard = ({ editingMemo, onEditComplete }: RecordingCardProps) => {
//   const { isRecording, recordingTime, formattedTime, startRecording, stopRecording, reset } = useAudioRecorder()
//   const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
//   const [processing, setProcessing] = useState<boolean>(false)
//   const [error, setError] = useState<string | null>(null)
//   const [transcription, setTranscription] = useState<string | null>(null)
//   const [showTranslation, setShowTranslation] = useState<boolean>(false)
//   const [showSummary, setShowSummary] = useState<boolean>(false)
//   const [targetLanguage, setTargetLanguage] = useState<string>("es")
//   const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false)
//   const dropdownRef = useRef<HTMLDivElement>(null)
//   const [currentMemo, setCurrentMemo] = useState<VoiceMemo | null>(null)

//   const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "updating" | "updated" | "error">("idle")
//   const [savedMemoId, setSavedMemoId] = useState<string | null>(null)
//   const [translatedText, setTranslatedText] = useState<string | null>(null)
//   const [summaryText, setSummaryText] = useState<string | null>(null)
//   const [isEditMode, setIsEditMode] = useState<boolean>(false)

//   const languageOptions = [
//     { value: "es", label: "Spanish", flag: "🇪🇸" },
//     { value: "fr", label: "French", flag: "🇫🇷" },
//     { value: "de", label: "German", flag: "🇩🇪" },
//     { value: "it", label: "Italian", flag: "🇮🇹" },
//     { value: "pt", label: "Portuguese", flag: "🇵🇹" },
//     { value: "ru", label: "Russian", flag: "🇷🇺" },
//     { value: "zh", label: "Chinese", flag: "🇨🇳" },
//     { value: "ja", label: "Japanese", flag: "🇯🇵" },
//     { value: "ar", label: "Arabic", flag: "🇸🇦" },
//     { value: "hi", label: "Hindi", flag: "🇮🇳" },
//   ]

//   // Load editing memo data
//   useEffect(() => {
//     if (editingMemo) {
//       console.log("Loading memo for editing:", editingMemo)
//       setIsEditMode(true)
//       setAudioBlob(editingMemo.audioBlob || null)
//       setTranscription(editingMemo.transcription || null)
//       setCurrentMemo(editingMemo)
//       setSavedMemoId(editingMemo.id)

//       // Load existing translation if available
//       if (editingMemo.translation) {
//         setTranslatedText(editingMemo.translation.text)
//         setTargetLanguage(editingMemo.translation.language)
//         setShowTranslation(true)
//       }

//       // Load existing summary if available
//       if (editingMemo.summary) {
//         setSummaryText(editingMemo.summary)
//         setShowSummary(true)
//       }

//       setSaveStatus("idle")
//     }
//   }, [editingMemo])

//   // Convert Blob to ArrayBuffer for Chrome message passing
//   const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader()
//       reader.onload = () => resolve(reader.result as ArrayBuffer)
//       reader.onerror = reject
//       reader.readAsArrayBuffer(blob)
//     })
//   }

//   // Auto-save transcription when it becomes available (only for new recordings)
//   useEffect(() => {
//     const autoSave = async () => {
//       if (!audioBlob || !transcription || saveStatus === "saving" || savedMemoId || isEditMode) {
//         return
//       }

//       console.log("Starting auto-save process...")
//       setSaveStatus("saving")

//       try {
//         // Convert blob to ArrayBuffer for message passing
//         const audioArrayBuffer = await blobToArrayBuffer(audioBlob)

//         // Create serializable audio data
//         const audioData = {
//           buffer: audioArrayBuffer,
//           type: audioBlob.type,
//           size: audioBlob.size,
//         }

//         console.log("Sending save request to background script...")

//         const response = await new Promise<SaveResponse>((resolve) => {
//           chrome.runtime.sendMessage(
//             {
//               type: "TranscriptStoring",
//               audioData,
//               transcription,
//               recordingTime,
//             },
//             (response: SaveResponse) => {
//               if (chrome.runtime.lastError) {
//                 console.error("Chrome runtime error:", chrome.runtime.lastError)
//                 resolve({ success: false, error: chrome.runtime.lastError.message })
//               } else {
//                 resolve(response)
//               }
//             },
//           )
//         })

//         console.log("Save response received:", response)

//         if (response.success && response.memo) {
//           const savedMemo = response.memo
//           setSavedMemoId(savedMemo.id)
//           setCurrentMemo(savedMemo)
//           setSaveStatus("saved")
//           console.log("Memo saved successfully:", savedMemo.id)

//           // Reset status after showing success
//           setTimeout(() => {
//             setSaveStatus("idle")
//           }, 3000)
//         } else {
//           console.error("Save failed:", response.error)
//           setError(`Failed to save memo: ${response.error}`)
//           setSaveStatus("error")

//           setTimeout(() => {
//             setSaveStatus("idle")
//           }, 3000)
//         }
//       } catch (error) {
//         console.error("Failed to auto-save memo:", error)
//         setError("Failed to save memo")
//         setSaveStatus("error")

//         setTimeout(() => {
//           setSaveStatus("idle")
//         }, 3000)
//       }
//     }

//     if (transcription && audioBlob && !savedMemoId && saveStatus === "idle" && !isEditMode) {
//       autoSave()
//     }
//   }, [transcription, audioBlob, recordingTime, savedMemoId, saveStatus, isEditMode])

//   const handleStartRecording = async () => {
//     setError(null)
//     setTranscription(null)
//     setShowTranslation(false)
//     setShowSummary(false)
//     setCurrentMemo(null)
//     setSavedMemoId(null)
//     setTranslatedText(null)
//     setSummaryText(null)
//     setSaveStatus("idle")
//     setIsEditMode(false)

//     try {
//       await startRecording()
//     } catch (error) {
//       console.error("Recording error:", error)
//       setError("Could not access microphone")
//     }
//   }

//   const handleStopRecording = async () => {
//     try {
//       const blob = await stopRecording()
//       setAudioBlob(blob)
//       console.log("Recording stopped, blob created:", blob.size, "bytes")
//     } catch (error) {
//       console.error("Error stopping recording:", error)
//       setError("Error stopping recording.")
//     }
//   }

//   function blobToBase64(blob: Blob): Promise<string> {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader()
//       reader.onloadend = () => {
//         const result = reader.result as string
//         const base64 = result.split(",")[1]
//         if (!base64) {
//           reject("Base64 conversion failed")
//         } else {
//           resolve(base64)
//         }
//       }
//       reader.onerror = reject
//       reader.readAsDataURL(blob)
//     })
//   }

//   async function handleAudioTranscription() {
//     setProcessing(true)
//     setShowTranslation(false)
//     setShowSummary(false)
//     setTranslatedText(null)
//     setSummaryText(null)

//     try {
//       const base64 = await blobToBase64(audioBlob!)
//       const mimeType = audioBlob!.type

//       console.log("Starting transcription...")

//       const response = await new Promise<TranscriptionResponse>((resolve) => {
//         chrome.runtime.sendMessage(
//           {
//             type: "TRANSCRIBE_AUDIO_BASE64",
//             base64Audio: base64,
//             mimeType,
//           },
//           (response: TranscriptionResponse) => {
//             if (chrome.runtime.lastError) {
//               resolve({ success: false, error: chrome.runtime.lastError.message })
//             } else {
//               resolve(response)
//             }
//           },
//         )
//       })

//       setProcessing(false)

//       if (response.success && response.text) {
//         setTranscription(response.text)
//         console.log("Transcribed text:", response.text)
//       } else {
//         setError(response.error || "Transcription failed")
//         console.error("Transcription failed:", response.error)
//       }
//     } catch (err) {
//       setProcessing(false)
//       setError("Failed to process audio")
//       console.error("Audio processing error:", err)
//     }
//   }

//   const handleLanguageSelect = (langValue: string) => {
//     console.log("Language selected:", langValue)
//     setTargetLanguage(langValue)
//     setShowLanguageDropdown(false)
//     setTranslatedText(null)
//   }

//   const handleTranslationUpdate = async (translatedText: string) => {
//     setTranslatedText(translatedText)

//     if (savedMemoId && currentMemo) {
//       setSaveStatus("updating")

//       const updatedMemo = {
//         ...currentMemo,
//         translation: {
//           language: targetLanguage,
//           text: translatedText,
//         },
//       }

//       try {
//         const response = await new Promise<SaveResponse>((resolve) => {
//           chrome.runtime.sendMessage({ type: "TRANSLATE_UPDATE", memo: updatedMemo }, (response: SaveResponse) => {
//             if (chrome.runtime.lastError) {
//               resolve({ success: false, error: chrome.runtime.lastError.message })
//             } else {
//               resolve(response)
//             }
//           })
//         })

//         if (response.success && response.memo) {
//           setCurrentMemo(response.memo)
//           setSaveStatus("updated")
//           console.log("Translation updated successfully")
//         } else {
//           console.error("Failed to update translation:", response.error)
//           setSaveStatus("error")
//         }
//       } catch (err) {
//         console.error("Failed to send translation update:", err)
//         setSaveStatus("error")
//       }

//       setTimeout(() => {
//         setSaveStatus("idle")
//       }, 2000)
//     }
//   }

//   const handleSummaryUpdate = async (summaryText: string) => {
//     setSummaryText(summaryText)

//     if (savedMemoId && currentMemo) {
//       setSaveStatus("updating")

//       const updatedMemo = {
//         ...currentMemo,
//         summary: summaryText,
//       }

//       try {
//         const response = await new Promise<SaveResponse>((resolve) => {
//           chrome.runtime.sendMessage({ type: "SUMMARY_UPDATE", memo: updatedMemo }, (response: SaveResponse) => {
//             if (chrome.runtime.lastError) {
//               resolve({ success: false, error: chrome.runtime.lastError.message })
//             } else {
//               resolve(response)
//             }
//           })
//         })

//         if (response.success && response.memo) {
//           setCurrentMemo(response.memo)
//           setSaveStatus("updated")
//           console.log("Summary updated successfully")
//         } else {
//           console.error("Failed to update summary:", response.error)
//           setSaveStatus("error")
//         }
//       } catch (err) {
//         console.error("Failed to send summary update:", err)
//         setSaveStatus("error")
//       }

//       setTimeout(() => {
//         setSaveStatus("idle")
//       }, 2000)
//     }
//   }

//   const handleReset = () => {
//     reset()
//     setAudioBlob(null)
//     setTranscription(null)
//     setError(null)
//     setShowTranslation(false)
//     setShowSummary(false)
//     setShowLanguageDropdown(false)
//     setSaveStatus("idle")
//     setSavedMemoId(null)
//     setTranslatedText(null)
//     setSummaryText(null)
//     setCurrentMemo(null)
//     setIsEditMode(false)

//     if (onEditComplete) {
//       onEditComplete()
//     }
//   }

//   const handleExitEdit = () => {
//     setIsEditMode(false)
//     setAudioBlob(null)
//     setTranscription(null)
//     setError(null)
//     setShowTranslation(false)
//     setShowSummary(false)
//     setShowLanguageDropdown(false)
//     setSaveStatus("idle")
//     setSavedMemoId(null)
//     setTranslatedText(null)
//     setSummaryText(null)
//     setCurrentMemo(null)

//     if (onEditComplete) {
//       onEditComplete()
//     }
//   }

//   const toggleTranslation = () => {
//     setShowTranslation(!showTranslation)
//   }

//   const toggleSummary = () => {
//     setShowSummary(!showSummary)
//   }

//   const selectedLanguage = languageOptions.find((lang) => lang.value === targetLanguage) || languageOptions[0]

//   // Dynamic states for different UI configurations
//   const isIdle = !isRecording && !audioBlob && !transcription && !processing && !error && !isEditMode
//   const isActive = isRecording || audioBlob || processing || error || isEditMode
//   const hasContent = transcription && transcription.length > 0
//   const isExpanded = hasContent || showTranslation || showSummary

//   // Save status indicator component
//   const SaveStatusIndicator = () => {
//     if (saveStatus === "idle") return null

//     const getStatusConfig = () => {
//       switch (saveStatus) {
//         case "saving":
//           return {
//             icon: (
//               <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                 ></path>
//               </svg>
//             ),
//             text: "Saving...",
//             color: "text-blue-400",
//           }
//         case "saved":
//           return {
//             icon: (
//               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//               </svg>
//             ),
//             text: "Saved ✓",
//             color: "text-green-400",
//           }
//         case "updating":
//           return {
//             icon: (
//               <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                 ></path>
//               </svg>
//             ),
//             text: "Updating...",
//             color: "text-purple-400",
//           }
//         case "updated":
//           return {
//             icon: (
//               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
//                 />
//               </svg>
//             ),
//             text: "Updated ✓",
//             color: "text-purple-400",
//           }
//         case "error":
//           return {
//             icon: (
//               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
//                 />
//               </svg>
//             ),
//             text: "Save Failed",
//             color: "text-red-400",
//           }
//         default:
//           return null
//       }
//     }

//     const config = getStatusConfig()
//     if (!config) return null

//     return (
//       <div
//         className={`flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-xs rounded-full ${config.color} text-xs animate-in fade-in duration-300 ml-2`}
//       >
//         {config.icon}
//         <span>{config.text}</span>
//       </div>
//     )
//   }

//   return (
//     <div className="z-50">
//       <div
//         className={`
//           relative transition-all duration-700 ease-out transform-gpu
//           ${
//             isIdle
//               ? "bg-black/90 backdrop-blur-xl rounded-full w-12 h-12"
//               : isExpanded
//                 ? "bg-black/95 backdrop-blur-2xl rounded-3xl w-80 min-h-[120px] p-4"
//                 : isActive
//                   ? "bg-black/90 backdrop-blur-xl rounded-full px-6 py-3 min-w-[180px]"
//                   : "bg-black/90 backdrop-blur-xl rounded-full w-12 h-12"
//           }
//         `}
//         style={{
//           backdropFilter: "blur(24px)",
//           WebkitBackdropFilter: "blur(24px)",
//           border: "1px solid rgba(255,255,255,0.15)",
//           boxShadow: isExpanded
//             ? "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
//             : "0 8px 32px rgba(0,0,0,0.4)",
//         }}
//       >
//         {/* Error State */}
//         {error && (
//           <div className="flex items-center justify-center text-red-400 text-sm font-medium">
//             <svg className="w-4 h-4 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
//               <path
//                 fillRule="evenodd"
//                 d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//                 clipRule="evenodd"
//               />
//             </svg>
//             {error}
//           </div>
//         )}

//         {/* Initial State - Mic Button */}
//         {isIdle && (
//           <div className="w-full h-full flex items-center justify-center">
//             <button
//               onClick={handleStartRecording}
//               className="w-8 h-8 rounded-full bg-linear-to-br from-red-500 via-red-600 to-pink-600 hover:from-red-600 hover:via-red-700 hover:to-pink-700 text-white flex items-center justify-center shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-110 active:scale-95"
//               title="Start Recording"
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 className="h-4 w-4"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
//                 />
//               </svg>
//             </button>
//           </div>
//         )}

//         {/* Recording State */}
//         {isRecording && (
//           <div className="flex items-center justify-between animate-in slide-in-from-top duration-500">
//             <div className="flex items-center">
//               <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3 shadow-lg shadow-red-500/50"></div>
//               <span className="text-white text-sm font-medium">Recording {formattedTime}</span>
//             </div>
//             <button
//               onClick={handleStopRecording}
//               className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white flex items-center justify-center transition-all duration-200 hover:scale-105"
//               title="Stop Recording"
//             >
//               <div className="w-3 h-3 bg-white rounded-xs"></div>
//             </button>
//           </div>
//         )}

//         {/* Audio Ready State */}
//         {audioBlob && !isRecording && !transcription && !processing && !isEditMode && (
//           <div className="space-y-3 animate-in slide-in-from-bottom duration-500">
//             <div className="flex items-center justify-between">
//               <span className="text-white text-sm font-medium flex items-center">
//                 <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
//                 Audio ready
//               </span>
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={handleAudioTranscription}
//                   className="px-4 py-1.5 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs rounded-full transition-all duration-200 transform hover:scale-105"
//                 >
//                   Transcribe
//                 </button>
//                 <button
//                   onClick={handleReset}
//                   className="w-6 h-6 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
//                   title="Cancel"
//                 >
//                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Processing State */}
//         {processing && (
//           <div className="flex items-center justify-center animate-in fade-in duration-300">
//             <svg className="animate-spin w-4 h-4 text-white mr-2" fill="none" viewBox="0 0 24 24">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//               ></path>
//             </svg>
//             <span className="text-white text-sm font-medium">Processing audio...</span>
//           </div>
//         )}

//         {/* Expanded State with Transcription */}
//         {hasContent && (
//           <div className="space-y-4 animate-in slide-in-from-bottom duration-700">
//             <div className="flex items-center">
//               <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
//               <span className="text-white/90 text-sm font-semibold">
//                 {isEditMode ? "Editing Memo" : "Transcription"}
//               </span>
//               <SaveStatusIndicator />
//             </div>

//             {/* Header with controls */}
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 {/* Language Dropdown */}
//                 <div className="relative" ref={dropdownRef}>
//                   <button
//                     onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
//                     className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs rounded-full transition-all duration-200 border border-white/20 hover:border-white/30"
//                     type="button"
//                   >
//                     <span className="text-xs">{selectedLanguage.flag}</span>
//                     <span className="hidden sm:inline">{selectedLanguage.label}</span>
//                     <svg
//                       className={`w-3 h-3 transition-transform duration-200 ${showLanguageDropdown ? "rotate-180" : ""}`}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </button>

//                   {showLanguageDropdown && (
//                     <div className="absolute top-full mt-2 right-0 bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 min-w-40 animate-in slide-in-from-top duration-200">
//                       <div className="py-2 max-h-48 overflow-y-auto">
//                         {languageOptions.map((lang) => (
//                           <button
//                             key={lang.value}
//                             onClick={() => handleLanguageSelect(lang.value)}
//                             type="button"
//                             className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors duration-150 flex items-center gap-2 ${
//                               targetLanguage === lang.value ? "bg-white/20 text-white" : "text-white/80"
//                             }`}
//                           >
//                             <span>{lang.flag}</span>
//                             <span>{lang.label}</span>
//                           </button>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Summary Button */}
//                 <button
//                   onClick={toggleSummary}
//                   className={`px-3 py-1.5 bg-linear-to-r transition-all duration-300 text-white text-xs rounded-full transform hover:scale-105 ${
//                     showSummary
//                       ? "from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25"
//                       : "from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/25"
//                   }`}
//                 >
//                   {showSummary ? "Hide Summary" : "Summarize"}
//                 </button>

//                 {/* Translate Button */}
//                 <button
//                   onClick={toggleTranslation}
//                   className={`px-3 py-1.5 bg-linear-to-r transition-all duration-300 text-white text-xs rounded-full transform hover:scale-105 ${
//                     showTranslation
//                       ? "from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
//                       : "from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25"
//                   }`}
//                 >
//                   {showTranslation ? "Hide" : "Translate"}
//                 </button>

//                 {/* Exit Edit Button (only in edit mode) */}
//                 {isEditMode && (
//                   <button
//                     onClick={handleExitEdit}
//                     className="w-7 h-7 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
//                     title="Exit Edit Mode"
//                   >
//                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                     </svg>
//                   </button>
//                 )}

//                 {/* Reset Button (only for new recordings) */}
//                 {!isEditMode && (
//                   <button
//                     onClick={handleReset}
//                     className="w-7 h-7 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
//                     title="Record New"
//                   >
//                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
//                       />
//                     </svg>
//                   </button>
//                 )}
//               </div>
//             </div>

//             {/* Audio Player */}
//             {audioBlob && (
//               <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
//                 <AudioPlayer audioBlob={audioBlob} />
//               </div>
//             )}

//             {/* Transcription Text */}
//             <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
//               <p className="text-white text-sm leading-relaxed font-medium">{transcription}</p>
//             </div>

//             {/* Summary */}
//             {showSummary && (
//               <div className="animate-in slide-in-from-bottom duration-500 space-y-2">
//                 <div className="flex items-center">
//                   <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse shadow-lg shadow-orange-400/50"></div>
//                   <span className="text-white/90 text-sm font-semibold">Summary</span>
//                 </div>
//                 <div className="bg-linear-to-br from-orange-500/15 to-red-500/15 backdrop-blur-xs rounded-2xl p-4 border border-orange-400/30 shadow-lg shadow-orange-500/10">
//                   <SummaryText text={transcription} onSummaryComplete={handleSummaryUpdate} />
//                 </div>
//               </div>
//             )}

//             {/* Translation */}
//             {showTranslation && (
//               <div className="animate-in slide-in-from-bottom duration-500 space-y-2">
//                 <div className="flex items-center">
//                   <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse shadow-lg shadow-purple-400/50"></div>
//                   <span className="text-white/90 text-sm font-semibold">Translation ({selectedLanguage.label})</span>
//                 </div>
//                 <div className="bg-linear-to-br from-purple-500/15 to-pink-500/15 backdrop-blur-xs rounded-2xl p-4 border border-purple-400/30 shadow-lg shadow-purple-500/10">
//                   <TranslateText
//                     text={transcription}
//                     target={targetLanguage}
//                     onTranslationComplete={handleTranslationUpdate}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }
