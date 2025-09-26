import { useAudioRecorder } from "hooks/useAudioRecorder";
import { useState, useRef, useEffect } from "react";
import type { VoiceMemo, SaveResponse, TranscriptionResponse } from "../../types";
import { RecordingButton } from "../components/RecordingButton";
import { RecordingStatus } from "../components/RecordingStatus";
import { AudioControls } from "../components/AudioControls";
import { ProcessingStatus } from "../components/ProcessingStatus";
import { TranscriptionDisplay } from "../components/TranscriptionDisplay";
import { ErrorDisplay } from "../components/ErrorDisplay";
import { ContextInvalidatedError } from "../components/ContextInvalidatedError";
import { base64ToArrayBuffer } from "../../utils/audio-utils.";
// Utility functions for safe Chrome runtime communication
const isContextInvalidatedError = (error: string): boolean => {
  return error.includes('Extension context invalidated') || 
         error.includes('Receiving end does not exist') ||
         error.includes('Could not establish connection');
};

const safeChromeRuntimeSendMessage = async <T = any>(message: any): Promise<{success: boolean, data?: T, error?: string}> => {
  try {
    const response = await new Promise<T>((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response: T) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });

    return { success: true, data: response };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
};

declare const chrome: {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
    lastError?: { message: string };
  };
};

interface RecordingCardProps {
  editingMemo?: VoiceMemo | null;
  onEditComplete?: () => void;
}

interface LanguageOption {
  value: string;
  label: string;
  flag: string;
}

export const RecordingCard = ({ editingMemo, onEditComplete }: RecordingCardProps) => {
  const {
    isRecording,
    recordingTime,
    formattedTime,
    startRecording,
    stopRecording,
    reset: resetRecorder,
  } = useAudioRecorder();

  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isContextInvalidated, setIsContextInvalidated] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [showTranslation, setShowTranslation] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<string>("es");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentMemo, setCurrentMemo] = useState<VoiceMemo | null>(null);

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "updating" | "updated" | "error"
  >("idle");
  const [savedMemoId, setSavedMemoId] = useState<string | null>(null);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  const languageOptions: LanguageOption[] = [
    { value: "es", label: "Spanish", flag: "🇪🇸" },
    { value: "fr", label: "French", flag: "🇫🇷" },
    { value: "de", label: "German", flag: "🇩🇪" },
    { value: "it", label: "Italian", flag: "🇮🇹" },
    { value: "pt", label: "Portuguese", flag: "🇵🇹" },
    { value: "ru", label: "Russian", flag: "🇷🇺" },
    { value: "zh", label: "Chinese", flag: "🇨🇳" },
    { value: "ja", label: "Japanese", flag: "🇯🇵" },
    { value: "ar", label: "Arabic", flag: "🇸🇦" },
    { value: "hi", label: "Hindi", flag: "🇮🇳" },
  ];

  // Load editing memo data
  useEffect(() => {
    if (editingMemo) {
      console.log("Loading memo for editing:", editingMemo);
      setIsEditMode(true);
      setAudioBlob(editingMemo.audioBlob || null);
      setTranscription(editingMemo.transcription || null);
      setCurrentMemo(editingMemo);
      setSavedMemoId(editingMemo.id);

      if (editingMemo.translation) {
        setTranslatedText(editingMemo.translation.text);
        setTargetLanguage(editingMemo.translation.language);
        setShowTranslation(true);
      }

      if (editingMemo.summary) {
        setSummaryText(editingMemo.summary);
        setShowSummary(true);
      }

      setSaveStatus("idle");
    }
  }, [editingMemo]);

  // Auto-save transcription when it becomes available (only for new recordings)
  useEffect(() => {
    const autoSave = async () => {
      if (!audioBlob || !transcription || saveStatus !== "idle" || savedMemoId || isEditMode) {
        return;
      }

      console.log("Starting auto-save process...");
      setSaveStatus("saving");

      try {
        const audioArrayBuffer = await audioBlob.arrayBuffer();
        
        const response = await new Promise<SaveResponse>((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: "TranscriptStoring",
              audioData: {
                buffer: Array.from(new Uint8Array(audioArrayBuffer)),
                type: audioBlob.type,
                size: audioBlob.size,
              },
              transcription,
              recordingTime,
            },
            (response: SaveResponse) => {
              if (chrome.runtime.lastError) {
                const error = chrome.runtime.lastError.message;
                if (isContextInvalidatedError(error)) {
                  setIsContextInvalidated(true);
                  resolve({ success: false, error });
                } else {
                  resolve({ success: false, error });
                }
              } else {
                resolve(response);
              }
            }
          );
        });

        if (response.success && response.memo) {
          setSavedMemoId(response.memo.id);
          setCurrentMemo(response.memo);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 3000);
        } else {
          throw new Error(response.error || "Save failed");
        }
      } catch (error) {
        console.error("Failed to auto-save memo:", error);
        setError(error instanceof Error ? error.message : "Failed to save memo");
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    };

    autoSave();
  }, [transcription, audioBlob, recordingTime, savedMemoId, saveStatus, isEditMode]);

  const handleStartRecording = async () => {
    try {
      setError(null);
      setTranscription(null);
      setShowTranslation(false);
      setShowSummary(false);
      setCurrentMemo(null);
      setSavedMemoId(null);
      setTranslatedText(null);
      setSummaryText(null);
      setSaveStatus("idle");
      setIsEditMode(false);

      await startRecording();
    } catch (error) {
      console.error("Recording error:", error);
      setError("Could not access microphone");
    }
  };

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording();
      if (!blob || blob.size === 0) {
        throw new Error("Empty recording");
      }
      setAudioBlob(blob);
    } catch (error) {
      console.error("Error stopping recording:", error);
      setError(error instanceof Error ? error.message : "Error stopping recording");
    }
  };

  const handleAudioTranscription = async () => {
    if (!audioBlob) return;

    setProcessing(true);
    setShowTranslation(false);
    setShowSummary(false);
    setTranslatedText(null);
    setSummaryText(null);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          if (base64Data) {
            resolve(base64Data);
          } else {
            reject("Failed to convert blob to base64");
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(audioBlob);
      });

      const response = await new Promise<TranscriptionResponse>((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "TRANSCRIBE_AUDIO_BASE64",
            base64Audio: base64,
            mimeType: audioBlob.type,
          },
          (response: TranscriptionResponse) => {
            if (chrome.runtime.lastError) {
              const error = chrome.runtime.lastError.message;
              if (isContextInvalidatedError(error)) {
                setIsContextInvalidated(true);
                resolve({ success: false, error });
              } else {
                resolve({ success: false, error });
              }
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response.success && response.text) {
        setTranscription(response.text);
      } else {
        throw new Error(response.error || "Transcription failed");
      }
    } catch (error) {
      console.error("Audio processing error:", error);
      setError(error instanceof Error ? error.message : "Failed to process audio");
    } finally {
      setProcessing(false);
    }
  };

  const handleLanguageSelect = (langValue: string) => {
    setTargetLanguage(langValue);
    setShowLanguageDropdown(false);
    setTranslatedText(null);
  };

  const handleTranslationUpdate = async (newTranslation: string) => {
    if (!audioBlob || !savedMemoId || !currentMemo) return;

    setSaveStatus("updating");
    setTranslatedText(newTranslation);

    try {
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      
      const updatedMemo = {
        ...currentMemo,
        translation: {
          language: targetLanguage,
          text: newTranslation,
        },
      };

      const response = await safeChromeRuntimeSendMessage<SaveResponse>({
        type: "TRANSLATE_UPDATE",
        memo: updatedMemo,
        audioData: {
          buffer: Array.from(new Uint8Array(audioArrayBuffer)),
          type: audioBlob.type,
          size: audioBlob.size,
        },
      });

      if (!response.success) {
        if (isContextInvalidatedError(response.error || "")) {
          setIsContextInvalidated(true);
          return;
        } else {
          throw new Error(response.error || "Update failed");
        }
      }

      if (response.data && response.data.memo) {
        setCurrentMemo(response.data.memo);
        setSaveStatus("updated");
      } else {
        throw new Error("Invalid update response");
      }
    } catch (error) {
      console.error("Failed to update translation:", error);
      setSaveStatus("error");
    } finally {
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleSummaryUpdate = async (newSummary: string) => {
    if (!audioBlob || !savedMemoId || !currentMemo) return;

    setSaveStatus("updating");
    setSummaryText(newSummary);

    try {
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      
      const updatedMemo = {
        ...currentMemo,
        summary: newSummary,
      };

      const response = await safeChromeRuntimeSendMessage<SaveResponse>({
        type: "SUMMARY_UPDATE",
        memo: updatedMemo,
        audioData: {
          buffer: Array.from(new Uint8Array(audioArrayBuffer)),
          type: audioBlob.type,
          size: audioBlob.size,
        },
      });

      if (!response.success) {
        if (isContextInvalidatedError(response.error || "")) {
          setIsContextInvalidated(true);
          return;
        } else {
          throw new Error(response.error || "Update failed");
        }
      }

      if (response.data && response.data.memo) {
        setCurrentMemo(response.data.memo);
        setSaveStatus("updated");
      } else {
        throw new Error("Invalid update response");
      }
    } catch (error) {
      console.error("Failed to update summary:", error);
      setSaveStatus("error");
    } finally {
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleReset = () => {
    resetRecorder();
    setAudioBlob(null);
    setTranscription(null);
    setError(null);
    setShowTranslation(false);
    setShowSummary(false);
    setShowLanguageDropdown(false);
    setSaveStatus("idle");
    setSavedMemoId(null);
    setTranslatedText(null);
    setSummaryText(null);
    setCurrentMemo(null);
    setIsEditMode(false);

    if (onEditComplete) {
      onEditComplete();
    }
  };

  const handleExitEdit = () => {
    setIsEditMode(false);
    handleReset();
  };

  const toggleTranslation = () => setShowTranslation(!showTranslation);
  const toggleSummary = () => setShowSummary(!showSummary);

  const selectedLanguage = languageOptions.find((lang) => lang.value === targetLanguage) || languageOptions[0];

  const isIdle = !isRecording && !audioBlob && !transcription && !processing && !error && !isEditMode;
  const isActive = isRecording || audioBlob || processing || error || isEditMode;
  const hasContent = !!transcription;
  const isExpanded = hasContent || showTranslation || showSummary;

  return (
    <div className="z-50">
      {isContextInvalidated && (
        <ContextInvalidatedError onReload={() => window.location.reload()} />
      )}
      <div
        className={`
          relative transition-all duration-700 ease-out transform-gpu
          ${
            isIdle
              ? "bg-black/90 backdrop-blur-xl rounded-full w-12 h-12"
              : isExpanded
              ? "bg-black/95 backdrop-blur-2xl rounded-3xl w-80 min-h-[120px] p-4"
              : isActive
              ? "bg-black/90 backdrop-blur-xl rounded-full px-6 py-3 min-w-[180px]"
              : "bg-black/90 backdrop-blur-xl rounded-full w-12 h-12"
          }
        `}
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: isExpanded
            ? "0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
            : "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {error && <ErrorDisplay error={error} />}
        {isIdle && <RecordingButton onStartRecording={handleStartRecording} />}
        {isRecording && (
          <RecordingStatus formattedTime={formattedTime} onStopRecording={handleStopRecording} />
        )}
        {audioBlob && !isRecording && !transcription && !processing && !isEditMode && (
          <AudioControls onTranscribe={handleAudioTranscription} onReset={handleReset} />
        )}
        {processing && <ProcessingStatus />}
        {hasContent && (
          <TranscriptionDisplay
            transcription={transcription}
            isEditMode={isEditMode}
            saveStatus={saveStatus}
            audioBlob={audioBlob}
            showTranslation={showTranslation}
            showSummary={showSummary}
            targetLanguage={targetLanguage}
            languageOptions={languageOptions}
            selectedLanguage={selectedLanguage}
            showLanguageDropdown={showLanguageDropdown}
            dropdownRef={dropdownRef}
            onLanguageSelect={handleLanguageSelect}
            onToggleLanguageDropdown={() => setShowLanguageDropdown(!showLanguageDropdown)}
            onToggleSummary={toggleSummary}
            onToggleTranslation={toggleTranslation}
            onExitEdit={handleExitEdit}
            onReset={handleReset}
            onTranslationUpdate={handleTranslationUpdate}
            onSummaryUpdate={handleSummaryUpdate}
          />
        )}
      </div>
    </div>
  );
};