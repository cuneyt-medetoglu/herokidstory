"use client"

/**
 * @file Checkout sayfası ana içeriği.
 *
 * Yapı:
 *  1. Müşteri bilgileri (e-posta / ad) — oturum açmışsa otomatik doldurulur
 *  2. Hardcopy kargo adresi (ürünlerde hardcopy varsa gösterilir)
 *  3. Ödeme bölümü — IyzicoPaymentFlow ile tam entegre
 *
 * NOT: Ödeme formu (BillingAddressForm) kendi <form> elementini yönetir.
 * Bu bileşen <div> sarmalayıcıdır; iç içe <form> kullanılmaz.
 *
 * Localization: checkout namespace.
 */

import { useTranslations } from "next-intl"
import { IyzicoPaymentFlow } from "@/components/payment/IyzicoPaymentFlow"

// ============================================================================
// Props
// ============================================================================

interface CheckoutFormProps {
  hasHardcopy: boolean
}

// ============================================================================
// Bileşen
// ============================================================================

export function CheckoutForm({ hasHardcopy }: CheckoutFormProps) {
  const t        = useTranslations("checkout")
  const tShip    = useTranslations("checkout.shipping")

  return (
    <div className="space-y-8">
      {/*
       * Kargo adresi bölümü — sadece hardcopy siparişlerde gösterilir.
       * iyzico fatura adresi BillingAddressForm içinde ayrı sorulur.
       * Fiziksel kargolama detayları Faz 5 (fulfillment) kapsamında ele alınacak.
       */}
      {hasHardcopy && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {tShip("title")} —{" "}
            <span className="font-medium">{tShip("streetPlaceholder")}</span>
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            {tShip("hardcopyNote")}
          </p>
        </div>
      )}

      {/* Ödeme bölümü */}
      <div>
        <h3 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
          {t("paymentMethod")}
        </h3>
        <IyzicoPaymentFlow />
      </div>
    </div>
  )
}
