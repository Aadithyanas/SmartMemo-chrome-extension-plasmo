
import type React from "react"

import { useState, useRef, useEffect } from "react"
import { WaveformAudioPlayer } from "./WaveFormAudioPLayer.jsx"
import { Globe, FileText, Tag, Clock, Copy, Check, AlertTriangle, Loader2 } from "lucide-react"

interface AudioPlayerProps {
  audioBlob: Blob
}

export const AudioPlayer = ({ audioBlob }: AudioPlayerProps) => {

  console.log("AudioBlob inside the Audiobar",audioBlob)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Create audio URL from blob
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
      setIsLoading(false)

      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [audioBlob])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    const handleWaiting = () => {
      setIsLoading(true)
    }

    const handleCanPlayThrough = () => {
      setIsLoading(false)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("waiting", handleWaiting)
    audio.addEventListener("canplaythrough", handleCanPlayThrough)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("waiting", handleWaiting)
      audio.removeEventListener("canplaythrough", handleCanPlayThrough)
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const newTime = (clickX / width) * duration

    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }
   console.log(audioUrl)

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (isLoading && !audioUrl) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
        <span className="text-white/70 text-xs ml-2">Loading audio...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-2">
       {audioUrl && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          
          </div>
          <WaveformAudioPlayer
            audioUrl={audioUrl}
            waveColor="#6366f1"
            progressColor="#8b5cf6"
            cursorColor="#7c3aed"
            height={40}
          />
         
        </div>
      )}
      
    </div>
  )
}
