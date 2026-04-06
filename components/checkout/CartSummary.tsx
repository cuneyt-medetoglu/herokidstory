"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Download, BookOpen } from "lucide-react"
import { useCart } from "@/contexts/CartContext"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { useCurrency } from "@/contexts/CurrencyContext"

export function CartSummary() {
  const { items, getCartTotal } = useCart()
  const { currencyConfig } = useCurrency()
  const total = getCartTotal()
  const hasHardcopy = items.some((item) => item.type === "hardcopy")
  const hasEbook = items.some(
    (item) => item.type === "ebook_plan" || item.type === "ebook"
  )
  const t = useTranslations("cart")

  const fmt = (n: number) => `${currencyConfig.symbol}${n.toFixed(2)}`

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("orderSummary")}</h3>

      {/* Items List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
          >
            {/* Item Image/Icon */}
            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-muted">
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.bookTitle}
                  fill
                  sizes="48px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-brand-2/10">
                  {item.type === "ebook_plan" ? (
                    <Download className="h-6 w-6 text-primary" />
                  ) : (
                    <BookOpen className="h-6 w-6 text-primary" />
                  )}
                </div>
              )}
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {item.bookTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {item.type === "hardcopy" && t("hardcoverBook")}
                {item.type === "ebook_plan" && t("ebookPlan", { n: item.planType ?? "10" })}
              </p>
              <p className="mt-1 text-sm font-bold text-primary">
                {fmt(item.price)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>{t("subtotal")}</span>
            <span>{fmt(total)}</span>
          </div>

          <div className="flex justify-between text-green-600 dark:text-green-400">
            <span className="flex items-center gap-1">
              <Check className="h-4 w-4" />
              {t("shipping")}
            </span>
            <span>{hasHardcopy ? t("shippingFree") : hasEbook ? t("shippingNA") : t("shippingFree")}</span>
          </div>

          <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-slate-900 dark:text-white">{t("total")}</span>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-transparent">
                {fmt(total)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
