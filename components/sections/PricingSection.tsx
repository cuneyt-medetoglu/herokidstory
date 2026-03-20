"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Download, BookOpen, Info } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useTranslations } from "next-intl"

export function PricingSection() {
  const { currencyConfig, isLoading: isLoadingCurrency } = useCurrency()
  const t = useTranslations("homePricing")

  const ebookFeatures = [
    t("ebook.feature1"),
    t("ebook.feature2"),
    t("ebook.feature3"),
    t("ebook.feature4"),
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-brand-2/5 to-white py-8 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 md:py-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -left-20 bottom-20 h-64 w-64 rounded-full bg-brand-2/15 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center md:mb-12"
        >
          <h2 className="mb-2 bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-3xl font-bold leading-tight pb-1 text-transparent md:mb-4 md:text-5xl md:leading-normal">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Pricing Layout: E-book (main) + Printed Book (info card) */}
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:gap-8">
            {/* E-Book Card (Main) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.01 }}
              className="relative"
            >
              <div className="relative h-full rounded-3xl bg-white p-6 shadow-xl transition-shadow duration-300 hover:shadow-2xl dark:bg-slate-900 md:p-8">
                {/* Plan icon */}
                <div className="mb-4 flex items-center justify-center md:mb-6">
                  <div className="rounded-2xl bg-primary/10 p-3 md:p-4">
                    <Download className="h-6 w-6 text-primary md:h-8 md:w-8" />
                  </div>
                </div>

                {/* Plan name */}
                <div className="mb-3 text-center md:mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                    {t("ebook.title")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 md:text-sm">{t("ebook.type")}</p>
                </div>

                {/* Price */}
                <div className="mb-3 text-center md:mb-4">
                  {isLoadingCurrency ? (
                    <div className="mb-1 h-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 md:h-16" />
                  ) : (
                    <div className="mb-1 bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
                      {currencyConfig.price}
                    </div>
                  )}
                  {/* Pages badge */}
                  <div className="mt-1.5 flex justify-center md:mt-2">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-xs text-primary md:text-sm"
                    >
                      {t("ebook.pages")}
                    </Badge>
                  </div>
                </div>

                {/* Features list - Compact (4 items, 2 columns on mobile and desktop) */}
                <ul className="mb-4 grid grid-cols-2 gap-2 md:mb-6 md:gap-3">
                  {ebookFeatures.map((feature, featureIndex) => (
                    <motion.li
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.3,
                        delay: featureIndex * 0.05,
                      }}
                      className="flex items-start gap-1.5"
                    >
                      <div className="mt-0.5 flex-shrink-0 rounded-full bg-green-100 p-0.5 dark:bg-green-900/30">
                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 md:h-4 md:w-4" />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 md:text-base">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href="/create/step1?new=1">
                  <Button
                    size="lg"
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-brand-2 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl md:py-6 md:text-lg"
                  >
                    {t("ebook.cta")}
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Printed Book Info Card (Compact) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-brand-2/5 p-6 shadow-lg dark:from-primary/10 dark:to-brand-2/10 md:p-6">
                {/* Icon */}
                <div className="mb-4 flex items-center justify-center md:mb-3">
                  <div className="rounded-xl bg-primary/10 p-3 md:p-2">
                    <BookOpen className="h-6 w-6 text-primary md:h-6 md:w-6" />
                  </div>
                </div>

                {/* Title */}
                <div className="mb-3 text-center md:mb-2">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white md:text-xl">
                    {t("hardcover.title")}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 md:text-xs">{t("hardcover.type")}</p>
                </div>

                {/* Price */}
                <div className="mb-3 text-center md:mb-3">
                  <div className="bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-3xl font-bold text-transparent md:text-3xl">
                    $34.99
                  </div>
                </div>

                {/* Compact features (3 key points) */}
                <ul className="mb-4 space-y-2 md:mb-4 md:space-y-2">
                  {[
                    t("hardcover.feature1"),
                    t("hardcover.feature2"),
                    t("hardcover.feature3"),
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 md:gap-2">
                      <div className="mt-0.5 flex-shrink-0 rounded-full bg-green-100 p-0.5 dark:bg-green-900/30">
                        <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400 md:h-3 md:w-3" />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 md:text-xs">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Info message */}
                <div className="rounded-lg bg-white/60 p-3 dark:bg-slate-800/60 md:p-3">
                  <div className="mb-2 flex flex-col items-center gap-1.5 md:mb-1 md:flex-row md:gap-1.5">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 text-primary md:h-3 md:w-3" />
                    <span className="text-center text-xs font-semibold text-slate-900 dark:text-white md:text-left md:text-xs">
                      {t("hardcover.availableIn")}
                    </span>
                  </div>
                  <p className="text-center text-xs leading-relaxed text-slate-600 dark:text-slate-400 md:text-left md:text-xs">
                    {t("hardcover.convertText")}
                  </p>
                </div>

                {/* CTA Link */}
                <Link href="/dashboard" className="mt-4 block md:mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg border-primary/20 bg-transparent text-sm text-primary hover:bg-primary/5 md:text-xs"
                  >
                    {t("hardcover.viewInLibrary")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center md:mt-12"
        >
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("trust")}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

