

export function handleMicrophonePermissionCheck(sendResponse: (response: any) => void): void {
  chrome.permissions.contains({ permissions: ["audioCapture"] }, (hasPermission) => {
    chrome.storage.local.set({ microphoneAccessGranted: hasPermission })
    sendResponse({ hasPermission })
  })
}

export function handleMicrophonePermissionRequest(sendResponse: (response: any) => void): void {
  chrome.permissions.request({ permissions: ["audioCapture"] }, (granted) => {
    chrome.storage.local.set({ microphoneAccessGranted: granted })
    console.log(granted ? "Microphone permission granted" : "Microphone permission denied")
    sendResponse({ granted })
  })
}

export function handleRecordingStateChange(request: any): void {
  const isRecordingGlobal = request.isRecording
  chrome.storage.local.set({ isRecording: isRecordingGlobal })

  if (isRecordingGlobal) {
    chrome.action.setBadgeText({ text: "REC" })
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" })
  } else {
    chrome.action.setBadgeText({ text: "" })
  }
}

export function handleGetRecordingState(sendResponse: (response: any) => void, isRecordingGlobal: boolean): void {
  sendResponse({ isRecording: isRecordingGlobal })
}
