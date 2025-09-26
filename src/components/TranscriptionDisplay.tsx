

import type { RefObject } from "react"
import { AudioPlayer } from "./AudioPlayer"
import TranslateText from "./TranslateText"
import SummaryText from "./SummaryText"
import { SaveStatusIndicator } from "./SaveStatusIndicator"
import { LanguageSelector } from "./LanguageSelector"
import { ActionButtons } from "./ActionButtons"
import { ControlButtons } from "./ControlButtons"

interface LanguageOption {
  value: string
  label: string
  flag: string
}

interface TranscriptionDisplayProps {
  transcription: string
  isEditMode: boolean
  saveStatus: "idle" | "saving" | "saved" | "updating" | "updated" | "error"
  audioBlob: Blob | null
  showTranslation: boolean
  showSummary: boolean
  targetLanguage: string
  languageOptions: LanguageOption[]
  selectedLanguage: LanguageOption
  showLanguageDropdown: boolean
  dropdownRef: RefObject<HTMLDivElement>
  onLanguageSelect: (langValue: string) => void
  onToggleLanguageDropdown: () => void
  onToggleSummary: () => void
  onToggleTranslation: () => void
  onExitEdit: () => void
  onReset: () => void
  onTranslationUpdate: (text: string) => void
  onSummaryUpdate: (text: string) => void
}

export const TranscriptionDisplay = ({
  transcription,
  isEditMode,
  saveStatus,
  audioBlob,
  showTranslation,
  showSummary,
  targetLanguage,
  languageOptions,
  selectedLanguage,
  showLanguageDropdown,
  dropdownRef,
  onLanguageSelect,
  onToggleLanguageDropdown,
  onToggleSummary,
  onToggleTranslation,
  onExitEdit,
  onReset,
  onTranslationUpdate,
  onSummaryUpdate,
}: TranscriptionDisplayProps) => {
  return (
    <div className="space-y-4 animate-in slide-in-from-bottom duration-700">
      <div className="flex items-center">
        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse shadow-lg shadow-green-400/50"></div>
        <span className="text-white/90 text-sm font-semibold">{isEditMode ? "Editing Memo" : "Transcription"}</span>
        <SaveStatusIndicator saveStatus={saveStatus} />
      </div>

      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Language Dropdown */}
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            languageOptions={languageOptions}
            showLanguageDropdown={showLanguageDropdown}
            dropdownRef={dropdownRef}
            onToggleDropdown={onToggleLanguageDropdown}
            onLanguageSelect={onLanguageSelect}
            targetLanguage={targetLanguage}
          />

          <ActionButtons
            showSummary={showSummary}
            showTranslation={showTranslation}
            onToggleSummary={onToggleSummary}
            onToggleTranslation={onToggleTranslation}
          />

          <ControlButtons isEditMode={isEditMode} onExitEdit={onExitEdit} onReset={onReset} />
        </div>
      </div>

      {/* Audio Player */}
      {audioBlob && (
        <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-3 border border-white/10">
          <AudioPlayer audioBlob={audioBlob} />
        </div>
      )}

      {/* Transcription Text */}
      <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
        <p className="text-white text-sm leading-relaxed font-medium">{transcription}</p>
      </div>

      {/* Summary */}
      {showSummary && (
        <div className="animate-in slide-in-from-bottom duration-500 space-y-2">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse shadow-lg shadow-orange-400/50"></div>
            <span className="text-white/90 text-sm font-semibold">Summary</span>
          </div>
          <div className="bg-linear-to-br from-orange-500/15 to-red-500/15 backdrop-blur-xs rounded-2xl p-4 border border-orange-400/30 shadow-lg shadow-orange-500/10">
            <SummaryText text={transcription} onSummaryComplete={onSummaryUpdate} />
          </div>
        </div>
      )}

      {/* Translation */}
      {showTranslation && (
        <div className="animate-in slide-in-from-bottom duration-500 space-y-2">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse shadow-lg shadow-purple-400/50"></div>
            <span className="text-white/90 text-sm font-semibold">Translation ({selectedLanguage.label})</span>
          </div>
          <div className="bg-linear-to-br from-purple-500/15 to-pink-500/15 backdrop-blur-xs rounded-2xl p-4 border border-purple-400/30 shadow-lg shadow-purple-500/10">
            <TranslateText text={transcription} target={targetLanguage} onTranslationComplete={onTranslationUpdate} />
          </div>
        </div>
      )}
    </div>
  )
}
