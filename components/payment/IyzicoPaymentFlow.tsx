"use client"

/**
 * @file iyzico ödeme akışı orchestrator bileşeni.
 *
 * Durum makinesi:
 *   billing-form → (kullanıcı adresi doldurur)
 *   loading       → (POST /api/payment/iyzico/initialize)
 *   payment-form  → (iyzico iframe inject edildi, kullanıcı ödüyor)
 *   error         → (API veya script hatası, retry butonu)
 *
 * Sepetteki tüm ürünler (productId olanlar) iyzico üzerinden işlenir.
 * productId yoksa item.type'dan haritalama yapılır:
 *   ebook_plan → 'ebook'
 *   hardcopy   → 'hardcopy'
 *   bundle     → 'bundle'
 *
 * Localization: checkout.iyzicoPayment + payment.providerBadge namespace.
 */

import { useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BillingAddressForm } from "@/components/payment/BillingAddressForm"
import { IyzicoCheckoutForm } from "@/components/payment/IyzicoCheckoutForm"
import { useCart } from "@/contexts/CartContext"
import { isUuid } from "@/lib/utils/uuid"
import type { BillingAddress } from "@/lib/payment/types"
import type { ProductId } from "@/lib/pricing/payment-products"
import type { CartItem } from "@/contexts/CartContext"

// ============================================================================
// İç tip tanımları
// ============================================================================

type FlowState = "billing-form" | "loading" | "payment-form" | "error"

interface InitializeResult {
  orderId: string
  token: string
  checkoutFormContent: string
}

// ============================================================================
// Yardımcı: CartItem → productId haritalaması
// ============================================================================

function resolveProductId(item: CartItem): ProductId {
  if (item.productId) return item.productId as ProductId

  switch (item.type) {
    case "hardcopy":   return "hardcopy"
    case "bundle":     return "bundle"
    case "ebook":
    case "ebook_plan":
    default:           return "ebook"
  }
}

function resolveBookId(item: CartItem): string {
  const raw = item.bookId ?? item.draftId ?? ""
  if (raw && isUuid(raw)) return raw.trim()
  throw new Error("INVALID_BOOK_ID")
}

// ============================================================================
// Props
// ============================================================================

interface IyzicoPaymentFlowProps {
  /** Ödeme başarılı + yönlendirme öncesi çalışır (opsiyonel cleanup) */
  onPaymentInitiated?: (orderId: string) => void
}

// ============================================================================
// Bileşen
// ============================================================================

export function IyzicoPaymentFlow({ onPaymentInitiated }: IyzicoPaymentFlowProps) {
  const t      = useTranslations("checkout")
  const tBadge = useTranslations("payment.providerBadge")
  const { items } = useCart()

  const [state, setState]       = useState<FlowState>("billing-form")
  const [errorMessage, setError] = useState<string | null>(null)
  const [iyzicoData, setData]    = useState<InitializeResult | null>(null)
  const [savedAddress, setAddress] = useState<BillingAddress | undefined>()

  // ============================================================================
  // Adres gönderildi → iyzico initialize API çağrısı
  // ============================================================================

  const handleAddressSubmit = useCallback(
    async (billingAddress: BillingAddress) => {
      // Sepet validasyonu — API'ye gitmeden önce, loading state açılmadan önce
      let apiItems: { bookId: string; productId: ProductId; quantity: number }[]
      try {
        apiItems = items.map((item) => ({
          bookId:    resolveBookId(item),
          productId: resolveProductId(item),
          quantity:  item.quantity,
        }))
      } catch (e) {
        const code = e instanceof Error ? e.message : ""
        const msg =
          code === "INVALID_BOOK_ID"
            ? t("iyzicoPayment.invalidBookId")
            : code || t("iyzicoPayment.initError")
        setError(msg)
        setState("error")
        return
      }

      setAddress(billingAddress)
      setState("loading")
      setError(null)

      try {
        const res = await fetch("/api/payment/iyzico/initialize", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ items: apiItems, billingAddress }),
        })

        const json = await res.json()

        if (!res.ok || !json.success) {
          throw new Error(json.details ?? json.error ?? t("iyzicoPayment.initError"))
        }

        setData({
          orderId:             json.data.orderId,
          token:               json.data.token,
          checkoutFormContent: json.data.checkoutFormContent,
        })
        onPaymentInitiated?.(json.data.orderId)
        setState("payment-form")
      } catch (err) {
        const msg = err instanceof Error ? err.message : t("iyzicoPayment.initError")
        setError(msg)
        setState("error")
      }
    },
    [items, t, onPaymentInitiated]
  )

  // ============================================================================
  // Render
  // ============================================================================

  if (state === "billing-form") {
    return (
      <div className="space-y-4">
        {/* iyzico güvenlik rozeti */}
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 dark:border-blue-900/40 dark:bg-blue-950/30">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            🔒 {tBadge("iyzico")}
          </span>
        </div>

        <BillingAddressForm
          onSubmit={handleAddressSubmit}
          isLoading={false}
          defaultValues={savedAddress}
        />
      </div>
    )
  }

  if (state === "loading") {
    return (
      <div className="space-y-4">
        {/* Address form disabled/loading state — buton loading'de */}
        <BillingAddressForm
          onSubmit={handleAddressSubmit}
          isLoading={true}
          defaultValues={savedAddress}
        />
      </div>
    )
  }

  if (state === "payment-form" && iyzicoData) {
    return (
      <div className="space-y-4">
        {/* Geri butonu */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setState("billing-form")}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t("iyzicoPayment.cancelPayment")}
        </Button>

        <IyzicoCheckoutForm
          checkoutFormContent={iyzicoData.checkoutFormContent}
          onError={() => {
            setError(t("iyzicoPayment.loadingError"))
            setState("error")
          }}
        />
      </div>
    )
  }

  // state === "error"
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30"
    >
      <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
      <div>
        <p className="font-semibold text-red-700 dark:text-red-400">
          {t("iyzicoPayment.initError")}
        </p>
        {errorMessage && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-500">
            {errorMessage}
          </p>
        )}
      </div>
      <Button
        variant="outline"
        onClick={() => {
          setError(null)
          setState("billing-form")
        }}
        className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-400"
      >
        {t("iyzicoPayment.retryButton")}
      </Button>
    </div>
  )
}
