"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Bug, BookOpen, User, Image as ImageIcon, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DebugModal } from "./DebugModal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type DebugStoryModel = 'gpt-4.1-mini' | 'gpt-4.1' | 'gpt-4o-mini' | 'gpt-4o' | 'o1-mini'

interface DebugQualityPanelProps {
  wizardData: any
  characterIds: string[]
  canShow: boolean
  /** Admin/debug: story model (step6 seçici ile aynı). */
  storyModel?: DebugStoryModel
}

export function DebugQualityPanel({ wizardData, characterIds, canShow, storyModel = 'gpt-4.1-mini' }: DebugQualityPanelProps) {
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(false)
  
  // Loading states
  const [loadingStory, setLoadingStory] = useState(false)
  const [loadingMasters, setLoadingMasters] = useState(false)
  const [loadingCover, setLoadingCover] = useState(false)
  const [loadingPage, setLoadingPage] = useState(false)

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<{
    title: string
    request: any
    response: any
    status: "success" | "error"
    imageUrl?: string
  } | null>(null)

  // Story data (stored after "Sadece hikaye" is called)
  const [storyData, setStoryData] = useState<any>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [selectedPage, setSelectedPage] = useState<number>(1)
  const [loadingCreateFromStory, setLoadingCreateFromStory] = useState(false)

  if (!canShow) return null

  const handleStoryOnly = async () => {
    setLoadingStory(true)
    try {
      const themeKey =
        wizardData?.step3?.theme?.id ||
        (typeof wizardData?.step3?.theme === "string" ? wizardData.step3.theme : "") ||
        "adventure"
      const styleKey =
        wizardData?.step4?.illustrationStyle?.id ||
        (typeof wizardData?.step4?.illustrationStyle === "string"
          ? wizardData.step4.illustrationStyle
          : "") ||
        "watercolor"
      const language = wizardData?.step3?.language?.id || "en"

      const singleId = characterIds.length === 1 ? characterIds[0] : null
      const fallbackId = localStorage.getItem("herokidstory_character_id")

      const requestBody = {
        characterId: singleId || fallbackId || characterIds[0],
        theme: themeKey,
        illustrationStyle: styleKey,
        customRequests: wizardData?.step5?.customRequests || "",
        language,
        pageCount: wizardData?.step5?.pageCount,
        debug: true,
        storyModel,
      }

      const response = await fetch("/api/ai/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Story generation failed")
      }

      // Store story data for page generation
      setStoryData(result.data || result)
      setPageCount(result.data?.pages?.length || 0)

      // Request: gerçekte ne gittiğini göster (API body + karakter çözümü + AI'a giden prompt)
      const requestForModal = result.metadata?.debug ?? requestBody

      setModalData({
        title: "Debug: Sadece Hikaye",
        request: requestForModal,
        response: result,
        status: "success",
      })
      setModalOpen(true)

      toast({
        title: "Hikaye üretildi",
        description: `${result.data?.pages?.length || 0} sayfa oluşturuldu`,
      })
    } catch (error: any) {
      setModalData({
        title: "Debug: Sadece Hikaye",
        request: {},
        response: { error: error.message },
        status: "error",
      })
      setModalOpen(true)

      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingStory(false)
    }
  }

  const handleCreateBookFromStory = async () => {
    if (!storyData?.pages?.length) return
    setLoadingCreateFromStory(true)
    try {
      const themeKey =
        wizardData?.step3?.theme?.id ||
        (typeof wizardData?.step3?.theme === "string" ? wizardData.step3.theme : "") ||
        "adventure"
      const styleKey =
        wizardData?.step4?.illustrationStyle?.id ||
        (typeof wizardData?.step4?.illustrationStyle === "string"
          ? wizardData.step4.illustrationStyle
          : "") ||
        "watercolor"
      const language = (wizardData?.step3?.language?.id || "en") as string
      const singleId = characterIds.length === 1 ? characterIds[0] : null
      const fallbackId = localStorage.getItem("herokidstory_character_id")
      const requestBody = {
        characterId: singleId || fallbackId || characterIds[0],
        characterIds: characterIds.length > 0 ? characterIds : [singleId || fallbackId || characterIds[0]].filter(Boolean),
        theme: themeKey,
        illustrationStyle: styleKey,
        customRequests: wizardData?.step5?.customRequests || "",
        language,
        pageCount: wizardData?.step5?.pageCount || storyData.pages.length,
        story_data: storyData,
        skipPayment: true,
      }
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || result.message || "Kitap oluşturulamadı")
      }
      toast({
        title: "Kitap oluşturuldu",
        description: result.data?.id ? `Kitap ID: ${result.data.id}` : "Hikayeden kitap oluşturuldu.",
      })
      if (result.data?.id) {
        window.open(`/books/${result.data.id}/view`, "_blank")
      }
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingCreateFromStory(false)
    }
  }

  const handleMastersDebug = async () => {
    setLoadingMasters(true)
    try {
      const themeKey =
        wizardData?.step3?.theme?.id ||
        (typeof wizardData?.step3?.theme === "string" ? wizardData.step3.theme : "") ||
        "adventure"
      const styleKey =
        wizardData?.step4?.illustrationStyle?.id ||
        (typeof wizardData?.step4?.illustrationStyle === "string"
          ? wizardData.step4.illustrationStyle
          : "") ||
        "watercolor"
      const language = (wizardData?.step3?.language?.id || "en") as string
      const requestBody = {
        ...(characterIds.length > 0 ? { characterIds } : { characterId: characterIds[0] }),
        theme: themeKey,
        illustrationStyle: styleKey,
        customRequests: wizardData?.step5?.customRequests || "",
        language,
        pageCount: wizardData?.step5?.pageCount || 5,
        debugRunUpTo: "masters" as const,
      }

      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || "Masters debug başarısız")
      }

      setModalData({
        title: "Debug: Hikaye + Masters (karakter + entity)",
        request: result.request ?? requestBody,
        response: result,
        status: "success",
      })
      setModalOpen(true)

      toast({
        title: "Masters üretildi",
        description: "Hikaye + karakter + entity masters (kitap kaydedilmedi).",
      })
    } catch (error: any) {
      setModalData({
        title: "Debug: Hikaye + Masters (karakter + entity)",
        request: {},
        response: { error: error.message },
        status: "error",
      })
      setModalOpen(true)

      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingMasters(false)
    }
  }

  const handleCoverDebug = async () => {
    setLoadingCover(true)
    try {
      const themeKey =
        wizardData?.step3?.theme?.id ||
        (typeof wizardData?.step3?.theme === "string" ? wizardData.step3.theme : "") ||
        "adventure"
      const styleKey =
        wizardData?.step4?.illustrationStyle?.id ||
        (typeof wizardData?.step4?.illustrationStyle === "string"
          ? wizardData.step4.illustrationStyle
          : "") ||
        "watercolor"
      const language = (wizardData?.step3?.language?.id || "en") as string
      const requestBody = {
        ...(characterIds.length > 0 ? { characterIds } : { characterId: characterIds[0] }),
        theme: themeKey,
        illustrationStyle: styleKey,
        customRequests: wizardData?.step5?.customRequests || "",
        language,
        pageCount: wizardData?.step5?.pageCount || 5,
        debugRunUpTo: "cover" as const,
      }

      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || "Kapak debug başarısız")
      }

      const coverUrl = result.data?.coverUrl ?? null

      setModalData({
        title: "Debug: Hikaye + Masters + Kapak",
        request: result.request ?? requestBody,
        response: result,
        status: "success",
        imageUrl: coverUrl || undefined,
      })
      setModalOpen(true)

      toast({
        title: "Kapak üretildi",
        description: coverUrl ? "Gerçek akışla kapak oluşturuldu (kitap kaydedilmedi)." : "Yanıt alındı.",
      })
    } catch (error: any) {
      setModalData({
        title: "Debug: Hikaye + Masters + Kapak",
        request: {},
        response: { error: error.message },
        status: "error",
      })
      setModalOpen(true)

      toast({
        title: "Hata",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingCover(false)
    }
  }

  return (
    <>
      <Card className="p-4 border-orange-200 bg-orange-50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Debug Kalite Paneli (Admin)</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Kapat" : "Aç"}
          </Button>
        </div>

        {expanded && (
          <div className="space-y-4">
            <p className="text-sm text-orange-800">
              Her adımı ayrı test edip request/response'ları inceleyebilirsiniz.
            </p>

            {/* 1. Sadece Hikaye */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <BookOpen className="h-5 w-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">1. Sadece Hikaye</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Hikaye üretimi (kitap oluşturulmaz). Model: <strong>{storyModel}</strong> (yukarıdaki seçim)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {storyData && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleCreateBookFromStory}
                      disabled={loadingCreateFromStory}
                    >
                      {loadingCreateFromStory ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Oluşturuluyor...
                        </>
                      ) : (
                        "Bu hikayeden kitap oluştur"
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleStoryOnly}
                    disabled={loadingStory}
                  >
                    {loadingStory ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Üretiliyor...
                      </>
                    ) : (
                      "Test Et"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* 2. Masters (karakter + entity) – gerçek akış */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <User className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">2. Masters (karakter + entity)</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Hikaye → Karakter masters → Entity masters (hayvan/nesne; kitap kaydedilmez)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleMastersDebug}
                  disabled={loadingMasters}
                >
                  {loadingMasters ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Üretiliyor...
                    </>
                  ) : (
                    "Test Et"
                  )}
                </Button>
              </div>
            </div>

            {/* 3. Hikaye + Masters + Kapak (gerçek akış) */}
            <div className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <ImageIcon className="h-5 w-5 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">3. Kapak (gerçek akış)</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Hikaye → Masters → Kapak (kitap kaydedilmez, sadece kapak gösterilir)
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={handleCoverDebug}
                  disabled={loadingCover}
                >
                  {loadingCover ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Üretiliyor...
                    </>
                  ) : (
                    "Test Et"
                  )}
                </Button>
              </div>
            </div>

            {/* 4. Sadece Sayfa X - Coming soon */}
            <div className="border rounded-lg p-4 bg-white opacity-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-brand-2 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">4. Sadece Sayfa X</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Belirli bir sayfa görseli (hikaye + masters gerekli)
                    </p>
                    {storyData && pageCount > 0 && (
                      <div className="mt-2">
                        <Label className="text-xs">Sayfa seç (1-{pageCount})</Label>
                        <Input
                          type="number"
                          min={1}
                          max={pageCount}
                          value={selectedPage}
                          onChange={(e) => setSelectedPage(Number(e.target.value))}
                          className="w-20 h-8 text-sm mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Button size="sm" disabled>
                  Yakında
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {modalData && (
        <DebugModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title={modalData.title}
          request={modalData.request}
          response={modalData.response}
          status={modalData.status}
          imageUrl={modalData.imageUrl}
        />
      )}
    </>
  )
}
