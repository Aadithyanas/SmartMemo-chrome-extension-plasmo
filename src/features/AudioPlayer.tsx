// "use client"

// import type React from "react"

// import { useEffect, useRef, useState } from "react"

// interface AudioPlayerProps {
//   audioBlob: Blob
// }

// export const AudioPlayer = ({ audioBlob }: AudioPlayerProps) => {
//   const audioRef = useRef<HTMLAudioElement>(null)
//   const [audioUrl, setAudioUrl] = useState<string>("")
//   const [isPlaying, setIsPlaying] = useState(false)
//   const [currentTime, setCurrentTime] = useState(0)
//   const [duration, setDuration] = useState(0)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string>("")

//   useEffect(() => {
//     if (!audioBlob) {
//       setError("No audio data provided")
//       setLoading(false)
//       return
//     }

//     try {
//       const url = URL.createObjectURL(audioBlob)
//       setAudioUrl(url)
//       setError("")

//       return () => {
//         URL.revokeObjectURL(url)
//       }
//     } catch (err) {
//       console.error("Error creating audio URL:", err)
//       setError("Failed to create audio URL")
//       setLoading(false)
//     }
//   }, [audioBlob])

//   useEffect(() => {
//     const audio = audioRef.current
//     if (!audio) return

//     const handleLoadedMetadata = () => {
//       setDuration(audio.duration)
//       setLoading(false)
//     }

//     const handleTimeUpdate = () => {
//       setCurrentTime(audio.currentTime)
//     }

//     const handleEnded = () => {
//       setIsPlaying(false)
//       setCurrentTime(0)
//     }

//     const handleError = (e: Event) => {
//       console.error("Audio error:", e)
//       setError("Failed to load audio")
//       setLoading(false)
//     }

//     const handleCanPlay = () => {
//       setLoading(false)
//     }

//     audio.addEventListener("loadedmetadata", handleLoadedMetadata)
//     audio.addEventListener("timeupdate", handleTimeUpdate)
//     audio.addEventListener("ended", handleEnded)
//     audio.addEventListener("error", handleError)
//     audio.addEventListener("canplay", handleCanPlay)

//     return () => {
//       audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
//       audio.removeEventListener("timeupdate", handleTimeUpdate)
//       audio.removeEventListener("ended", handleEnded)
//       audio.removeEventListener("error", handleError)
//       audio.removeEventListener("canplay", handleCanPlay)
//     }
//   }, [audioUrl])

//   const togglePlayPause = async () => {
//     const audio = audioRef.current
//     if (!audio) return

//     try {
//       if (isPlaying) {
//         audio.pause()
//         setIsPlaying(false)
//       } else {
//         await audio.play()
//         setIsPlaying(true)
//       }
//     } catch (err) {
//       console.error("Error playing audio:", err)
//       setError("Failed to play audio")
//     }
//   }

//   const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const audio = audioRef.current
//     if (!audio) return

//     const newTime = Number.parseFloat(e.target.value)
//     audio.currentTime = newTime
//     setCurrentTime(newTime)
//   }

//   const formatTime = (time: number) => {
//     const minutes = Math.floor(time / 60)
//     const seconds = Math.floor(time % 60)
//     return `${minutes}:${seconds.toString().padStart(2, "0")}`
//   }

//   if (error) {
//     return (
//       <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//         <div className="text-red-600 text-sm">{error}</div>
//       </div>
//     )
//   }

//   return (
//     <div className="bg-gray-50 rounded-lg p-4 border">
//       <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />

//       <div className="flex items-center gap-3">
//         <button
//           onClick={togglePlayPause}
//           disabled={loading || !audioUrl}
//           className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors"
//         >
//           {loading ? (
//             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//           ) : isPlaying ? (
//             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//               <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
//             </svg>
//           ) : (
//             <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
//               <path d="M8 5v14l11-7z" />
//             </svg>
//           )}
//         </button>

//         <div className="flex-1">
//           <input
//             type="range"
//             min="0"
//             max={duration || 0}
//             value={currentTime}
//             onChange={handleSeek}
//             disabled={loading || !audioUrl}
//             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//           />
//           <div className="flex justify-between text-xs text-gray-500 mt-1">
//             <span>{formatTime(currentTime)}</span>
//             <span>{formatTime(duration)}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
