import { sendMessageToTab, isTabAccessible, showNotificationInTab } from "../utils/chrome-utils"
import { getPreferredLanguage } from "../utils/storage-utils"
import { translateText } from "../services/geminiServices"


export async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab,
): Promise<void> {
  if (info.menuItemId !== "translate-text" || !info.selectionText || !tab?.id) {
    return
  }

  const selectedText = info.selectionText.trim()
  console.log("Context menu clicked, selected text:", selectedText.substring(0, 50) + "...")

  if (!selectedText || selectedText.length > 5000) {
    console.warn("Selected text is empty or too long")
    return
  }

  // Check if tab is accessible
  if (!(await isTabAccessible(tab.id))) {
    console.warn("Tab is not accessible for content script injection")
    return
  }

  try {
    // Try to send initial message
    await sendMessageToTab(tab.id, {
      action: "SHOW_UI",
      text: "Translating...",
    })
    console.log("Initial message sent successfully")
  } catch (e: any) {
    console.error("Content script not available:", e.message)

    // Try to show a simple notification instead
    await showNotificationInTab(tab.id, "Please refresh the page to use translation")
    return
  }

  try {
    console.log("Starting translation process...")
    const preferredLanguage = await getPreferredLanguage()
    console.log("Target language:", preferredLanguage)

    const translatedText = await translateText(selectedText, preferredLanguage)
    console.log("Translation result:", translatedText.substring(0, 100) + "...")

    // Send the translated text
    await sendMessageToTab(tab.id, {
      action: "SHOW_UI",
      text: translatedText,
      originalText: selectedText,
      targetLanguage: preferredLanguage,
    })

    console.log("Translation completed and sent to content script")
  } catch (err: any) {
    console.error("Translation process failed:", err)

    try {
      await sendMessageToTab(tab.id, {
        action: "SHOW_UI",
        text: "Error: Translation failed. Please try again.",
      })
    } catch (msgErr: any) {
      console.error("Failed to send error message:", msgErr)
    }
  }
}
