"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2, ShoppingCart, Check, ArrowRight, ArrowLeft, Tag, X, Loader2 } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import type { AppliedPromo } from "@/contexts/CartContext"
import { useRouter, Link } from "@/i18n/navigation"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useEffect, useState, useCallback } from "react"
import { useWizardNavigate } from "@/hooks/use-wizard-navigate"
import { useCurrency } from "@/contexts/CurrencyContext"

export default function CartPage() {
  const router = useRouter()
  const { navigate, isPending } = useWizardNavigate()
  const { items, appliedPromo, removeFromCart, getCartTotal, getCartSubtotal, setAppliedPromo, isLoading } = useCart()
  const { currencyConfig } = useCurrency()
  const subtotal = getCartSubtotal()
  const total = getCartTotal()
  const t = useTranslations("cart")
  const tp = useTranslations("cart.promo")
  const tcCreate = useTranslations("create.common")
  const fmt = (n: number) => `${currencyConfig.symbol}${n.toFixed(2)}`

  // Promo kodu state'i
  const [promoInput, setPromoInput]   = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError]   = useState<string | null>(null)

  const handleApplyPromo = useCallback(async () => {
    if (!promoInput.trim()) return
    setPromoLoading(true)
    setPromoError(null)
    try {
      const itemTypes = items.map((i) =>
        i.type === "ebook_plan" ? "ebook" : i.type
      )
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code:      promoInput.trim(),
          subtotal,
          currency:  currencyConfig.currency,
          itemTypes,
        }),
      })
      const data = await res.json() as {
        valid: boolean
        error?: string
        code?: string
        promoCodeId?: string
        discountType?: "percent" | "fixed"
        discountValue?: number
        discountAmount?: number
      }
      if (!data.valid) {
        const errorKey = data.error as string | undefined
        const msg = errorKey
          ? (t(`promo.errors.${errorKey}` as Parameters<typeof t>[0]) ?? tp("errors.generic"))
          : tp("errors.generic")
        setPromoError(msg)
      } else {
        const promo: AppliedPromo = {
          code:           data.code!,
          promoCodeId:    data.promoCodeId!,
          discountType:   data.discountType!,
          discountValue:  data.discountValue!,
          discountAmount: data.discountAmount!,
        }
        setAppliedPromo(promo)
        setPromoInput("")
      }
    } catch {
      setPromoError(tp("errors.generic"))
    } finally {
      setPromoLoading(false)
    }
  }, [promoInput, subtotal, currencyConfig.currency, items, setAppliedPromo, t, tp])

  const handleRemovePromo = useCallback(() => {
    setAppliedPromo(null)
    setPromoError(null)
    setPromoInput("")
  }, [setAppliedPromo])

  useEffect(() => {
    router.prefetch("/checkout")
    router.prefetch("/dashboard")
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("continueShopping")}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <ShoppingCart className="mb-4 h-16 w-16 text-slate-400 dark:text-slate-600" />
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              {t("empty.title")}
            </h3>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              {t("empty.subtitle")}
            </p>
            <Button
              className="bg-gradient-to-r from-primary to-brand-2 text-white"
              loading={isPending}
              disabled={isPending}
              onClick={() => navigate("/dashboard")}
            >
              {isPending ? tcCreate("navigating") : t("empty.goToLibrary")}
            </Button>
          </motion.div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="mb-4">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex gap-4">
                          {/* Book Cover */}
                          <div className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted md:h-40 md:w-28">
                            {item.coverImage ? (
                              <Image
                                src={item.coverImage}
                                alt={item.bookTitle}
                                fill
                                sizes="(max-width: 768px) 96px, 112px"
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-200 dark:bg-slate-700">
                                <ShoppingCart className="h-8 w-8 text-slate-400" />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white md:text-xl">
                              {item.bookTitle}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {t("hardcoverBook")}
                            </p>
                            <p className="mt-2 text-xl font-bold text-primary">
                              {fmt(item.price)}
                            </p>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {t("quantity")} {item.quantity}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-2 hidden md:inline">{t("remove")}</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
                  {t("orderSummary")}
                </h3>

                {/* Promo kodu input */}
                {!appliedPromo ? (
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Tag className="mr-1 inline h-4 w-4" />
                      {tp("label")}
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={promoInput}
                        onChange={(e) => {
                          setPromoInput(e.target.value.toUpperCase())
                          setPromoError(null)
                        }}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleApplyPromo() }}
                        placeholder={tp("placeholder")}
                        className="font-mono text-sm uppercase"
                        disabled={promoLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleApplyPromo()}
                        disabled={!promoInput.trim() || promoLoading}
                        className="shrink-0"
                      >
                        {promoLoading
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : tp("apply")}
                      </Button>
                    </div>
                    {promoError && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{promoError}</p>
                    )}
                  </div>
                ) : (
                  <div className="mb-4 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
                    <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                      <Check className="h-4 w-4 shrink-0" />
                      <span className="font-medium font-mono">{appliedPromo.code}</span>
                      <span className="text-xs opacity-80">
                        {appliedPromo.discountType === "percent"
                          ? `%${appliedPromo.discountValue}`
                          : fmt(appliedPromo.discountValue)}
                      </span>
                    </div>
                    <button onClick={handleRemovePromo} className="ml-2 text-slate-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t("subtotal")}</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {tp("discount")}
                      </span>
                      <span>-{fmt(appliedPromo.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      {t("shipping")}
                    </span>
                    <span>{t("shippingFree")}</span>
                  </div>
                </div>

                <div className="mb-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{t("total")}</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-transparent">
                      {fmt(total)}
                    </span>
                  </div>
                </div>

                <Button
                  size="lg"
                  loading={isPending}
                  disabled={items.length === 0 || isPending}
                  className="w-full bg-gradient-to-r from-primary to-brand-2 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  onClick={() => navigate("/checkout")}
                >
                  {isPending ? tcCreate("navigating") : t("proceedToCheckout")}
                  {!isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
