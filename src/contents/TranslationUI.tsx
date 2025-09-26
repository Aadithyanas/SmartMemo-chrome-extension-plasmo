// Content script to handle UI display
console.log("Content script loaded");

let translationUI = null;

// Create and show the translation UI
export default function TranslationUI(text: string, position: {x: number, y: number}) {
  // Remove existing UI if present
  hideTranslationUI();
  
  // Validate inputs
  if (!text || typeof text !== 'string') {
    console.error('TranslationUI: Invalid text parameter:', text);
    return;
  }
  
  if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    console.error('TranslationUI: Invalid position parameter:', position);
    return;
  }
  
  // Create UI element
  translationUI = document.createElement('div');
  translationUI.id = 'gemini-translation-ui';
  translationUI.style.cssText = `
    position: absolute;
    top: ${position.y}px;
    left: ${position.x}px;
    background-color: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px 15px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    z-index: 9999;
    font-family: sans-serif;
    font-size: 14px;
    color: black;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  // Create text content
  const textElement = document.createElement('p');
  textElement.style.cssText = 'margin: 0; padding: 0;';
  textElement.textContent = text;
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = `
    position: absolute;
    top: -8px;
    right: -8px;
    background: black;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    text-align: center;
    line-height: 20px;
    font-size: 12px;
    font-weight: bold;
  `;
  
  closeButton.addEventListener('click', hideTranslationUI);
  
  // Append elements
  translationUI.appendChild(textElement);
  translationUI.appendChild(closeButton);
  
  // Add to page
  document.body.appendChild(translationUI);
  
  // Hide on click outside
  document.addEventListener('click', handleClickOutside);
}

function hideTranslationUI() {
  if (translationUI) {
    translationUI.remove();
    translationUI = null;
    document.removeEventListener('click', handleClickOutside);
  }
}

function handleClickOutside(event) {
  if (translationUI && !translationUI.contains(event.target)) {
    hideTranslationUI();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Content script received message:", request);
  
  if (request.action === "SHOW_UI") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const position = {
        x: rect.left + window.scrollX,
        y: rect.bottom + window.scrollY + 5
      };
      
      // Ensure text is a string, not an object
      const textToDisplay = typeof request.text === 'string' 
        ? request.text 
        : JSON.stringify(request.text);
      
      TranslationUI(textToDisplay, position);
    }
    
    sendResponse({ success: true });
  }
  
  return true;
});