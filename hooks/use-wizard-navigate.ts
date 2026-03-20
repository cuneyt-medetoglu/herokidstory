"use client"

import { useRouter } from "@/i18n/navigation"
import { useCallback, useTransition } from "react"

/**
 * Client navigasyon için useTransition tabanlı pending durumu.
 * Çift tıklamayı engellemek ve İleri butonlarında tutarlı yükleme göstermek için kullanılır.
 */
export function useWizardNavigate() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = useCallback(
    (href: string, beforeNavigate?: () => boolean | void) => {
      startTransition(() => {
        if (beforeNavigate?.() === false) return
        router.push(href)
      })
    },
    [router]
  )

  return { isPending, navigate }
}
