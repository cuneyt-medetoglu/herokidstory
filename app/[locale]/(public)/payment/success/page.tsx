"use client"

/**
 * /payment/success
 *
 * iyzico callback başarılı ödeme sonrasında buraya yönlendirir:
 *   GET /payment/success?orderId=<uuid>
 *
 * İki fazlı deneyim:
 *   Faz 1 — Ödeme onayı (~3 saniye): Yeşil tik + sipariş no
 *   Faz 2 — Kitap üretim takibi: Canlı adım takibi, progress bar, tamamlanınca kitaba git
 *
 * Edge case'ler:
 *   - E-kitap yok (sadece baskı): Faz 1'de kalır, baskı notu gösterir
 *   - Kitap zaten tamamlanmış: Doğrudan "Kitabınız hazır!" gösterir
 *   - Üretim hatası: Hata durumu + destek mesajı
 */

import { Suspense, useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { useRouter } from "@/i18n/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CheckCircle,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Mail,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useCart } from "@/contexts/CartContext"
import { useBookGenerationStatus, getStepLabel, type GenerationStep } from "@/hooks/useBookGenerationStatus"
import { cn } from "@/lib/utils"
import { useLocale } from "next-intl"

// ============================================================================
// Sabitler
// ============================================================================

const PHASE1_DURATION_MS = 3000
const REDIRECT_COUNTDOWN_S = 3

const STEPS: Array<{
  key: GenerationStep
  threshold: number
  labelKey: string
}> = [
  { key: "story_generating",  threshold: 15,  labelKey: "stepStory" },
  { key: "master_generating", threshold: 30,  labelKey: "stepCharacter" },
  { key: "cover_generating",  threshold: 50,  labelKey: "stepCover" },
  { key: "pages_generating",  threshold: 80,  labelKey: "stepPages" },
  { key: "video_generating",  threshold: 100, labelKey: "stepVideo" },
]

// ============================================================================
// Step item bileşeni
// ============================================================================

function StepItem({
  label,
  threshold,
  progress,
  currentStep,
  stepKey,
}: {
  label: string
  threshold: number
  progress: number
  currentStep: GenerationStep
  stepKey: GenerationStep
}) {
  const isCompleted = progress >= threshold
  const isCurrent = currentStep === stepKey
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500",
          isCompleted
            ? "border-green-500 bg-green-500 text-white"
            : isCurrent
            ? "border-primary bg-primary/10 text-primary"
            : "border-muted-foreground/30 bg-background text-muted-foreground/50"
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : isCurrent ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-current" />
        )}
      </div>
      <span
        className={cn(
          "text-sm transition-colors",
          isCompleted
            ? "text-foreground font-medium"
            : isCurrent
            ? "text-foreground font-semibold"
            : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  )
}

// ============================================================================
// İçerik bileşeni (searchParams gerektirir — Suspense içinde)
// ============================================================================

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const t = useTranslations("payment.success")
  const locale = useLocale()
  const router = useRouter()
  const { clearCart } = useCart()

  // Faz yönetimi: "confirmation" → "generating"
  const [phase, setPhase] = useState<"confirmation" | "generating">("confirmation")

  // Sipariş'ten çekilen bookId (e-kitap varsa)
  const [bookId, setBookId] = useState<string | null>(null)
  const [hasEbook, setHasEbook] = useState<boolean | null>(null) // null = yükleniyor

  // Animasyonlu progress
  const [displayProgress, setDisplayProgress] = useState(0)
  // Geri sayım (tamamlanınca yönlendirme için)
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_S)

  const { title, progress, step: rawStep, isDone, isError, isLoading, lastGenerationError } =
    useBookGenerationStatus(bookId)
  const step: GenerationStep =
    rawStep === "watch_preparing" || rawStep === "tts_generating"
      ? "video_generating"
      : rawStep

  // 1. Sepeti temizle
  useEffect(() => {
    if (orderId) {
      clearCart()
    }
  }, [orderId, clearCart])

  // 2. Sipariş detaylarını çek — bookId'yi bul
  const fetchOrderBookId = useCallback(async () => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (!res.ok) {
        setHasEbook(false)
        return
      }
      const data = await res.json()
      const items: Array<{ book_id?: string; item_type?: string }> = data?.order?.items ?? []
      const ebookItem = items.find(
        (item) => item.item_type === "ebook" && item.book_id
      )
      if (ebookItem?.book_id) {
        setBookId(ebookItem.book_id)
        setHasEbook(true)
      } else {
        setHasEbook(false)
      }
    } catch {
      setHasEbook(false)
    }
  }, [orderId])

  useEffect(() => {
    void fetchOrderBookId()
  }, [fetchOrderBookId])

  // 3. Faz 1'den faz 2'ye geçiş (3 saniye bekle, e-kitap varsa)
  useEffect(() => {
    if (hasEbook !== true) return
    const timer = setTimeout(() => {
      setPhase("generating")
    }, PHASE1_DURATION_MS)
    return () => clearTimeout(timer)
  }, [hasEbook])

  // 4. Progress animasyonu
  useEffect(() => {
    const target = isDone ? 100 : progress
    const interval = setInterval(() => {
      setDisplayProgress((prev) => {
        if (target <= prev) return prev
        const delta = target - prev
        const stepSize = Math.max(1, Math.ceil(delta / 8))
        return Math.min(target, prev + stepSize)
      })
    }, 60)
    return () => clearInterval(interval)
  }, [progress, isDone])

  // 5. Tamamlanınca geri sayım + yönlendirme
  useEffect(() => {
    if (!isDone || isError || !bookId) return
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          router.push(`/books/${bookId}/view`)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isDone, isError, bookId, router])

  // ============================================================================
  // Faz 1: Ödeme onayı
  // ============================================================================

  if (phase === "confirmation") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto max-w-xl px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-xl">
              <CardContent className="p-8 md:p-12">
                {/* Başarı ikonu */}
                <div className="mb-6 flex justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="rounded-full bg-green-100 p-4 dark:bg-green-900/30"
                  >
                    <CheckCircle
                      className="h-14 w-14 text-green-500 dark:text-green-400"
                      aria-hidden="true"
                    />
                  </motion.div>
                </div>

                {/* Başlık */}
                <div className="mb-6 text-center">
                  <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                    {t("title")}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    {t("subtitle")}
                  </p>
                </div>

                {/* Sipariş No */}
                {orderId && (
                  <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("orderLabel")}
                    </p>
                    <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-white break-all">
                      {orderId}
                    </p>
                  </div>
                )}

                {/* Yükleniyor / sadece baskı durumunda butonlar */}
                {hasEbook === false ? (
                  <>
                    <p className="mb-6 text-center text-sm text-muted-foreground">
                      {t("hardcopyNote")}
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link href="/dashboard" className="flex-1">
                        <Button
                          size="lg"
                          className="w-full bg-gradient-to-r from-primary to-brand-2 text-white"
                        >
                          <BookOpen className="mr-2 h-5 w-5" aria-hidden="true" />
                          {t("goToLibrary")}
                        </Button>
                      </Link>
                      {orderId && (
                        <Link href="/dashboard/settings?section=orders" className="flex-1">
                          <Button size="lg" variant="outline" className="w-full">
                            {t("viewOrder")}
                            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  /* E-kitap var — faz 2'ye geçiş bekleniyor */
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t("fetchingOrder")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // Faz 2: Kitap üretim takibi
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Kompakt ödeme onay bandı */}
            <div className="mb-4 flex items-center justify-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{t("paymentConfirmedBadge")}</span>
              {orderId && (
                <span className="font-mono text-xs opacity-70 ml-1">
                  #{orderId.slice(0, 8)}
                </span>
              )}
            </div>

            {/* Ana kart */}
            <div className="rounded-2xl border bg-card shadow-lg p-8 space-y-8">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="flex justify-center mb-4">
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl",
                      isError
                        ? "bg-red-100 text-red-500"
                        : isDone
                        ? "bg-green-100 text-green-600"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    {isError ? (
                      <AlertCircle className="h-8 w-8" />
                    ) : isDone ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : (
                      <BookOpen className="h-8 w-8" />
                    )}
                  </div>
                </div>

                <h1 className="text-xl font-bold tracking-tight">
                  {isError
                    ? t("errorTitle")
                    : isDone
                    ? t("bookReadyTitle")
                    : t("generatingTitle")}
                </h1>

                {title && (
                  <p className="text-sm text-muted-foreground font-medium">
                    &ldquo;{title}&rdquo;
                  </p>
                )}

                {!isDone && !isError && (
                  <p className="text-xs text-muted-foreground">
                    {t("generatingSubtitle")}
                  </p>
                )}

                {isDone && !isError && (
                  <p className="text-xs text-muted-foreground">
                    {t("bookReadySubtitle")}
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              {!isError && !isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{getStepLabel(step, locale)}</span>
                    <span className="font-mono font-medium text-foreground">
                      {displayProgress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        isDone ? "bg-green-500" : "bg-primary"
                      )}
                      style={{ width: `${displayProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Adımlar */}
              {!isError && (
                <div className="space-y-3">
                  {STEPS.map((s) => (
                    <StepItem
                      key={s.key}
                      label={t(s.labelKey as Parameters<typeof t>[0])}
                      threshold={s.threshold}
                      progress={displayProgress}
                      currentStep={step}
                      stepKey={s.key}
                    />
                  ))}
                </div>
              )}

              {/* Tamamlandı: butonlar + geri sayım */}
              {isDone && !isError && bookId && (
                <div className="space-y-3 pt-2">
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/books/${bookId}/view`)}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    {t("viewBook")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/dashboard")}
                  >
                    {t("goToLibraryShort")}
                  </Button>
                  {countdown > 0 && (
                    <p className="text-center text-xs text-muted-foreground">
                      {t("redirectingIn", { n: countdown })}
                    </p>
                  )}
                </div>
              )}

              {/* Hata durumu */}
              {isError && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700 space-y-2 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    <p>{t("errorDesc")}</p>
                    {lastGenerationError && (
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-red-100/80 p-2 text-xs text-red-900 font-mono dark:bg-red-900/40 dark:text-red-300">
                        {lastGenerationError}
                      </pre>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/dashboard")}
                  >
                    {t("goToLibraryShort")}
                  </Button>
                </div>
              )}

              {/* Üretim devam ediyor: kapat butonu */}
              {!isDone && !isError && (
                <div className="space-y-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground text-sm h-9"
                    onClick={() => router.push("/dashboard")}
                  >
                    <X className="h-3.5 w-3.5 mr-2" />
                    {t("closeBackground")}
                  </Button>
                </div>
              )}

              {/* E-posta notu (üretim devam ederken) */}
              {!isDone && !isError && (
                <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {t("generatingSubtitle")}
                  </p>
                </div>
              )}
            </div>

            {/* Alt animasyonlu yazı */}
            {!isDone && !isError && (
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground animate-pulse">
                  {step === "story_generating"
                    ? locale === "tr"
                      ? "Yapay zeka benzersiz hikayenizi yazıyor..."
                      : "AI is writing your unique story..."
                    : locale === "tr"
                    ? "Her sayfa özenle illüstre ediliyor..."
                    : "Every page is being carefully illustrated..."}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ============================================================================
// Sayfa export
// ============================================================================

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
