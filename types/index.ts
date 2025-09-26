export interface VoiceMemo {
  id: string
  name: string
  date: string
  duration: number
  transcription?: string
  translation?: {
    text: string
    language: string
  }
  summary?: string
  audioBlob?: Blob
  hasAudio?: boolean
  audioSize?: number
  audioType?: string
}

export interface MemoListResponse {
  success: boolean
  memos?: VoiceMemo[]
  error?: string
}

export interface DeleteResponse {
  success: boolean
  error?: string
}

export interface AudioData {
  buffer: ArrayBuffer | Uint8Array | number[]
  type: string
  size?: number
}


export interface MemoUpdateMessage {
  type: "MEMO_UPDATE"
  updateType: "MEMO_SAVED" | "MEMO_UPDATED" | "MEMO_DELETED"
  data: any
}

export type VoiceMemoList = VoiceMemo[];

export type Language={
  code:string;
    name:string;
}


export interface SaveResponse {
  success: boolean
  memo?: VoiceMemo
  error?: string
}

export interface MessageResponse {
  success: boolean
  text?: string
  memos?: VoiceMemo[]
  error?: string
}

export interface TranscriptionResponse {
  success: boolean
  text?: string
  error?: string
}

export interface MemoListResponse {
  success: boolean
  memos?: VoiceMemo[]
  error?: string
}

export interface DeleteResponse {
  success: boolean
  error?: string
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  {code : 'ml',name : 'Malayalam'}
];