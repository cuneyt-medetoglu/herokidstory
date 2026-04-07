"use client"

import { Suspense, useEffect, useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter, Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  ShoppingCart,
  LogIn,
  Mail,
  ArrowLeft,
  Sparkles,
} from "lucide-react"
import Image from "next/image"
import {
  getDraftFromLocalStorage,
  type DraftData,
  transferDraftToDatabase,
} from "@/lib/draft-storage"
import { useCart } from "@/contexts/CartContext"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { getProductPrice } from "@/lib/pricing/payment-products"
import type { Currency } from "@/lib/currency"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTranslations } from "next-intl"

function DraftPreviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("draftPreview")
  const draftId = searchParams.get("draftId")
  const { addToCart } = useCart()
  const { toast } = useToast()
  const { currencyConfig } = useCurrency()

  const { data: session } = useSession()
  const isAuthenticated = !!session?.user
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<"10" | "15" | "20">("10")
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [isPlanCheckout, setPlanCheckout] = useState(false)

  const cur = currencyConfig.currency as Currency
  const ebookUnit = getProductPrice("ebook", cur)
  const planPrices = useMemo(
    () => ({
      "10": ebookUnit,
      "15": ebookUnit,
      "20": ebookUnit,
    }),
    [ebookUnit]
  )

  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId) {
        router.push("/")
        return
      }

      setIsLoading(true)

      try {
        // Try to get from localStorage first
        let draftData = getDraftFromLocalStorage(draftId)

        // If not in localStorage, try API (for authenticated users)
        if (!draftData) {
          const response = await fetch(`/api/drafts/${draftId}`)
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              draftData = data.draft
            }
          }
        }

        if (!draftData) {
          toast({
            title: t("toasts.draftNotFoundTitle"),
            description: t("toasts.draftNotFoundDesc"),
            variant: "destructive",
          })
          router.push("/")
          return
        }

        setDraft(draftData)
      } catch (error) {
        console.error("[DraftPreview] Error loading draft:", error)
        toast({
          title: t("toasts.loadErrorTitle"),
          description: t("toasts.loadErrorDesc"),
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDraft()
  }, [draftId, router, toast, t])

  const handleBuyFullBook = () => {
    if (!draft) return

    setShowPlanModal(true)
  }

  const handlePlanSelect = async () => {
    if (!draft) return
    if (!isAuthenticated) {
      toast({
        title: t("toasts.addedToCartTitle"),
        description: t("toasts.loginRequiredDesc"),
        variant: "destructive",
      })
      return
    }

    const uuidRe =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const charIds = draft.characterData.characterIds ?? []
    const characterId = charIds.find((id) => typeof id === "string" && uuidRe.test(id))
    const titleLine = `E-Book (${selectedPlan} pages) - ${draft.characterData.name}'s Story`
    const lang =
      (draft.wizardState?.step3?.language as string | undefined) || "tr"

    setPlanCheckout(true)
    try {
      const res = await fetch("/api/books/checkout-placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(characterId ? { characterId } : {}),
          title: titleLine,
          theme: draft.theme || "story",
          illustrationStyle: draft.style || "3d_animation",
          language: lang,
          totalPages: parseInt(selectedPlan, 10),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success || !json.data?.bookId) {
        throw new Error(json.error || json.details || "checkout-placeholder failed")
      }

      addToCart({
        type: "ebook_plan",
        bookId: json.data.bookId,
        bookTitle: titleLine,
        price: planPrices[selectedPlan],
        quantity: 1,
        planType: selectedPlan,
        draftId: draft.draftId,
        characterData: draft.characterData,
        productId: "ebook",
        currency: cur,
      })

      toast({
        title: t("toasts.addedToCartTitle"),
        description: t("toasts.addedToCartDesc"),
      })

      setShowPlanModal(false)
      router.push("/cart")
    } catch (e) {
      toast({
        title: t("toasts.loadErrorTitle"),
        description: e instanceof Error ? e.message : t("toasts.loadErrorDesc"),
        variant: "destructive",
      })
    } finally {
      setPlanCheckout(false)
    }
  }

  const handleLoginToSave = () => {
    router.push(`/auth/login?redirect=/draft-preview?draftId=${draftId}`)
  }

  const handleEmailShare = async () => {
    toast({
      title: t("toasts.emailComingSoonTitle"),
      description: t("toasts.emailComingSoonDesc"),
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    )
  }

  if (!draft) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href={isAuthenticated ? "/dashboard" : "/"}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {isAuthenticated ? t("backToLibrary") : t("backToHome")}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        {/* Draft Content */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Cover Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] w-full">
                  <Image
                    src={draft.coverImage}
                    alt={`${draft.characterData.name}'s book cover`}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Draft Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {draft.characterData.name}'s Story
                  </h2>
                </div>

                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="font-semibold">{t("characterLabel")}</span>{" "}
                    {draft.characterData.name} ({draft.characterData.age} years old)
                  </div>
                  <div>
                    <span className="font-semibold">{t("themeLabel")}</span> {draft.theme}
                  </div>
                  <div>
                    <span className="font-semibold">{t("styleLabel")}</span> {draft.style}
                  </div>
                  <div>
                    <span className="font-semibold">{t("createdLabel")}</span>{" "}
                    {new Date(draft.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <Badge className="mt-4 bg-primary/10 text-primary">
                  {t("draftCover")}
                </Badge>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                size="lg"
                onClick={handleBuyFullBook}
                className="w-full bg-gradient-to-r from-primary to-brand-2 text-white"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {t("buyFullBook")}
              </Button>

              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleLoginToSave}
                  className="w-full"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  {t("loginToSave")}
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                onClick={handleEmailShare}
                className="w-full"
              >
                <Mail className="mr-2 h-5 w-5" />
                {t("shareEmail")}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Plan Selection Modal */}
        <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("planModal.title")}</DialogTitle>
              <DialogDescription>
                {t("planModal.subtitle")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {(["10", "15", "20"] as const).map((plan) => {
                const ageKey = plan === "10" ? "youngerChildren" : plan === "15" ? "middleChildren" : "olderChildren"
                return (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                      selectedPlan === plan
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {t("planModal.pages", { n: plan })}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {t("planModal.perfectFor", { age: t(`planModal.${ageKey}`) })}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">
                        {currencyConfig.symbol}
                        {cur === "TRY"
                          ? planPrices[plan]
                          : planPrices[plan].toFixed(2)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPlanModal(false)}
                className="flex-1"
              >
                {t("planModal.cancel")}
              </Button>
              <Button
                onClick={() => void handlePlanSelect()}
                disabled={isPlanCheckout}
                className="flex-1 bg-gradient-to-r from-primary to-brand-2 text-white"
              >
                {isPlanCheckout ? "…" : t("planModal.addToCart")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function DraftPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <DraftPreviewContent />
    </Suspense>
  )
}
