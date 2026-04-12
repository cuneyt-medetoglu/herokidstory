"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export default function AdminTtsSettingsPage() {
  const t = useTranslations("admin.ttsSettings")
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [voiceName, setVoiceName] = useState("Achernar")
  const [prompt, setPrompt] = useState("")
  const [languageCode, setLanguageCode] = useState("tr")

  useEffect(() => {
    let cancelled = false
    fetch("/api/tts/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setVoiceName(data.voiceName ?? "Achernar")
        setPrompt(data.prompt ?? "")
        setLanguageCode(data.languageCode ?? "tr")
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/tts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceName: voiceName.trim() || "Achernar",
          prompt: prompt.trim() || t("defaultPrompt"),
          languageCode: languageCode.trim() || "tr",
        }),
      })
      if (!res.ok) {
        if (res.status === 403) {
          toast({ title: t("toastForbiddenTitle"), description: t("toastForbiddenDesc"), variant: "destructive" })
          return
        }
        throw new Error("save failed")
      }
      const data = await res.json()
      setVoiceName(data.voiceName)
      setPrompt(data.prompt)
      setLanguageCode(data.languageCode)
      toast({ title: t("toastSavedTitle"), description: t("toastSavedDesc") })
    } catch {
      toast({ title: t("toastErrorTitle"), description: t("toastErrorDesc"), variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>{t("cardDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tts-voice">{t("voiceLabel")}</Label>
            <Input
              id="tts-voice"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Achernar"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tts-prompt">{t("promptLabel")}</Label>
            <Textarea
              id="tts-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("promptPlaceholder")}
              rows={4}
              className="resize-none"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tts-lang">{t("languageLabel")}</Label>
            <Input
              id="tts-lang"
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              placeholder="tr"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
