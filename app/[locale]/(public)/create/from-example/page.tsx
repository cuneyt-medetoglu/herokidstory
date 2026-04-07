"use client"

import { Suspense, useEffect, useState, useMemo, useCallback } from "react"
import type { ElementType } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter, Link } from "@/i18n/navigation"
import { useWizardNavigate } from "@/hooks/use-wizard-navigate"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { ArrowLeft, Loader2, BookOpen, User, Heart, Eye, Scissors, Upload, Star, Sparkles, X, CheckCircle, ShoppingCart } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useCart } from "@/contexts/CartContext"
import {
  getProductPrice,
  HARDCOVER_PRINT_PROMO_DISCOUNT_TRY,
} from "@/lib/pricing/payment-products"
import type { Currency } from "@/lib/currency"

const HAIR_COLOR_VALUES = ["light-blonde", "blonde", "dark-blonde", "black", "brown", "red"] as const
const EYE_COLOR_VALUES = ["blue", "green", "brown", "black", "hazel"] as const

const HAIR_KEY_MAP: Record<string, string> = {
  "light-blonde": "lightBlonde",
  "blonde": "blonde",
  "dark-blonde": "darkBlonde",
  "black": "black",
  "brown": "brown",
  "red": "red",
}

type ExampleBook = {
  id: string
  title: string
  theme: string
  illustration_style: string
  language: string
  age_group: string
  total_pages: number
  story_data: any
  cover_image_url: string | null
  images_data: any[]
  /** Slot sırasına göre her karakterin orijinal tipi */
  characterSlotTypes?: Array<{ group: string; value: string; displayName: string }>
}

type CharacterSlot = {
  name: string
  age: number
  gender: "boy" | "girl" | ""
  hairColor: string
  eyeColor: string
  photoFile: File | null
  photoPreview: string | null
  uploadError: string | null
  isDragging: boolean
}

const defaultCharacter = (): CharacterSlot => ({
  name: "",
  age: 0,
  gender: "",
  hairColor: "",
  eyeColor: "",
  photoFile: null,
  photoPreview: null,
  uploadError: null,
  isDragging: false,
})

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** Örnek kitaptaki benzersiz karakter sayısı (story_data.pages içindeki characterIds'den). */
function getExampleCharacterCount(example: ExampleBook): number {
  const pages = example?.story_data?.pages || []
  const ids = new Set(pages.flatMap((p: any) => p.characterIds || []))
  return Math.max(ids.size, 1)
}

function pageCountToPlanType(count: number | undefined): "10" | "15" | "20" {
  if (typeof count !== "number" || !Number.isFinite(count) || count <= 0) return "10"
  if (count <= 10) return "10"
  if (count <= 15) return "15"
  return "20"
}

interface DecorativeElement {
  Icon: React.ElementType
  top: string
  left?: string
  right?: string
  delay: number
  size: string
  color: string
}

const floatingVariants = {
  animate: (i: number) => ({
    y: [0, -15, 0],
    rotate: [0, 5, 0, -5, 0],
    transition: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" as const },
  }),
}

const decorativeElements: DecorativeElement[] = [
  { Icon: Star,     top: "10%", left: "8%",  delay: 0,   size: "h-6 w-6", color: "text-yellow-400" },
  { Icon: Heart,    top: "15%", right: "10%", delay: 0.5, size: "h-8 w-8", color: "text-brand-2" },
  { Icon: Sparkles, top: "70%", left: "5%",  delay: 1,   size: "h-6 w-6", color: "text-primary" },
  { Icon: BookOpen, top: "75%", right: "8%", delay: 1.5, size: "h-7 w-7", color: "text-blue-400" },
]

function FromExampleContent() {
  const t = useTranslations("create.fromExample")
  const tStep1 = useTranslations("create.step1")
  const tStep2 = useTranslations("create.step2")
  const searchParams = useSearchParams()
  const router = useRouter()
  const { navigate, isPending: isNavPending } = useWizardNavigate()
  const { toast } = useToast()
  const tcCreate = useTranslations("create.common")

  const hairColorOptions = HAIR_COLOR_VALUES.map((v) => ({ value: v, label: tStep1(`hairColors.${HAIR_KEY_MAP[v] ?? v}`) }))
  const eyeColorOptions = EYE_COLOR_VALUES.map((v) => ({ value: v, label: tStep1(`eyeColors.${v}`) }))
  const exampleId = searchParams.get("exampleId")

  const [example, setExample] = useState<ExampleBook | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isPayCheckout, setPayCheckout] = useState(false)
  const [characters, setCharacters] = useState<CharacterSlot[]>([])
  const [step, setStep] = useState<"form" | "summary">("form")
  const { data: session } = useSession()
  const user = session?.user ?? null
  const [canSkipPayment, setCanSkipPayment] = useState(false)
  const { currencyConfig, isLoading: isLoadingCurrency } = useCurrency()
  const { addToCart } = useCart()

  const characterCount = useMemo(() => (example ? getExampleCharacterCount(example) : 0), [example])
  const isFormValid = useMemo(
    () =>
      characters.length > 0 &&
      characters.every(
        (c) =>
          c.name.trim() &&
          (c.gender === "boy" || c.gender === "girl") &&
          c.photoFile !== null &&
          (c.hairColor ?? "").trim() !== "" &&
          (c.eyeColor ?? "").trim() !== ""
      ),
    [characters]
  )

  useEffect(() => {
    if (!exampleId) {
      router.replace("/examples")
      return
    }
    const fetchExample = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/examples/${exampleId}`)
        const data = await res.json()
        if (!res.ok || !data.success) {
          toast({ title: t("toasts.errorTitle"), description: data.error || t("toasts.exampleNotFound"), variant: "destructive" })
          router.replace("/examples")
          return
        }
        setExample(data.data)
      } catch {
        toast({ title: t("toasts.errorTitle"), description: t("toasts.failedToLoad"), variant: "destructive" })
        router.replace("/examples")
      } finally {
        setLoading(false)
      }
    }
    fetchExample()
  }, [exampleId, router, toast, t])

  useEffect(() => {
    if (characterCount > 0 && characters.length !== characterCount) {
      setCharacters((prev) => {
        const next = [...prev]
        while (next.length < characterCount) next.push(defaultCharacter())
        return next.slice(0, characterCount)
      })
    }
  }, [characterCount, characters.length])

  useEffect(() => {
    fetch("/api/debug/can-skip-payment")
      .then((r) => r.json())
      .then((data) => setCanSkipPayment(!!data?.canSkipPayment))
      .catch(() => setCanSkipPayment(false))
  }, [])

  useEffect(() => {
    router.prefetch("/examples")
    router.prefetch("/cart")
    router.prefetch("/dashboard")
  }, [router])

  const updateCharacter = (index: number, patch: Partial<CharacterSlot>) => {
    setCharacters((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const validateFile = (file: File): string | null => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png"]
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (!validTypes.includes(file.type)) return "Invalid file format. Please upload JPG or PNG"
    if (file.size > maxSize) return "File size exceeds 5MB. Please choose a smaller file"
    return null
  }

  const handleFileUpload = useCallback((index: number, file: File) => {
    const error = validateFile(file)
    if (error) {
      updateCharacter(index, { photoFile: null, photoPreview: null, uploadError: error })
      toast({ title: t("toasts.uploadErrorTitle"), description: error, variant: "destructive" })
      return
    }
    updateCharacter(index, { photoFile: file, photoPreview: URL.createObjectURL(file), uploadError: null })
  }, [t, toast])

  const handleFileDrop = useCallback((index: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    updateCharacter(index, { isDragging: false })
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(index, file)
  }, [handleFileUpload])

  const handleRemoveFile = useCallback((index: number) => {
    setCharacters((prev) => {
      const next = [...prev]
      const char = next[index]
      if (char?.photoPreview) URL.revokeObjectURL(char.photoPreview)
      next[index] = { ...char, photoFile: null, photoPreview: null, uploadError: null }
      return next
    })
  }, [])

  const createUploadedCharacterIds = async (): Promise<string[]> => {
    if (!example || characters.length === 0) {
      throw new Error(t("toasts.missingFieldsDesc"))
    }
    const characterIds: string[] = []
    for (let i = 0; i < characters.length; i++) {
      const c = characters[i]
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const dataUrl = reader.result as string
          resolve(dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl)
        }
        reader.onerror = reject
        reader.readAsDataURL(c.photoFile!)
      })
      const slotType = example.characterSlotTypes?.[i]
      const characterType = slotType
        ? { ...slotType, displayName: c.name.trim() }
        : { group: "Child", value: "Child", displayName: c.name.trim() }
      const createCharRes = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: c.name.trim(),
          age: String(c.age),
          gender: c.gender,
          hairColor: (c.hairColor || "").trim() || "brown",
          eyeColor: (c.eyeColor || "").trim() || "brown",
          photoBase64: base64,
          characterType,
        }),
      })
      const charData = await createCharRes.json()
      if (!createCharRes.ok || !charData.success) {
        throw new Error(charData.error || "Failed to create character")
      }
      const id = charData.character?.id
      if (!id) throw new Error("No character ID returned")
      characterIds.push(id)
    }
    return characterIds
  }

  const createCharactersAndBook = async (skipPayment: boolean) => {
    if (!example || characters.length === 0) return
    const characterIds = await createUploadedCharacterIds()
    const bookRes = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromExampleId: example.id,
        characterIds,
        theme: example.theme,
        illustrationStyle: example.illustration_style,
        language: example.language || "en",
        pageCount: example.total_pages,
        customRequests: "",
        ...(skipPayment ? { skipPayment: true } : {}),
      }),
    })
    const bookResult = await bookRes.json()
    if (!bookRes.ok || !bookResult.success) {
      throw new Error(bookResult.error || bookResult.message || "Failed to create book")
    }
    const newBookId = bookResult.data?.id ?? bookResult.data?.bookId ?? bookResult.id
    if (newBookId) {
      navigate(`/create/generating/${newBookId}`)
    } else {
      toast({ title: t("toasts.bookStartedTitle"), description: t("toasts.bookStartedDesc") })
      navigate("/dashboard")
    }
  }

  const handleContinue = () => {
    if (!isFormValid) {
      toast({ title: t("toasts.missingFieldsTitle"), description: t("toasts.missingFieldsDesc"), variant: "destructive" })
      return
    }
    setStep("summary")
  }

  const handleCreateWithoutPayment = async () => {
    if (!example || !isFormValid) return
    setSubmitting(true)
    try {
      await createCharactersAndBook(true)
    } catch (err) {
      toast({
        title: t("toasts.errorTitle"),
        description: err instanceof Error ? err.message : t("toasts.errorDesc"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const showSkipPaymentButton = user && canSkipPayment

  if (loading || !example) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-brand-2/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-white to-brand-2/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {decorativeElements.map((el, i) => {
          const Icon = el.Icon
          return (
            <motion.div
              key={i}
              custom={i}
              variants={floatingVariants}
              animate="animate"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.4, scale: 1 }}
              viewport={{ once: true }}
              className="absolute"
              style={{ top: el.top, left: el.left, right: el.right }}
            >
              <Icon className={`${el.size} ${el.color} drop-shadow-lg`} />
            </motion.div>
          )
        })}
      </div>

      <div className="container relative mx-auto px-4 py-8 md:py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link href="/examples" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> {t("backToExamples")}
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
              <span>Create from Example</span>
              <span>{step === "summary" ? "Payment" : characterCount === 1 ? "Character" : `${characterCount} Characters`}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-gradient-to-r from-primary to-brand-2" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white/80 p-6 shadow-2xl backdrop-blur-sm dark:bg-slate-800/80 md:p-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">{t("title")}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">Based on: {example.title}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">
                {characterCount === 1
                  ? "Same story and scenes — only the main character will be yours."
                  : `This example has ${characterCount} characters. Fill in one form per character to replace each one in the book.`}
              </p>
            </motion.div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              {step === "form" && characters.map((char, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="rounded-xl border border-gray-200 bg-white/50 p-6 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-slate-200">
                    {characterCount === 1 ? t("characterLabel") : t("characterSlotTitle", { n: index + 1 })}
                  </h2>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t("labels.childName")}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                        <Input
                          value={char.name}
                          onChange={(e) => updateCharacter(index, { name: e.target.value })}
                          placeholder={t("namePlaceholder")}
                          required
                          className="pl-10 border-gray-300 focus-visible:ring-primary dark:border-slate-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t("labels.age")}</Label>
                      <div className="relative">
                        <Heart className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none z-10" />
                        <Input
                          type="number"
                          min={0}
                          max={12}
                          placeholder={t("agePlaceholder")}
                          value={char.age || ""}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === "") updateCharacter(index, { age: 0 })
                            else {
                              const n = parseInt(v, 10)
                              if (!isNaN(n)) updateCharacter(index, { age: Math.min(12, Math.max(0, n)) })
                            }
                          }}
                          className="pl-10 border-gray-300 focus-visible:ring-primary dark:border-slate-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t("labels.gender")}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateCharacter(index, { gender: "boy" })}
                          className={`rounded-lg border-2 p-3 font-medium transition-all ${
                            char.gender === "boy" ? "border-primary bg-primary/5 text-gray-900 dark:text-slate-50" : "border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                          }`}
                          aria-pressed={char.gender === "boy"}
                        >
                          {tStep2("gender.boy")}
                        </motion.button>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateCharacter(index, { gender: "girl" })}
                          className={`rounded-lg border-2 p-3 font-medium transition-all ${
                            char.gender === "girl" ? "border-brand-2 bg-brand-2/5 text-gray-900 dark:text-slate-50" : "border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                          }`}
                          aria-pressed={char.gender === "girl"}
                        >
                          {tStep2("gender.girl")}
                        </motion.button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t("labels.hairColor")}</Label>
                        <div className="relative">
                          <Scissors className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500 z-10 pointer-events-none" />
                          <Select
                            value={char.hairColor === "" || !char.hairColor ? "__placeholder_hair__" : char.hairColor}
                            onValueChange={(v) => updateCharacter(index, { hairColor: v === "__placeholder_hair__" ? "" : v })}
                          >
                            <SelectTrigger className="pl-10 border-gray-300 focus:ring-primary dark:border-slate-600">
                              <SelectValue placeholder={t("hairPlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__placeholder_hair__">{t("hairPlaceholder")}</SelectItem>
                              {hairColorOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t("labels.eyeColor")}</Label>
                        <div className="relative">
                          <Eye className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500 z-10 pointer-events-none" />
                          <Select
                            value={char.eyeColor === "" || !char.eyeColor ? "__placeholder_eye__" : char.eyeColor}
                            onValueChange={(v) => updateCharacter(index, { eyeColor: v === "__placeholder_eye__" ? "" : v })}
                          >
                            <SelectTrigger className="pl-10 border-gray-300 focus:ring-primary dark:border-slate-600">
                              <SelectValue placeholder={t("eyePlaceholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__placeholder_eye__">{t("eyePlaceholder")}</SelectItem>
                              {eyeColorOptions.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t("labels.photo")}</Label>
                      {!char.photoPreview ? (
                        <motion.div
                          onDragOver={(e) => { e.preventDefault(); updateCharacter(index, { isDragging: true }) }}
                          onDragLeave={(e) => { e.preventDefault(); updateCharacter(index, { isDragging: false }) }}
                          onDrop={(e) => handleFileDrop(index, e)}
                          className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                            char.isDragging
                              ? "border-primary bg-primary/10"
                              : "border-primary/30 bg-white/50 hover:border-primary/50 hover:bg-primary/5 dark:border-primary/30 dark:bg-slate-700/50 dark:hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="file"
                            id={`file-input-from-example-${index}`}
                            accept="image/jpeg,image/jpg,image/png"
                            className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(index, f) }}
                          />
                          <label htmlFor={`file-input-from-example-${index}`} className="flex cursor-pointer flex-col items-center justify-center">
                            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }} className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-primary to-brand-2 text-white shadow-lg">
                              <Upload className="h-8 w-8" />
                            </motion.div>
                            <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-slate-300">{t("uploadText")}</p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{t("uploadSubtext")}</p>
                            <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">{t("uploadHint")}</p>
                          </label>
                          {char.uploadError && <p className="mt-2 text-xs text-red-500">{char.uploadError}</p>}
                        </motion.div>
                      ) : (
                        <div className="relative mx-auto max-w-sm">
                          <div className="relative overflow-hidden rounded-lg shadow-xl aspect-square">
                            <Image
                              src={char.photoPreview}
                              alt={`Preview ${index + 1}`}
                              fill
                              sizes="(max-width: 640px) 100vw, 384px"
                              className="object-cover"
                              unoptimized
                            />
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveFile(index)}
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-all hover:bg-red-600"
                              aria-label={tStep2("aria.removePhoto")}
                            >
                              <X className="h-5 w-5" />
                            </motion.button>
                          </div>
                          <div className="mt-2 text-center text-sm text-gray-600 dark:text-slate-400">
                            <p className="font-medium">{char.photoFile?.name}</p>
                            <p>{char.photoFile && formatFileSize(char.photoFile.size)}</p>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-xs font-semibold">{t("photoReady")}</span>
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {step === "form" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleContinue}
                    disabled={!isFormValid}
                    className="w-full bg-gradient-to-r from-primary to-brand-2 px-8 py-6 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  >
                    {t("continueToPayment")}
                  </Button>
                </motion.div>
              )}

              {step === "summary" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-4">
                  <div className="rounded-xl border border-gray-200 bg-white/50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{t("basedOn", { title: example.title })}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                      {t("summaryLine", {
                        characterPart: t("charactersCount", { count: characterCount }),
                        pages: example.total_pages,
                        pagesWord: t("pagesWord"),
                      })}
                    </p>
                  </div>

                  {user && (
                    <Button
                      type="button"
                      loading={isLoadingCurrency || isNavPending || isPayCheckout}
                      disabled={isLoadingCurrency || isNavPending || isPayCheckout}
                      onClick={async () => {
                        if (!example || !isFormValid) return
                        const planType = pageCountToPlanType(example.total_pages)
                        const cur = currencyConfig.currency as Currency
                        const childName =
                          characters[0]?.name?.trim() || example.title
                        const titleLine = t("cartEbookLine", {
                          pages: planType,
                          name: childName,
                        })
                        setPayCheckout(true)
                        try {
                          const characterIds = await createUploadedCharacterIds()
                          const res = await fetch("/api/books/checkout-placeholder", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              characterId: characterIds[0],
                              title: titleLine,
                              theme: example.theme,
                              illustrationStyle: example.illustration_style,
                              language: example.language || "en",
                              totalPages: parseInt(planType, 10),
                              sourceExampleBookId: example.id,
                            }),
                          })
                          const json = await res.json()
                          if (!res.ok || !json.success || !json.data?.bookId) {
                            throw new Error(
                              json.error || json.details || tcCreate("checkoutPrepareError")
                            )
                          }
                          addToCart({
                            type: "ebook_plan",
                            bookId: json.data.bookId,
                            bookTitle: titleLine,
                            price: getProductPrice("ebook", cur),
                            quantity: 1,
                            planType,
                            characterData: {
                              fromExampleId: example.id,
                              characters,
                            },
                            coverImage: example.cover_image_url || undefined,
                            productId: "ebook",
                            currency: cur,
                          })
                          navigate(`/cart?plan=ebook&fromExampleId=${exampleId}`)
                        } catch (err) {
                          toast({
                            title: tcCreate("checkoutPrepareErrorTitle"),
                            description:
                              err instanceof Error
                                ? err.message
                                : tcCreate("checkoutPrepareError"),
                            variant: "destructive",
                          })
                        } finally {
                          setPayCheckout(false)
                        }
                      }}
                      className="w-full bg-gradient-to-r from-primary to-brand-2 px-8 py-8 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                    >
                      {!isLoadingCurrency && !isNavPending && !isPayCheckout && (
                        <ShoppingCart className="mr-2 h-6 w-6" />
                      )}
                      <span>
                        {isLoadingCurrency || isNavPending || isPayCheckout
                          ? tcCreate("navigating")
                          : t("payCreate", { price: currencyConfig.price })}
                      </span>
                    </Button>
                  )}
                  {user && currencyConfig.currency === "TRY" && (
                    <p className="text-center text-xs text-gray-600 dark:text-slate-400">
                      {t("hardcoverDiscount", {
                        price: `₺${HARDCOVER_PRINT_PROMO_DISCOUNT_TRY}`,
                      })}
                    </p>
                  )}

                  {showSkipPaymentButton && (
                    <div className="space-y-1">
                      <Button
                        type="button"
                        variant="outline"
                        loading={submitting}
                        disabled={submitting}
                        onClick={handleCreateWithoutPayment}
                        className="w-full border-amber-500/50 text-amber-700 dark:border-amber-400 dark:text-amber-400"
                      >
                        <span>
                          {submitting
                            ? tcCreate("pleaseWait")
                            : t("createWithoutPaymentDebug")}
                        </span>
                      </Button>
                      <p className="text-center text-xs text-amber-600/80 dark:text-amber-400/80">{t("adminDebugOnly")}</p>
                    </div>
                  )}

                  <Button type="button" variant="ghost" onClick={() => setStep("form")} className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {tcCreate("back")}
                  </Button>
                </motion.div>
              )}
            </form>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {t("needHelp")}{" "}
              <Link href="/help" className="font-semibold text-primary underline underline-offset-2 hover:text-brand-2">
                {t("contactSupport")}
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function FromExamplePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <FromExampleContent />
    </Suspense>
  )
}
