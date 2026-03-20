"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useRouter } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { Search, Grid3x3, List, BookOpen, Plus, Download, Share2, Trash2, Edit, Loader2, ShoppingCart, CheckSquare, Square, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty } from "@/components/ui/empty"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/CartContext"
import { getIllustrationStyleLabel } from "@/lib/illustration-styles"

type Book = {
  id: string
  title: string
  coverImage: string
  status: "completed" | "in-progress" | "draft"
  createdDate: string
  illustrationStyle?: string
}

const mockBooks: Book[] = [
  {
    id: "book-123",
    title: "Arya's Adventure",
    coverImage: "/test-images/books/children-s-book-cover-with-magical-adventure-theme.jpg",
    status: "completed",
    createdDate: "Jan 5, 2026",
  },
  {
    id: "book-456",
    title: "Emma's Space Journey",
    coverImage: "/test-images/books/children-s-book-cover-with-space-theme.jpg",
    status: "in-progress",
    createdDate: "Jan 8, 2026",
  },
  {
    id: "book-789",
    title: "Oliver's Magic Forest",
    coverImage: "/test-images/books/children-s-book-cover-with-enchanted-forest-theme.jpg",
    status: "draft",
    createdDate: "Jan 10, 2026",
  },
]

const statusColors = {
  completed: "bg-green-500/10 text-green-700 dark:text-green-400",
  "in-progress": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  draft: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

export default function LibraryPage() {
  const t = useTranslations("dashboard")
  const router = useRouter()
  const { toast } = useToast()
  const { addToCart } = useCart()
  const [books, setBooks] = useState<Book[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<string>("date-newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  
  // Bulk selection state
  const [selectedBooks, setSelectedBooks] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)

  // Fetch books when authenticated
  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") {
        router.push("/auth/login")
      }
      setIsLoading(false)
      return
    }

    const fetchBooks = async () => {
      try {
        console.log("[Dashboard] Authenticated user:", session?.user?.email)

        // Fetch books from API
        console.log("[Dashboard] Fetching books from API...")
        const response = await fetch('/api/books', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          console.error("[Dashboard] Error fetching books:", result)
          toast({
            title: t("toasts.loadError"),
            description: t("toasts.loadErrorDesc"),
            variant: "destructive",
          })
          setBooks([])
        } else {
          console.log("[Dashboard] Books fetched successfully:", result.data?.length || 0, "books")
          
          // Transform API response to Book type
          const transformedBooks: Book[] = (result.data || []).map((book: any) => ({
            id: book.id,
            title: book.title,
            coverImage: book.cover_image_url || "", // No mock data fallback - empty string if no cover
            status: book.status === 'completed' ? 'completed' : 
                   book.status === 'generating' ? 'in-progress' : 'draft',
            createdDate: new Date(book.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            illustrationStyle: book.illustration_style || undefined,
          }))

          setBooks(transformedBooks)
        }
      } catch (err) {
        console.error("[Dashboard] Error:", err)
        toast({
          title: t("toasts.loadError"),
          description: t("toasts.loadErrorDesc"),
          variant: "destructive",
        })
        setBooks([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchBooks()
  }, [router, toast, session, status, t])

  // Filter and search (moved before early return to fix hooks order)
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

    // Sort
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

  // Show loading state while checking auth (moved after hooks to fix hooks order)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-gray-600 dark:text-slate-400">{t("loading")}</p>
        </div>
      </div>
    )
  }

  const handleCreateBook = () => {
    router.push("/create/step1")
  }

  const handleReadBook = (bookId: string) => {
    const targetBook = books.find((b) => b.id === bookId)
    if (targetBook?.status === "in-progress") {
      router.push(`/create/generating/${bookId}`)
      return
    }
    router.push(`/books/${bookId}/view`)
  }

  const handleEditBook = (bookId: string) => {
    router.push(`/books/${bookId}/settings`)
  }

  const handleDownloadBook = async (bookId: string) => {
    try {
      setDownloadingBookId(bookId)
      console.log("[Dashboard] Downloading book:", bookId)

      // Call PDF generation API
      const response = await fetch(`/api/books/${bookId}/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to generate PDF')
      }

      const pdfUrl = result.data?.pdfUrl

      if (!pdfUrl) {
        throw new Error('PDF URL not found in response')
      }

      console.log("[Dashboard] PDF generated successfully:", pdfUrl)

      // Download PDF
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `${bookId}.pdf`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: t("toasts.pdfSuccessTitle"),
        description: t("toasts.pdfSuccessDesc"),
      })
    } catch (error) {
      console.error("[Dashboard] Error downloading book:", error)
      toast({
        title: t("toasts.pdfFailedTitle"),
        description: error instanceof Error ? error.message : t("toasts.pdfFailedDesc"),
        variant: "destructive",
      })
    } finally {
      setDownloadingBookId(null)
    }
  }

  const handleShareBook = (bookId: string) => {
    // ROADMAP: Share functionality (dashboard kitap paylaşımı)
    console.log("Share book:", bookId)
  }

  const handleDeleteBook = async (bookId: string) => {
    try {
      // ROADMAP: Confirmation modal before delete
      if (!confirm(t('toasts.deleteConfirm'))) {
        return
      }

      console.log("[Dashboard] Deleting book:", bookId)

      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to delete book')
      }

      console.log("[Dashboard] Book deleted successfully:", bookId)

      // Remove book from local state
      setBooks(books.filter(book => book.id !== bookId))
      // Remove from selected if selected
      setSelectedBooks(selectedBooks.filter(id => id !== bookId))

      toast({
        title: t("toasts.bookDeletedTitle"),
        description: t("toasts.deleteSuccess"),
      })
    } catch (error) {
      console.error("[Dashboard] Error deleting book:", error)
      toast({
        title: t("toasts.deleteFailedTitle"),
        description: error instanceof Error ? error.message : t("toasts.deleteFailed"),
        variant: "destructive",
      })
    }
  }

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedBooks.length === filteredBooks.length) {
      setSelectedBooks([])
    } else {
      setSelectedBooks(filteredBooks.map(book => book.id))
    }
  }

  const handleBookSelect = (bookId: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId]
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

    // Only allow completed books (purchased E-Books)
    const completedBooks = filteredBooks.filter(
      book => selectedBooks.includes(book.id) && book.status === "completed"
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

    try {
      // Validate books via API
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
          book_ids: completedBooks.map(book => book.id),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add books to cart")
      }

      // Add to cart context
      completedBooks.forEach(book => {
        addToCart({
          type: "hardcopy",
          bookId: book.id,
          bookTitle: book.title,
          coverImage: book.coverImage,
          price: 34.99,
          quantity: 1,
        })
      })

      toast({
        title: t("toasts.addedToCartTitle"),
        description: t("toasts.addedToCartDesc", { count: completedBooks.length }),
      })

      // Clear selection
      setSelectedBooks([])
      setIsSelectMode(false)

      // Navigate to cart
      router.push("/cart")
    } catch (error) {
      console.error("[Dashboard] Error adding to cart:", error)
      toast({
        title: t("toasts.failedAddToCartTitle"),
        description: error instanceof Error ? error.message : t("toasts.failedAddToCartDesc"),
        variant: "destructive",
      })
    }
  }

  const handleAddSingleToCart = async (bookId: string) => {
    const book = books.find(b => b.id === bookId)
    if (!book) return

    if (book.status !== "completed") {
      toast({
        title: t("toasts.cannotAddToCartTitle"),
        description: t("toasts.cannotAddToCartDesc"),
        variant: "destructive",
      })
      return
    }

    try {
      // Validate book via API
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
          book_ids: [bookId],
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to add book to cart")
      }

      // Add to cart context
      addToCart({
        type: "hardcopy",
        bookId: book.id,
        bookTitle: book.title,
        coverImage: book.coverImage,
        price: 34.99,
        quantity: 1,
      })

      toast({
        title: t("toasts.addedToCartTitle"),
        description: t("toasts.addedSingleToCartDesc", { title: book.title }),
      })

      // Navigate to cart
      router.push("/cart")
    } catch (error) {
      console.error("[Dashboard] Error adding to cart:", error)
      toast({
        title: t("toasts.failedAddToCartTitle"),
        description: error instanceof Error ? error.message : t("toasts.failedAddToCartDesc"),
        variant: "destructive",
      })
    }
  }

  const HARDCOPY_PRICE = 34.99
  const selectedTotal = selectedBooks.length * HARDCOPY_PRICE

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
                      {t("total")} ${selectedTotal.toFixed(2)}
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
                    disabled={selectedBooks.length === 0}
                    className="bg-gradient-to-r from-primary to-brand-2 text-white"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {t("addSelectedToCart", { count: selectedBooks.length })}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filters and Controls — single outer frame avoids border clipping from overflow-x-auto */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
            {/* Top Row: Tabs and Create Button */}
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

            {/* Bottom Row: Search, View Toggle, Sort */}
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
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="w-full aspect-[3/4] mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
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
        ) : (
          <motion.div
            layout
            className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
          >
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`group relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                  selectedBooks.includes(book.id) ? "ring-2 ring-primary" : ""
                }`}>
                  <CardContent className="p-4">
                    {/* Checkbox (when in select mode) */}
                    {(isSelectMode || selectedBooks.length > 0) && (
                      <div className="absolute top-4 left-4 z-10">
                        <Checkbox
                          checked={selectedBooks.includes(book.id)}
                          onCheckedChange={() => handleBookSelect(book.id)}
                          className="h-5 w-5 bg-white dark:bg-slate-800 border-2"
                        />
                      </div>
                    )}

                    {/* Book Cover */}
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

                    {/* Book Info */}
                    <div className="space-y-2 mb-4">
                      <h3 className="font-semibold text-lg line-clamp-2 text-foreground">{book.title}</h3>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <p className="text-xs text-muted-foreground">{t("createdOn")} {book.createdDate}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {book.status === "completed" && (
                            <>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                E-Book
                              </Badge>
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800 gap-1" title={t("tooltips.audio")}>
                                <Volume2 className="h-3 w-3" />
                                {t("tooltips.audio")}
                              </Badge>
                            </>
                          )}
                          {book.illustrationStyle && (
                            <Badge variant="outline" className="bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400 border-violet-200 dark:border-violet-800">
                              {getIllustrationStyleLabel(book.illustrationStyle)}
                            </Badge>
                          )}
                          <Badge variant="secondary" className={statusColors[book.status]}>
                            {book.status === "completed" ? t("status.completed") : book.status === "in-progress" ? t("status.inProgress") : t("status.draft")}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReadBook(book.id)}
                        className="flex-1 bg-gradient-to-r from-primary to-brand-2 hover:opacity-90 transition-opacity text-white"
                      >
                        {book.status === "in-progress" ? t("continue") : t("read")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEditBook(book.id)} className="flex-1">
                        <Edit className="mr-1 h-4 w-4" />
                        {t("edit")}
                      </Button>
                    </div>

                    {/* Hardcopy Button (only for completed books) */}
                    {book.status === "completed" && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddSingleToCart(book.id)}
                          className="w-full border-primary/20 text-primary hover:bg-primary/5 dark:border-primary/20"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {t("addToCartHardcopy")}
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadBook(book.id)}
                        disabled={downloadingBookId === book.id}
                        className="flex-1"
                        title={t("tooltips.downloadPdf")}
                      >
                        {downloadingBookId === book.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShareBook(book.id)}
                        className="flex-1"
                        title={t("tooltips.share")}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteBook(book.id)}
                        className="flex-1 hover:text-destructive hover:bg-destructive/10"
                        title={t("tooltips.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
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

