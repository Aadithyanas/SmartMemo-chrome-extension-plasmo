interface SaveStatusIndicatorProps {
  saveStatus: "idle" | "saving" | "saved" | "updating" | "updated" | "error"
}

export const SaveStatusIndicator = ({ saveStatus }: SaveStatusIndicatorProps) => {
  if (saveStatus === "idle") return null

  const getStatusConfig = () => {
    switch (saveStatus) {
      case "saving":
        return {
          icon: (
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ),
          text: "Saving...",
          color: "text-blue-400",
        }
      case "saved":
        return {
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          text: "Saved ✓",
          color: "text-green-400",
        }
      case "updating":
        return {
          icon: (
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ),
          text: "Updating...",
          color: "text-purple-400",
        }
      case "updated":
        return {
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          ),
          text: "Updated ✓",
          color: "text-purple-400",
        }
      case "error":
        return {
          icon: (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
          text: "Save Failed",
          color: "text-red-400",
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-xs rounded-full ${config.color} text-xs animate-in fade-in duration-300 ml-2`}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}
