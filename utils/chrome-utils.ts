

export interface Message {
  action: string
  text?: string
  originalText?: string
  targetLanguage?: string
  type?: string
}

export async function sendMessageToTab(tabId: number, message: Message, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await chrome.tabs.sendMessage(tabId, message)
      return true
    } catch (error: any) {
      console.log(`Message send attempt ${i + 1} failed:`, error.message)
      if (i === retries - 1) {
        throw error
      }
      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  return false
}

export async function isTabAccessible(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId)
    // Check if it's a regular web page (not chrome:// or extension pages)
    return !!tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("chrome-extension://")
  } catch {
    return false
  }
}

export async function showNotificationInTab(tabId: number, text: string): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (notificationText: string) => {
        const notification = document.createElement("div")
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #333;
          color: white;
          padding: 10px 15px;
          border-radius: 5px;
          z-index: 10000;
          font-family: sans-serif;
          font-size: 14px;
        `
        notification.textContent = notificationText
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
      },
      args: [text],
    })
  } catch (scriptError: any) {
    console.error("Failed to show notification:", scriptError)
  }
}
