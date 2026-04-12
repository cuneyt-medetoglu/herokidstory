"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { ReaderDefaults } from "@/lib/types/reader-defaults"
import { DEFAULT_READER_DEFAULTS } from "@/lib/types/reader-defaults"

type AnimationType = ReaderDefaults["animationType"]
type AnimationSpeed = ReaderDefaults["animationSpeed"]
type MobileLayoutMode = ReaderDefaults["mobileLayoutMode"]
type AutoplayMode = ReaderDefaults["defaultAutoplayMode"]
type AutoplaySpeed = ReaderDefaults["defaultAutoplaySpeed"]

const ANIMATION_TYPES: AnimationType[] = ["flip", "slide", "fade", "curl", "zoom", "none"]
const ANIMATION_SPEEDS: AnimationSpeed[] = ["slow", "normal", "fast"]
const AUTOPLAY_SPEEDS: AutoplaySpeed[] = [5, 10, 15, 20]

export default function AdminReaderDefaultsPage() {
  const t = useTranslations("admin.readerDefaults")
  const { toast } = useToast()

  const [prefs, setPrefs] = useState<ReaderDefaults>(DEFAULT_READER_DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/reader-defaults")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.success || !data.defaults) return
        setPrefs(data.defaults)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/reader-defaults", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      const data = await res.json()
      if (data.success) {
        setPrefs(data.defaults)
        toast({ title: t("toastSavedTitle"), description: t("toastSavedDesc") })
      } else {
        throw new Error()
      }
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

  const animationTypeKey: Record<AnimationType, string> = {
    flip: t("animation.flip"),
    slide: t("animation.slide"),
    fade: t("animation.fade"),
    curl: t("animation.curl"),
    zoom: t("animation.zoom"),
    none: t("animation.none"),
  }

  const animationSpeedKey: Record<AnimationSpeed, string> = {
    slow: t("animationSpeed.slow"),
    normal: t("animationSpeed.normal"),
    fast: t("animationSpeed.fast"),
  }

  const autoplaySpeedKey: Record<AutoplaySpeed, string> = {
    5: t("autoplay.speed5"),
    10: t("autoplay.speed10"),
    15: t("autoplay.speed15"),
    20: t("autoplay.speed20"),
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("animation.title")}</CardTitle>
          <CardDescription>{t("animation.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ANIMATION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, animationType: type }))}
                className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  prefs.animationType === type
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {animationTypeKey[type]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("animationSpeed.title")}</CardTitle>
          <CardDescription>{t("animationSpeed.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {ANIMATION_SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, animationSpeed: speed }))}
                className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  prefs.animationSpeed === speed
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {animationSpeedKey[speed]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("mobileLayout.title")}</CardTitle>
          <CardDescription>{t("mobileLayout.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(["stacked", "flip"] as MobileLayoutMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, mobileLayoutMode: mode }))}
              className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
                prefs.mobileLayoutMode === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {t(`mobileLayout.${mode}`)}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("autoplay.title")}</CardTitle>
          <CardDescription>{t("autoplay.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">{t("autoplay.modeLabel")}</Label>
            <div className="space-y-2">
              {(["off", "tts", "timed"] as AutoplayMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, defaultAutoplayMode: mode }))}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
                    prefs.defaultAutoplayMode === mode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {t(`autoplay.${mode === "off" ? "off" : mode === "tts" ? "tts" : "timed"}`)}
                </button>
              ))}
            </div>
          </div>

          {prefs.defaultAutoplayMode === "timed" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">{t("autoplay.speedLabel")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {AUTOPLAY_SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, defaultAutoplaySpeed: speed }))}
                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                      prefs.defaultAutoplaySpeed === speed
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    {autoplaySpeedKey[speed]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
          {saving ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  )
}
