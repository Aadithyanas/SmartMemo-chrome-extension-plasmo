
interface ControlButtonsProps {
  isEditMode: boolean
  onExitEdit: () => void
  onReset: () => void
}

export const ControlButtons = ({ isEditMode, onExitEdit, onReset }: ControlButtonsProps) => {
  return (
    <>
      {/* Exit Edit Button (only in edit mode) */}
      {isEditMode && (
        <button
          onClick={onExitEdit}
          className="w-7 h-7 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
          title="Exit Edit Mode"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Reset Button (only for new recordings) */}
      {!isEditMode && (
        <button
          onClick={onReset}
          className="w-7 h-7 bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
          title="Record New"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </button>
      )}
    </>
  )
}
