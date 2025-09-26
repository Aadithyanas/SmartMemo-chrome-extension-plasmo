

import type { RefObject } from "react"

interface LanguageOption {
  value: string
  label: string
  flag: string
}

interface LanguageSelectorProps {
  selectedLanguage: LanguageOption
  languageOptions: LanguageOption[]
  showLanguageDropdown: boolean
  dropdownRef: RefObject<HTMLDivElement>
  onToggleDropdown: () => void
  onLanguageSelect: (langValue: string) => void
  targetLanguage: string
}

export const LanguageSelector = ({
  selectedLanguage,
  languageOptions,
  showLanguageDropdown,
  dropdownRef,
  onToggleDropdown,
  onLanguageSelect,
  targetLanguage,
}: LanguageSelectorProps) => {
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggleDropdown}
        className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs rounded-full transition-all duration-200 border border-white/20 hover:border-white/30"
        type="button"
      >
        <span className="text-xs">{selectedLanguage.flag}</span>
        <span className="hidden sm:inline">{selectedLanguage.label}</span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${showLanguageDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showLanguageDropdown && (
        <div className="absolute top-full mt-2 left-10 bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl z-50 min-w-40 animate-in slide-in-from-top duration-200">
          <div className="py-2 max-h-48 overflow-y-auto">
            {languageOptions.map((lang) => (
              <button
                key={lang.value}
                onClick={() => onLanguageSelect(lang.value)}
                type="button"
                className={`w-full text-left px-4 py-2 text-xs hover:bg-white/10 transition-colors duration-150 flex items-center gap-2 ${targetLanguage === lang.value ? "bg-white/20 text-white" : "text-white/80"
                  }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
