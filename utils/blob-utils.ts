// Utility functions for handling blob serialization in Chrome extensions

export interface SerializableBlob {
  buffer: ArrayBuffer
  type: string
  size: number
}

export async function blobToSerializable(blob: Blob): Promise<SerializableBlob> {
  const buffer = await blobToArrayBuffer(blob)
  return {
    buffer,
    type: blob.type,
    size: blob.size,
  }
}

export function serializableToBlob(serializable: SerializableBlob): Blob {
  return new Blob([serializable.buffer], { type: serializable.type })
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to convert blob to ArrayBuffer"))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

export function createAudioUrl(audioBlob: Blob | null): string | null {
  if (!audioBlob) return null

  try {
    return URL.createObjectURL(audioBlob)
  } catch (error) {
    console.error("Failed to create audio URL:", error)
    return null
  }
}

export function revokeAudioUrl(url: string | null): void {
  if (url) {
    try {
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to revoke audio URL:", error)
    }
  }
}
