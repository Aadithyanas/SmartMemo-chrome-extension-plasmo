
declare const chrome: any

// Check if Chrome runtime is available and context is valid
function isChromeRuntimeAvailable(): boolean {
  try {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id && 
           !chrome.runtime.lastError;
  } catch (error) {
    console.warn('Chrome runtime not available:', error);
    return false;
  }
}

chrome.runtime.onMessage.addListener((message: any, sender: any, sendResponse: any) => {
  // Check if context is still valid
  if (!isChromeRuntimeAvailable()) {
    console.warn('Chrome runtime context invalidated, ignoring message:', message.type);
    sendResponse({ success: false, error: 'Extension context invalidated' });
    return;
  }

  switch (message.type) {
    case "SHOW_RECORDING_CARD":
      showRecordingCard()
      sendResponse({ success: true })
      break

    case "MEMO_UPDATE":
      console.log("Content script received memo update:", message.updateType)
      sendResponse({ success: true })
      break

    default:
      sendResponse({ success: false, error: 'Unknown message type' })
      break
  }
})

function showRecordingCard() {

  const existingCard = document.querySelector("[data-recording-card]")

  if (existingCard) {
  
    existingCard.scrollIntoView({ behavior: "smooth" })
    return
  }

  console.log("Showing recording card on page")

}

export { showRecordingCard }
