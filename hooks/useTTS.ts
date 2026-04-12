"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface TTSOptions {
  voiceId?: string
  speed?: number
  volume?: number
  language?: string
  /** Pre-generated audio URL — API çağrısını atla, doğrudan oynat */
  audioUrl?: string
}

interface UseTTSReturn {
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  error: string | null
  currentWordIndex: number
  play: (text: string, options?: TTSOptions) => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  setVolume: (volume: number) => void
  setSpeed: (speed: number) => void
  onEnded: (callback: () => void) => void
}

export function useTTS(): UseTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentWordIndex, setCurrentWordIndex] = useState(-1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentOptionsRef = useRef<TTSOptions>({})
  const onEndedCallbackRef = useRef<(() => void) | null>(null)
  const rafRef = useRef<number | null>(null)
  const wordCountRef = useRef(0)
  // Eşzamanlı çift-fetch'i önleyen guard (React Strict Mode + hızlı sayfa geçişi)
  const fetchInProgressRef = useRef(false)

  const stopHighlightLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const highlightTick = useCallback(() => {
    const el = audioRef.current
    if (!el || el.paused || el.ended || !el.duration || !wordCountRef.current) return

    const progress = el.currentTime / el.duration
    const idx = Math.min(
      Math.floor(progress * wordCountRef.current),
      wordCountRef.current - 1
    )
    setCurrentWordIndex(idx)

    rafRef.current = requestAnimationFrame(highlightTick)
  }, [])

  const startHighlightLoop = useCallback(() => {
    stopHighlightLoop()
    rafRef.current = requestAnimationFrame(highlightTick)
  }, [highlightTick, stopHighlightLoop])

  useEffect(() => {
    const el = new Audio()
    audioRef.current = el

    const handleEnded = () => {
      stopHighlightLoop()
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentWordIndex(-1)
      onEndedCallbackRef.current?.()
    }
    const handlePlay = () => startHighlightLoop()
    const handlePause = () => stopHighlightLoop()

    el.addEventListener("ended", handleEnded)
    el.addEventListener("play", handlePlay)
    el.addEventListener("pause", handlePause)
    el.addEventListener("error", () => {
      setError("Audio playback error")
      setIsPlaying(false)
      setIsPaused(false)
    })

    return () => {
      stopHighlightLoop()
      el.removeEventListener("ended", handleEnded)
      el.removeEventListener("play", handlePlay)
      el.removeEventListener("pause", handlePause)
      el.pause()
      audioRef.current = null
    }
  }, [startHighlightLoop, stopHighlightLoop])

  const play = useCallback(async (text: string, options: TTSOptions = {}) => {
    // Eşzamanlı çift çağrıyı engelle
    if (fetchInProgressRef.current) return
    fetchInProgressRef.current = true
    try {
      setIsLoading(true)
      setError(null)

      const wordList = text.split(/\s+/).filter(Boolean)
      wordCountRef.current = wordList.length

      const { voiceId = "Achernar", speed = 1.0, volume = 1.0, language = "en", audioUrl: prebuiltUrl } = options
      currentOptionsRef.current = { voiceId, speed, volume, language }

      // Pre-generated URL varsa API çağrısını atla
      let resolvedAudioUrl: string
      if (prebuiltUrl) {
        resolvedAudioUrl = prebuiltUrl
      } else {
        const response = await fetch("/api/tts/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId, speed, language }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate speech")
        }

        const data = await response.json()
        if (!data?.audioUrl || typeof data.audioUrl !== "string") {
          throw new Error("API did not return a valid audio URL")
        }
        resolvedAudioUrl = data.audioUrl
      }

      if (!audioRef.current) throw new Error("Audio element not initialized")

      const el = audioRef.current
      el.volume = Math.max(0, Math.min(1, volume))
      el.playbackRate = speed

      await new Promise<void>((resolve, reject) => {
        let settled = false
        const settle = (fn: () => void) => {
          if (settled) return
          settled = true
          clearTimeout(tid)
          el.removeEventListener("canplaythrough", onCanPlay)
          el.removeEventListener("error", onError)
          fn()
        }
        const onCanPlay = () => settle(() => resolve())
        const onError = () => settle(() => reject(new Error("Ses yüklenemedi. Ağ veya CORS hatası olabilir.")))
        el.addEventListener("canplaythrough", onCanPlay, { once: true })
        el.addEventListener("error", onError, { once: true })
        const tid = setTimeout(() => {
          if (!settled) settle(() => reject(new Error("Ses yükleme zaman aşımı.")))
        }, 15000)
        el.src = resolvedAudioUrl
        el.load()
      })

      await el.play()

      setIsPlaying(true)
      setIsPaused(false)
      setCurrentWordIndex(0)
    } catch (err: any) {
      setError(err.message || "Failed to play audio")
      setIsPlaying(false)
      setIsPaused(false)
    } finally {
      setIsLoading(false)
      fetchInProgressRef.current = false
    }
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPaused(true)
    }
  }, [isPlaying])

  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play()
      setIsPaused(false)
    }
  }, [isPaused])

  const stop = useCallback(() => {
    stopHighlightLoop()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentWordIndex(-1)
    }
  }, [stopHighlightLoop])

  const setVolume = useCallback((volume: number) => {
    const validVolume = Math.max(0, Math.min(1, volume))
    if (audioRef.current) audioRef.current.volume = validVolume
    currentOptionsRef.current.volume = validVolume
  }, [])

  const setSpeed = useCallback((speed: number) => {
    const validSpeed = Math.max(0.25, Math.min(4.0, speed))
    if (audioRef.current) audioRef.current.playbackRate = validSpeed
    currentOptionsRef.current.speed = validSpeed
  }, [])

  const onEnded = useCallback((callback: () => void) => {
    onEndedCallbackRef.current = callback
  }, [])

  return {
    isPlaying,
    isPaused,
    isLoading,
    error,
    currentWordIndex,
    play,
    pause,
    resume,
    stop,
    setVolume,
    setSpeed,
    onEnded,
  }
}
