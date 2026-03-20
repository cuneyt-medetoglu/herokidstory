"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Box,
  Hexagon,
  Palette,
  BookOpen,
  Grid3x3,
  Sparkles,
  Layers,
  Circle,
  Heart,
  Zap,
  StickyNote,
  ArrowRight,
  ArrowLeft,
  Brush,
} from "lucide-react"
import { Link, useRouter } from "@/i18n/navigation"
import { useState, useEffect } from "react"
import { useWizardNavigate } from "@/hooks/use-wizard-navigate"
import { useForm } from "react-hook-form"
import { useTranslations } from "next-intl"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

// Validation schema
const formSchema = z.object({
  illustrationStyle: z.enum(
    [
      "3d_animation",
      "comic_book",
      "geometric",
      "kawaii",
      "watercolor",
      "clay_animation",
      "collage",
      "block_world",
      "sticker_art",
    ],
    { message: "Please select an illustration style" },
  ),
})

type FormData = z.infer<typeof formSchema>

type IllustrationStyle = {
  id: FormData["illustrationStyle"]
  Icon: typeof Box
  title: string
  description: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
  iconBgColor: string
}

const illustrationStyles: IllustrationStyle[] = [
  {
    id: "3d_animation",
    Icon: Box,
    title: "3d_animation",
    description: "3d_animation",
    gradientFrom: "from-orange-500",
    gradientTo: "to-amber-500",
    borderColor: "border-orange-500",
    iconBgColor: "bg-gradient-to-br from-orange-500 to-amber-500",
  },
  {
    id: "comic_book",
    Icon: Zap,
    title: "comic",
    description: "comic",
    gradientFrom: "from-red-600",
    gradientTo: "to-orange-600",
    borderColor: "border-red-600",
    iconBgColor: "bg-gradient-to-br from-red-600 to-orange-600",
  },
  {
    id: "geometric",
    Icon: Hexagon,
    title: "geometric",
    description: "geometric",
    gradientFrom: "from-blue-500",
    gradientTo: "to-cyan-500",
    borderColor: "border-blue-500",
    iconBgColor: "bg-gradient-to-br from-blue-500 to-cyan-500",
  },
  {
    id: "kawaii",
    Icon: Heart,
    title: "kawaii",
    description: "kawaii",
    gradientFrom: "from-brand-2",
    gradientTo: "to-rose-400",
    borderColor: "border-brand-2",
    iconBgColor: "bg-gradient-to-br from-brand-2 to-rose-400",
  },
  {
    id: "watercolor",
    Icon: Palette,
    title: "watercolor",
    description: "watercolor",
    gradientFrom: "from-primary",
    gradientTo: "to-brand-2",
    borderColor: "border-primary",
    iconBgColor: "bg-gradient-to-br from-primary to-brand-2",
  },
  {
    id: "clay_animation",
    Icon: Circle,
    title: "clay",
    description: "clay",
    gradientFrom: "from-amber-600",
    gradientTo: "to-orange-600",
    borderColor: "border-amber-600",
    iconBgColor: "bg-gradient-to-br from-amber-600 to-orange-600",
  },
  {
    id: "collage",
    Icon: Layers,
    title: "collage",
    description: "collage",
    gradientFrom: "from-indigo-500",
    gradientTo: "to-violet-500",
    borderColor: "border-indigo-500",
    iconBgColor: "bg-gradient-to-br from-indigo-500 to-violet-500",
  },
  {
    id: "block_world",
    Icon: Grid3x3,
    title: "block_world",
    description: "block_world",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-500",
    borderColor: "border-green-500",
    iconBgColor: "bg-gradient-to-br from-green-500 to-emerald-500",
  },
  {
    id: "sticker_art",
    Icon: StickyNote,
    title: "sticker",
    description: "sticker",
    gradientFrom: "from-cyan-500",
    gradientTo: "to-blue-500",
    borderColor: "border-cyan-500",
    iconBgColor: "bg-gradient-to-br from-cyan-500 to-blue-500",
  },
]

export default function Step4Page() {
  const t = useTranslations("create.step4")
  const tc = useTranslations("create.common")
  const router = useRouter()
  const { isPending, navigate } = useWizardNavigate()
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)

  const {
    setValue,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const illustrationStyle = watch("illustrationStyle")

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId)
    setValue("illustrationStyle", styleId as FormData["illustrationStyle"], { shouldValidate: true })
  }

  useEffect(() => {
    router.prefetch("/create/step5")
  }, [router])

  const handleNext = () => {
    if (!illustrationStyle) return

    navigate("/create/step5", () => {
      try {
        const saved = localStorage.getItem("herokidstory_wizard")
        const wizardData = saved ? JSON.parse(saved) : {}

        const selectedStyleObj = illustrationStyles.find((s) => s.id === illustrationStyle)

        wizardData.step4 = {
          illustrationStyle: selectedStyleObj,
        }

        localStorage.setItem("herokidstory_wizard", JSON.stringify(wizardData))
      } catch (error) {
        console.error("Error saving step 4 data:", error)
        return false
      }
    })
  }

  const isFormValid = !!illustrationStyle

  // Floating animations for decorative elements
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
    { Icon: Palette, top: "10%", left: "8%", delay: 0, size: "h-7 w-7", color: "text-primary" },
    { Icon: Brush, top: "15%", right: "10%", delay: 0.5, size: "h-8 w-8", color: "text-brand-2" },
    { Icon: Sparkles, top: "70%", left: "5%", delay: 1, size: "h-6 w-6", color: "text-blue-400" },
    { Icon: BookOpen, top: "75%", right: "8%", delay: 1.5, size: "h-7 w-7", color: "text-amber-400" },
  ]

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
          <div className="mx-auto max-w-6xl">
            <div className="mb-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
              <span>{t("stepProgress")}</span>
              <span>{t("stepTitle")}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "66.67%" }}
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">{t("title")}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                {t("subtitle")}
              </p>
            </motion.div>

            {/* Illustration Style Selection Section */}
            <div className="mb-8">
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mb-6 text-xl font-semibold text-gray-900 dark:text-slate-50"
              >
                Choose Illustration Style
              </motion.h2>

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
                      whileHover={{
                        scale: 1.05,
                        transition: { duration: 0.2 },
                      }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStyleSelect(style.id)}
                      className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                        isSelected
                          ? `${style.borderColor} border-[3px] shadow-2xl`
                          : "border-gray-200 bg-white hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                      }`}
                    >
                      {/* Preview Image Area - 1024x1536 (2:3 aspect ratio) */}
                      <div className="relative aspect-[2/3] overflow-hidden rounded-t-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600">
                        {/* Style Example Image */}
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
                        {/* Fallback gradient (shown if image fails to load) */}
                        <div className={`hidden h-full w-full ${style.iconBgColor} opacity-20`} />

                        {/* Selected checkmark badge - top left */}
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

                        {/* Hover effect overlay */}
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${style.gradientFrom} ${style.gradientTo} opacity-0 transition-opacity group-hover:opacity-20`}
                        />
                      </div>

                      {/* Content Section */}
                      <div className="p-4 text-left">
                        <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-slate-50">{t(`styles.${style.title}`)}</h3>
                        <p className="line-clamp-3 text-sm text-gray-600 dark:text-slate-400">{t(`styleDescriptions.${style.description}`)}</p>
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

            {/* Navigation Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between"
            >
              <Link href="/create/step3" className="w-full sm:w-auto">
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

