"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, ShoppingCart, Check, ArrowRight, ArrowLeft } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { useRouter, Link } from "@/i18n/navigation"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { useWizardNavigate } from "@/hooks/use-wizard-navigate"

export default function CartPage() {
  const router = useRouter()
  const { navigate, isPending } = useWizardNavigate()
  const { items, removeFromCart, getCartTotal, isLoading } = useCart()
  const total = getCartTotal()
  const t = useTranslations("cart")
  const tcCreate = useTranslations("create.common")

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
                              ${item.price.toFixed(2)}
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

                <div className="mb-4 space-y-2">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>{t("subtotal")}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
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
                      ${total.toFixed(2)}
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
