

export interface StorageItems {
  geminiApiKey?: string
  preferredLanguage?: string
}

export async function getPreferredLanguage(): Promise<string> {
  try {
    const result = await chrome.storage.sync.get(["preferredLanguage"])
    return result.preferredLanguage || "Malayalam"
  } catch {
    return "hindi"
  }
}

export async function initializeDefaultSettings(): Promise<void> {
  chrome.storage.sync.get(["preferredLanguage"], (result: StorageItems) => {
    if (!result.preferredLanguage) {
      chrome.storage.sync.set({ preferredLanguage: "Malayalam" })
    }
  })

  chrome.storage.local.set({
    microphoneAccessGranted: false,
    isRecording: false,
  })
}
