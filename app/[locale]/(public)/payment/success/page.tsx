"use client"

/**
 * /payment/success
 *
 * iyzico callback başarılı ödeme sonrasında buraya yönlendirir:
 *   GET /payment/success?orderId=<uuid>
 *
 * Localization: payment.success namespace.
 */

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, BookOpen, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"

// ============================================================================
// İçerik (searchParams gerektiren kısım Suspense içinde)
// ============================================================================

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId")
  const t = useTranslations("payment.success")

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

              {/* Eylem butonları */}
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
                  <Link href="/dashboard?tab=orders" className="flex-1">
                    <Button size="lg" variant="outline" className="w-full">
                      {t("viewOrder")}
                      <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                    </Button>
                  </Link>
                )}
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
