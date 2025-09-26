// Utility functions for safe Chrome runtime communication
export interface ChromeRuntimeResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Check if Chrome runtime is available and context is valid
export function isChromeRuntimeAvailable(): boolean {
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

// Safe wrapper for chrome.runtime.sendMessage with retry logic
export async function safeChromeRuntimeSendMessage<T = any>(
  message: any,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<ChromeRuntimeResponse<T>> {
  if (!isChromeRuntimeAvailable()) {
    return {
      success: false,
      error: 'Chrome runtime context is invalid or unavailable'
    };
  }

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

      return {
        success: true,
        data: response
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      
      // Check if it's a context invalidated error
      if (lastError.includes('Extension context invalidated') || 
          lastError.includes('Receiving end does not exist')) {
        return {
          success: false,
          error: 'Extension context invalidated. Please reload the page.'
        };
      }

      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        console.warn(`Chrome runtime call failed (attempt ${attempt}/${maxRetries}):`, lastError);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError || 'Chrome runtime call failed after all retries'
  };
}

// Safe wrapper for chrome.runtime.sendMessage with callback
export function safeChromeRuntimeSendMessageCallback<T = any>(
  message: any,
  callback: (response: ChromeRuntimeResponse<T>) => void,
  maxRetries: number = 3
): void {
  if (!isChromeRuntimeAvailable()) {
    callback({
      success: false,
      error: 'Chrome runtime context is invalid or unavailable'
    });
    return;
  }

  let attempt = 0;
  
  const trySendMessage = () => {
    attempt++;
    
    try {
      chrome.runtime.sendMessage(message, (response: T) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          
          // Check if it's a context invalidated error
          if (error.includes('Extension context invalidated') || 
              error.includes('Receiving end does not exist')) {
            callback({
              success: false,
              error: 'Extension context invalidated. Please reload the page.'
            });
            return;
          }

          // Retry if we haven't exceeded max retries
          if (attempt < maxRetries) {
            console.warn(`Chrome runtime call failed (attempt ${attempt}/${maxRetries}):`, error);
            setTimeout(trySendMessage, 1000 * attempt);
            return;
          }

          callback({
            success: false,
            error: error
          });
        } else {
          callback({
            success: true,
            data: response
          });
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (attempt < maxRetries) {
        console.warn(`Chrome runtime call failed (attempt ${attempt}/${maxRetries}):`, errorMessage);
        setTimeout(trySendMessage, 1000 * attempt);
        return;
      }

      callback({
        success: false,
        error: errorMessage
      });
    }
  };

  trySendMessage();
}

// Check if the error is a context invalidated error
export function isContextInvalidatedError(error: string): boolean {
  return error.includes('Extension context invalidated') || 
         error.includes('Receiving end does not exist') ||
         error.includes('Could not establish connection');
}

// Show user-friendly error message for context invalidated errors
export function getContextInvalidatedMessage(): string {
  return 'Extension context has been invalidated. Please refresh the page to continue using the extension.';
}
