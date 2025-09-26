import { resetGenAI } from "../utils/api-utils"
import { initializeDefaultSettings } from "../utils/storage-utils"
import { handleContextMenuClick } from "../handlers/context-menu-handler"
import {
  handleTranscription,
  handleTranslation,
  handleSummarization,
  handleTranscriptStoring,
} from "../handlers/audio-handlers"
import { handleMemoUpdate, handleGetAllMemos, handleDeleteMemo, handleClearAllMemos, handleUpdateMemoName } from "../handlers/memo-handlers"
import {
  
  handleRecordingStateChange,
  handleGetRecordingState,
} from "../handlers/permission-handlers"

let isRecordingGlobal = false

// Extension installation and setup
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu
  chrome.contextMenus.create({
    id: "translate-text",
    title: "Translate with Gemini",
    contexts: ["selection"],
  })

  // Initialize default settings
  initializeDefaultSettings()

  console.log("Extension installed - context menu created and settings initialized")
})

// Context menu handler for text translation
chrome.contextMenus.onClicked.addListener(handleContextMenuClick)

// Message handler for both text translation and audio transcription
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Check if the extension context is still valid
    if (!chrome.runtime.id) {
      console.warn("Extension context invalidated, ignoring message:", request.type);
      sendResponse({ success: false, error: "Extension context invalidated" });
      return;
    }

    const type = request.type || request.action
    console.log("Background received message:", type)

  switch (type) {
    // Audio transcription handlers
    case "TRANSCRIBE_AUDIO_BASE64":
      handleTranscription(request, sendResponse)
      return true

    case "TRANSALTE_TEXT_TO_TARGET_LANG":
      handleTranslation(request, sendResponse)
      return true

    case "TranscriptStoring":
      handleTranscriptStoring(request, sendResponse)
      return true

    case "UPDATE_MEMO_NAME":
      handleUpdateMemoName(request,sendResponse)
      return true


    case "TRANSLATE_UPDATE":
      handleMemoUpdate(request, sendResponse, "translation")
      return true

    case "SUMMARY_UPDATE":
      handleMemoUpdate(request, sendResponse, "summary")
      return true

    case "GET_ALL_MEMOS":
      handleGetAllMemos(sendResponse)
      return true

    case "DELETE_MEMO":
      handleDeleteMemo(request, sendResponse)
      return true

    case "CLEAR_ALL_MEMOS":
      handleClearAllMemos(sendResponse)
      return true

    case "SUMMARIZED_THE_TRANSCRIPT":
      handleSummarization(request, sendResponse)
      return true


    // Recording state handlers
    case "recordingStateChanged":
      isRecordingGlobal = request.isRecording
      handleRecordingStateChange(request)
      break

    case "getRecordingState":
      handleGetRecordingState(sendResponse, isRecordingGlobal)
      break

    default:
      console.warn("Unknown message type:", type)
  }
  } catch (error) {
    console.error("Error in background message handler:", error)
    sendResponse({ success: false, error: error.message })
  }
})

// Extension lifecycle handlers
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension startup - reinitializing...")
  resetGenAI() // Reset API instance
})

chrome.runtime.onSuspend.addListener(() => {
  console.log("Extension is being unloaded")
  if (isRecordingGlobal) {
    console.warn("Recording was active during unload")
  }
})
