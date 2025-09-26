

interface RecordingButtonProps {
  onStartRecording: () => void
}

export const RecordingButton = ({ onStartRecording }: RecordingButtonProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <button
        onClick={onStartRecording}
        className="w-8 h-8 rounded-full bg-linear-to-br from-red-500 via-red-600 to-pink-600 hover:from-red-600 hover:via-red-700 hover:to-pink-700 text-white flex items-center justify-center shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-110 active:scale-95"
        title="Start Recording"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>
    </div>
  )
}
