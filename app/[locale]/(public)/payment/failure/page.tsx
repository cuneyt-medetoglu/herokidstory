"use client"

/**
 * /payment/failure
 *
 * iyzico callback başarısız ödeme sonrasında buraya yönlendirir:
 *   GET /payment/failure?reason=<encoded>&orderId=<uuid>
 *
 * İç sistem hata kodları kullanıcıya gösterilmez — genel mesaj kullanılır.
 *
 * Localization: payment.failure namespace.
 */

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { XCircle, RefreshCw, ShoppingCart } from "lucide-react"
import { useTranslations } from "next-intl"

// ============================================================================
// İç sistem hata kodları — kullanıcıya gösterilmez
// ============================================================================

const INTERNAL_ERROR_CODES = new Set([
  "processing_error",
  "order_not_found",
  "missing_token",
  "invalid_request",
])

// ============================================================================
// İçerik
// ============================================================================

function FailureContent() {
  const searchParams = useSearchParams()
  const reason       = searchParams.get("reason")
  const orderId      = searchParams.get("orderId")
  const t            = useTranslations("payment.failure")

  // İç hata mesajlarını filtrele
  const isInternal    = reason ? INTERNAL_ERROR_CODES.has(reason) : false
  const displayReason = !isInternal && reason && reason !== "unknown" ? reason : null

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
              {/* Hata ikonu */}
              <div className="mb-6 flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="rounded-full bg-red-100 p-4 dark:bg-red-900/30"
                >
                  <XCircle
                    className="h-14 w-14 text-red-500 dark:text-red-400"
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

              {/* Hata detayı (varsa, güvenliyse) */}
              {displayReason && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {t("reasonLabel")}
                  </p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {displayReason}
                  </p>
                </div>
              )}

              {/* Eylem butonları */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/checkout" className="flex-1">
                  <Button
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-brand-2 text-white"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" aria-hidden="true" />
                    {t("tryAgain")}
                  </Button>
                </Link>
                <Link href="/cart" className="flex-1">
                  <Button size="lg" variant="outline" className="w-full">
                    <ShoppingCart className="mr-2 h-5 w-5" aria-hidden="true" />
                    {t("backToCart")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

// ============================================================================
// Sayfa export
// ============================================================================

export default function PaymentFailurePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <FailureContent />
    </Suspense>
  )
}
