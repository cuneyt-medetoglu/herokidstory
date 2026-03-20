"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Heart, Eye, Scissors, ArrowRight, Sparkles, Star, BookOpen } from "lucide-react"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import {
  clearWizardDraft,
  persistWizardData,
  readWizardFormMirror,
  readWizardLocal,
} from "@/lib/herokid-wizard-storage"
import { useWizardNavigate } from "@/hooks/use-wizard-navigate"
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form"
import { useTranslations } from "next-intl"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Form validation schema
const characterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(0, "Age must be at least 0").max(12, "Age must be at most 12"),
  gender: z.enum(["boy", "girl"], { message: "Please select a gender" }),
  hairColor: z.string().min(1, "Please select a hair color"),
  eyeColor: z.string().min(1, "Please select an eye color"),
})

type CharacterFormData = { name: string; age: number; gender: "boy" | "girl"; hairColor: string; eyeColor: string }

export default function Step1Page() {
  const t = useTranslations("create.step1")
  const tc = useTranslations("create.common")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isPending, navigate } = useWizardNavigate()

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      clearWizardDraft()
      router.replace(pathname)
    }
  }, [searchParams, pathname, router])

  useEffect(() => {
    router.prefetch("/create/step2")
  }, [router])

  const hairColorOptions = [
    { value: "light-blonde", label: t("hairColors.lightBlonde") },
    { value: "blonde", label: t("hairColors.blonde") },
    { value: "dark-blonde", label: t("hairColors.darkBlonde") },
    { value: "black", label: t("hairColors.black") },
    { value: "brown", label: t("hairColors.brown") },
    { value: "red", label: t("hairColors.red") },
  ]

  const eyeColorOptions = [
    { value: "blue", label: t("eyeColors.blue") },
    { value: "green", label: t("eyeColors.green") },
    { value: "brown", label: t("eyeColors.brown") },
    { value: "black", label: t("eyeColors.black") },
    { value: "hazel", label: t("eyeColors.hazel") },
  ]

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema) as Resolver<CharacterFormData>,
    mode: "onChange",
  })

  useEffect(() => {
    try {
      const wizardData = readWizardFormMirror() as { step1?: Partial<CharacterFormData> } | null
      if (!wizardData) return
      const s1 = wizardData.step1
      if (!s1?.name || s1.age === undefined || s1.age === null) return
      if (s1.gender !== "boy" && s1.gender !== "girl") return
      if (!s1.hairColor || !s1.eyeColor) return
      reset({
        name: s1.name,
        age: Number(s1.age),
        gender: s1.gender,
        hairColor: s1.hairColor,
        eyeColor: s1.eyeColor,
      })
    } catch {
      /* ignore */
    }
  }, [reset])

  const selectedGender = watch("gender")
  const selectedHairColor = watch("hairColor")
  const selectedEyeColor = watch("eyeColor")

  const onSubmit = (data: CharacterFormData) => {
    navigate("/create/step2", () => {
      try {
        const wizardData = readWizardLocal()
        wizardData.step1 = {
          name: data.name,
          age: data.age,
          gender: data.gender,
          hairColor: data.hairColor,
          eyeColor: data.eyeColor,
        }
        persistWizardData(wizardData)
      } catch (error) {
        console.error("Error saving step 1 data:", error)
        return false
      }
    })
  }

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
    { Icon: Star, top: "10%", left: "8%", delay: 0, size: "h-6 w-6", color: "text-yellow-400" },
    { Icon: Heart, top: "15%", right: "10%", delay: 0.5, size: "h-8 w-8", color: "text-brand-2" },
    { Icon: Sparkles, top: "70%", left: "5%", delay: 1, size: "h-6 w-6", color: "text-primary" },
    { Icon: BookOpen, top: "75%", right: "8%", delay: 1.5, size: "h-7 w-7", color: "text-blue-400" },
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
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-slate-300">
              <span>{t("stepProgress")}</span>
              <span>{t("stepTitle")}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "16.67%" }}
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
          className="mx-auto max-w-2xl"
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
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit as SubmitHandler<CharacterFormData>)} className="space-y-6">
              {/* Name Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {t("nameLabel")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder={t("namePlaceholder")}
                    {...register("name")}
                    className={`pl-10 ${
                      errors.name
                        ? "border-red-500 ring-red-500 focus-visible:ring-red-500"
                        : "border-gray-300 focus-visible:ring-primary dark:border-slate-600"
                    }`}
                    aria-invalid={errors.name ? "true" : "false"}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                </div>
                {errors.name && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="name-error"
                    className="text-sm text-red-500"
                  >
                    {errors.name.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Age Input */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="age" className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {t("ageLabel")}
                </Label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    max="12"
                    placeholder={t("agePlaceholder")}
                    {...register("age")}
                    className={`pl-10 ${
                      errors.age
                        ? "border-red-500 ring-red-500 focus-visible:ring-red-500"
                        : "border-gray-300 focus-visible:ring-primary dark:border-slate-600"
                    }`}
                    aria-invalid={errors.age ? "true" : "false"}
                    aria-describedby={errors.age ? "age-error" : undefined}
                  />
                </div>
                {errors.age && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="age-error"
                    className="text-sm text-red-500"
                  >
                    {errors.age.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Gender Radio Group */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="space-y-3"
              >
                <Label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t("genderLabel")}</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 transition-all ${
                      selectedGender === "boy"
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                    }`}
                  >
                    <input type="radio" value="boy" {...register("gender")} className="sr-only" />
                    <span className="font-medium text-gray-900 dark:text-slate-50">{t("genderBoy")}</span>
                  </motion.label>

                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 transition-all ${
                      selectedGender === "girl"
                        ? "border-brand-2 bg-brand-2/5"
                        : "border-gray-300 bg-white dark:border-slate-600 dark:bg-slate-800"
                    }`}
                  >
                    <input type="radio" value="girl" {...register("gender")} className="sr-only" />
                    <span className="font-medium text-gray-900 dark:text-slate-50">{t("genderGirl")}</span>
                  </motion.label>
                </div>
                {errors.gender && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500"
                  >
                    {errors.gender.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Hair Color Dropdown */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="hairColor" className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {t("hairLabel")}
                </Label>
                <div className="relative">
                  <Scissors className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <select
                    id="hairColor"
                    {...register("hairColor")}
                    className={`w-full rounded-md border pl-10 pr-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 ${
                      errors.hairColor
                        ? "border-red-500 ring-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
                    }`}
                    aria-invalid={errors.hairColor ? "true" : "false"}
                    aria-describedby={errors.hairColor ? "hairColor-error" : undefined}
                  >
                    <option value="">{t("hairSelect")}</option>
                    {hairColorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.hairColor && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="hairColor-error"
                    className="text-sm text-red-500"
                  >
                    {errors.hairColor.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Eye Color Dropdown */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="space-y-2"
              >
                <Label htmlFor="eyeColor" className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {t("eyeLabel")}
                </Label>
                <div className="relative">
                  <Eye className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                  <select
                    id="eyeColor"
                    {...register("eyeColor")}
                    className={`w-full rounded-md border pl-10 pr-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 ${
                      errors.eyeColor
                        ? "border-red-500 ring-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-primary dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
                    }`}
                    aria-invalid={errors.eyeColor ? "true" : "false"}
                    aria-describedby={errors.eyeColor ? "eyeColor-error" : undefined}
                  >
                    <option value="">{t("eyeSelect")}</option>
                    {eyeColorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.eyeColor && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    id="eyeColor-error"
                    className="text-sm text-red-500"
                  >
                    {errors.eyeColor.message}
                  </motion.p>
                )}
              </motion.div>

              {/* Navigation Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="flex justify-end pt-4"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
                  <Button
                    type="submit"
                    loading={isPending}
                    disabled={!isValid || isPending}
                    className="w-full bg-gradient-to-r from-primary to-brand-2 px-8 py-6 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed sm:w-auto"
                  >
                    <span>{isPending ? tc("saving") : tc("next")}</span>
                    {!isPending && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {tc("needHelp")}{" "}
              <Link
                href="/help"
                className="font-semibold text-primary underline underline-offset-2 transition-colors hover:text-brand-2"
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

