"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  Grid3X3,
  Bookmark,
  BookmarkCheck,
  Share2,
  Maximize,
  Minimize,
  X,
  ChevronLeft,
  RotateCcw,
  Square,
  BookOpen,
  Volume2,
  VolumeX,
  Headphones,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BookPage } from "./book-page"
import { PageThumbnails } from "./page-thumbnails"
import { useSwipeGesture } from "@/hooks/use-swipe-gesture"
import { useTTS } from "@/hooks/useTTS"
import { VideoPlayer } from "@/components/video/VideoPlayer"
import { getTtsPrefs } from "@/lib/tts-prefs"
import { DEFAULT_READER_DEFAULTS } from "@/lib/types/reader-defaults"

type AnimationType = "flip" | "slide" | "fade" | "curl" | "zoom" | "none"
type AnimationSpeed = "slow" | "normal" | "fast"
type MobileLayoutMode = "stacked" | "flip"

interface BookViewerProps {
  bookId?: string
  onClose?: () => void
  /** When true, fetch from /api/examples/[id] (public); when false, from /api/books/[id] (requires auth). */
  useExampleApi?: boolean
  /** When "watch", auto-start watch (İzle) mode after book loads. */
  initialMode?: "watch"
}

export function BookViewer({ bookId, onClose, useExampleApi = false, initialMode }: BookViewerProps) {
  const t = useTranslations("bookViewer")
  const [book, setBook] = useState<any>(null)
  const [isLoadingBook, setIsLoadingBook] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // All hooks must be declared unconditionally (React Rules of Hooks)
  const [currentPage, setCurrentPage] = useState(0)
  const [bookmarkedPages, setBookmarkedPages] = useState<Set<number>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [animationType, setAnimationType] = useState<AnimationType>("flip")
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>("normal")
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const [direction, setDirection] = useState(0)
  const [ttsSpeed, setTtsSpeed] = useState(1.0)
  const [ttsVolume, setTtsVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [autoplayMode, setAutoplayMode] = useState<"off" | "tts" | "timed">("off")
  const [autoplaySpeed, setAutoplaySpeed] = useState(10) // seconds per page
  const [autoplayCountdown, setAutoplayCountdown] = useState(0)
  const [mobileLayoutMode, setMobileLayoutMode] = useState<MobileLayoutMode>("stacked")
  const [showTextOnMobile, setShowTextOnMobile] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // TTS hook (must be called unconditionally)
  const { isPlaying, isPaused, isLoading, play, pause, resume, stop, setVolume, onEnded } = useTTS()

  // Sesli Hikaye — regeneration state (idle/failed kitaplar için)
  const [audioStoryRegenerating, setAudioStoryRegenerating] = useState(false)

  // Read-along mode

  const totalPages = book?.pages?.length ?? 0
  const isBookmarked = bookmarkedPages.has(currentPage)
  
  // Fetch book data from API
  useEffect(() => {
    if (!bookId) {
      setError('Book ID is required')
      setIsLoadingBook(false)
      return
    }

    const fetchBook = async () => {
      try {
        setIsLoadingBook(true)
        const url = useExampleApi ? `/api/examples/${bookId}` : `/api/books/${bookId}`
        const response = await fetch(url)

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Kitap yüklenemedi. Giriş yapmanız gerekebilir.')
        }

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || result.error || 'Failed to fetch book')
        }

        const bookData = result.data
        
        // DEBUG: Log API response
        console.log('[BookViewer] 📦 API Response received:')
        console.log('[BookViewer]   - Book ID:', bookData.id)
        console.log('[BookViewer]   - Title:', bookData.title)
        console.log('[BookViewer]   - Has story_data:', !!bookData.story_data)
        console.log('[BookViewer]   - Has images_data:', !!bookData.images_data)
        console.log('[BookViewer]   - images_data length:', bookData.images_data?.length || 0)
        
        if (bookData.story_data?.pages) {
          console.log('[BookViewer]   - story_data.pages length:', bookData.story_data.pages.length)
          console.log('[BookViewer]   - First page imageUrl:', bookData.story_data.pages[0]?.imageUrl || 'MISSING')
          console.log('[BookViewer]   - All page imageUrls:', bookData.story_data.pages.map((p: any, i: number) => ({
            page: i + 1,
            imageUrl: p.imageUrl || 'MISSING',
            hasImageUrl: !!p.imageUrl,
          })))
        }
        
        if (bookData.images_data && Array.isArray(bookData.images_data)) {
          console.log('[BookViewer]   - images_data sample:', bookData.images_data.slice(0, 2).map((img: any) => ({
            pageNumber: img.pageNumber,
            imageUrl: img.imageUrl || 'MISSING',
            hasImageUrl: !!img.imageUrl,
          })))
        }
        
        // Transform API response to BookViewer format
        const hasStoryData = bookData.story_data && Array.isArray(bookData.story_data.pages) && bookData.story_data.pages.length > 0
        
        // Merge images_data into story_data.pages if imageUrl is missing
        let mergedPages: any[] = []
        if (hasStoryData) {
          const pages = [...bookData.story_data.pages]
          const imagesMap = new Map()
          
          // Build map from images_data (imageUrl + audioUrl)
          const audioUrlsMap = new Map<number, string>()
          if (bookData.images_data && Array.isArray(bookData.images_data)) {
            bookData.images_data.forEach((img: any) => {
              if (img.pageNumber) {
                imagesMap.set(img.pageNumber, img.imageUrl || null)
                if (img.audioUrl) audioUrlsMap.set(img.pageNumber, img.audioUrl)
              }
            })
          }
          
          mergedPages = pages.map((page: any, index: number) => {
            const pageNum = page.pageNumber || index + 1
            const imageUrl = page.imageUrl || imagesMap.get(pageNum) || null
            const audioUrl = audioUrlsMap.get(pageNum) || null
            
            return {
              pageNumber: pageNum,
              text: page.text || '',
              imageUrl,
              audioUrl,
            }
          })
        }
        
        const transformedBook = {
          id: bookData.id,
          title: bookData.title || bookData.story_data?.title || 'Untitled',
          pages: mergedPages,
          video_url: bookData.video_url || null,
          audio_story_status: (bookData.audio_story_status as 'idle' | 'generating' | 'ready' | 'failed') ?? 'idle',
          audio_story_version: bookData.audio_story_version ?? 0,
          language: bookData.language || 'tr',
        }
        
        console.log('[BookViewer] ✅ Transformed book:')
        console.log('[BookViewer]   - Total pages:', transformedBook.pages.length)
        console.log('[BookViewer]   - Pages with imageUrl:', transformedBook.pages.filter((p: any) => p.imageUrl).length)
        console.log('[BookViewer]   - Pages without imageUrl:', transformedBook.pages.filter((p: any) => !p.imageUrl).length)
        console.log('[BookViewer]   - First page imageUrl:', transformedBook.pages[0]?.imageUrl || 'MISSING')

        setBook(transformedBook)
        setError(null)
      } catch (err) {
        console.error('[BookViewer] Error fetching book:', err)
        setError(err instanceof Error ? err.message : 'Failed to load book')
      } finally {
        setIsLoadingBook(false)
      }
    }

    fetchBook()
  }, [bookId, useExampleApi])

  // Load bookmarks once book is available
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!book?.id) return

    const savedBookmarks = localStorage.getItem(`book-bookmarks-${book.id}`)
    if (savedBookmarks) {
      try {
        const bookmarks = JSON.parse(savedBookmarks)
        setBookmarkedPages(new Set(bookmarks))
      } catch {
        // ignore invalid JSON
      }
    }
  }, [book?.id, totalPages])

  // All hooks must be declared before conditional returns (React Rules of Hooks)
  // Save bookmarks to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!book?.id) return
    localStorage.setItem(`book-bookmarks-${book.id}`, JSON.stringify(Array.from(bookmarkedPages)))
  }, [bookmarkedPages, book?.id])

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth >= 768)
    }
    checkOrientation()
    window.addEventListener("resize", checkOrientation)
    return () => window.removeEventListener("resize", checkOrientation)
  }, [])

  // mobileLayoutMode and other reader UI defaults load from global reader_defaults (GET /api/reader-defaults).

  // Reset showTextOnMobile when page changes (always show image first on new page)
  useEffect(() => {
    setShowTextOnMobile(false)
  }, [currentPage])

  // Load user TTS prefs (global for this user) from localStorage
  useEffect(() => {
    const prefs = getTtsPrefs()
    setTtsSpeed(prefs.ttsSpeed)
    setTtsVolume(prefs.volume)
  }, [])

  // Global reader defaults (admin-managed)
  useEffect(() => {
    let cancelled = false
    fetch("/api/reader-defaults")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.success) return
        const d = data.defaults ?? DEFAULT_READER_DEFAULTS
        setAnimationType(d.animationType)
        setAnimationSpeed(d.animationSpeed)
        setMobileLayoutMode(d.mobileLayoutMode)
        setAutoplayMode(d.defaultAutoplayMode)
        setAutoplaySpeed(d.defaultAutoplaySpeed)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Apply mute state to audio volume
  useEffect(() => {
    setVolume(isMuted ? 0 : ttsVolume)
  }, [isMuted, ttsVolume, setVolume])

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Navigation functions
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setDirection(1)
      setCurrentPage((prev) => prev + 1)
    }
  }, [currentPage, totalPages])

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1)
      setCurrentPage((prev) => prev - 1)
    }
  }, [currentPage])

  const goToPage = useCallback(
    (page: number) => {
      setDirection(page > currentPage ? 1 : -1)
      setCurrentPage(page)
      setShowThumbnails(false)
    },
    [currentPage],
  )

  // Swipe gesture
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: goToNextPage,
    onSwipeRight: goToPrevPage,
  })

  // Auto-advance page when TTS finishes (only if autoplay TTS mode is active)
  const handleTTSEnded = useCallback(() => {
    if (autoplayMode === "tts" && book?.pages) {
      setTimeout(() => {
        setCurrentPage((prevPage) => {
          const nextPage = prevPage + 1
          if (nextPage < totalPages) {
            setDirection(1)
            setTimeout(() => {
              const nextPageText = book.pages[nextPage]?.text
              if (nextPageText) {
                play(nextPageText, {
                  speed: ttsSpeed,
                  volume: isMuted ? 0 : ttsVolume,
                  language: book?.language || "en",
                })
              }
            }, 500)
            return nextPage
          } else {
            setAutoplayMode("off")
            return prevPage
          }
        })
      }, 1000)
    }
  }, [autoplayMode, totalPages, book?.pages, book?.language, play, ttsSpeed, ttsVolume, isMuted])

  // Set up TTS ended callback
  useEffect(() => {
    if (autoplayMode === "tts") {
      onEnded(handleTTSEnded)
    }
  }, [autoplayMode, onEnded, handleTTSEnded])

  // Timed autoplay
  useEffect(() => {
    if (autoplayMode === "timed") {
      setAutoplayCountdown(autoplaySpeed)
      const countdownInterval = setInterval(() => {
        setAutoplayCountdown((prev) => {
          if (prev <= 1) {
            if (currentPage < totalPages - 1) {
              goToNextPage()
              return autoplaySpeed
            } else {
              setAutoplayMode("off")
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(countdownInterval)
    } else {
      setAutoplayCountdown(0)
    }
  }, [autoplayMode, autoplaySpeed, currentPage, totalPages, goToNextPage])

  // Single TTS button: play from current page + autoplay through book, or stop
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      stop()
      setAutoplayMode("off")
    } else if (isPaused) {
      resume()
    } else if (autoplayMode === "tts") {
      // Autoplay on but not playing (e.g. between pages) – user wants to stop
      setAutoplayMode("off")
      stop()
    } else {
      setAutoplayMode("tts")
      const currentPageText = book?.pages?.[currentPage]?.text
      if (currentPageText) {
        await play(currentPageText, {
          speed: ttsSpeed,
          volume: isMuted ? 0 : ttsVolume,
          language: book?.language || "en",
        })
      }
    }
  }, [isPlaying, isPaused, autoplayMode, currentPage, book?.pages, book?.language, play, resume, stop, ttsSpeed, ttsVolume, isMuted])

  // Toggle autoplay mode
  const handleAutoplayToggle = useCallback(() => {
    if (autoplayMode === "off") {
      setAutoplayMode("tts")
      const currentPageText = book?.pages?.[currentPage]?.text
      if (currentPageText) {
        stop()
        setTimeout(() => {
          play(currentPageText, {
            speed: ttsSpeed,
            volume: isMuted ? 0 : ttsVolume,
            language: book?.language || "en",
          })
        }, 100)
      }
    } else {
      setAutoplayMode("off")
      stop()
    }
  }, [autoplayMode, currentPage, book?.pages, book?.language, play, stop, ttsSpeed, ttsVolume, isMuted])

  // Toggle bookmark for current page
  const toggleBookmark = useCallback(() => {
    setBookmarkedPages((prev) => {
      const newBookmarks = new Set(prev)
      if (newBookmarks.has(currentPage)) {
        newBookmarks.delete(currentPage)
      } else {
        newBookmarks.add(currentPage)
      }
      return newBookmarks
    })
  }, [currentPage])

  // Toggle flip for mobile
  const toggleFlip = useCallback(() => {
    setShowTextOnMobile((prev) => !prev)
  }, [])

  // Share function
  const handleShare = useCallback(async () => {
    if (!book?.title) return
    try {
      await navigator.share({
        title: book.title,
        text: `Check out this amazing story: ${book.title}`,
        url: window.location.href,
      })
    } catch {
      await navigator.clipboard.writeText(window.location.href)
    }
  }, [book?.title])

  // Pause/resume autoplay on tap
  const handleContentTap = useCallback(() => {
    if (autoplayMode !== "off") {
      if (autoplayMode === "tts") {
        if (isPlaying) {
          pause()
        } else if (isPaused) {
          resume()
        }
      }
    }
  }, [autoplayMode, isPlaying, isPaused, pause, resume])

  // Sesli hikaye: status 'ready' + video_url doluysa doğrudan oynatılabilir
  const audioStoryStatus = book?.audio_story_status ?? 'idle'
  const hasVideo = audioStoryStatus === 'ready' && !!book?.video_url
  const [videoMode, setVideoMode] = useState(false)

  // Auto-start watch mode if initialMode="watch" and video is ready
  const initialModeTriggered = useRef(false)
  const stopRef = useRef(stop)
  stopRef.current = stop

  useEffect(() => {
    if (initialMode === "watch" && book && !initialModeTriggered.current) {
      initialModeTriggered.current = true
      stopRef.current()
      setAutoplayMode("off")
      if (hasVideo) {
        setVideoMode(true)
      }
      // Sesli hikaye hazır değilse (idle/generating/failed) normal kitap görünümüne düşüyoruz
    }
  }, [initialMode, book, hasVideo]) // eslint-disable-line react-hooks/exhaustive-deps

  // "Dinle" butonuna tıklanınca
  const handleReadAlongStart = useCallback(async () => {
    if (!book) return
    stop()
    setAutoplayMode("off")
    if (hasVideo) {
      setVideoMode(true)
      return
    }
    // Sesli hikaye henüz hazır değil (idle/failed) → regenerate başlat
    if (audioStoryStatus === 'idle' || audioStoryStatus === 'failed') {
      setAudioStoryRegenerating(true)
      try {
        const res = await fetch(`/api/books/${book.id}/audio-story/regenerate`, { method: 'POST' })
        if (res.ok || res.status === 409) {
          // 202 → üretim başladı; 409 → zaten üretiliyor. Her iki durumda da reload ile bekle
          window.location.reload()
        }
      } catch {
        setAudioStoryRegenerating(false)
      }
    }
  }, [book, hasVideo, audioStoryStatus, stop])

  const handleReadAlongClose = useCallback(() => {
    setVideoMode(false)
    if (initialMode === "watch" && onClose) {
      onClose()
    }
  }, [initialMode, onClose])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showThumbnails && e.key === "Escape") {
        setShowThumbnails(false)
        return
      }
      if (showThumbnails) return
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault()
          goToNextPage()
          break
        case "ArrowLeft":
        case "Backspace":
          e.preventDefault()
          goToPrevPage()
          break
        case "Home":
          e.preventDefault()
          setDirection(-1)
          setCurrentPage(0)
          break
        case "End":
          e.preventDefault()
          setDirection(1)
          setCurrentPage(totalPages - 1)
          break
        case "Escape":
          e.preventDefault()
          if (isFullscreen) toggleFullscreen()
          break
        case "f":
        case "F":
          e.preventDefault()
          toggleFullscreen()
          break
        case "p":
        case "P":
          e.preventDefault()
          if (autoplayMode === "off") {
            handlePlayPause()
          }
          break
        case "a":
        case "A":
          e.preventDefault()
          handleAutoplayToggle()
          break
        case "b":
        case "B":
          e.preventDefault()
          toggleBookmark()
          break
        case "t":
        case "T":
          e.preventDefault()
          setShowThumbnails(true)
          break
        case "s":
        case "S":
          e.preventDefault()
          handleShare()
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    currentPage,
    totalPages,
    isFullscreen,
    showThumbnails,
    autoplayMode,
    goToNextPage,
    goToPrevPage,
    toggleFullscreen,
    handlePlayPause,
    handleAutoplayToggle,
    toggleBookmark,
    handleShare,
  ])

  // Stop TTS when page changes manually (but continue autoplay if active)
  useEffect(() => {
    stop()
    if (autoplayMode === "tts" && book?.pages) {
      const timer = setTimeout(() => {
        const pageData = book.pages[currentPage]
        if (pageData?.text) {
          play(pageData.text, {
            speed: ttsSpeed,
            volume: isMuted ? 0 : ttsVolume,
            language: book?.language || "en",
            // Önceden üretilmiş URL varsa API çağrısını atla
            audioUrl: pageData.audioUrl || undefined,
          })
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentPage, stop, autoplayMode, book?.pages, book?.language, play, ttsSpeed, ttsVolume, isMuted])

  // Video mode fullscreen player (pre-generated MP4)
  if (videoMode && hasVideo) {
    return (
      <div ref={containerRef} className="fixed inset-0 z-50">
        <VideoPlayer
          videoUrl={book.video_url}
          bookId={book.id}
          title={book.title}
          onClose={handleReadAlongClose}
          autoPlay
          className="h-full w-full"
        />
      </div>
    )
  }

  // Show loading state
  if (isLoadingBook) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-gray-600 dark:text-slate-400">{t("loadingBook")}</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || t("bookNotFound")}</p>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              {t("goBack")}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Show empty state for cover-only books (no pages)
  if (book.pages.length === 0) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-brand-2/5 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-md px-4">
          <BookOpen className="h-24 w-24 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{book.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t("noPagesYet")}</p>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              {t("goBack")}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Get animation duration based on speed
  const getAnimationDuration = () => {
    switch (animationSpeed) {
      case "slow":
        return 0.8
      case "fast":
        return 0.2
      case "normal":
      default:
        return 0.5
    }
  }

  // Animation variants
  const getPageVariants = () => {
    const baseDuration = getAnimationDuration()
    
    switch (animationType) {
      case "flip":
        return {
          enter: (dir: number) => ({
            rotateY: dir > 0 ? 90 : -90,
            opacity: 0,
            scale: 0.9,
            z: -50,
          }),
          center: {
            rotateY: 0,
            opacity: 1,
            scale: 1,
            z: 0,
          },
          exit: (dir: number) => ({
            rotateY: dir > 0 ? -90 : 90,
            opacity: 0,
            scale: 0.9,
            z: -50,
          }),
        }
      case "slide":
        return {
          enter: (dir: number) => ({
            x: dir > 0 ? "100%" : "-100%",
            opacity: 0,
          }),
          center: {
            x: 0,
            opacity: 1,
          },
          exit: (dir: number) => ({
            x: dir > 0 ? "-100%" : "100%",
            opacity: 0,
          }),
        }
      case "fade":
        return {
          enter: { opacity: 0, scale: 0.95 },
          center: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.95 },
        }
      case "curl":
        return {
          enter: (dir: number) => ({
            rotateY: dir > 0 ? 45 : -45,
            rotateX: 10,
            opacity: 0,
            scale: 0.95,
            z: -100,
          }),
          center: {
            rotateY: 0,
            rotateX: 0,
            opacity: 1,
            scale: 1,
            z: 0,
          },
          exit: (dir: number) => ({
            rotateY: dir > 0 ? -45 : 45,
            rotateX: -10,
            opacity: 0,
            scale: 0.95,
            z: -100,
          }),
        }
      case "zoom":
        return {
          enter: (dir: number) => ({
            scale: dir > 0 ? 1.1 : 0.9,
            opacity: 0,
            z: -50,
          }),
          center: {
            scale: 1,
            opacity: 1,
            z: 0,
          },
          exit: (dir: number) => ({
            scale: dir > 0 ? 0.9 : 1.1,
            opacity: 0,
            z: -50,
          }),
        }
      case "none":
      default:
        return {
          enter: { opacity: 1 },
          center: { opacity: 1 },
          exit: { opacity: 1 },
        }
    }
  }

  const pageVariants = getPageVariants()
  const animationDuration = getAnimationDuration()

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-primary/5 via-white to-brand-2/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/50 bg-white/80 px-4 shadow-sm backdrop-blur-sm md:h-[60px] md:px-6 dark:bg-slate-800/80">
        {/* Left: Progress */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {t("pageOf", { current: currentPage + 1, total: totalPages })}
              </span>
              {autoplayMode !== "off" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-brand-2 px-2 py-0.5 text-[10px] font-semibold text-white"
                >
                  <RotateCcw className="h-3 w-3" />
                  {autoplayMode === "tts" ? t("autoReading") : t("autoSeconds", { count: autoplayCountdown })}
                </motion.div>
              )}
            </div>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-secondary md:w-32">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-brand-2"
                initial={{ width: 0 }}
                animate={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {/* Center: Title */}
        <h1 className="hidden text-center font-semibold text-foreground md:block">{book.title}</h1>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9" aria-label="Close book">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-6 md:px-8 md:py-8"
        onClick={handleContentTap}
      >
        {/* Click zones for desktop navigation */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToPrevPage()
          }}
          disabled={currentPage === 0}
          className="absolute left-0 top-0 z-10 hidden h-full w-20 cursor-pointer items-center justify-start pl-4 opacity-0 transition-opacity hover:opacity-100 disabled:cursor-default disabled:opacity-0 md:flex"
          aria-label="Previous page"
        >
          <div className="rounded-full bg-black/10 p-2 dark:bg-white/10">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </div>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToNextPage()
          }}
          disabled={currentPage === totalPages - 1}
          className="absolute right-0 top-0 z-10 hidden h-full w-20 cursor-pointer items-center justify-end pr-4 opacity-0 transition-opacity hover:opacity-100 disabled:cursor-default disabled:opacity-0 md:flex"
          aria-label="Next page"
        >
          <div className="rounded-full bg-black/10 p-2 dark:bg-white/10">
            <ArrowRight className="h-6 w-6 text-foreground" />
          </div>
        </button>

        {/* Page Content */}
        <div
          className={cn(
            "relative flex h-full w-full items-center justify-center",
            isLandscape ? "max-w-6xl" : "max-w-3xl",
          )}
          style={{ perspective: "1500px" }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: animationDuration,
                ease: animationType === "flip" || animationType === "curl" ? "easeInOut" : "easeOut",
                type: animationType === "flip" || animationType === "curl" ? "spring" : "tween",
                stiffness: animationType === "flip" || animationType === "curl" ? 100 : undefined,
                damping: animationType === "flip" || animationType === "curl" ? 15 : undefined,
              }}
              className={cn(
                "flex h-full w-full",
                isLandscape ? "flex-row gap-6" : "flex-col",
                animationType !== "none" && "shadow-2xl",
                animationType === "flip" || animationType === "curl" ? "shadow-[0_20px_60px_rgba(0,0,0,0.3)]" : "",
              )}
              style={{
                transformStyle: "preserve-3d",
                filter: animationType === "curl" ? "drop-shadow(0 10px 30px rgba(0,0,0,0.2))" : undefined,
              }}
            >
              <BookPage 
                page={book.pages[currentPage]} 
                isLandscape={isLandscape} 
                mobileLayoutMode={mobileLayoutMode}
                showTextOnMobile={showTextOnMobile}
                onToggleFlip={toggleFlip}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Thumbnails Modal */}
        <AnimatePresence>
          {showThumbnails && (
            <PageThumbnails
              pages={book.pages}
              currentPage={currentPage}
              onSelectPage={goToPage}
              onClose={() => setShowThumbnails(false)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Footer Controls – 3.5: 44px+ touch targets on mobile, press feedback */}
      <footer className="sticky bottom-0 z-40 flex min-h-[72px] items-center justify-center gap-2 border-t border-border/50 bg-white/80 px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] backdrop-blur-sm md:h-20 md:gap-4 md:px-6 dark:bg-slate-800/80">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          className="h-11 w-11 min-h-[44px] min-w-[44px] bg-transparent transition-transform active:scale-95 md:h-12 md:w-12"
          aria-label="Previous page"
        >
          <ArrowLeft className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        {/* Single TTS: play from current page + autoplay through book, or stop */}
        <Button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="h-11 w-11 min-h-[44px] min-w-[44px] bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 transition-transform active:scale-95 md:h-12 md:w-12 disabled:opacity-50 disabled:active:scale-100"
          size="icon"
          aria-label={isLoading ? "Yükleniyor..." : isPlaying ? "Okumayı durdur" : "Bu sayfadan başla, sayfaları sırayla oku"}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-5 w-5 border-2 border-white border-t-transparent rounded-full md:h-6 md:w-6"
            />
          ) : isPlaying ? (
            <Square className="h-5 w-5 md:h-6 md:w-6" />
          ) : (
            <Play className="h-5 w-5 md:h-6 md:w-6" />
          )}
        </Button>

        {/* Sesli Hikaye CTA — duruma göre farklı buton */}
        {audioStoryStatus === 'ready' && (
          <Button
            onClick={handleReadAlongStart}
            className="h-11 min-h-[44px] px-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-transform active:scale-95 md:h-12"
            size="sm"
            aria-label={t("watchModeLabel")}
          >
            <Headphones className="mr-1 h-4 w-4" />
            <span className="text-xs font-semibold">{t("watchMode")}</span>
          </Button>
        )}
        {(audioStoryStatus === 'generating' || audioStoryRegenerating) && (
          <Button
            disabled
            className="h-11 min-h-[44px] px-3 bg-gradient-to-r from-purple-400 to-pink-400 text-white opacity-70 md:h-12"
            size="sm"
          >
            <div className="mr-1 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="text-xs font-semibold">{t("watchModeLoading")}</span>
          </Button>
        )}
        {audioStoryStatus === 'idle' && !audioStoryRegenerating && (
          <Button
            onClick={handleReadAlongStart}
            className="h-11 min-h-[44px] px-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-transform active:scale-95 md:h-12"
            size="sm"
            aria-label={t("prepareAudioStory")}
          >
            <Headphones className="mr-1 h-4 w-4" />
            <span className="text-xs font-semibold">{t("prepareAudioStory")}</span>
          </Button>
        )}
        {audioStoryStatus === 'failed' && !audioStoryRegenerating && (
          <Button
            onClick={handleReadAlongStart}
            className="h-11 min-h-[44px] px-3 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-transform active:scale-95 md:h-12"
            size="sm"
            aria-label={t("retryAudioStory")}
          >
            <Headphones className="mr-1 h-4 w-4" />
            <span className="text-xs font-semibold">{t("retryAudioStory")}</span>
          </Button>
        )}

        {/* Mute */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMuted((m) => !m)}
          className={cn(
            "h-11 w-11 min-h-[44px] min-w-[44px] transition-transform active:scale-95 md:h-12 md:w-12",
            isMuted && "bg-muted text-muted-foreground"
          )}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="h-5 w-5 md:h-6 md:w-6" /> : <Volume2 className="h-5 w-5 md:h-6 md:w-6" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextPage}
          disabled={currentPage === totalPages - 1}
          className="h-11 w-11 min-h-[44px] min-w-[44px] bg-transparent transition-transform active:scale-95 md:h-12 md:w-12"
          aria-label="Next page"
        >
          <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        <div className="mx-2 h-8 w-px bg-border md:mx-4" />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowThumbnails(true)}
          className="h-11 w-11 min-h-[44px] min-w-[44px] transition-transform active:scale-95 md:h-12 md:w-12"
          aria-label="View all pages"
        >
          <Grid3X3 className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleBookmark}
          className={cn("h-11 w-11 min-h-[44px] min-w-[44px] transition-transform active:scale-95 md:h-12 md:w-12", isBookmarked && "text-brand-2")}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {isBookmarked ? <BookmarkCheck className="h-5 w-5 md:h-6 md:w-6 fill-brand-2" /> : <Bookmark className="h-5 w-5 md:h-6 md:w-6" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleShare}
          className="h-11 w-11 min-h-[44px] min-w-[44px] transition-transform active:scale-95 md:h-12 md:w-12"
          aria-label="Share book"
        >
          <Share2 className="h-5 w-5 md:h-6 md:w-6" />
        </Button>

      </footer>
    </div>
  )
}

