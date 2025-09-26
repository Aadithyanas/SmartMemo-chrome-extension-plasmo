import { GoogleGenerativeAI } from "@google/generative-ai"


const DEV_API_KEY = "AIzaSyAHJp-QqTwCbwMse0ZpBNFtEEYj672e6Q8"

let genAI: GoogleGenerativeAI | null = null

export async function initializeAPI(): Promise<boolean> {
  try {
    const result = await chrome.storage.sync.get(["geminiApiKey"])
    let apiKey = result.geminiApiKey

    if (!apiKey && DEV_API_KEY) {
      apiKey = DEV_API_KEY
      console.log("Using development API key")
    }

    if (!apiKey) {
      throw new Error("API key not found")
    }

    genAI = new GoogleGenerativeAI(apiKey)
    return true
  } catch (error) {
    console.error("Failed to initialize API:", error)
    return false
  }
}

export function getGenAI(): GoogleGenerativeAI | null {
  return genAI
}

export function resetGenAI(): void {
  genAI = null
}
