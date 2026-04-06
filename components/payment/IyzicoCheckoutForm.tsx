"use client"

/**
 * @file iyzico Checkout Form bileşeni.
 *
 * iyzico API'den dönen `checkoutFormContent` HTML'ini DOM'a inject eder.
 * `<script>` etiketleri `innerHTML` ile çalıştırılmaz; her biri yeniden
 * oluşturularak `document.body`'ye eklenir — bu, iyzico iframe'inin
 * doğru yüklenmesi için gereklidir.
 *
 * Temizlik: bileşen unmount olduğunda enjekte edilen script'ler kaldırılır.
 *
 * Localization: checkout.iyzicoPayment namespace.
 */

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react"

// ============================================================================
// Props
// ============================================================================

interface IyzicoCheckoutFormProps {
  /** iyzico API'den dönen HTML içeriği (script + iframe içerir) */
  checkoutFormContent: string
  /** Form yüklendiğinde çağrılır (opsiyonel) */
  onLoad?: () => void
  /** Form yükleme hatası callback'i (opsiyonel) */
  onError?: (err: Error) => void
}

// ============================================================================
// Bileşen
// ============================================================================

export function IyzicoCheckoutForm({
  checkoutFormContent,
  onLoad,
  onError,
}: IyzicoCheckoutFormProps) {
  const t = useTranslations("checkout")
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const injectedScriptsRef = useRef<HTMLScriptElement[]>([])

  useEffect(() => {
    if (!containerRef.current || !checkoutFormContent) return

    // Önceki enjeksiyonu temizle
    injectedScriptsRef.current.forEach((s) => s.remove())
    injectedScriptsRef.current = []

    // HTML'i inject et
    containerRef.current.innerHTML = checkoutFormContent

    // Script etiketlerini yeniden oluştur ve çalıştır
    const scripts = Array.from(
      containerRef.current.querySelectorAll<HTMLScriptElement>("script")
    )

    const injectScripts = async () => {
      try {
        for (const original of scripts) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script")

            if (original.src) {
              // Harici script — yüklenmesini bekle
              script.src = original.src
              script.async = true
              script.onload  = () => resolve()
              script.onerror = () => reject(new Error(`Script yüklenemedi: ${original.src}`))
            } else {
              // Satır içi script — senkron çalışır
              script.textContent = original.textContent ?? ""
              setTimeout(resolve, 0)
            }

            document.body.appendChild(script)
            injectedScriptsRef.current.push(script)
          })
        }

        setIsLoaded(true)
        onLoad?.()
      } catch (err) {
        setHasError(true)
        onError?.(err instanceof Error ? err : new Error(String(err)))
      }
    }

    injectScripts()

    // Cleanup: unmount olduğunda script'leri kaldır
    return () => {
      injectedScriptsRef.current.forEach((s) => s.remove())
      injectedScriptsRef.current = []
    }
  }, [checkoutFormContent]) // eslint-disable-line react-hooks/exhaustive-deps

  if (hasError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30"
      >
        <AlertCircle className="h-10 w-10 text-red-500" aria-hidden="true" />
        <p className="font-medium text-red-700 dark:text-red-400">
          {t("iyzicoPayment.loadingError")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Yükleniyor göstergesi — iyzico script'leri yüklenene kadar */}
      {!isLoaded && (
        <div
          aria-live="polite"
          aria-label={t("iyzicoPayment.loadingForm")}
          className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-800/50"
        >
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {t("iyzicoPayment.loadingForm")}
          </span>
        </div>
      )}

      {/* iyzico iframe container — checkoutFormContent buraya inject edilir */}
      <div
        ref={containerRef}
        id="iyzipay-checkout-form"
        className="responsive min-h-[200px]"
        aria-label={t("iyzicoPayment.formRegion")}
      />

      {/* Güvenlik bildirimi */}
      {isLoaded && (
        <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("secureNotice")}
          </p>
        </div>
      )}
    </div>
  )
}
