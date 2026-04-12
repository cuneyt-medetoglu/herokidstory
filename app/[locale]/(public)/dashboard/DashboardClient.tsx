"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import {
  Search,
  Grid3x3,
  List,
  BookOpen,
  Plus,
  Download,
  Share2,
  Edit,
  Loader2,
  ShoppingCart,
  CheckSquare,
  Square,
  Volume2,
  SlidersHorizontal,
  Headphones,
  FileText,
  Film,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Empty } from "@/components/ui/empty"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/CartContext"
import { useCurrency } from "@/contexts/CurrencyContext"
import { getIllustrationStyleLabel } from "@/lib/illustration-styles"
import { getProductPrice, isProductAvailableInCurrency } from "@/lib/pricing/payment-products"

export type DashboardBook = {
  id: string
  title: string
  coverImage: string
  status: "completed" | "in-progress" | "draft"
  createdDate: string
  illustrationStyle?: string
  videoUrl?: string
  audioStoryStatus?: "idle" | "generating" | "ready" | "failed"
}

const statusColors = {
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  "in-progress": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

interface DashboardClientProps {
  initialBooks: DashboardBook[]
}

export default function DashboardClient({ initialBooks }: DashboardClientProps) {
  const t = useTranslations("dashboard")
  const router = useRouter()
  const { toast } = useToast()
  const { addToCart } = useCart()
  const { currencyConfig } = useCurrency()
  const hardcopyUnitPrice = getProductPrice("hardcopy", currencyConfig.currency)
  const hardcopyAvailable = isProductAvailableInCurrency("hardcopy", currencyConfig.currency)

  const [books, setBooks] = useState<DashboardBook[]>(initialBooks)
  const [filter, setFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<string>("date-newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null)

  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)

  const filteredBooks = useMemo(() => {
    let result = books.filter((book) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "completed" && book.status === "completed") ||
        (filter === "in-progress" && book.status === "in-progress") ||
        (filter === "drafts" && book.status === "draft")
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "date-newest":
          return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        case "date-oldest":
          return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
        case "title-az":
          return a.title.localeCompare(b.title)
        case "title-za":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    return result
  }, [books, filter, searchQuery, sortBy])

  const hasBooks = books.length > 0
  const hasFilteredResults = filteredBooks.length > 0

  const handleCreateBook = () => {
    router.push("/create/step1?new=1")
  }

  const handleReadBook = (bookId: string) => {
    const targetBook = books.find((b) => b.id === bookId)
    if (targetBook?.status === "in-progress") {
      router.push(`/create/generating/${bookId}`)
      return
    }
    router.push(`/books/${bookId}/view`)
  }

  const handleWatchBook = (bookId: string) => {
    router.push(`/books/${bookId}/view?mode=audio-story`)
  }

  const handleEditBook = (bookId: string) => {
    router.push(`/books/${bookId}/settings`)
  }

  const handleDownloadBook = async (bookId: string) => {
    try {
      setDownloadingBookId(bookId)

      const response = await fetch(`/api/books/${bookId}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || "Failed to generate PDF")
      }

      const pdfUrl = result.data?.pdfUrl
      if (!pdfUrl) throw new Error("PDF URL not found in response")

      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = `${bookId}.pdf`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: t("toasts.pdfSuccessTitle"),
        description: t("toasts.pdfSuccessDesc"),
      })
    } catch (error) {
      toast({
        title: t("toasts.pdfFailedTitle"),
        description: error instanceof Error ? error.message : t("toasts.pdfFailedDesc"),
        variant: "destructive",
      })
    } finally {
      setDownloadingBookId(null)
    }
  }

  const handleDownloadVideo = async (bookId: string, bookTitle?: string) => {
    try {
      setDownloadingBookId(bookId)
      // Aynı-origin indirme: S3 signed URL'ye tarayıcıdan fetch CORS yüzünden çoğu ortamda başarısız olur
      const videoRes = await fetch(`/api/books/${bookId}/audio-story/download`)
      if (!videoRes.ok) {
        const errBody = await videoRes.json().catch(() => ({}))
        throw new Error((errBody as { error?: string }).error || "Video indirilemedi")
      }
      const blob = await videoRes.blob()
      const blobUrl = URL.createObjectURL(blob)
      const safeName = (bookTitle || bookId)
        .replace(/[/\\?%*:|"<>]/g, "")
        .replace(/\s+/g, "_")
        .slice(0, 80) || bookId
      const a = document.createElement("a")
      a.href = blobUrl
      a.download = `${safeName}.mp4`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      toast({
        title: t("toasts.videoSuccessTitle"),
        description: t("toasts.videoSuccessDesc"),
      })
    } catch (error) {
      toast({
        title: t("toasts.videoFailedTitle"),
        description: error instanceof Error ? error.message : t("toasts.videoFailedDesc"),
        variant: "destructive",
      })
    } finally {
      setDownloadingBookId(null)
    }
  }

  const handleShareBook = (bookId: string) => {
    // ROADMAP: Share functionality
    console.log("Share book:", bookId)
  }

  const handleSelectAll = () => {
    if (selectedBooks.length === filteredBooks.length) {
      setSelectedBooks([])
    } else {
      setSelectedBooks(filteredBooks.map((book) => book.id))
    }
  }

  const handleBookSelect = (bookId: string) => {
    setSelectedBooks((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]
    )
  }

  const handleAddSelectedToCart = async () => {
    if (selectedBooks.length === 0) {
      toast({
        title: t("toasts.noBooksSelectedTitle"),
        description: t("toasts.noBooksSelectedDesc"),
        variant: "destructive",
      })
      return
    }

    const completedBooks = filteredBooks.filter(
      (book) => selectedBooks.includes(book.id) && book.status === "completed"
    )

    if (completedBooks.length === 0) {
      toast({
        title: t("toasts.noValidBooksTitle"),
        description: t("toasts.noValidBooksDesc"),
        variant: "destructive",
      })
      return
    }

    if (completedBooks.length < selectedBooks.length) {
      toast({
        title: t("toasts.someBooksSkippedTitle"),
        description: t("toasts.someBooksSkippedDesc"),
      })
    }

    if (!hardcopyAvailable) {
      toast({
        title: t("toasts.hardcopyUnavailableTitle"),
        description: t("toasts.hardcopyUnavailableDesc"),
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          book_ids: completedBooks.map((book) => book.id),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add books to cart")
      }

      completedBooks.forEach((book) => {
        addToCart({
          type: "hardcopy",
          bookId: book.id,
          bookTitle: book.title,
          coverImage: book.coverImage,
          price: hardcopyUnitPrice,
          currency: currencyConfig.currency,
          quantity: 1,
          productId: "hardcopy",
        })
      })

      toast({
        title: t("toasts.addedToCartTitle"),
        description: t("toasts.addedToCartDesc", { count: completedBooks.length }),
      })

      setSelectedBooks([])
      setIsSelectMode(false)
      router.push("/cart")
    } catch (error) {
      toast({
        title: t("toasts.failedAddToCartTitle"),
        description: error instanceof Error ? error.message : t("toasts.failedAddToCartDesc"),
        variant: "destructive",
      })
    }
  }

  const handleAddSingleToCart = async (bookId: string) => {
    const book = books.find((b) => b.id === bookId)
    if (!book) return

    if (book.status !== "completed") {
      toast({
        title: t("toasts.cannotAddToCartTitle"),
        description: t("toasts.cannotAddToCartDesc"),
        variant: "destructive",
      })
      return
    }

    if (!hardcopyAvailable) {
      toast({
        title: t("toasts.hardcopyUnavailableTitle"),
        description: t("toasts.hardcopyUnavailableDesc"),
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", book_ids: [bookId] }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add book to cart")
      }

      addToCart({
        type: "hardcopy",
        bookId: book.id,
        bookTitle: book.title,
        coverImage: book.coverImage,
        price: hardcopyUnitPrice,
        currency: currencyConfig.currency,
        quantity: 1,
        productId: "hardcopy",
      })

      toast({
        title: t("toasts.addedToCartTitle"),
        description: t("toasts.addedSingleToCartDesc", { title: book.title }),
      })

      router.push("/cart")
    } catch (error) {
      toast({
        title: t("toasts.failedAddToCartTitle"),
        description: error instanceof Error ? error.message : t("toasts.failedAddToCartDesc"),
        variant: "destructive",
      })
    }
  }

  const selectedTotal = selectedBooks.length * hardcopyUnitPrice

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-4xl font-bold text-foreground">{t("title")}</h1>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {books.length}
            </Badge>
          </div>

          {/* Bulk Actions Bar */}
          {(isSelectMode || selectedBooks.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-4 dark:border-primary/20 dark:bg-primary/5"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedBooks.length === filteredBooks.length && filteredBooks.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="h-5 w-5"
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {t("selectAll")}
                    </span>
                  </div>
                  {selectedBooks.length > 0 && (
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {t("selectedCount", { count: selectedBooks.length })}
                    </Badge>
                  )}
                  {selectedBooks.length > 0 && (
                    <span className="text-sm font-semibold text-primary">
                      {t("total")} {currencyConfig.symbol}
                      {selectedTotal.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsSelectMode(false)
                      setSelectedBooks([])
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddSelectedToCart}
                    disabled={selectedBooks.length === 0 || !hardcopyAvailable}
                    className="bg-gradient-to-r from-primary to-brand-2 text-white"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t("addSelectedToCart", { count: selectedBooks.length })}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filters and Controls */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 w-full sm:w-auto">
                <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
                  <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start sm:inline-flex sm:h-10 sm:w-auto sm:flex-nowrap">
                    <TabsTrigger value="all" className="text-xs sm:text-sm">{t("tabs.all")}</TabsTrigger>
                    <TabsTrigger value="completed" className="text-xs sm:text-sm">{t("tabs.completed")}</TabsTrigger>
                    <TabsTrigger value="in-progress" className="text-xs sm:text-sm">{t("tabs.inProgress")}</TabsTrigger>
                    <TabsTrigger value="drafts" className="text-xs sm:text-sm">{t("tabs.drafts")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                {!isSelectMode && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsSelectMode(true)}
                    className="w-full sm:w-auto shrink-0 text-sm sm:text-base"
                  >
                    <CheckSquare className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">{t("selectBooks")}</span>
                    <span className="sm:hidden">{t("selectBooksShort")}</span>
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={handleCreateBook}
                  className="w-full shrink-0 bg-gradient-to-r from-primary to-brand-2 text-sm text-white transition-opacity hover:opacity-90 sm:w-auto sm:text-base"
                >
                  <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">{t("createNewBook")}</span>
                  <span className="sm:hidden">{t("createBookShort")}</span>
                </Button>
              </div>
            </div>

            <div className="my-4 h-px bg-border" aria-hidden />

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 md:shrink-0">
                <div className="inline-flex w-full items-center rounded-md bg-muted p-1 sm:w-auto">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="flex-1 px-2 sm:flex-none sm:px-3"
                  >
                    <Grid3x3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="flex-1 px-2 sm:flex-none sm:px-3"
                  >
                    <List className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full min-w-0 sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-newest">{t("sort.dateNewest")}</SelectItem>
                    <SelectItem value="date-oldest">{t("sort.dateOldest")}</SelectItem>
                    <SelectItem value="title-az">{t("sort.titleAZ")}</SelectItem>
                    <SelectItem value="title-za">{t("sort.titleZA")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {!hasBooks ? (
          /* True empty state: user has no books at all */
          <Empty
            icon={BookOpen}
            title={t("empty.title")}
            description={t("empty.subtitle")}
            action={
              <Button
                size="lg"
                onClick={handleCreateBook}
                className="bg-gradient-to-r from-primary to-brand-2 hover:opacity-90 transition-opacity text-white"
              >
                <Plus className="mr-2 h-5 w-5" />
                {t("createNewBook")}
              </Button>
            }
          />
        ) : !hasFilteredResults ? (
          /* Filter/search returned no results but user does have books */
          <Empty
            icon={SlidersHorizontal}
            title={t("noResults.title")}
            description={t("noResults.subtitle")}
          />
        ) : (
          <motion.div
            layout
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <Card
                  className={`group relative h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                    selectedBooks.includes(book.id) ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <CardContent className="flex h-full flex-col p-4">
                    {(isSelectMode || selectedBooks.length > 0) && (
                      <div className="absolute top-4 left-4 z-10">
                        <Checkbox
                          checked={selectedBooks.includes(book.id)}
                          onCheckedChange={() => handleBookSelect(book.id)}
                          className="h-5 w-5 border-2 border-primary/60 bg-background dark:bg-slate-900/90 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary"
                        />
                      </div>
                    )}

                    <div className="relative mb-4 overflow-hidden rounded-lg aspect-[3/4] bg-muted">
                      {book.coverImage ? (
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <BookOpen className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="mb-4 min-h-[7rem] space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-2 text-foreground">{book.title}</h3>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-xs text-muted-foreground">
                            {t("createdOn")} {book.createdDate}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`shrink-0 px-2 py-0.5 text-[11px] sm:text-xs ${statusColors[book.status]}`}
                          >
                            {book.status === "completed"
                              ? t("status.completed")
                              : book.status === "in-progress"
                              ? t("status.inProgress")
                              : t("status.draft")}
                          </Badge>
                        </div>

                        <div className="h-6 overflow-hidden">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            {book.status === "completed" && (
                              <>
                                <Badge
                                  variant="outline"
                                  className="shrink-0 bg-blue-50 px-2 py-0.5 text-[11px] text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 sm:text-xs"
                                >
                                  E-Book
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="hidden shrink-0 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1 sm:inline-flex sm:text-xs"
                                  title={t("tooltips.audio")}
                                >
                                  <Volume2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  {t("tooltips.audio")}
                                </Badge>
                              </>
                            )}
                            {book.illustrationStyle && (
                              <Badge
                                variant="outline"
                                className="shrink-0 max-w-[130px] truncate bg-violet-50 px-2 py-0.5 text-[11px] text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 border-violet-200 dark:border-violet-800 sm:text-xs"
                              >
                                {getIllustrationStyleLabel(book.illustrationStyle)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReadBook(book.id)}
                        className="flex-1 bg-gradient-to-r from-primary to-brand-2 hover:opacity-90 transition-opacity text-white"
                      >
                        {book.status === "in-progress" ? t("continue") : t("read")}
                      </Button>
                      {book.status === "completed" && book.audioStoryStatus === "generating" && (
                        <Button
                          size="sm"
                          disabled
                          className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 opacity-70 text-white"
                        >
                          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          {t("watchModeLoading")}
                        </Button>
                      )}
                      {book.status === "completed" && book.audioStoryStatus === "ready" && (
                        <Button
                          size="sm"
                          onClick={() => handleWatchBook(book.id)}
                          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity text-white"
                        >
                          <Headphones className="mr-1 h-3.5 w-3.5" />
                          {t("watch")}
                        </Button>
                      )}
                      {book.status === "completed" && book.audioStoryStatus === "idle" && (
                        <Button
                          size="sm"
                          onClick={() => handleWatchBook(book.id)}
                          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 transition-opacity text-white"
                        >
                          <Headphones className="mr-1 h-3.5 w-3.5" />
                          {t("prepareAudioStory")}
                        </Button>
                      )}
                      {book.status === "completed" && book.audioStoryStatus === "failed" && (
                        <Button
                          size="sm"
                          onClick={() => handleWatchBook(book.id)}
                          className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 transition-opacity text-white"
                        >
                          <Headphones className="mr-1 h-3.5 w-3.5" />
                          {t("retryAudioStory")}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleEditBook(book.id)} className="flex-[0.8]">
                        <Edit className="mr-1 h-4 w-4" />
                        {t("edit")}
                      </Button>
                    </div>

                    {book.status === "completed" && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddSingleToCart(book.id)}
                          disabled={!hardcopyAvailable}
                          className="w-full border-primary/20 text-primary hover:bg-primary/5 dark:border-primary/20"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {t("addToCartHardcopy")}
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2">
                      {book.status === "completed" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={downloadingBookId === book.id}
                              className="flex-1"
                              title={t("tooltips.download")}
                            >
                              {downloadingBookId === book.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center">
                            <DropdownMenuItem onClick={() => handleDownloadBook(book.id)}>
                              <FileText className="mr-2 h-4 w-4" />
                              {t("tooltips.downloadPdf")}
                            </DropdownMenuItem>
                            {book.audioStoryStatus === "ready" && (
                              <DropdownMenuItem onClick={() => handleDownloadVideo(book.id, book.title)}>
                                <Film className="mr-2 h-4 w-4" />
                                {t("tooltips.downloadVideo")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShareBook(book.id)}
                        className="flex-1"
                        title={t("tooltips.share")}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
