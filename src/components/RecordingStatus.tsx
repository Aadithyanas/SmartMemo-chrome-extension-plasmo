
interface RecordingStatusProps {
  formattedTime: string
  onStopRecording: () => void
}

export const RecordingStatus = ({ formattedTime, onStopRecording }: RecordingStatusProps) => {
  return (
    <div className="flex items-center justify-between animate-in slide-in-from-top duration-500">
      <div className="flex items-center">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3 shadow-lg shadow-red-500/50"></div>
        <span className="text-white text-sm font-medium">Recording {formattedTime}</span>
      </div>
      <button
        onClick={onStopRecording}
        className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white flex items-center justify-center transition-all duration-200 hover:scale-105"
        title="Stop Recording"
      >
        <div className="w-3 h-3 bg-white rounded-xs"></div>
      </button>
    </div>
  )
}
