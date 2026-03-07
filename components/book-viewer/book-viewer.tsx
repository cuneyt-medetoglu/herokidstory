"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
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
  Settings,
  X,
  ChevronLeft,
  RotateCcw,
  Square,
  BookOpen,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { BookPage } from "./book-page"
import { PageThumbnails } from "./page-thumbnails"
import { useSwipeGesture } from "@/hooks/use-swipe-gesture"
import { useTTS } from "@/hooks/useTTS"
import { getTtsPrefs } from "@/lib/tts-prefs"

// Mock data - Faz 3'te API'den gelecek
const mockBook = {
  id: "book-123",
  title: "Arya's Adventure",
  pages: [
    {
      pageNumber: 1,
      imageUrl: "/magical-forest-entrance-with-glowing-pathway-child.jpg",
      text: "Once upon a time, there was a little girl named Arya who lived at the edge of a magical forest. Every night, she would look out her window and wonder what secrets lay hidden among the trees.",
    },
    {
      pageNumber: 2,
      imageUrl: "/little-girl-with-backpack-exploring-enchanted-fore.jpg",
      text: "One sunny morning, Arya decided to explore the forest. She packed her favorite snacks, put on her adventure boots, and stepped onto the winding path that led into the woods.",
    },
    {
      pageNumber: 3,
      imageUrl: "/talking-rabbit-with-colorful-vest-in-forest-cleari.jpg",
      text: "Deep in the forest, she met a friendly rabbit named Oliver. He wore a tiny vest and spoke in riddles. 'To find the treasure you seek, follow the butterflies to the creek!'",
    },
    {
      pageNumber: 4,
      imageUrl: "/colorful-butterflies-leading-path-through-magical-.jpg",
      text: "Arya followed the butterflies through meadows of wildflowers. They shimmered in shades of purple, pink, and gold, leaving trails of sparkles in the air.",
    },
    {
      pageNumber: 5,
      imageUrl: "/sparkling-creek-with-stepping-stones-and-fireflies.jpg",
      text: "At last, she reached the crystal creek. Stepping stones led across the water, and fireflies danced above the surface like tiny floating lanterns.",
    },
    {
      pageNumber: 6,
      imageUrl: "/ancient-tree-with-door-carved-into-trunk-magical-f.jpg",
      text: "On the other side, Arya discovered an ancient tree with a door carved into its trunk. It was covered in glowing runes and seemed to hum with magic.",
    },
    {
      pageNumber: 7,
      imageUrl: "/cozy-room-inside-tree-with-tiny-furniture-and-book.jpg",
      text: "Inside the tree was a cozy room filled with books, soft cushions, and a warm fireplace. This was the forest library, where all the woodland creatures came to share stories.",
    },
    {
      pageNumber: 8,
      imageUrl: "/wise-owl-with-glasses-reading-book-to-forest-anima.jpg",
      text: "A wise owl named Professor Hoot welcomed her. 'Every adventurer finds this place when they need it most,' he said, adjusting his tiny spectacles.",
    },
    {
      pageNumber: 9,
      imageUrl: "/little-girl-reading-glowing-book-surrounded-by-for.jpg",
      text: "Professor Hoot gave Arya a special book that glowed with her name on the cover. 'This book will fill with your own adventures,' he explained with a knowing smile.",
    },
    {
      pageNumber: 10,
      imageUrl: "/little-girl-walking-home-at-sunset-with-magical-bo.jpg",
      text: "As the sun began to set, Arya made her way home with her magical book. She knew this was just the beginning of many wonderful adventures to come. The End.",
    },
  ],
  totalPages: 10,
}

type AnimationType = "flip" | "slide" | "fade" | "curl" | "zoom" | "none"
type AnimationSpeed = "slow" | "normal" | "fast"
type MobileLayoutMode = "stacked" | "flip"

interface BookViewerProps {
  bookId?: string
  onClose?: () => void
  /** When true, fetch from /api/examples/[id] (public); when false, from /api/books/[id] (requires auth). */
  useExampleApi?: boolean
}

export function BookViewer({ bookId, onClose, useExampleApi = false }: BookViewerProps) {
  const router = useRouter()
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
  const [selectedVoice, setSelectedVoice] = useState("Achernar")
  const [ttsSpeed, setTtsSpeed] = useState(1.0)
  const [ttsVolume, setTtsVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [autoplayMode, setAutoplayMode] = useState<"off" | "tts" | "timed">("off")
  const [autoplaySpeed, setAutoplaySpeed] = useState(10) // seconds per page
  const [autoplayCountdown, setAutoplayCountdown] = useState(0)
  const [mobileLayoutMode, setMobileLayoutMode] = useState<MobileLayoutMode>("stacked")
  const [showTextOnMobile, setShowTextOnMobile] = useState(false)
  const [ttsSettings, setTtsSettings] = useState<{ voiceName: string; prompt: string; languageCode: string } | null>(null)
  const [canEditTts, setCanEditTts] = useState(false)
  const [ttsAdminPrompt, setTtsAdminPrompt] = useState("")
  const [ttsAdminVoice, setTtsAdminVoice] = useState("Achernar")
  const [ttsAdminLanguage, setTtsAdminLanguage] = useState("tr")
  const [ttsAdminSaving, setTtsAdminSaving] = useState(false)
  const [showTtsAdminDialog, setShowTtsAdminDialog] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null)

  // TTS hook (must be called unconditionally)
  const { isPlaying, isPaused, isLoading, play, pause, resume, stop, setVolume, onEnded } = useTTS()

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
          
          // Build map from images_data
          if (bookData.images_data && Array.isArray(bookData.images_data)) {
            bookData.images_data.forEach((img: any) => {
              if (img.pageNumber) {
                imagesMap.set(img.pageNumber, img.imageUrl || null)
              }
            })
          }
          
          mergedPages = pages.map((page: any, index: number) => {
            const pageNum = page.pageNumber || index + 1
            // Use imageUrl from page, or fallback to images_data
            const imageUrl = page.imageUrl || imagesMap.get(pageNum) || null
            
            return {
              pageNumber: pageNum,
              text: page.text || '',
              imageUrl: imageUrl,
            }
          })
        }
        
        const transformedBook = {
          id: bookData.id,
          title: bookData.title || bookData.story_data?.title || 'Untitled',
          pages: mergedPages,
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

  // Load reading progress/bookmarks once book is available
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!book?.id) return

    const savedProgress = localStorage.getItem(`book-progress-${book.id}`)
    if (savedProgress) {
      const page = parseInt(savedProgress, 10)
      if (!Number.isNaN(page) && page >= 0 && page < totalPages) {
        setCurrentPage(page)
      }
    }

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
  // Save reading progress to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!book?.id) return
    localStorage.setItem(`book-progress-${book.id}`, currentPage.toString())
  }, [currentPage, book?.id])

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

  // Auto-enable flip mode on mobile/tablet (portrait mode)
  useEffect(() => {
    if (!isLandscape) {
      // Mobile/Tablet portrait mode → auto-enable flip mode
      setMobileLayoutMode("flip")
    } else {
      // Desktop landscape mode → use stacked (default)
      setMobileLayoutMode("stacked")
    }
  }, [isLandscape])

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

  // Apply mute state to audio volume
  useEffect(() => {
    setVolume(isMuted ? 0 : ttsVolume)
  }, [isMuted, ttsVolume, setVolume])

  // Fetch global TTS settings (read-only display) and whether current user can edit (admin)
  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/tts/settings").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/tts/settings/can-edit").then((r) => (r.ok ? r.json() : { canEdit: false })),
    ]).then(([settings, canEditRes]) => {
      if (cancelled) return
      if (settings) {
        setTtsSettings({ voiceName: settings.voiceName, prompt: settings.prompt, languageCode: settings.languageCode })
        setTtsAdminVoice(settings.voiceName)
        setTtsAdminPrompt(settings.prompt)
        setTtsAdminLanguage(settings.languageCode)
      }
      setCanEditTts(!!canEditRes?.canEdit)
    })
    return () => { cancelled = true }
  }, [])

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
  }, [autoplayMode, totalPages, book?.pages, play, selectedVoice, ttsSpeed, ttsVolume, isMuted])

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
  }, [isPlaying, isPaused, autoplayMode, currentPage, book?.pages, play, resume, stop, selectedVoice, ttsSpeed, ttsVolume, isMuted])

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
  }, [autoplayMode, currentPage, book?.pages, play, stop, selectedVoice, ttsSpeed, ttsVolume, isMuted])

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
        const currentPageText = book.pages[currentPage]?.text
        if (currentPageText) {
          play(currentPageText, {
            speed: ttsSpeed,
            volume: isMuted ? 0 : ttsVolume,
            language: book?.language || "en",
          })
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [currentPage, stop, autoplayMode, book?.pages, play, selectedVoice, ttsSpeed, ttsVolume, isMuted])

  // Show loading state
  if (isLoadingBook) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mx-auto" />
          <p className="text-gray-600 dark:text-slate-400">Loading book...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Book not found'}</p>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Go Back
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Show empty state for cover-only books (no pages)
  if (book.pages.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center max-w-md px-4">
          <BookOpen className="h-24 w-24 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{book.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This book has no pages yet. It's a cover-only book.</p>
          {onClose && (
            <Button onClick={onClose} variant="outline">
              Go Back
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
      className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
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
                Page {currentPage + 1} of {totalPages}
              </span>
              {autoplayMode !== "off" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[10px] font-semibold text-white"
                >
                  <RotateCcw className="h-3 w-3" />
                  {autoplayMode === "tts" ? "Auto-reading" : `Auto (${autoplayCountdown}s)`}
                </motion.div>
              )}
            </div>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-secondary md:w-32">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Autoplay Mode</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAutoplayMode("off")}>
                <span className={cn(autoplayMode === "off" && "font-semibold")}>Off</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAutoplayMode("tts")}>
                <span className={cn(autoplayMode === "tts" && "font-semibold")}>TTS Synced (Auto-read)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAutoplayMode("timed")}>
                <span className={cn(autoplayMode === "timed" && "font-semibold")}>Timed (Auto-turn pages)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Autoplay Speed (Timed)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAutoplaySpeed(5)}>
                <span className={cn(autoplaySpeed === 5 && "font-semibold")}>Fast (5s per page)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAutoplaySpeed(10)}>
                <span className={cn(autoplaySpeed === 10 && "font-semibold")}>Normal (10s per page)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAutoplaySpeed(15)}>
                <span className={cn(autoplaySpeed === 15 && "font-semibold")}>Slow (15s per page)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAutoplaySpeed(20)}>
                <span className={cn(autoplaySpeed === 20 && "font-semibold")}>Very Slow (20s per page)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Mobile Layout</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setMobileLayoutMode("stacked")}>
                <span className={cn(mobileLayoutMode === "stacked" && "font-semibold")}>Stacked (Default)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMobileLayoutMode("flip")}>
                <span className={cn(mobileLayoutMode === "flip" && "font-semibold")}>Flip Mode</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Page Animation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAnimationType("flip")}>
                <span className={cn(animationType === "flip" && "font-semibold")}>Flip (3D)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAnimationType("slide")}>
                <span className={cn(animationType === "slide" && "font-semibold")}>Slide</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAnimationType("fade")}>
                <span className={cn(animationType === "fade" && "font-semibold")}>Fade</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAnimationType("curl")}>
                <span className={cn(animationType === "curl" && "font-semibold")}>Page Curl</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAnimationType("zoom")}>
                <span className={cn(animationType === "zoom" && "font-semibold")}>Zoom</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAnimationType("none")}>
                <span className={cn(animationType === "none" && "font-semibold")}>None (Instant)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Animation Speed</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAnimationSpeed("slow")}>
                <span className={cn(animationSpeed === "slow" && "font-semibold")}>Slow</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAnimationSpeed("normal")}>
                <span className={cn(animationSpeed === "normal" && "font-semibold")}>Normal</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAnimationSpeed("fast")}>
                <span className={cn(animationSpeed === "fast" && "font-semibold")}>Fast</span>
              </DropdownMenuItem>
              {canEditTts && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>TTS varsayılanları (Admin)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowTtsAdminDialog(true)} className="cursor-pointer">
                    Ses / ton / dil düzenle (global)
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={showTtsAdminDialog} onOpenChange={setShowTtsAdminDialog}>
            <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>TTS varsayılanları (herkese uygulanır)</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="tts-admin-voice">Ses adı</Label>
                  <Input
                    id="tts-admin-voice"
                    value={ttsAdminVoice}
                    onChange={(e) => setTtsAdminVoice(e.target.value)}
                    placeholder="Achernar"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tts-admin-prompt">Okuma tonu (prompt)</Label>
                  <Textarea
                    id="tts-admin-prompt"
                    value={ttsAdminPrompt}
                    onChange={(e) => setTtsAdminPrompt(e.target.value)}
                    placeholder="Heyecanlı çocuk hikayesi tonunda..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tts-admin-lang">Dil kodu (PRD)</Label>
                  <Input
                    id="tts-admin-lang"
                    value={ttsAdminLanguage}
                    onChange={(e) => setTtsAdminLanguage(e.target.value)}
                    placeholder="tr, en, de, fr, es, pt, ru, zh"
                  />
                </div>
                <Button
                  disabled={ttsAdminSaving}
                  onClick={async () => {
                    setTtsAdminSaving(true)
                    try {
                      const res = await fetch("/api/tts/settings", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          voiceName: ttsAdminVoice.trim() || "Achernar",
                          prompt: ttsAdminPrompt.trim() || "Çocuk hikayesi anlatır gibi enerjik, heyecanlı ve sıcak bir tonda konuş.",
                          languageCode: ttsAdminLanguage.trim() || "tr",
                        }),
                      })
                      if (!res.ok) throw new Error("Kaydetme başarısız")
                      const data = await res.json()
                      setTtsSettings({ voiceName: data.voiceName, prompt: data.prompt, languageCode: data.languageCode })
                      setShowTtsAdminDialog(false)
                    } catch (e) {
                      console.error(e)
                    } finally {
                      setTtsAdminSaving(false)
                    }
                  }}
                >
                  {ttsAdminSaving ? "Kaydediliyor…" : "Kaydet (global)"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
          className={cn("h-11 w-11 min-h-[44px] min-w-[44px] transition-transform active:scale-95 md:h-12 md:w-12", isBookmarked && "text-pink-500")}
          aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
        >
          {isBookmarked ? <BookmarkCheck className="h-5 w-5 md:h-6 md:w-6 fill-pink-500" /> : <Bookmark className="h-5 w-5 md:h-6 md:w-6" />}
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

        {/* Parent Settings - Subtle link for parents */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/books/${bookId}/settings`)}
          className="hidden text-xs text-muted-foreground hover:text-foreground md:flex"
          aria-label="Parent Settings"
        >
          <Settings className="h-3 w-3 mr-1" />
          <span className="hidden lg:inline">Parent Settings</span>
        </Button>
      </footer>
    </div>
  )
}

