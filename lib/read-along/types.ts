export interface WordTiming {
  text: string
  startMs: number
  endMs: number
}

export interface TextChunk {
  words: WordTiming[]
  displayText: string
  startMs: number
  endMs: number
}

export interface PageTimeline {
  pageNumber: number
  totalDurationMs: number
  words: WordTiming[]
  chunks: TextChunk[]
}

export type BookTimeline = PageTimeline[]

export type TimelineStrategy = "whisper" | "heuristic"

export interface TimelineGenerateOptions {
  text: string
  audioUrl: string
  language: string
  pageNumber: number
  strategy?: TimelineStrategy
  chunkSize?: number
  forceRefresh?: boolean
}

export interface TimelineResult {
  timeline: PageTimeline
  strategy: TimelineStrategy
  cached: boolean
}
