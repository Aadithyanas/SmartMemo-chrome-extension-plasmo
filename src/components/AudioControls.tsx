

interface AudioControlsProps {
  onTranscribe: () => void
  onReset: () => void
}

export const AudioControls = ({ onTranscribe, onReset }: AudioControlsProps) => {
  return (
    <div className="space-y-3 animate-in slide-in-from-bottom duration-500">
      <div className="flex items-center justify-between">
        <span className="text-white text-sm font-medium flex items-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
          Audio ready
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onTranscribe}
            className="px-4 py-1.5 bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs rounded-full transition-all duration-200 transform hover:scale-105"
          >
            Transcribe
          </button>
          <button
            onClick={onReset}
            className="w-6 h-6 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            title="Cancel"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
