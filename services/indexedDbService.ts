import Dexie from "dexie"

// Create database instance with proper typing
const db = new Dexie("VoiceMemoApp")

// Define schema
db.version(1).stores({
  memos: "id, name, date, duration, transcription",
})

// Get the memos table with proper typing
const memosTable = db.table("memos")

// Helper function to serialize blob for storage
const serializeBlob = async (blob: Blob): Promise<any> => {
  if (!blob || !(blob instanceof Blob)) return null

  try {
    const arrayBuffer = await blob.arrayBuffer()
    return {
      buffer: Array.from(new Uint8Array(arrayBuffer)), // Convert to array for JSON serialization
      type: blob.type,
      size: blob.size,
    }
  } catch (error) {
    console.error("Error serializing blob:", error)
    return null
  }
}

// Helper function to deserialize blob from storage
const deserializeBlob = (serializedBlob: any): Blob | null => {
  if (!serializedBlob || !serializedBlob.buffer) return null

  try {
    const uint8Array = new Uint8Array(serializedBlob.buffer)
    return new Blob([uint8Array], { type: serializedBlob.type })
  } catch (error) {
    console.error("Error deserializing blob:", error)
    return null
  }
}

// Simple functional approach for database operations
const saveMemo = async (memo: any) => {
  try {
    console.log("IndexedDB: Attempting to save memo:", memo.id)

    // Serialize the audio blob for storage
    const serializedAudioBlob = memo.audioBlob ? await serializeBlob(memo.audioBlob) : null

    const memoToSave = {
      id: memo.id,
      name: memo.name || "Untitled Memo",
      date: memo.date || new Date().toISOString(),
      duration: memo.duration || 0,
      transcription: memo.transcription || "",
      audioBlob: serializedAudioBlob, // Store serialized blob
      audioUrl: null,
      translation: memo.translation || null,
      summary: memo.summary || null,
    }

    const result = await memosTable.put(memoToSave)
    console.log("IndexedDB: Memo saved successfully with key:", result)
    return result
  } catch (error) {
    console.error("IndexedDB: Error saving memo:", error)
    throw error
  }
}

const getAllMemos = async () => {
  try {
    console.log("IndexedDB: Fetching all memos")
    const memos = await memosTable.orderBy("date").reverse().toArray()
    console.log("IndexedDB: Retrieved memos:", memos.length)

    // Deserialize audio blobs for each memo
    const processedMemos = memos.map((memo) => ({
      ...memo,
      audioBlob: memo.audioBlob ? deserializeBlob(memo.audioBlob) : null,
    }))

    return processedMemos
  } catch (error) {
    console.error("IndexedDB: Error fetching memos:", error)
    throw error
  }
}

const getMemoById = async (id: string) => {
  try {
    console.log("IndexedDB: Fetching memo by ID:", id)
    const memo = await memosTable.get(id)

    if (memo) {
      console.log("IndexedDB: Retrieved memo:", memo.id)
      // Deserialize the audio blob
      return {
        ...memo,
        audioBlob: memo.audioBlob ? deserializeBlob(memo.audioBlob) : null,
      }
    }

    console.log("IndexedDB: Memo not found")
    return undefined
  } catch (error) {
    console.error("IndexedDB: Error fetching memo by ID:", error)
    throw error
  }
}

const deleteMemo = async (id: string) => {
  try {
    console.log("IndexedDB: Deleting memo:", id)
    await memosTable.delete(id)
    console.log("IndexedDB: Memo deleted successfully")
  } catch (error) {
    console.error("IndexedDB: Error deleting memo:", error)
    throw error
  }
}

const clearAllMemos = async () => {
  try {
    console.log("IndexedDB: Clearing all memos")
    await memosTable.clear()
    console.log("IndexedDB: All memos cleared successfully")
  } catch (error) {
    console.error("IndexedDB: Error clearing memos:", error)
    throw error
  }
}

// Test database connection
const initializeDatabase = async () => {
  try {
    await db.open()
    console.log("IndexedDB: Database opened successfully")
    return true
  } catch (error) {
    console.error("IndexedDB: Failed to open database:", error)
    return false
  }
}

// Initialize on import
initializeDatabase()

// Export functions
export default {
  saveMemo,
  getAllMemos,
  getMemoById,
  deleteMemo,
  clearAllMemos,
  db, // Export db instance for debugging if needed
}
