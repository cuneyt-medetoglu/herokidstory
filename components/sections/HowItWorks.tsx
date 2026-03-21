"use client"

import { motion } from "framer-motion"
import { Upload, Sparkles, Gift, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { WaveDivider } from "./WaveDivider"

const stepIcons = [Upload, Sparkles, Gift]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
}

export function HowItWorks() {
  const t = useTranslations("howItWorks")

  const steps = [
    { number: 1, icon: stepIcons[0], title: t("step1.title"), description: t("step1.description") },
    { number: 2, icon: stepIcons[1], title: t("step2.title"), description: t("step2.description") },
    { number: 3, icon: stepIcons[2], title: t("step3.title"), description: t("step3.description") },
  ]

  return (
    <section className="relative overflow-visible bg-gradient-to-b from-[color-mix(in_srgb,hsl(var(--brand-2))_5%,white)] via-[color-mix(in_srgb,hsl(var(--primary))_5%,white)] to-[color-mix(in_srgb,hsl(var(--brand-2))_5%,white)] pb-16 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 sm:pb-20 md:overflow-hidden md:pt-4 md:pb-24 lg:pt-5 lg:pb-32">
      {/* Top Wave Separator (mobile) */}
      <div className="pointer-events-none absolute left-0 top-0 z-0 w-full -translate-y-[48px] md:hidden sm:-translate-y-[64px]">
        <WaveDivider className="h-12 sm:h-16" />
      </div>

      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-4 bottom-20 h-72 w-72 rounded-full bg-brand-2/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-balance text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground md:text-xl">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:gap-8"
        >
          {steps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === steps.length - 1
            return (
              <div key={step.number} className="relative flex">
                <motion.div variants={itemVariants} className="flex w-full">
                  <Card className="group relative flex w-full flex-col overflow-visible border-2 border-primary/10 bg-white p-6 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl dark:border-primary/10 dark:bg-slate-900 md:p-5 lg:p-8">
                    <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-brand-2/0 opacity-0 transition-opacity duration-300 group-hover:opacity-5" />

                    {/* Step number — large gradient background */}
                    <div className="absolute -right-4 -top-4 text-6xl font-bold text-transparent opacity-10 md:text-7xl lg:text-8xl">
                      <span className="bg-gradient-to-br from-primary to-brand-2 bg-clip-text">
                        {step.number}
                      </span>
                    </div>

                    <div className="relative space-y-4 md:space-y-3 lg:space-y-6">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{
                          duration: 3,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                        }}
                        className="inline-flex rounded-2xl bg-gradient-to-br from-primary to-brand-2 p-3 shadow-lg md:p-2.5 lg:p-4"
                      >
                        <Icon className="h-6 w-6 text-white md:h-5 md:w-5 lg:h-8 lg:w-8" />
                      </motion.div>

                      <div className="inline-flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-brand-2 text-base font-bold text-white shadow-md md:h-7 md:w-7 md:text-sm lg:h-10 lg:w-10 lg:text-lg">
                          {step.number}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground md:text-[0.65rem] lg:text-sm">
                          {t("stepLabel")} {step.number}
                        </span>
                      </div>

                      <h3 className="text-balance text-xl font-bold text-foreground md:text-lg lg:text-2xl">
                        {step.title}
                      </h3>

                      <p className="text-pretty text-sm text-muted-foreground md:text-xs lg:text-base">
                        {step.description}
                      </p>
                    </div>
                  </Card>
                </motion.div>

                {/* Connecting arrow between cards */}
                {!isLast && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.2, duration: 0.5 }}
                    className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block md:-right-2 lg:-right-4 xl:-right-6"
                  >
                    <div className="flex items-center justify-center rounded-full bg-white p-1.5 shadow-lg dark:bg-slate-800 md:p-1 lg:p-2">
                      <ArrowRight className="h-4 w-4 text-primary md:h-3 md:w-3 lg:h-6 lg:w-6" />
                    </div>
                  </motion.div>
                )}
              </div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-balance text-lg text-muted-foreground">{t("cta")}</p>
        </motion.div>
      </div>
    </section>
  )
}
