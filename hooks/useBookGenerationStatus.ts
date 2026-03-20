/**
 * useBookGenerationStatus — Kitap oluşturma durumunu periyodik olarak sorgular.
 *
 * Kullanım:
 *   const { status, progress, step, isDone, isError } = useBookGenerationStatus(bookId)
 *
 * Poll aralığı: `pollIntervalMs` (varsayılan 4000ms — dev konsolda `GET .../generation-status` gürültüsünü azaltır)
 * Durum 'completed' veya 'failed' olunca polling durur.
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type GenerationStatus = 'queued' | 'generating' | 'completed' | 'failed' | 'draft' | 'unknown'
export type GenerationStep =
  | 'story_generating'
  | 'master_generating'
  | 'cover_generating'
  | 'pages_generating'
  | 'tts_generating'
  | 'completed'
  | 'failed'
  | ''

export interface BookGenerationState {
  bookId: string
  title: string
  status: GenerationStatus
  progress: number
  step: GenerationStep
  isDone: boolean
  isError: boolean
  isLoading: boolean
  error: string | null
  /** Worker/pipeline hatası (DB generation_metadata.lastGenerationError) */
  lastGenerationError: string | null
  refetch: () => void
}

const TERMINAL_STATUSES: GenerationStatus[] = ['completed', 'failed']

async function fetchStatus(bookId: string) {
  const res = await fetch(`/api/books/${bookId}/generation-status`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<{
    success: boolean
    bookId: string
    title: string
    status: string
    progress_percent: number
    progress_step: string
    lastGenerationError?: string
  }>
}

export function useBookGenerationStatus(
  bookId: string | null | undefined,
  pollIntervalMs: number = 4000
): BookGenerationState {
  const [state, setState] = useState<Omit<BookGenerationState, 'refetch'>>({
    bookId: bookId ?? '',
    title: '',
    status: 'unknown',
    progress: 0,
    step: '',
    isDone: false,
    isError: false,
    isLoading: true,
    error: null,
    lastGenerationError: null,
  })

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stoppedRef = useRef(false)
  const inFlightRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const scheduleNext = useCallback(() => {
    if (stoppedRef.current || !bookId) return
    clearTimer()
    timeoutRef.current = setTimeout(() => {
      void poll()
    }, pollIntervalMs)
  }, [bookId, clearTimer, pollIntervalMs])

  const poll = useCallback(async () => {
    if (!bookId || stoppedRef.current || inFlightRef.current) return
    if (typeof document !== 'undefined' && document.hidden) {
      scheduleNext()
      return
    }
    inFlightRef.current = true

    try {
      const data = await fetchStatus(bookId)
      const status = data.status as GenerationStatus
      const progress = data.progress_percent ?? 0
      const step = (data.progress_step ?? '') as GenerationStep
      const isDone = TERMINAL_STATUSES.includes(status)
      const isError = status === 'failed'

      setState((prev) => ({
        bookId,
        title: data.title ?? '',
        status,
        // Paralel pipeline'da ara adımlar hızlı gelebilir; UI'da geri sıçrama gösterme.
        progress: Math.max(prev.progress, progress),
        step,
        isDone,
        isError,
        isLoading: false,
        error: null,
        lastGenerationError: data.lastGenerationError?.trim() || null,
      }))

      if (isDone) {
        stoppedRef.current = true
        clearTimer()
      } else {
        scheduleNext()
      }
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message ?? 'Bilinmeyen hata',
      }))
      scheduleNext()
    } finally {
      inFlightRef.current = false
    }
  }, [bookId, clearTimer, scheduleNext])

  useEffect(() => {
    if (!bookId) {
      setState((prev) => ({ ...prev, isLoading: false, status: 'unknown' }))
      return
    }

    stoppedRef.current = false
    inFlightRef.current = false
    clearTimer()
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    void poll()

    const onVisibilityChange = () => {
      if (!document.hidden && !stoppedRef.current) {
        void poll()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearTimer()
    }
  }, [bookId, poll, clearTimer])

  const refetch = useCallback(() => {
    stoppedRef.current = false
    void poll()
  }, [poll])

  return { ...state, refetch }
}

// Step label'larını Türkçe/İngilizce döndüren yardımcı
export function getStepLabel(step: GenerationStep, locale: string = 'tr'): string {
  const labels: Record<GenerationStep, { tr: string; en: string }> = {
    story_generating: { tr: 'Hikaye yazılıyor...', en: 'Writing the story...' },
    master_generating: { tr: 'Karakter illüstrasyonu oluşturuluyor...', en: 'Creating character illustrations...' },
    cover_generating: { tr: 'Kapak tasarlanıyor...', en: 'Designing the cover...' },
    pages_generating: { tr: 'Sayfa görselleri oluşturuluyor...', en: 'Generating page illustrations...' },
    tts_generating: { tr: 'Sesli anlatım hazırlanıyor...', en: 'Preparing narration audio...' },
    completed: { tr: 'Kitabınız hazır!', en: 'Your book is ready!' },
    failed: { tr: 'Bir hata oluştu', en: 'An error occurred' },
    '': { tr: 'Hazırlanıyor...', en: 'Preparing...' },
  }
  const entry = labels[step] ?? labels['']
  return locale === 'tr' ? entry.tr : entry.en
}
