export const ProcessingStatus = () => {
  return (
    <div className="flex items-center justify-center animate-in fade-in duration-300">
      <svg className="animate-spin w-4 h-4 text-white mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      <span className="text-white text-sm font-medium">Processing audio...</span>
    </div>
  )
}
