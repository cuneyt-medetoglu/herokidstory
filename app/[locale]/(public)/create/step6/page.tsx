"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  User,
  ImageIcon,
  Sparkles,
  Palette,
  Lightbulb,
  ArrowLeft,
  ShoppingCart,
  CheckCircle,
  Star,
  BookOpen,
  Pencil,
  Gift,
  Loader2,
  Mail,
  Share2,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import Image from "next/image"
import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "@/i18n/navigation"
import { useWizardNavigate } from "@/hooks/use-wizard-navigate"
import { useTranslations, useLocale } from "next-intl"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CurrencyConfig } from "@/lib/currency"
import { useCurrency } from "@/contexts/CurrencyContext"
import { DebugQualityPanel } from "@/components/debug/DebugQualityPanel"
import { TraceViewerModal, type DebugTraceEntry } from "@/components/debug/TraceViewerModal"
import { Checkbox } from "@/components/ui/checkbox"
import { routing } from "@/i18n/routing"
import type { Locale } from "@/i18n/routing"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const DEFAULT_PAGE_COUNT = 12

const HAIR_VALUE_TO_STEP1_KEY: Record<string, string> = {
  "light-blonde": "lightBlonde",
  blonde: "blonde",
  "dark-blonde": "darkBlonde",
  black: "black",
  brown: "brown",
  red: "red",
  white: "white",
}

const EYE_COLOR_VALUES = ["blue", "green", "brown", "black", "hazel"] as const

const OPTION_VALUE_TO_LABEL_KEY: Record<string, string> = {
  Child: "child",
  Dog: "dog",
  Cat: "cat",
  Rabbit: "rabbit",
  Bird: "bird",
  "Other Pet": "otherPet",
  Mom: "mom",
  Dad: "dad",
  Grandma: "grandma",
  Grandpa: "grandpa",
  Sister: "sister",
  Brother: "brother",
  Uncle: "uncle",
  Aunt: "aunt",
  "Other Family": "otherFamily",
  "Teddy Bear": "teddyBear",
  Doll: "doll",
  "Action Figure": "actionFigure",
  Robot: "robot",
  Car: "car",
  Train: "train",
  Ball: "ball",
  Blocks: "blocks",
  Puzzle: "puzzle",
  "Stuffed Animal": "stuffedAnimal",
  "Other Toy": "otherToy",
}

/** /api/books ALLOWED_STORY_MODELS ile uyumlu (admin/debug seçici). */
type DebugStoryModel = 'gpt-4.1-mini' | 'gpt-4.1' | 'gpt-4o-mini' | 'gpt-4o' | 'o1-mini'

export default function Step6Page() {
  const t = useTranslations("create.step6")
  const t1 = useTranslations("create.step1")
  const t2 = useTranslations("create.step2")
  const tc = useTranslations("create.common")

  const timelineSteps = useMemo(
    () => [
      {
        id: 1,
        title: t("timeline.step1.title"),
        description: t("timeline.step1.description"),
        icon: BookOpen,
        gradient: "from-primary to-primary/80",
        shadowColor: "shadow-primary/50",
      },
      {
        id: 2,
        title: t("timeline.step2.title"),
        description: t("timeline.step2.description"),
        icon: Pencil,
        gradient: "from-brand-2 to-rose-500",
        shadowColor: "shadow-brand-2/50",
      },
      {
        id: 3,
        title: t("timeline.step3.title"),
        description: t("timeline.step3.description"),
        icon: Share2,
        gradient: "from-primary to-brand-2",
        shadowColor: "shadow-primary/50",
      },
    ],
    [t],
  )
  const router = useRouter()
  const { navigate, isPending: isNavPending } = useWizardNavigate()
  const locale = useLocale()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [wizardData, setWizardData] = useState<any>(null)

  // Example book language (admin block): defaults to current site locale if in list
  const [exampleBookLanguage, setExampleBookLanguage] = useState<Locale>(() =>
    routing.locales.includes(locale as Locale) ? (locale as Locale) : routing.locales[0]
  )

  // Auth and email state
  const { data: session, status } = useSession()
  const user = session?.user ?? null
  const isLoadingAuth = status === "loading"
  const [email, setEmail] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  
  // Free cover state
  const [hasFreeCover, setHasFreeCover] = useState(false)
  const [isCheckingFreeCover, setIsCheckingFreeCover] = useState(true)

  // Debug / skip payment: only from API (admin role in DB or DEBUG_SKIP_PAYMENT server env)
  const [canSkipPayment, setCanSkipPayment] = useState(false)

  // Debug quality buttons: only for admin + feature flag
  const [canShowDebugQuality, setCanShowDebugQuality] = useState(false)

  // Debug trace: collect full request/response for every step when creating book
  const [debugTraceRequested, setDebugTraceRequested] = useState(false)
  const [traceModalOpen, setTraceModalOpen] = useState(false)
  const [traceData, setTraceData] = useState<DebugTraceEntry[] | null>(null)

  /** Create without payment / örnek kitap / debug panel — body'de storyModel olarak gider. Ücretli satın alma bu alanı göndermez → API varsayılanı. */
  const [debugStoryModel, setDebugStoryModel] = useState<DebugStoryModel>('gpt-4.1-mini')

  // Currency from context (tek seferlik fetch)
  const { currencyConfig, isLoading: isLoadingCurrency } = useCurrency()

  // Hover state for timeline nodes
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [illustrationStyleImageError, setIllustrationStyleImageError] = useState(false)
  const [showStyleImageModal, setShowStyleImageModal] = useState(false)

  // Check free cover status: üyeli → API; üyesiz → 1 hak var varsayımı (API "zaten kullanıldı" dönebilir)
  useEffect(() => {
    const checkFreeCover = async () => {
      if (user) {
        try {
          const response = await fetch("/api/users/free-cover-status")
          const data = await response.json()
          setHasFreeCover(data.hasFreeCover)
        } catch (error) {
          console.error("Error checking free cover:", error)
          setHasFreeCover(false)
        }
      } else {
        setHasFreeCover(true) // Üyesiz: 1 ücretsiz kapak hakkı var (email+IP ile sınır; API reddedebilir)
      }
      setIsCheckingFreeCover(false)
    }

    if (!isLoadingAuth) {
      checkFreeCover()
    }
  }, [user, isLoadingAuth])

  // Can skip payment (debug or admin) – for "Create without payment" button
  useEffect(() => {
    if (!user) {
      setCanSkipPayment(false)
      return
    }
    const check = async () => {
      try {
        const res = await fetch("/api/debug/can-skip-payment")
        const data = await res.json()
        setCanSkipPayment(!!data.canSkipPayment)
      } catch {
        setCanSkipPayment(false)
      }
    }
    check()
  }, [user])

  // Can show debug quality buttons (admin + feature flag)
  useEffect(() => {
    if (!user) {
      setCanShowDebugQuality(false)
      return
    }
    const check = async () => {
      try {
        const res = await fetch("/api/debug/quality/can-show")
        const data = await res.json()
        setCanShowDebugQuality(!!data.canShow)
      } catch {
        setCanShowDebugQuality(false)
      }
    }
    check()
  }, [user])

  useEffect(() => {
    router.prefetch("/create/step5")
    router.prefetch("/cart")
    router.prefetch("/dashboard")
  }, [router])

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Load wizard data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("herokidstory_wizard")
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setWizardData(data)
      } catch (error) {
        console.error("Error parsing wizard data:", error)
      }
    }
  }, [])

  // Reset illustration style image error when selected style id changes (e.g. user edited step 4)
  const styleId = wizardData?.step4?.illustrationStyle?.id ?? (typeof wizardData?.step4?.illustrationStyle === "string" ? wizardData?.step4?.illustrationStyle : null)
  useEffect(() => {
    setIllustrationStyleImageError(false)
  }, [styleId])
  
  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (value && !validateEmail(value)) {
      setEmailError(t("invalidEmail"))
    } else {
      setEmailError("")
    }
  }

  // Get actual data from wizardData (localStorage)
  // NEW: Support both old characterPhoto and new characters array
  const getCharactersData = () => {
    if (wizardData?.step2?.characters && Array.isArray(wizardData.step2.characters)) {
      // New format: characters array
      // Filter out characters that don't have at least an id or characterType
      return wizardData.step2.characters.filter((char: any) => 
        char && (char.id || char.characterType || char.photo)
      )
    }
    if (wizardData?.step2?.characterPhoto) {
      // Old format: single characterPhoto (backward compatibility)
      return [
        {
          id: "1",
          characterType: { group: "Child", value: "Child", displayName: "Child" },
          photo: wizardData.step2.characterPhoto,
          characterId: localStorage.getItem("herokidstory_character_id") || null,
        },
      ]
    }
    return []
  }

  // Get character UUIDs for API: Step 2 stores real UUID in characterId, id can be local "1"
  const getCharacterIdsForApi = (chars: any[]): string[] => {
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return chars
      .map((c: any) => c.characterId || c.id)
      .filter((id: unknown): id is string => typeof id === "string" && uuidRe.test(id))
  }

  const charactersData = getCharactersData()

  const formData = {
      character: {
      name: wizardData?.step1?.name || "Child",
      age: wizardData?.step1?.age || 3,
      gender: wizardData?.step1?.gender || "Girl",
      hairColor: wizardData?.step1?.hairColor || "Brown",
      eyeColor: wizardData?.step1?.eyeColor || "Brown",
    },
    // NEW: Multiple characters support
    characters: charactersData,
    photo: {
      uploaded: charactersData.length > 0 && !!charactersData[0]?.photo,
      filename: charactersData[0]?.photo?.filename || "",
      size: charactersData[0]?.photo?.size || "",
      url: charactersData[0]?.photo?.url || "",
      analysis: wizardData?.step2?.characterAnalysis || {},
    },
    theme: wizardData?.step3?.theme
      ? {
          id: wizardData.step3.theme.id,
          name: wizardData.step3.theme.title || wizardData.step3.theme.name || "Adventure",
          description: wizardData.step3.theme.description || "Exciting adventures and explorations",
          icon: wizardData.step3.theme.icon || "🗺️",
          color: wizardData.step3.theme.gradientFrom || "from-blue-400 to-cyan-500",
        }
      : {
          id: "adventure",
          name: "Adventure",
          description: "Exciting adventures and explorations",
          icon: "🗺️",
          color: "from-blue-400 to-cyan-500",
        },
    ageGroup: wizardData?.step3?.ageGroup
      ? {
          name: wizardData.step3.ageGroup.title || wizardData.step3.ageGroup.name || "3-5 Years",
          description: wizardData.step3.ageGroup.description || "Picture books with simple stories",
          icon: wizardData.step3.ageGroup.icon || "📚",
          features: typeof wizardData.step3.ageGroup.features === 'string' 
            ? [wizardData.step3.ageGroup.features] 
            : wizardData.step3.ageGroup.features || ["10 pages", "Simple story", "Large illustrations"],
        }
      : {
          name: "3-5 Years",
          description: "Picture books with simple stories",
          icon: "📚",
          features: ["10 pages", "Simple story", "Large illustrations"],
        },
    language: wizardData?.step3?.language
      ? {
          id: wizardData.step3.language.id || "en",
          title: wizardData.step3.language.title || "English",
          nativeName: wizardData.step3.language.nativeName || "English",
        }
      : {
          id: "en",
          title: "English",
          nativeName: "English",
        },
    illustrationStyle: wizardData?.step4?.illustrationStyle
      ? {
          id: wizardData.step4.illustrationStyle.id ?? (typeof wizardData.step4.illustrationStyle === "string" ? wizardData.step4.illustrationStyle : undefined),
          name: wizardData.step4.illustrationStyle.title || wizardData.step4.illustrationStyle,
          description: wizardData.step4.illustrationStyle.description || "",
          color: wizardData.step4.illustrationStyle.gradientFrom || "from-blue-400",
        }
      : {
          id: "3d_animation",
          name: "3D Animation",
          description: "Modern 3D animated style",
          color: "from-primary",
        },
    customRequests: wizardData?.step5?.customRequests || "",
    pageCount: wizardData?.step5?.pageCount,
  }

  const isCustomTheme = formData.theme?.id === "custom"

  const optionLabel = useCallback(
    (value: string) => {
      const k = OPTION_VALUE_TO_LABEL_KEY[value]
      if (k) return t2(`optionLabels.${k}` as "optionLabels.child")
      return value
    },
    [t2],
  )

  const formatGenderDisplay = useCallback(
    (raw?: string | null) => {
      if (raw == null || raw === "") return t("unknown")
      const lower = String(raw).toLowerCase()
      if (lower === "boy" || lower === "girl") return t2(`gender.${lower}` as "gender.boy")
      return String(raw)
    },
    [t, t2],
  )

  const formatHairColor = useCallback(
    (raw?: string | null) => {
      if (raw == null || raw === "") return t("unknown")
      const normalized = String(raw).toLowerCase().replace(/\s+/g, "-")
      const sk = HAIR_VALUE_TO_STEP1_KEY[normalized]
      if (sk) return t1(`hairColors.${sk}` as "hairColors.lightBlonde")
      return String(raw)
    },
    [t, t1],
  )

  const formatEyeColor = useCallback(
    (raw?: string | null) => {
      if (raw == null || raw === "") return t("unknown")
      const normalized = String(raw).toLowerCase()
      if ((EYE_COLOR_VALUES as readonly string[]).includes(normalized))
        return t1(`eyeColors.${normalized}` as "eyeColors.blue")
      return String(raw)
    },
    [t, t1],
  )

  const groupLabel = useCallback(
    (group: string) => {
      const map: Record<string, "characterTypes.child" | "characterTypes.familyMembers" | "characterTypes.pets" | "characterTypes.toys" | "characterTypes.other"> = {
        Child: "characterTypes.child",
        "Family Members": "characterTypes.familyMembers",
        Pets: "characterTypes.pets",
        Toys: "characterTypes.toys",
        Other: "characterTypes.other",
      }
      return map[group] ? t2(map[group]) : group
    },
    [t2],
  )

  const displayCharacterName = useCallback(
    (name: string) => (OPTION_VALUE_TO_LABEL_KEY[name] ? optionLabel(name) : name),
    [optionLabel],
  )

  // Floating animations for decorative elements
  const floatingVariants = {
    animate: (i: number) => ({
      y: [0, -15, 0],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 3 + i * 0.5,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    }),
  }

  const decorativeElements = [
    { Icon: CheckCircle, top: "8%", left: "8%", delay: 0, size: "h-8 w-8", color: "text-green-400" },
    { Icon: Sparkles, top: "12%", right: "10%", delay: 0.5, size: "h-7 w-7", color: "text-primary" },
    { Icon: BookOpen, top: "50%", left: "5%", delay: 1, size: "h-7 w-7", color: "text-brand-2" },
    { Icon: Star, top: "75%", right: "8%", delay: 1.5, size: "h-8 w-8", color: "text-yellow-400" },
  ]

  // Handle free cover creation
  const handleCreateFreeCover = async () => {
    if (!user && (!email || !validateEmail(email))) {
      setEmailError(t("invalidEmail"))
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/books/create-free-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wizardData,
          email: user ? user.email : email,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create free cover")
      }

      toast({
        title: t("toasts.freeCoverCreated"),
        description: t("toasts.freeCoverCreatedDesc"),
      })

      navigate(`/draft-preview?draftId=${result.draftId}`)
    } catch (error) {
      console.error("Error creating free cover:", error)
      toast({
        title: t("toasts.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("toasts.freeCoverError"),
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Create book without payment: only when API says canSkipPayment (DB role=admin or server DEBUG_SKIP_PAYMENT).
  const showSkipPaymentButton = user && canSkipPayment

  // Create example book: only for admin (visible when canSkipPayment is true, i.e., admin or DEBUG)
  const showCreateExampleButton = user && canSkipPayment

  const handleCreateWithoutPayment = async () => {
    if (!wizardData || !user) return
    if (isCustomTheme && (!formData.customRequests || !String(formData.customRequests).trim())) {
      toast({
        title: t("toasts.storyRequired"),
        description: t("toasts.storyRequiredDesc"),
        variant: "destructive",
      })
      navigate("/create/step5")
      return
    }
    const chars = getCharactersData()
    const characterIds = getCharacterIdsForApi(chars)
    const singleId = characterIds.length === 1 ? characterIds[0] : null
    const fallbackId = typeof localStorage !== "undefined" ? localStorage.getItem("herokidstory_character_id") : null
    const themeKey =
      wizardData?.step3?.theme?.id ||
      (typeof wizardData?.step3?.theme === "string" ? wizardData.step3.theme : "") ||
      "adventure"
    const styleKey =
      wizardData?.step4?.illustrationStyle?.id ||
      (typeof wizardData?.step4?.illustrationStyle === "string" ? wizardData.step4.illustrationStyle : "") ||
      "watercolor"
    const language = (wizardData?.step3?.language?.id || formData.language?.id || "en") as "en" | "tr" | "de" | "fr" | "es" | "zh" | "pt" | "ru"
    const pageCount = typeof formData.pageCount === "number" && Number.isFinite(formData.pageCount) && formData.pageCount > 0
      ? formData.pageCount
      : DEFAULT_PAGE_COUNT
    const payload = {
      ...(characterIds.length > 0 ? { characterIds } : singleId || fallbackId ? { characterId: singleId || fallbackId } : {}),
      theme: themeKey,
      illustrationStyle: styleKey,
      customRequests: formData.customRequests || "",
      pageCount,
      language,
      skipPayment: true,
      ...(canShowDebugQuality && debugTraceRequested && { debugTrace: true }),
      storyModel: debugStoryModel,
    }
    if (!(payload as { characterIds?: string[]; characterId?: string | null }).characterIds?.length && !(payload as any).characterId) {
      toast({
        title: t("toasts.charactersRequired"),
        description: t("toasts.charactersRequiredDesc"),
        variant: "destructive",
      })
      return
    }
    let willNavigate = false
    setIsCreating(true)
    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || result.message || "Create book failed")
      }
      const bookId = result.data?.id ?? result.data?.bookId ?? result.id
      if (result.data?.debugTrace?.length) {
        setTraceData(result.data.debugTrace)
        setTraceModalOpen(true)
        toast({
          title: t("toasts.bookCreatedDebugTitle"),
          description: t("toasts.bookCreatedDebugDesc"),
        })
      } else if (bookId) {
        willNavigate = true
        navigate(`/create/generating/${bookId}`)
      } else {
        willNavigate = true
        toast({
          title: t("toasts.bookStarted"),
          description: t("toasts.bookStartedDesc"),
        })
        navigate("/dashboard")
      }
    } catch (error) {
      console.error("Create without payment error:", error)
      toast({
        title: t("toasts.errorTitle"),
        description: error instanceof Error ? error.message : t("toasts.createError"),
        variant: "destructive",
      })
    } finally {
      // Navigation başlandıysa overlay'i kapat­ma — component unmount olunca kaybolur.
      // Kapatmak step6'nın kısa süre flash görünmesine neden olur.
      if (!willNavigate) setIsCreating(false)
    }
  }

  // Create example book: admin creates a book and marks it as is_example = true (public, viewable by everyone)
  const handleCreateExampleBook = async () => {
    if (!wizardData || !user) return
    if (isCustomTheme && (!formData.customRequests || !String(formData.customRequests).trim())) {
      toast({
        title: t("toasts.storyRequired"),
        description: t("toasts.storyRequiredDesc"),
        variant: "destructive",
      })
      navigate("/create/step5")
      return
    }

    const chars = getCharactersData()
    const characterIds = getCharacterIdsForApi(chars)
    const singleId = characterIds.length === 1 ? characterIds[0] : null
    const fallbackId = typeof localStorage !== "undefined" ? localStorage.getItem("herokidstory_character_id") : null

    const themeKey =
      wizardData?.step3?.theme?.id ||
      (typeof wizardData?.step3?.theme === "string" ? wizardData.step3.theme : "") ||
      "adventure"
    const styleKey =
      wizardData?.step4?.illustrationStyle?.id ||
      (typeof wizardData?.step4?.illustrationStyle === "string" ? wizardData.step4.illustrationStyle : "") ||
      "watercolor"
    const language = exampleBookLanguage

    const examplePageCount = typeof formData.pageCount === "number" && Number.isFinite(formData.pageCount) && formData.pageCount > 0
      ? formData.pageCount
      : DEFAULT_PAGE_COUNT
    const payload = {
      ...(characterIds.length > 0 ? { characterIds } : singleId || fallbackId ? { characterId: singleId || fallbackId } : {}),
      theme: themeKey,
      illustrationStyle: styleKey,
      customRequests: formData.customRequests || "",
      pageCount: examplePageCount,
      language,
      isExample: true,
      skipPayment: true,
      storyModel: debugStoryModel,
    }

    if (!(payload as { characterIds?: string[]; characterId?: string | null }).characterIds?.length && !(payload as any).characterId) {
      toast({
        title: t("toasts.charactersRequired"),
        description: t("toasts.charactersRequiredDesc"),
        variant: "destructive",
      })
      return
    }

    let willNavigate = false
    setIsCreating(true)
    try {
      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create example book")
      }

      const bookId = result.data?.id ?? result.data?.bookId ?? result.id
      toast({
        title: t("toasts.exampleCreated"),
        description: t("toasts.exampleCreatedDesc"),
      })

      willNavigate = true
      if (bookId) {
        navigate(`/create/generating/${bookId}`)
      } else {
        navigate(`/dashboard`)
      }
    } catch (error) {
      console.error("Error creating example book:", error)
      toast({
        title: t("toasts.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("toasts.exampleCreateError"),
        variant: "destructive",
      })
    } finally {
      if (!willNavigate) setIsCreating(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-white to-brand-2/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Decorative floating elements - hidden on mobile */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {decorativeElements.map((element, index) => {
          const Icon = element.Icon
          return (
            <motion.div
              key={index}
              custom={index}
              variants={floatingVariants}
              animate="animate"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 0.4, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: element.delay, duration: 0.5 }}
              className="absolute"
              style={{
                top: element.top,
                left: element.left,
                right: element.right,
              }}
            >
              <Icon className={`${element.size} ${element.color} drop-shadow-lg`} />
            </motion.div>
          )
        })}
      </div>

      <div className="container relative mx-auto px-4 py-8 md:py-12">
        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
              <span>{t("stepProgress")}</span>
              <span>{t("stepTitle")}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-brand-2"
              />
            </div>
          </div>
        </motion.div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          <div className="rounded-2xl bg-white/80 p-6 shadow-2xl backdrop-blur-sm dark:bg-slate-800/80 md:p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mb-8 text-center"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">{t("title")}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{t("subtitle")}</p>
              {/* Free Cover Badge */}
              {!isCheckingFreeCover && hasFreeCover && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg"
                >
                  <Gift className="h-4 w-4" />
                  <span>{t("freeCoverBadge")}</span>
                </motion.div>
              )}
            </motion.div>

            {/* Summary Sections */}
            <div className="space-y-6">
              {/* 1. Character Information Summary (Multi-Character) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow transition-all hover:scale-[1.01] hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
                        {t("characterInfoTitle", { count: formData.characters.length })}
                      </h2>
                    </div>
                    <Link
                      href="/create/step1"
                      className="text-sm font-medium text-primary underline underline-offset-2 opacity-0 transition-opacity hover:text-primary/80 group-hover:opacity-100"
                    >
                      <Pencil className="mr-1 inline h-3 w-3" />
                      {tc("edit")}
                    </Link>
                  </div>

                  {/* Characters List */}
                  <div className="space-y-4">
                    {formData.characters.map((char: any, index: number) => {
                      const isMainCharacter = index === 0 || char.characterType?.group === "Child"
                      // NEW: For Child characters, use name from char.name (from Step 2) or Step 1
                      // For other characters, use char.name or displayName
                      let characterName: string
                      if (char.characterType?.group === "Child") {
                        characterName = char.name || formData.character.name || "Child"
                      } else {
                        characterName = char.name || char.characterType?.displayName || "Child"
                      }
                      const characterType = char.characterType?.group || "Child"
                      const headingName = displayCharacterName(characterName)

                      return (
                        <div
                          key={char.id || index}
                          className={`rounded-lg border-2 p-4 ${
                            isMainCharacter
                              ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20"
                              : characterType === "Pets"
                              ? "border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-900/20"
                              : characterType === "Family Members"
                              ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-900/20"
                              : "border-primary/30 bg-primary/5 dark:border-primary/30 dark:bg-primary/5"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Character Photo */}
                            {char.photo?.url && (
                              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
                                <Image
                                  src={char.photo.url}
                                  alt={`${characterName} photo`}
                                  fill
                                  sizes="80px"
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            )}

                            {/* Character Info */}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-900 dark:text-slate-50">
                                  {isMainCharacter ? "🔵 " : characterType === "Pets" ? "🟢 " : characterType === "Family Members" ? "🟡 " : "🟣 "}
                                  {t("characterHeading", { n: index + 1, name: headingName })}
                                </span>
                                {isMainCharacter && (
                                  <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
                                    {t("mainBadge")}
                                  </span>
                                )}
                              </div>

                              {/* Main character (Child) - Show all details */}
                              {isMainCharacter && char.characterType?.group === "Child" ? (
                                <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                  <p>
                                    <span className="font-semibold">{t("labels.age")}</span>{" "}
                                    {t("yearsOld", {
                                      count: Number(char.age ?? formData.character.age) || 0,
                                    })}
                                  </p>
                                  <p>
                                    <span className="font-semibold">{t("labels.gender")}</span>{" "}
                                    {formatGenderDisplay(String(char.gender ?? formData.character.gender ?? ""))}
                                  </p>
                                  <p>
                                    <span className="font-semibold">{t("labels.hairColor")}</span>{" "}
                                    {formatHairColor(String(char.hairColor ?? formData.character.hairColor ?? ""))}
                                  </p>
                                  <p>
                                    <span className="font-semibold">{t("labels.eyeColor")}</span>{" "}
                                    {formatEyeColor(String(char.eyeColor ?? formData.character.eyeColor ?? ""))}
                                  </p>
                                </div>
                              ) : (
                                // Additional characters - Show type and appearance details
                                <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-slate-300">
                                  <p>
                                    <span className="font-semibold">{t("labels.type")}</span>{" "}
                                    {char.characterType?.value
                                      ? optionLabel(char.characterType.value)
                                      : t("unknown")}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
                                    {groupLabel(char.characterType?.group || "Other")}
                                  </p>
                                  
                                  {/* Appearance Details for Non-Child Characters */}
                                  {char.hairColor && (
                                    <p>
                                      <span className="font-semibold">
                                        {char.characterType?.group === "Pets" ? t("furColorLabel") : t("labels.hairColor")}
                                      </span>{" "}
                                      {formatHairColor(String(char.hairColor))}
                                    </p>
                                  )}
                                  {char.eyeColor && (
                                    <p>
                                      <span className="font-semibold">{t("labels.eyeColor")}</span>{" "}
                                      {formatEyeColor(String(char.eyeColor))}
                                    </p>
                                  )}
                                  {char.age && (
                                    <p>
                                      <span className="font-semibold">{t("labels.age")}</span>{" "}
                                      {t("yearsOld", { count: Number(char.age) })}
                                    </p>
                                  )}
                                  {char.gender && (
                                    <p>
                                      <span className="font-semibold">{t("labels.gender")}</span>{" "}
                                      {formatGenderDisplay(String(char.gender))}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Empty state */}
                    {formData.characters.length === 0 && (
                      <p className="italic text-gray-500 dark:text-slate-500">{t("noCharacters")}</p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* 2. Character Photos (Multi-Character Support) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow transition-all hover:scale-[1.01] hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
                        {t("characterPhotosTitle", { count: formData.characters.length })}
                      </h2>
                    </div>
                    <Link
                      href="/create/step2"
                      className="text-sm font-medium text-primary underline underline-offset-2 opacity-0 transition-opacity hover:text-primary/80 group-hover:opacity-100"
                    >
                      <Pencil className="mr-1 inline h-3 w-3" />
                      {tc("edit")}
                    </Link>
                  </div>

                  {formData.characters.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {formData.characters.map((char: any, index: number) => {
                        const rawName = char.name || char.characterType?.displayName || "Child"
                        const characterName = displayCharacterName(rawName)
                        const isMainCharacter = index === 0 || char.characterType?.group === "Child"

                        return (
                          <div key={char.id || index} className="flex flex-col items-center">
                            <div className="relative h-48 w-full overflow-hidden rounded-lg shadow-lg">
                              {char.photo?.url ? (
                                <Image
                                  src={char.photo.url}
                                  alt={`${characterName} photo`}
                                  fill
                                  sizes="(max-width: 768px) 100vw, 192px"
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-slate-700">
                                  <ImageIcon className="h-12 w-12 text-gray-400 dark:text-slate-500" />
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-center">
                              <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                                {characterName}
                                {isMainCharacter && <span className="ml-1 text-xs text-blue-500">{t("mainTag")}</span>}
                              </p>
                              {char.photo?.filename && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                                  {char.photo.filename}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="italic text-gray-500 dark:text-slate-500">{t("noPhotos")}</p>
                  )}
                </div>
              </motion.div>

              {/* 3. Theme, Age Group & Language Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow transition-all hover:scale-[1.01] hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">{t("themeAgeLanguageTitle")}</h2>
                    </div>
                    <Link
                      href="/create/step3"
                      className="text-sm font-medium text-primary underline underline-offset-2 opacity-0 transition-opacity hover:text-primary/80 group-hover:opacity-100"
                    >
                      <Pencil className="mr-1 inline h-3 w-3" />
                      {tc("edit")}
                    </Link>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Theme */}
                    <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                      <div className="text-3xl">{formData.theme.icon}</div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-slate-50">
                          {formData.theme.name}
                          {isCustomTheme && (
                            <span className="ml-2 rounded bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200">
                              {t("customThemeBadge")}
                            </span>
                          )}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{formData.theme.description}</p>
                      </div>
                    </div>

                    {/* Age Group */}
                    <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                      <div className="text-3xl">{formData.ageGroup.icon}</div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-slate-50">{formData.ageGroup.name}</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                          {formData.ageGroup.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {formData.ageGroup.features.map((feature: string, index: number) => (
                            <span
                              key={index}
                              className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Language */}
                    <div className="flex gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                      <div className="text-3xl">🌐</div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-slate-50">{formData.language.title}</h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                          {formData.language.nativeName}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 4. Illustration Style Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow transition-all hover:scale-[1.01] hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">{t("illustrationStyleTitle")}</h2>
                    </div>
                    <Link
                      href="/create/step4"
                      className="text-sm font-medium text-primary underline underline-offset-2 opacity-0 transition-opacity hover:text-primary/80 group-hover:opacity-100"
                    >
                      <Pencil className="mr-1 inline h-3 w-3" />
                      {tc("edit")}
                    </Link>
                  </div>

                  <div className="flex items-center gap-4">
                    {formData.illustrationStyle.id && !illustrationStyleImageError ? (
                      <button
                        type="button"
                        onClick={() => setShowStyleImageModal(true)}
                        className="relative h-32 w-24 flex-shrink-0 overflow-hidden rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:opacity-90 transition-opacity"
                        aria-label={t("viewStyleExample", { name: formData.illustrationStyle.name })}
                      >
                        <Image
                          src={`/illustration-styles/${formData.illustrationStyle.id}.jpg`}
                          alt={`${formData.illustrationStyle.name} style example`}
                          fill
                          sizes="96px"
                          className="object-cover"
                          onError={() => setIllustrationStyleImageError(true)}
                        />
                      </button>
                    ) : (
                      <div
                        className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${formData.illustrationStyle.color} shadow-lg`}
                      >
                        <Palette className="h-10 w-10 text-white" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-slate-50">{formData.illustrationStyle.name}</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                        {formData.illustrationStyle.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 5. Custom Requests & Page Count Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
              >
                <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow transition-all hover:scale-[1.01] hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-6 w-6 text-primary" />
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
                        {t("customRequestsTitle")}
                        {isCustomTheme ? t("customRequestsRequiredSuffix") : ""}
                      </h2>
                    </div>
                    <Link
                      href="/create/step5"
                      className="text-sm font-medium text-primary underline underline-offset-2 opacity-0 transition-opacity hover:text-primary/80 group-hover:opacity-100"
                    >
                      <Pencil className="mr-1 inline h-3 w-3" />
                      {tc("edit")}
                    </Link>
                  </div>

                  {formData.customRequests ? (
                    <>
                      {isCustomTheme && (
                        <p className="mb-2 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-300">
                          {t("customStoryLead")}
                        </p>
                      )}
                      <p className="text-base leading-relaxed text-gray-700 dark:text-slate-300">
                        {formData.customRequests}
                      </p>
                    </>
                  ) : (
                    <p className="italic text-sm text-gray-500 dark:text-slate-500">
                      {isCustomTheme ? t("noCustomTheme") : t("noCustomEmpty")}
                    </p>
                  )}

                  {/* Page Count Display */}
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 p-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                      {t("pageCountLabel")}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {typeof formData.pageCount === 'number' && Number.isFinite(formData.pageCount) && formData.pageCount > 0
                        ? t("pagesFormatted", { count: formData.pageCount })
                        : formData.pageCount === 0
                        ? t("coverOnly")
                        : t("pagesDefault", { count: DEFAULT_PAGE_COUNT })}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Interactive Timeline Section - "What Happens Next" */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              className="mt-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-brand-2/5 p-6 dark:border-slate-700/50 dark:from-slate-800/30 dark:to-slate-900/30 md:p-8"
            >
              {/* Timeline Title */}
              <h2 className="mb-6 text-center text-lg font-bold text-gray-900 dark:text-white md:mb-8 md:text-xl">
                <span className="bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-transparent">
                  {t("whatHappensNext")}
                </span>
              </h2>

              {/* Timeline Flow - Desktop: Horizontal, Mobile: Vertical */}
              <div className="relative">
                {/* Connecting Line - Desktop */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1, delay: 0.9, ease: "easeInOut" }}
                  className="absolute left-[calc(16.666%-0.5rem)] top-10 hidden h-1 w-[calc(66.666%+1rem)] origin-left bg-gradient-to-r from-primary via-brand-2 to-primary md:block"
                  style={{ transformOrigin: "left center" }}
                />

                {/* Mobile vertical line - sol sütun merkezinden geçer; 3. node’ın altında bitiyor (bottom-24), 3. adımdan sonra devam etmiyor */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 1, delay: 0.9, ease: "easeInOut" }}
                  className="absolute left-[2.375rem] top-8 bottom-[5.5rem] w-1 origin-top bg-gradient-to-b from-primary via-brand-2 to-primary md:hidden"
                />

                {/* Timeline Steps - Mobil: CSS Grid 3 eşit satır (metin uzunluğundan bağımsız); md: flex yatay */}
                <div className="relative grid min-h-[420px] grid-cols-1 grid-rows-3 gap-8 md:min-h-0 md:flex md:flex-row md:justify-between md:gap-12">
                  {timelineSteps.map((step, index) => {
                    const Icon = step.icon
                    const isHovered = hoveredStep === step.id

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: 0.2 * index + 1,
                          ease: "easeOut",
                        }}
                        className="relative flex min-h-0 flex-1 flex-row items-start gap-4 md:flex-col md:items-center md:gap-0"
                        onMouseEnter={() => setHoveredStep(step.id)}
                        onMouseLeave={() => setHoveredStep(null)}
                      >
                        {/* Sol sütun (mobil): node; desktop: md:contents ile sadece node */}
                        <div className="w-20 flex-shrink-0 flex justify-center md:contents">
                          {/* Node Circle - hover: büyüme+gölge korunuyor */}
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} shadow-lg transition-all duration-300 md:h-20 md:w-20 ${
                              isHovered ? `shadow-xl ${step.shadowColor}` : ""
                            }`}
                          >
                            <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-primary shadow-md dark:bg-slate-800">
                              {step.id}
                            </div>
                            <motion.div
                              initial={{ rotate: -180 }}
                              animate={{ rotate: 0 }}
                              transition={{
                                duration: 0.5,
                                delay: 0.2 * index + 1.1,
                              }}
                            >
                              <Icon className="h-8 w-8 text-white md:h-10 md:w-10" />
                            </motion.div>
                          </motion.div>
                        </div>

                        {/* Sağ sütun (mobil) / alt (desktop): başlık + açıklama; metinde arka plan/gölge yok */}
                        <div className="flex flex-1 min-w-0 flex-col md:flex-initial">
                          <h3 className="mt-0 text-left text-sm font-semibold text-gray-900 dark:text-white md:mt-4 md:text-center md:text-base">
                            {step.title}
                          </h3>
                          {/* Açıklama her zaman görünür; AnimatePresence kaldırıldı */}
                          <p className="mt-3 max-w-none text-left text-xs text-gray-600 dark:text-slate-400 md:max-w-xs md:text-center md:text-sm">
                            {step.description}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Email Input (if not authenticated) */}
            {!isLoadingAuth && !user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className="mt-6 rounded-xl border-2 border-primary/20 bg-primary/5 p-6 dark:border-primary/20 dark:bg-primary/5"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <Label htmlFor="email" className="text-base font-semibold text-gray-900 dark:text-slate-50">
                    {t("emailLabel")}
                  </Label>
                </div>
                <p className="mb-3 text-sm text-gray-600 dark:text-slate-400">
                  {t("emailHint")}
                </p>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full ${emailError ? "border-red-500" : ""}`}
                />
                {emailError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailError}</p>
                )}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3, duration: 0.4 }}
              className="mt-8 space-y-3"
            >
              {/* Free Cover Button (if available) */}
              {!isCheckingFreeCover && hasFreeCover && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.35, duration: 0.4 }}
                  className="w-full"
                >
                  <Button
                    type="button"
                    onClick={handleCreateFreeCover}
                    loading={isCreating}
                    disabled={isCreating || (!user && (!email || !validateEmail(email)))}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-6 text-base font-bold text-white shadow-lg transition-all hover:shadow-2xl dark:from-green-400 dark:to-emerald-400"
                  >
                    {!isCreating && <Gift className="mr-2 h-5 w-5" />}
                    <span>{isCreating ? tc("pleaseWait") : t("createButton")}</span>
                  </Button>
                  <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">
                    {t("freeCoverCreditHint")}
                  </p>
                </motion.div>
              )}

              {/* Pay & Create My Book Button - only for authenticated users */}
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.4 }}
                  className="w-full"
                >
                  <Button
                    type="button"
                    loading={isLoadingCurrency || isNavPending}
                    disabled={isCreating || isLoadingCurrency || isNavPending}
                    onClick={() => navigate(`/cart?plan=ebook`)}
                    className="w-full bg-gradient-to-r from-primary to-brand-2 px-8 py-8 text-lg font-bold text-white shadow-lg transition-all hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!isLoadingCurrency && !isNavPending && (
                      <ShoppingCart className="mr-2 h-6 w-6" />
                    )}
                    <span>
                      {isLoadingCurrency || isNavPending
                        ? tc("navigating")
                        : t("payCreate", { price: currencyConfig.price })}
                    </span>
                  </Button>
                  <p className="mt-2 text-center text-xs text-gray-600 dark:text-slate-400">
                    {t("hardcoverDiscount", { price: currencyConfig.price })}
                  </p>
                </motion.div>
              )}

              {/* Create without payment (Debug / Admin only) */}
              {showSkipPaymentButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.35, duration: 0.4 }}
                  className="w-full space-y-2"
                >
                  {/* Story model selector — shared for Create without payment, Example book, and Sadece Hikaye test */}
                  <div className="flex items-center gap-2 rounded-md border border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/20 dark:border-amber-500/30 px-3 py-2">
                    <span className="text-xs font-medium text-amber-800 dark:text-amber-200 shrink-0">{t("debug.storyModel")}</span>
                    <select
                      value={debugStoryModel}
                      onChange={(e) => setDebugStoryModel(e.target.value as DebugStoryModel)}
                      className="flex-1 rounded border border-amber-300/60 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-amber-900 dark:text-amber-100 focus:outline-none"
                    >
                      <option value="gpt-4.1-mini">{t("debug.modelGpt41Mini")}</option>
                      <option value="gpt-4.1">{t("debug.modelGpt41")}</option>
                      <option value="gpt-4o-mini">{t("debug.modelGpt4oMini")}</option>
                      <option value="gpt-4o">{t("debug.modelGpt4o")}</option>
                      <option value="o1-mini">{t("debug.modelO1Mini")}</option>
                    </select>
                  </div>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80 -mt-1">
                    {t("debug.modelHint")}
                  </p>
                  {canShowDebugQuality && (
                    <label className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200 cursor-pointer">
                      <Checkbox
                        checked={debugTraceRequested}
                        onCheckedChange={(v) => setDebugTraceRequested(!!v)}
                      />
                      <span>{t("debug.traceCheckbox")}</span>
                    </label>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    loading={isCreating}
                    disabled={isCreating || !wizardData}
                    onClick={handleCreateWithoutPayment}
                    className="w-full border-amber-500/50 text-amber-700 dark:text-amber-400 dark:border-amber-400/50"
                  >
                    <span>
                      {isCreating
                        ? tc("pleaseWait")
                        : t("debug.createWithoutPayment", { model: debugStoryModel })}
                    </span>
                  </Button>
                  <p className="mt-1 text-center text-xs text-amber-600/80 dark:text-amber-400/80">
                    {t("debug.adminOnly")}
                  </p>
                </motion.div>
              )}

              {/* Create example book (Admin only) */}
              {showCreateExampleButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4, duration: 0.4 }}
                  className="w-full space-y-2"
                >
                  <label className="block text-sm font-medium text-muted-foreground">
                    {t("exampleBookLanguage")}
                  </label>
                  <select
                    value={exampleBookLanguage}
                    onChange={(e) => setExampleBookLanguage(e.target.value as Locale)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {routing.locales.map((loc) => (
                      <option key={loc} value={loc}>
                        {t(`localeLabel.${loc}`)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    loading={isCreating}
                    disabled={isCreating || !wizardData}
                    onClick={handleCreateExampleBook}
                    className="w-full border-green-500/50 text-green-700 dark:text-green-400 dark:border-green-400/50"
                  >
                    {!isCreating && <BookOpen className="mr-2 h-4 w-4" />}
                    <span>
                      {isCreating
                        ? tc("pleaseWait")
                        : t("debug.createExampleBook", { model: debugStoryModel })}
                    </span>
                  </Button>
                  <p className="mt-1 text-center text-xs text-green-600/80 dark:text-green-400/80">
                    {t("debug.exampleBookAdminHint")}
                  </p>
                </motion.div>
              )}

              {/* Debug Quality Panel (Admin only) */}
              {canShowDebugQuality && wizardData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.45, duration: 0.4 }}
                  className="w-full"
                >
                  <DebugQualityPanel
                    wizardData={wizardData}
                    characterIds={getCharacterIdsForApi(getCharactersData())}
                    canShow={canShowDebugQuality}
                    storyModel={debugStoryModel}
                  />
                </motion.div>
              )}

              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.45 }}
              >
                <Link href="/create/step5">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full rounded-xl text-sm md:text-base"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {tc("back")}
                  </Button>
                </Link>
              </motion.div>

            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.55 }}
              className="mt-6 text-center text-xs text-gray-600 dark:text-slate-400"
            >
              <p>{t("trustBadges")}</p>
            </motion.div>
          </div>

        </motion.div>
      </div>

      {/* Trace viewer modal (after create with debugTrace) */}
      {traceData && (
        <TraceViewerModal
          open={traceModalOpen}
          onOpenChange={(open) => {
            setTraceModalOpen(open)
            if (!open) navigate("/dashboard")
          }}
          trace={traceData}
        />
      )}

      {/* Illustration Style image enlarge modal */}
      <Dialog open={showStyleImageModal} onOpenChange={setShowStyleImageModal}>
        <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{formData.illustrationStyle.name}</DialogTitle>
          </DialogHeader>
          {formData.illustrationStyle.id && (
            <div className="relative aspect-[2/3] w-full max-h-[80vh] bg-muted">
              <Image
                src={`/illustration-styles/${formData.illustrationStyle.id}.jpg`}
                alt={`${formData.illustrationStyle.name} style example`}
                fill
                sizes="(max-width: 672px) 100vw, 672px"
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isCreating && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          role="alertdialog"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="max-w-md rounded-2xl border bg-card p-8 shadow-xl text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground">
              {t("starting.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("starting.hint")}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
