"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { X, Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  videoUrl: string
  title?: string
  onClose?: () => void
  autoPlay?: boolean
  className?: string
  bookId?: string
}

export function VideoPlayer({
  videoUrl,
  title,
  onClose,
  autoPlay = true,
  className,
  bookId,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [resolvedUrl, setResolvedUrl] = useState<string>(videoUrl)
  const [isUrlLoading, setIsUrlLoading] = useState(!!bookId)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!bookId) {
      setResolvedUrl(videoUrl)
      setIsUrlLoading(false)
      return
    }
    let cancelled = false
    setIsUrlLoading(true)
    fetch(`/api/books/${bookId}/audio-story/url`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setResolvedUrl(data?.url || videoUrl)
          setIsUrlLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedUrl(videoUrl)
          setIsUrlLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [bookId, videoUrl])

  const handleDownload = useCallback(async () => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      const res = await fetch(resolvedUrl)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = title ? `${title}.mp4` : "video.mp4"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(resolvedUrl, "_blank")
    } finally {
      setIsDownloading(false)
    }
  }, [resolvedUrl, title, isDownloading])

  if (isUrlLoading) {
    return (
      <div className={cn("relative w-full h-full bg-black flex items-center justify-center", className)}>
        <Loader2 className="h-10 w-10 text-white animate-spin" />
      </div>
    )
  }

  return (
    <div className={cn("relative w-full h-full bg-black", className)}>
      {/* Native video player — seek, fullscreen, play/pause, volume all built-in */}
      <video
        ref={videoRef}
        src={resolvedUrl}
        controls
        autoPlay={autoPlay}
        playsInline
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Overlay: Close + Download */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-3 pt-3 z-10 pointer-events-none">
        {onClose ? (
          <button
            onClick={onClose}
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md active:scale-95 transition-transform hover:bg-black/80"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md active:scale-95 transition-transform hover:bg-black/80 disabled:opacity-50"
          aria-label="Download"
        >
          {isDownloading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}
