"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/navigation"

export default function Step5RedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/create/step3")
  }, [router])
  return null
}
