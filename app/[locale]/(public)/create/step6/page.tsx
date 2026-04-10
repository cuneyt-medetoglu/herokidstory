"use client"

import { useEffect } from "react"
import { useRouter } from "@/i18n/navigation"

export default function Step6RedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/create/step4")
  }, [router])
  return null
}
