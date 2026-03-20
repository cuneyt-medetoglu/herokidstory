"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { Link } from "@/i18n/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, Plus, ChevronLeft, ChevronRight, BookOpen, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getIllustrationStyleLabel } from "@/lib/illustration-styles"
import { mockExampleBooks, type ExampleBook, type UsedPhoto, type AgeGroup } from "./types"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useTranslations, useLocale } from "next-intl"

// Loading skeleton component
function BookCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4 md:p-5 animate-pulse">
      <div className="relative aspect-[3/4] rounded-lg bg-muted mb-4" />
      <div className="space-y-2 mb-4">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 bg-muted rounded w-1/3" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-10 h-10 md:w-14 md:h-14 rounded bg-muted" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-11 bg-muted rounded-lg" />
        <div className="h-11 bg-muted rounded-lg" />
      </div>
    </div>
  )
}

// Empty state component
function EmptyState({ onReset }: { onReset: () => void }) {
  const t = useTranslations("examples")
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Search className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t("noExamples")}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {t("noExamplesSubtitle")}
      </p>
      <Button variant="outline" onClick={onReset}>
        {t("viewAll")}
      </Button>
    </motion.div>
  )
}

// Photo comparison modal
function PhotoModal({
  open,
  onOpenChange,
  photos,
  initialIndex = 0,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  photos: UsedPhoto[]
  initialIndex?: number
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showTransformed, setShowTransformed] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)

  useEffect(() => {
    setCurrentIndex(initialIndex)
    setShowTransformed(false)
  }, [initialIndex, open])

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowTransformed(false)
    }
  }, [currentIndex, photos.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowTransformed(false)
    }
  }, [currentIndex])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goNext()
      } else {
        goPrev()
      }
    }
    setTouchStart(null)
  }

  const t = useTranslations("examples")
  const tChars = useTranslations("examples.characterNames")
  const currentPhoto = photos[currentIndex]
  if (!currentPhoto) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-sm"
      >
        <div 
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image container */}
          <div className="relative aspect-square md:aspect-[4/3] bg-muted">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentIndex}-${showTransformed}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={showTransformed && currentPhoto.transformedImage 
                    ? currentPhoto.transformedImage 
                    : currentPhoto.originalPhoto}
                  alt={currentPhoto.characterName}
                  fill
                  sizes="(max-width: 768px) 100vw,  min(80vw, 800px)"
                  className="object-contain"
                />
              </motion.div>
            </AnimatePresence>

            {/* Before/After toggle */}
            {currentPhoto.transformedImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex bg-background/80 backdrop-blur-sm rounded-full p-1">
                <button
                  onClick={() => setShowTransformed(false)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    !showTransformed 
                      ? "bg-gradient-to-r from-primary to-brand-2 text-white" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t("before")}
                </button>
                <button
                  onClick={() => setShowTransformed(true)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    showTransformed 
                      ? "bg-gradient-to-r from-primary to-brand-2 text-white" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t("after")}
                </button>
              </div>
            )}

            {/* Navigation arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  disabled={currentIndex === photos.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-background transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Footer info */}
          <div className="p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-center">
                {currentPhoto.characterNameKey ? tChars(currentPhoto.characterNameKey as any) : currentPhoto.characterName}
              </DialogTitle>
            </DialogHeader>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Book card component
function BookCard({ book, onPhotoClick }: { book: ExampleBook; onPhotoClick: (photos: UsedPhoto[], index: number) => void }) {
  const t = useTranslations("examples")
  const tBooks = useTranslations("examples.books")
  const tChars = useTranslations("examples.characterNames")

  const localizedTitle = book.localeKey ? tBooks(`${book.localeKey}.title` as any) : book.title
  const localizedDesc = book.localeKey ? tBooks(`${book.localeKey}.description` as any) : book.description
  const localizedTheme = book.localeKey ? tBooks(`${book.localeKey}.theme` as any) : book.theme

  const displayPhotos = book.usedPhotos.slice(0, 4)
  const remainingCount = book.usedPhotos.length - 4

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group bg-card rounded-xl border shadow-sm p-4 md:p-5 hover:shadow-lg transition-shadow duration-200"
    >
      {/* Cover image */}
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-4 bg-muted">
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 280px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <BookOpen className="w-12 h-12 md:w-16 md:h-16" />
          </div>
        )}
        {/* Age badge */}
        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-primary to-brand-2 text-white border-0 text-xs">
          {book.ageGroup} {t("ageYrsSuffix")}
        </Badge>
        {/* Theme badge */}
        <Badge variant="secondary" className="absolute top-2 left-2 text-xs">
          {localizedTheme}
        </Badge>
      </div>

      {/* Title and description */}
      <div className="mb-4">
        <h3 className="font-semibold text-lg md:text-xl text-foreground mb-1 line-clamp-1">
          {localizedTitle}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {localizedDesc}
        </p>
      </div>

      {/* Illustration style badge */}
      {book.storyDetails?.style && (
        <div className="mb-4">
          <Badge variant="outline" className="bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 border-violet-200 dark:border-violet-800">
            {getIllustrationStyleLabel(book.storyDetails.style)}
          </Badge>
        </div>
      )}

      {/* Used photos section */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">{t("usedPhotos")}</p>
        {book.usedPhotos.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {displayPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => onPhotoClick(book.usedPhotos, index)}
                  className="relative w-10 h-10 md:w-14 md:h-14 rounded overflow-hidden ring-2 ring-transparent hover:ring-primary transition-all bg-muted"
                >
                  {photo.originalPhoto ? (
                    <>
                      <Image
                        src={photo.originalPhoto}
                        alt={photo.characterNameKey ? tChars(photo.characterNameKey as any) : photo.characterName}
                        fill
                        sizes="56px"
                        className="object-cover"
                        onError={(e) => {
                          // Görsel yüklenemezse parent'a placeholder class ekle
                          const target = e.target as HTMLImageElement
                          const parent = target.closest('button')
                          if (parent) {
                            target.style.display = 'none'
                            if (!parent.querySelector('.photo-placeholder')) {
                              const placeholder = document.createElement('div')
                              placeholder.className = 'photo-placeholder w-full h-full flex items-center justify-center text-xs text-muted-foreground'
                              placeholder.innerHTML = '<span class="text-[8px] md:text-[10px]">📷</span>'
                              parent.appendChild(placeholder)
                            }
                          }
                        }}
                      />
                      {/* Fallback placeholder - görsel yüklenemezse gösterilir */}
                      <div className="photo-placeholder hidden w-full h-full absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-muted">
                        <span className="text-[8px] md:text-[10px]">📷</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-muted">
                      <span className="text-[8px] md:text-[10px]">📷</span>
                    </div>
                  )}
                </button>
              ))}
              {remainingCount > 0 && (
                <button
                  onClick={() => onPhotoClick(book.usedPhotos, 4)}
                  className="w-10 h-10 md:w-14 md:h-14 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  +{remainingCount}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("noPhotos")}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Link href={`/examples/${book.id}`} className="w-full">
          <Button className="w-full h-11 bg-gradient-to-r from-primary to-brand-2 hover:opacity-90 text-white">
            <Eye className="w-4 h-4 mr-2" />
            {t("viewExample")}
          </Button>
        </Link>
        <Link href={`/create/from-example?exampleId=${book.id}`} className="w-full">
          <Button variant="outline" className="w-full h-11 bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            {t("createOwnBook")}
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}

function ExamplesPageContent() {
  const t = useTranslations("examples")
  const locale = useLocale()

  const ageFilters = [
    { value: "all", label: t("ageFilter.all") },
    { value: "0-2", label: t("ageFilter.0-2") },
    { value: "3-5", label: t("ageFilter.3-5") },
    { value: "6-9", label: t("ageFilter.6-9") },
    { value: "10+", label: t("ageFilter.10+") },
  ]

  const [selectedAge, setSelectedAge] = useState<AgeGroup | "all">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [books, setBooks] = useState<ExampleBook[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPhotos, setModalPhotos] = useState<UsedPhoto[]>([])
  const [modalInitialIndex, setModalInitialIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch example books from API (locale-filtered: /en/examples → en, /tr/examples → tr)
  useEffect(() => {
    const fetchExampleBooks = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/examples?locale=${locale}`)
        const result = await response.json()

        if (result.success && result.data) {
          setBooks(result.data)
        } else {
          console.error('[Examples] Failed to fetch:', result.error)
          setBooks([]) // Fallback to empty array
        }
      } catch (error) {
        console.error('[Examples] Error fetching example books:', error)
        setBooks([]) // Fallback to empty array
      } finally {
        setIsLoading(false)
      }
    }

    fetchExampleBooks()
  }, [locale])

  // Reset to page 1 when age filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedAge])

  const filteredBooks = selectedAge === "all" 
    ? books 
    : books.filter(book => book.ageGroup === selectedAge)

  // Pagination logic - responsive items per page
  const getItemsPerPage = () => {
    if (typeof window === 'undefined') return 8 // SSR default
    const width = window.innerWidth
    if (width < 768) return 4 // Mobile: 1 column
    if (width < 1024) return 6 // Tablet: 2 columns
    if (width < 1440) return 8 // Desktop: 3 columns
    return 8 // Large Desktop: 4 columns
  }

  const [itemsPerPage, setItemsPerPage] = useState(8)

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(getItemsPerPage())
    }
    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [])

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex)

  const handlePhotoClick = (photos: UsedPhoto[], index: number) => {
    setModalPhotos(photos)
    setModalInitialIndex(Math.min(index, photos.length - 1))
    setModalOpen(true)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of books section
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal title strip – then filters */}
      <section className="border-b bg-gradient-to-br from-primary/5 via-transparent to-brand-2/5">
        <div className="container px-4 md:px-6 lg:px-8 py-5 md:py-6">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              {t("title")}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Filter chips */}
      <section className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container px-4 md:px-6 lg:px-8 py-2 md:py-3">
          <div className="relative flex gap-1.5 md:gap-2 overflow-x-auto px-1 py-1 pb-2 -mb-2 scrollbar-hide flex-nowrap [scrollbar-gutter:stable]">
            {ageFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSelectedAge(filter.value as AgeGroup | "all")}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 whitespace-nowrap",
                  selectedAge === filter.value
                    ? "bg-gradient-to-r from-primary to-brand-2 text-white shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Book cards grid */}
      <section className="container px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <EmptyState onReset={() => setSelectedAge("all")} />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {paginatedBooks.map((book, index) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <BookCard book={book} onPhotoClick={handlePhotoClick} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={cn(
                          currentPage === 1 && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)

                      if (!showPage) {
                        // Show ellipsis
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }
                        return null
                      }

                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={cn(
                          currentPage === totalPages && "pointer-events-none opacity-50"
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </section>

      {/* Photo comparison modal */}
      <PhotoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        photos={modalPhotos}
        initialIndex={modalInitialIndex}
      />

      {/* Hide scrollbar utility */}
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default function ExamplesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
      </div>
    }>
      <ExamplesPageContent />
    </Suspense>
  )
}
