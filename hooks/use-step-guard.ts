"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "@/i18n/navigation"
import { readWizardLocal } from "@/lib/herokid-wizard-storage"

/**
 * Wizard step guard: önceki step(ler) tamamlanmadan ileri geçilmesini engeller.
 * Eksik data varsa kullanıcıyı en erken eksik step'e yönlendirir.
 *
 * Kullanım:
 *   useStepGuard(2)  →  step1 dolu olmalı  (step2 sayfasında)
 *   useStepGuard(3)  →  step1 + step2 dolu olmalı (step3 sayfasında)
 *   useStepGuard(4)  →  step1 + step2 + step3 dolu olmalı (step4 sayfasında)
 */
export function useStepGuard(currentStep: 2 | 3 | 4) {
  const router = useRouter()
  // Bir render döngüsünde birden fazla redirect tetiklenmesin
  const redirected = useRef(false)

  useEffect(() => {
    if (redirected.current) return
    const data = readWizardLocal()

    const step1Ok = Boolean(
      data.step1 &&
        typeof data.step1 === "object" &&
        (data.step1 as Record<string, unknown>).name
    )

    const step2Ok = (() => {
      if (!data.step2 || typeof data.step2 !== "object") return false
      const characters = (data.step2 as Record<string, unknown>).characters
      if (!Array.isArray(characters) || characters.length === 0) return false
      // En az bir karakter fotoğraf yüklenmiş veya API'ye kaydedilmiş olmalı
      return characters.some(
        (c: Record<string, unknown>) => Boolean(c.photo) || Boolean(c.characterId)
      )
    })()

    const step3Ok = (() => {
      if (!data.step3 || typeof data.step3 !== "object") return false
      const s3 = data.step3 as Record<string, unknown>
      return Boolean(s3.theme) && Boolean(s3.language)
    })()

    let redirectTo: string | null = null

    if (currentStep >= 2 && !step1Ok) {
      redirectTo = "/create/step1"
    } else if (currentStep >= 3 && !step2Ok) {
      redirectTo = "/create/step2"
    } else if (currentStep >= 4 && !step3Ok) {
      redirectTo = "/create/step3"
    }

    if (redirectTo) {
      redirected.current = true
      router.replace(redirectTo)
    }
  }, [currentStep, router])
}
