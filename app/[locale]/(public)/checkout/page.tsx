"use client"

import { useEffect } from "react"
import { useRouter, Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import { CartSummary } from "@/components/checkout/CartSummary"
import { CheckoutForm } from "@/components/checkout/CheckoutForm"
import { useTranslations } from "next-intl"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, isLoading } = useCart()
  const t = useTranslations("checkout")

  // Redirect to cart if empty
  useEffect(() => {
    if (!isLoading && items.length === 0) {
      router.push("/cart")
    }
  }, [items.length, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-64 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return null // Will redirect
  }

  const hasHardcopy = items.some((item) => item.type === "hardcopy")

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/cart">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToCart")}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        {/* Checkout Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 md:p-8">
              <CheckoutForm hasHardcopy={hasHardcopy} />
            </div>
          </motion.div>

          {/* Right: Cart Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-4">
              <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800">
                <CartSummary />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
