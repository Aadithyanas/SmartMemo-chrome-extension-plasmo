import { type } from "node:os"
import { transcribeAudio, translateText, summarizeText } from "../services/geminiServices"
import indexedDbService from "../services/indexedDbService"

export async function handleTranscription(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { base64Audio, mimeType } = request
    const text = await transcribeAudio(base64Audio, mimeType)
    console.log("Transcription successful")
    sendResponse({ success: true, text })
  } catch (err: any) {
    console.error("Transcription failed:", err)
    sendResponse({ success: false, error: err.message })
  }
}

export async function handleTranslation(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { text, target } = request
    const translatedText = await translateText(text, target)
    console.log("Translation successful")
    sendResponse({ success: true, text: translatedText })
  } catch (err: any) {
    console.error("Translation failed:", err)
    sendResponse({ success: false, error: err.message })
  }
}

export async function handleSummarization(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { transcript } = request
    const summaryText = await summarizeText(transcript)
    console.log("Summary successful")
    sendResponse({ success: true, text: summaryText })
  } catch (err: any) {
    console.error("Summary failed:", err)
    sendResponse({ success: false, error: err.message })
  }
}
export async function handleTranscriptStoring(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    const { audioData, transcription, recordingTime } = request

    const id = `memo_${Date.now()}`
    const date = new Date().toISOString()
    const name = transcription?.substring(0, 20) || "New Memo"

    // ✅ Convert plain object to real Blob
    const audioBlob = new Blob([audioData.buffer], { type: audioData.type })
    console.log("Created Blob from buffer:", audioBlob.size, "bytes")

    const memo = {
      id,
      name,
      date,
      duration: recordingTime,
      transcription,
      audioBlob,
    }

    await indexedDbService.saveMemo(memo)

    const savedMemo = await indexedDbService.getMemoById(id)
    if (savedMemo) {
      console.log("Memo saved and verified:", savedMemo.id)
      sendResponse({ success: true, memo: savedMemo })
    } else {
      throw new Error("Memo verification failed")
    }
  } catch (err: any) {
    console.error("Failed to store transcript:", err)
    sendResponse({ success: false, error: err.message })
  }
}
