export interface VideoPageInput {
  pageNumber: number
  text: string
  imageUrl: string
  audioUrl: string
}

export interface VideoGenerationOptions {
  bookId: string
  userId: string
  pages: VideoPageInput[]
  language: string
  /** Output resolution width (default 720) */
  width?: number
  /** Output resolution height (default 1280 — portrait 9:16) */
  height?: number
  /** Callback for progress reporting (0-100) */
  onProgress?: (percent: number) => void
}

export interface VideoGenerationResult {
  s3Key: string
  publicUrl: string
  durationMs: number
  fileSizeBytes: number
}

export interface AssSubtitleEvent {
  startMs: number
  endMs: number
  text: string
}
