
import { request } from "http";
import indexedDbService from "../services/indexedDbService"

import { arrayBufferToBase64 } from '../utils/audio-utils.';
import type { VoiceMemo } from "@/types";


export async function handleMemoUpdate(
  request: any,
  sendResponse: (response: any) => void,
  updateType: string,
): Promise<void> {
  try {
    const { memo, audioData } = request
    console.log(memo)
    const audioBlob = new Blob([audioData.buffer], { type: audioData.type })
    const memoToSave = {
      ...memo,
      audioBlob,
    }

    console.log(`Updating memo ${updateType}:`, memo.id)

    await indexedDbService.saveMemo(memoToSave)

    const updatedMemo = await indexedDbService.getMemoById(memo.id)
    if (updatedMemo) {
      console.log(`Memo ${updateType} updated successfully`)
      sendResponse({ success: true, memo: updatedMemo })
    } else {
      throw new Error("Update verification failed")
    }
  } catch (err: any) {
    console.error(`${updateType} update failed:`, err)
    sendResponse({ success: false, error: err.message })
  }
}




export async function handleGetAllMemos(sendResponse: (response: any) => void): Promise<void> {
  try {
    console.log("Fetching all memos");
    const memos = await indexedDbService.getAllMemos();

    const processedMemos = await Promise.all(
      memos.map(async (memo) => {
        try {
          const audioBlob = memo.audioBlob;

          if (!(audioBlob instanceof Blob)) {
            console.warn(`Memo ${memo.id} has invalid audioBlob`);
            return {
              ...memo,
              audioBuffer: null,
              audioType: null
            };
          }

          const buffer = await audioBlob.arrayBuffer();
          return {
            ...memo,
            audioBuffer: arrayBufferToBase64(buffer),
            audioType: audioBlob.type,
            audioBlob: undefined // Remove blob to reduce payload
          };
        } catch (error) {
          console.error(`Error processing memo ${memo.id}:`, error);
          return {
            ...memo,
            audioBuffer: null,
            audioType: null
          };
        }
      })
    );

    sendResponse({
      success: true,
      memos: processedMemos.filter(memo => memo !== null)
    });
  } catch (err) {
    console.error("Failed to fetch memos:", err);
    sendResponse({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

// Other handler functions remain the same...

export async function handleDeleteMemo(request: any, sendResponse: (response: any) => void): Promise<void> {
  try {
    console.log("Deleting memo:", request.id)
    await indexedDbService.deleteMemo(request.id)
    console.log("Memo deleted successfully")
    sendResponse({ success: true })
  } catch (err: any) {
    console.error("Failed to delete memo:", err)
    sendResponse({ success: false, error: err.message })
  }
}

export async function handleClearAllMemos(sendResponse: (response: any) => void): Promise<void> {
  try {
    console.log("Clearing all memos")
    await indexedDbService.clearAllMemos()
    console.log("All memos cleared successfully")
    sendResponse({ success: true })
  } catch (err: any) {
    console.error("Failed to clear memos:", err)
    sendResponse({ success: false, error: err.message })
  }
}
export async function handleUpdateMemoName(
  request: { updatedMemo: VoiceMemo },
  sendResponse: (response: any) => void
): Promise<void> {
  try {
    const { updatedMemo } = request;

    console.log("Updating memo name:", updatedMemo.id, "to:", updatedMemo.name);


    await indexedDbService.saveMemo(updatedMemo);


    const savedMemo = await indexedDbService.getMemoById(updatedMemo.id);

    if (savedMemo) {
      console.log("Memo name updated successfully:", savedMemo.name);
      sendResponse({ success: true, memo: savedMemo });
    } else {
      throw new Error("Update verification failed - memo not found after save");
    }

  } catch (err: any) {
    console.error("Failed to update memo name:", err);
    sendResponse({
      success: false,
      error: err.message || "Failed to update memo name"
    });
  }
}