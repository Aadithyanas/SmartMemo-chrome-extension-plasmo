

interface ActionButtonsProps {
  showSummary: boolean
  showTranslation: boolean
  onToggleSummary: () => void
  onToggleTranslation: () => void
}

export const ActionButtons = ({
  showSummary,
  showTranslation,
  onToggleSummary,
  onToggleTranslation,
}: ActionButtonsProps) => {
  return (
    <>
      {/* Summary Button */}
      <button
        onClick={onToggleSummary}
        className={`px-3 py-1.5 bg-linear-to-r transition-all duration-300 text-white text-xs rounded-full transform hover:scale-105 ${showSummary
            ? "from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25"
            : "from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/25"
          }`}
      >
        {showSummary ? "Clear Summary" : "Summarize"}
      </button>

      {/* Translate Button */}
      <button
        onClick={onToggleTranslation}
        className={`px-3 py-1.5 bg-linear-to-r transition-all duration-300 text-white text-xs rounded-full transform hover:scale-105 ${showTranslation
            ? "from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
            : "from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25"
          }`}
      >
        {showTranslation ? "Clear Translate":"Translate"}
      </button>
    </>
  )
}
