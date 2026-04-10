"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Mountain,
  Sparkles,
  BookOpen,
  Trees,
  Rocket,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Star,
  Heart,
  Globe,
  Wand2,
  Box,
  Hexagon,
  Palette,
  Grid3x3,
  Layers,
  Circle,
  Zap,
  StickyNote,
  Lightbulb,
  ChevronDown,
} from "lucide-react"
import { Link, useRouter } from "@/i18n/navigation"
import { useState, useEffect, useMemo } from "react"
import { useWizardNavigate } from "@/hooks/use-wizard-navigate"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  persistWizardData,
  readWizardFormMirror,
  readWizardLocal,
} from "@/lib/herokid-wizard-storage"
import {
  PAGE_COUNT_MAX,
  resolvePageCount,
} from "@/lib/constants/book-config"

const STORY_IDEA_MAX_LENGTH = 1000

type ThemeId = "adventure" | "fairy_tale" | "educational" | "nature" | "sports" | "custom"
type LanguageId = "en" | "tr" | "de" | "fr" | "es" | "zh" | "pt" | "ru"
type IllustrationStyleId =
  | "3d_animation"
  | "comic_book"
  | "geometric"
  | "kawaii"
  | "watercolor"
  | "clay_animation"
  | "collage"
  | "block_world"
  | "sticker_art"

function getFormSchema(
  isCustomTheme: boolean,
  messages: { minLength: string; maxLength: string }
) {
  return z.object({
    theme: z.enum(["adventure", "fairy_tale", "educational", "nature", "sports", "custom"], { message: "Please select a theme" }),
    language: z.enum(["en", "tr", "de", "fr", "es", "zh", "pt", "ru"], { message: "Please select a language" }),
    illustrationStyle: z.enum(
      ["3d_animation", "comic_book", "geometric", "kawaii", "watercolor", "clay_animation", "collage", "block_world", "sticker_art"],
      { message: "Please select an illustration style" },
    ),
    customRequests: isCustomTheme
      ? z.string().min(10, messages.minLength).max(STORY_IDEA_MAX_LENGTH, messages.maxLength)
      : z.string().max(STORY_IDEA_MAX_LENGTH, messages.maxLength).optional().or(z.literal("")),
    pageCount: z.preprocess(
      (val) => (val === "" || val === undefined || Number.isNaN(val) ? undefined : Number(val)),
      z.number().min(0).max(PAGE_COUNT_MAX).optional()
    ),
  })
}

type FormData = z.infer<ReturnType<typeof getFormSchema>>

type Theme = {
  id: ThemeId
  Icon: typeof Mountain
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
}

type Language = {
  id: LanguageId
  Icon: typeof Globe
  title: string
  nativeName: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
}

type IllustrationStyle = {
  id: IllustrationStyleId
  Icon: typeof Box
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
  iconBgColor: string
}

const themes: Theme[] = [
  { id: "adventure", Icon: Mountain, title: "adventure", description: "adventure", gradientFrom: "from-orange-500", gradientTo: "to-amber-500", borderColor: "border-orange-500" },
  { id: "fairy_tale", Icon: Sparkles, title: "fairyTale", description: "fairyTale", gradientFrom: "from-primary", gradientTo: "to-brand-2", borderColor: "border-primary" },
  { id: "educational", Icon: Rocket, title: "learning", description: "learning", gradientFrom: "from-blue-500", gradientTo: "to-cyan-500", borderColor: "border-blue-500" },
  { id: "nature", Icon: Trees, title: "nature", description: "nature", gradientFrom: "from-green-500", gradientTo: "to-emerald-500", borderColor: "border-green-500" },
  { id: "sports", Icon: Trophy, title: "sports", description: "sports", gradientFrom: "from-red-500", gradientTo: "to-rose-500", borderColor: "border-red-500" },
  { id: "custom", Icon: Wand2, title: "custom", description: "custom", gradientFrom: "from-fuchsia-500", gradientTo: "to-violet-500", borderColor: "border-fuchsia-500" },
]

const languages: Language[] = [
  { id: "en", Icon: Globe, title: "English", nativeName: "English", gradientFrom: "from-blue-500", gradientTo: "to-indigo-500", borderColor: "border-blue-500" },
  { id: "tr", Icon: Globe, title: "Türkçe", nativeName: "Türkçe", gradientFrom: "from-red-500", gradientTo: "to-rose-500", borderColor: "border-red-500" },
  { id: "de", Icon: Globe, title: "Deutsch", nativeName: "Deutsch", gradientFrom: "from-yellow-500", gradientTo: "to-amber-500", borderColor: "border-yellow-500" },
  { id: "fr", Icon: Globe, title: "Français", nativeName: "Français", gradientFrom: "from-blue-500", gradientTo: "to-cyan-500", borderColor: "border-blue-500" },
  { id: "es", Icon: Globe, title: "Español", nativeName: "Español", gradientFrom: "from-orange-500", gradientTo: "to-red-500", borderColor: "border-orange-500" },
  { id: "zh", Icon: Globe, title: "中文", nativeName: "中文 (Mandarin)", gradientFrom: "from-red-500", gradientTo: "to-yellow-500", borderColor: "border-red-500" },
  { id: "pt", Icon: Globe, title: "Português", nativeName: "Português", gradientFrom: "from-green-500", gradientTo: "to-emerald-500", borderColor: "border-green-500" },
  { id: "ru", Icon: Globe, title: "Русский", nativeName: "Русский", gradientFrom: "from-blue-500", gradientTo: "to-slate-500", borderColor: "border-blue-500" },
]

const illustrationStyles: IllustrationStyle[] = [
  { id: "3d_animation", Icon: Box, title: "3d_animation", description: "3d_animation", gradientFrom: "from-orange-500", gradientTo: "to-amber-500", borderColor: "border-orange-500", iconBgColor: "bg-gradient-to-br from-orange-500 to-amber-500" },
  { id: "comic_book", Icon: Zap, title: "comic", description: "comic", gradientFrom: "from-red-600", gradientTo: "to-orange-600", borderColor: "border-red-600", iconBgColor: "bg-gradient-to-br from-red-600 to-orange-600" },
  { id: "geometric", Icon: Hexagon, title: "geometric", description: "geometric", gradientFrom: "from-blue-500", gradientTo: "to-cyan-500", borderColor: "border-blue-500", iconBgColor: "bg-gradient-to-br from-blue-500 to-cyan-500" },
  { id: "kawaii", Icon: Heart, title: "kawaii", description: "kawaii", gradientFrom: "from-brand-2", gradientTo: "to-rose-400", borderColor: "border-brand-2", iconBgColor: "bg-gradient-to-br from-brand-2 to-rose-400" },
  { id: "watercolor", Icon: Palette, title: "watercolor", description: "watercolor", gradientFrom: "from-primary", gradientTo: "to-brand-2", borderColor: "border-primary", iconBgColor: "bg-gradient-to-br from-primary to-brand-2" },
  { id: "clay_animation", Icon: Circle, title: "clay", description: "clay", gradientFrom: "from-amber-600", gradientTo: "to-orange-600", borderColor: "border-amber-600", iconBgColor: "bg-gradient-to-br from-amber-600 to-orange-600" },
  { id: "collage", Icon: Layers, title: "collage", description: "collage", gradientFrom: "from-indigo-500", gradientTo: "to-violet-500", borderColor: "border-indigo-500", iconBgColor: "bg-gradient-to-br from-indigo-500 to-violet-500" },
  { id: "block_world", Icon: Grid3x3, title: "block_world", description: "block_world", gradientFrom: "from-green-500", gradientTo: "to-emerald-500", borderColor: "border-green-500", iconBgColor: "bg-gradient-to-br from-green-500 to-emerald-500" },
  { id: "sticker_art", Icon: StickyNote, title: "sticker", description: "sticker", gradientFrom: "from-cyan-500", gradientTo: "to-blue-500", borderColor: "border-cyan-500", iconBgColor: "bg-gradient-to-br from-cyan-500 to-blue-500" },
]

export default function Step3Page() {
  const t3 = useTranslations("create.step3")
  const t4 = useTranslations("create.step4")
  const t5 = useTranslations("create.step5")
  const tc = useTranslations("create.common")
  const router = useRouter()
  const { isPending, navigate } = useWizardNavigate()

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const isCustomTheme = selectedTheme === "custom"

  const formSchema = useMemo(
    () =>
      getFormSchema(isCustomTheme, {
        minLength: t5("validationMinLength"),
        maxLength: t5("validationMaxLength"),
      }),
    [isCustomTheme, t5]
  )

  const {
    register,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      customRequests: "",
      pageCount: undefined,
    },
  })

  const theme = watch("theme")
  const language = watch("language")
  const illustrationStyle = watch("illustrationStyle")
  const customRequests = watch("customRequests") || ""
  const pageCount = watch("pageCount")
  const remainingChars = STORY_IDEA_MAX_LENGTH - customRequests.length

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId)
    setValue("theme", themeId as ThemeId, { shouldValidate: true })
    if (themeId === "custom") {
      setShowAdvanced(true)
    }
  }

  const handleLanguageSelect = (languageId: string) => {
    setSelectedLanguage(languageId)
    setValue("language", languageId as LanguageId, { shouldValidate: true })
  }

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId)
    setValue("illustrationStyle", styleId as IllustrationStyleId, { shouldValidate: true })
  }

  useEffect(() => {
    try {
      const wizardData = readWizardFormMirror() as Record<string, any> | null
      if (!wizardData) return

      // Restore theme & language from step3
      const s3 = wizardData.step3
      if (s3) {
        const themeId =
          (typeof s3.theme === "object" && s3.theme?.id) ||
          (typeof s3.theme === "string" ? s3.theme : null)
        const languageId =
          (typeof s3.language === "object" && s3.language?.id) ||
          (typeof s3.language === "string" ? s3.language : null)

        if (themeId && themes.some((th) => th.id === themeId)) {
          setSelectedTheme(themeId)
          setValue("theme", themeId as ThemeId, { shouldValidate: true })
        }
        if (languageId && languages.some((l) => l.id === languageId)) {
          setSelectedLanguage(languageId)
          setValue("language", languageId as LanguageId, { shouldValidate: true })
        }
      }

      // Restore illustration style from step4
      const s4 = wizardData.step4
      if (s4) {
        const raw = s4.illustrationStyle
        const styleId =
          (typeof raw === "object" && raw !== null && "id" in raw ? (raw as { id: string }).id : null) ||
          (typeof raw === "string" ? raw : null)
        if (styleId && illustrationStyles.some((s) => s.id === styleId)) {
          setSelectedStyle(styleId)
          setValue("illustrationStyle", styleId as IllustrationStyleId, { shouldValidate: true })
        }
      }

      // Restore custom requests & page count from step5
      const s5 = wizardData.step5
      if (s5) {
        if (s5.customRequests) {
          setValue("customRequests", s5.customRequests)
          setShowAdvanced(true)
        }
        if (typeof s5.pageCount === "number" && Number.isFinite(s5.pageCount) && s5.pageCount > 0) {
          setValue("pageCount", s5.pageCount)
          setShowAdvanced(true)
        }
      }
    } catch {
      /* ignore */
    }
  }, [setValue])

  useEffect(() => {
    router.prefetch("/create/step4")
  }, [router])

  const handleNext = async () => {
    const valid = await trigger(["theme", "language", "illustrationStyle"])
    if (!valid) return
    if (!theme || !language || !illustrationStyle) return

    if (isCustomTheme) {
      const customValid = await trigger("customRequests")
      if (!customValid) return
    }

    const resolvedPageCount = resolvePageCount(pageCount)

    navigate("/create/step4", () => {
      try {
        const wizardData = readWizardLocal()

        const selectedThemeObj = themes.find((th) => th.id === theme)
        const selectedLanguageObj = languages.find((l) => l.id === language)
        const selectedStyleObj = illustrationStyles.find((s) => s.id === illustrationStyle)

        wizardData.step3 = {
          theme: selectedThemeObj,
          language: selectedLanguageObj,
        }

        wizardData.step4 = {
          illustrationStyle: selectedStyleObj,
        }

        wizardData.step5 = {
          customRequests: customRequests || undefined,
          pageCount: resolvedPageCount,
        }

        persistWizardData(wizardData)
      } catch (error) {
        console.error("Error saving step 3 data:", error)
        return false
      }
    })
  }

  const isFormValid = theme && language && illustrationStyle

  const floatingVariants = {
    animate: (i: number) => ({
      y: [0, -15, 0],
      rotate: [0, 5, 0, -5, 0],
      transition: {
        duration: 3 + i * 0.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut" as const,
      },
    }),
  }

  const decorativeElements = [
    { Icon: Star, top: "10%", left: "8%", delay: 0, size: "h-6 w-6", color: "text-yellow-400" },
    { Icon: Palette, top: "15%", right: "10%", delay: 0.5, size: "h-8 w-8", color: "text-brand-2" },
    { Icon: Sparkles, top: "70%", left: "5%", delay: 1, size: "h-6 w-6", color: "text-primary" },
    { Icon: BookOpen, top: "75%", right: "8%", delay: 1.5, size: "h-7 w-7", color: "text-blue-400" },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/5 via-white to-brand-2/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Decorative floating elements */}
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
              style={{ top: element.top, left: element.left, right: element.right }}
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
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
              <span>{t3("stepProgress")}</span>
              <span>{t3("stepTitle")}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
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
          className="mx-auto max-w-6xl"
        >
          <div className="rounded-2xl bg-white/80 p-6 shadow-2xl backdrop-blur-sm dark:bg-slate-800/80 md:p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mb-8 text-center"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">{t3("themeTitle")}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">{t3("themeSubtitle")}</p>
            </motion.div>

            {/* ── SECTION 1: Theme Selection ── */}
            <div className="mb-10">
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mb-4 text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                {t3("themeTitle")}
              </motion.h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {themes.map((themeItem, index) => {
                  const Icon = themeItem.Icon
                  const isSelected = selectedTheme === themeItem.id

                  return (
                    <motion.button
                      key={themeItem.id}
                      type="button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleThemeSelect(themeItem.id)}
                      className={`group relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all ${
                        isSelected
                          ? `border-transparent bg-gradient-to-br ${themeItem.gradientFrom} ${themeItem.gradientTo} shadow-xl`
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm"
                        >
                          <div className="h-4 w-4 rounded-full bg-white" />
                        </motion.div>
                      )}
                      <div
                        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                          isSelected
                            ? "bg-white/20 backdrop-blur-sm"
                            : `bg-gradient-to-br ${themeItem.gradientFrom} ${themeItem.gradientTo}`
                        }`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <h3
                        className={`mb-2 text-lg font-bold transition-colors ${
                          isSelected ? "text-white" : "text-gray-900 dark:text-slate-50"
                        }`}
                      >
                        {t3(`themes.${themeItem.title}`)}
                      </h3>
                      <p
                        className={`text-sm transition-colors ${
                          isSelected ? "text-white/90" : "text-gray-600 dark:text-slate-400"
                        }`}
                      >
                        {t3(`themeDescriptions.${themeItem.description}`)}
                      </p>
                    </motion.button>
                  )
                })}
              </div>

              {errors.theme && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.theme.message}
                </motion.p>
              )}
            </div>

            {/* ── SECTION 2: Language Selection ── */}
            <div className="mb-10">
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mb-4 text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                {t3("languageTitle")}
              </motion.h2>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {languages.map((languageItem, index) => {
                  const Icon = languageItem.Icon
                  const isSelected = selectedLanguage === languageItem.id

                  return (
                    <motion.button
                      key={languageItem.id}
                      type="button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + 0.05 * index, duration: 0.4 }}
                      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLanguageSelect(languageItem.id)}
                      className={`group relative overflow-hidden rounded-xl border-2 p-4 text-center transition-all ${
                        isSelected
                          ? `border-transparent bg-gradient-to-br ${languageItem.gradientFrom} ${languageItem.gradientTo} shadow-xl`
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm"
                        >
                          <div className="h-3 w-3 rounded-full bg-white" />
                        </motion.div>
                      )}
                      <div
                        className={`mb-3 mx-auto flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                          isSelected
                            ? "bg-white/20 backdrop-blur-sm"
                            : `bg-gradient-to-br ${languageItem.gradientFrom} ${languageItem.gradientTo}`
                        }`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <h3
                        className={`mb-1 text-base font-bold transition-colors ${
                          isSelected ? "text-white" : "text-gray-900 dark:text-slate-50"
                        }`}
                      >
                        {languageItem.title}
                      </h3>
                      <p
                        className={`text-xs transition-colors ${
                          isSelected ? "text-white/80" : "text-gray-500 dark:text-slate-500"
                        }`}
                      >
                        {languageItem.nativeName}
                      </p>
                    </motion.button>
                  )
                })}
              </div>

              {errors.language && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.language.message}
                </motion.p>
              )}
            </div>

            {/* ── SECTION 3: Illustration Style ── */}
            <div className="mb-10">
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mb-4 text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                {t4("title")}
              </motion.h2>
              <p className="mb-6 text-sm text-gray-600 dark:text-slate-400">{t4("subtitle")}</p>

              <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
                {illustrationStyles.map((style, index) => {
                  const isSelected = selectedStyle === style.id

                  return (
                    <motion.button
                      key={style.id}
                      type="button"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.4 }}
                      whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStyleSelect(style.id)}
                      className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                        isSelected
                          ? `${style.borderColor} border-[3px] shadow-2xl`
                          : "border-gray-200 bg-white hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    >
                      <div className="relative aspect-[2/3] overflow-hidden rounded-t-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600">
                        <Image
                          src={`/illustration-styles/${style.id}.jpg`}
                          alt={`${style.title} style example`}
                          fill
                          sizes="(max-width: 768px) 50vw, 200px"
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            const fallback = target.nextElementSibling as HTMLElement
                            if (fallback) fallback.style.display = "block"
                          }}
                        />
                        <div className={`hidden h-full w-full ${style.iconBgColor} opacity-20`} />

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg dark:bg-slate-50"
                          >
                            <svg
                              className={`h-4 w-4 ${style.borderColor.replace("border", "text")}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}

                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${style.gradientFrom} ${style.gradientTo} opacity-0 transition-opacity group-hover:opacity-20`}
                        />
                      </div>

                      <div className="p-4 text-left">
                        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-slate-50">{t4(`styles.${style.title}`)}</h3>
                        <p className="line-clamp-3 text-sm text-gray-600 dark:text-slate-400">{t4(`styleDescriptions.${style.description}`)}</p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              {errors.illustrationStyle && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-red-600 dark:text-red-400"
                >
                  {errors.illustrationStyle.message}
                </motion.p>
              )}
            </div>

            {/* ── SECTION 4: Custom Story Notes (Collapsible / always visible for Custom theme) ── */}
            <div className="mb-8">
              {isCustomTheme ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border-2 border-amber-200 bg-amber-50/80 p-4 dark:border-amber-700 dark:bg-amber-900/30"
                >
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    {t5("customThemeSelected")}
                  </p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    {t5("customThemeRequired")}
                  </p>
                </motion.div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="mb-4 flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                >
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <span className="flex-1 text-base font-semibold text-gray-900 dark:text-slate-50">
                    {t5("label")}{" "}
                    <span className="text-sm font-normal text-gray-500 dark:text-slate-400">
                      {t5("storyIdeaOptionalSuffix")}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                  />
                </button>
              )}

              {(showAdvanced || isCustomTheme) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  {isCustomTheme && (
                    <label
                      htmlFor="customRequests"
                      className="mb-3 block text-base font-semibold text-gray-900 dark:text-slate-50"
                    >
                      {t5("label")}{" "}
                      <span className="text-amber-600 dark:text-amber-400">{t5("storyIdeaRequiredSuffix")}</span>
                    </label>
                  )}

                  <div className="relative">
                    <textarea
                      id="customRequests"
                      {...register("customRequests")}
                      maxLength={STORY_IDEA_MAX_LENGTH}
                      placeholder={t5("placeholder")}
                      className="min-h-[150px] w-full resize-y rounded-lg border-2 border-gray-300 bg-white p-4 text-gray-900 transition-all placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-primary"
                      aria-label={t5("ariaCustomRequests")}
                    />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute bottom-3 right-3"
                    >
                      <span
                        className={`text-xs ${
                          remainingChars < 50 ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-slate-500"
                        }`}
                      >
                        {t5("charactersRemaining", { count: remainingChars })}
                      </span>
                    </motion.div>
                  </div>

                  {errors.customRequests && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400"
                    >
                      {errors.customRequests.message}
                    </motion.p>
                  )}

                  <p className="mt-3 text-sm text-gray-600 dark:text-slate-400">
                    {t5("storyIdeaHelp")}
                  </p>

                  {/* Page Count Override (debug) */}
                  <div className="mt-4 rounded-lg border-2 border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                    <label
                      htmlFor="pageCount"
                      className="mb-2 block text-sm font-semibold text-amber-900 dark:text-amber-200"
                    >
                      🐛 {t5("debugPageCountLabel")}
                    </label>
                    <input
                      id="pageCount"
                      type="number"
                      min={0}
                      max={PAGE_COUNT_MAX}
                      {...register("pageCount", { valueAsNumber: true })}
                      placeholder={t5("pageCountPlaceholder")}
                      className="w-full rounded-lg border-2 border-amber-300 bg-white p-3 text-gray-900 transition-all placeholder:text-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-amber-700 dark:bg-slate-800 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-amber-500"
                    />
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                      {t5("debugPageCountHelp")}
                    </p>
                    {errors.pageCount && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-sm text-red-600 dark:text-red-400"
                      >
                        {errors.pageCount.message}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between"
            >
              <Link href="/create/step2" className="w-full sm:w-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 border-gray-300 bg-transparent px-6 py-6 text-base font-semibold transition-all hover:border-primary hover:bg-primary/5 dark:border-slate-600 dark:hover:border-primary sm:w-auto"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    <span>{tc("back")}</span>
                  </Button>
                </motion.div>
              </Link>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                <Button
                  type="button"
                  loading={isPending}
                  disabled={!isFormValid || isPending}
                  onClick={handleNext}
                  className="w-full bg-gradient-to-r from-primary to-brand-2 px-6 py-6 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  <span>{isPending ? tc("navigating") : tc("next")}</span>
                  {!isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                </Button>
              </motion.div>
            </motion.div>
          </div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {tc("needHelp")}{" "}
              <Link
                href="/help"
                className="font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
              >
                {tc("contactSupport")}
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
