"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Download,
  BookOpen,
  Package,
  Shield,
  Zap,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useTranslations } from "next-intl"
import { isProductAvailableInCurrency, getProductPrice } from "@/lib/pricing/payment-products"
import { formatProductPrice } from "@/lib/currency"
import { cn } from "@/lib/utils"

export function PricingSection() {
  const { currencyConfig, isLoading } = useCurrency()
  const t = useTranslations("homePricing")

  const currency = currencyConfig.currency
  const showHardcopy = !isLoading && isProductAvailableInCurrency("hardcopy", currency)
  const showBundle = !isLoading && isProductAvailableInCurrency("bundle", currency)

  const ebookFeatures = [
    t("ebook.feature1"),
    t("ebook.feature2"),
    t("ebook.feature3"),
    t("ebook.feature4"),
  ]

  const hardcoverFeatures = [
    t("hardcover.feature1"),
    t("hardcover.feature2"),
    t("hardcover.feature3"),
    t("hardcover.feature4"),
  ]

  const bundleSavings = showBundle
    ? getProductPrice("ebook", currency) + getProductPrice("hardcopy", currency) - getProductPrice("bundle", currency)
    : 0

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-brand-2/5 to-white py-8 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 md:py-24">
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
          <h2 className="mb-2 bg-gradient-to-r from-primary to-brand-2 bg-clip-text pb-1 text-3xl font-bold leading-tight text-transparent md:mb-4 md:text-5xl md:leading-normal">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="mx-auto max-w-5xl">
          <div
            className={cn(
              "grid gap-6 md:gap-8",
              showHardcopy ? "md:grid-cols-2" : "mx-auto max-w-lg"
            )}
          >
            {/* E-Book Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.01 }}
              className="relative"
            >
              <div className="relative flex h-full flex-col rounded-3xl bg-white p-6 shadow-xl transition-shadow duration-300 hover:shadow-2xl dark:bg-slate-900 md:p-8">
                <div className="mb-4 flex items-center justify-center md:mb-6">
                  <div className="rounded-2xl bg-primary/10 p-3 md:p-4">
                    <Download className="h-6 w-6 text-primary md:h-8 md:w-8" />
                  </div>
                </div>

                <div className="mb-3 text-center md:mb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                    {t("ebook.title")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("ebook.type")}</p>
                </div>

                {/* Price */}
                <div className="mb-3 text-center md:mb-4">
                  {isLoading ? (
                    <div className="mx-auto mb-1 h-10 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 md:h-14 md:w-40" />
                  ) : (
                    <div className="mb-1 bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
                      {currencyConfig.price}
                    </div>
                  )}
                  <div className="mt-1.5 flex justify-center md:mt-2">
                    <Badge variant="secondary" className="bg-primary/10 text-xs text-primary md:text-sm">
                      {t("ebook.pages")}
                    </Badge>
                  </div>
                </div>

                {/* Features */}
                <ul className="mb-4 grid flex-1 grid-cols-2 gap-2 md:mb-6 md:gap-3">
                  {ebookFeatures.map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
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

                {/* CTA */}
                <Link href="/create/step1?new=1" className="mt-auto">
                  <Button
                    size="lg"
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-brand-2 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl md:py-6 md:text-lg"
                  >
                    {t("ebook.cta")}
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Hardcover Card — only for TRY users */}
            {showHardcopy && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative"
              >
                <div className="relative flex h-full flex-col rounded-3xl bg-white p-6 shadow-xl transition-shadow duration-300 hover:shadow-2xl dark:bg-slate-900 md:p-8">
                  <div className="mb-4 flex items-center justify-center md:mb-6">
                    <div className="rounded-2xl bg-primary/10 p-3 md:p-4">
                      <BookOpen className="h-6 w-6 text-primary md:h-8 md:w-8" />
                    </div>
                  </div>

                  <div className="mb-3 text-center md:mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                      {t("hardcover.title")}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("hardcover.type")}</p>
                  </div>

                  {/* Price from catalog */}
                  <div className="mb-3 text-center md:mb-4">
                    <div className="mb-1 bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
                      {formatProductPrice("hardcopy", currency)}
                    </div>
                    <div className="mt-1.5 flex justify-center md:mt-2">
                      <Badge variant="secondary" className="bg-primary/10 text-xs text-primary md:text-sm">
                        {t("ebook.pages")}
                      </Badge>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="mb-4 grid flex-1 grid-cols-2 gap-2 md:mb-6 md:gap-3">
                    {hardcoverFeatures.map((feature, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
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

                  {/* Info: requires ebook first */}
                  <div className="mb-4 rounded-xl bg-primary/5 p-3 dark:bg-primary/10 md:mb-6">
                    <p className="text-center text-xs leading-relaxed text-slate-600 dark:text-slate-400 md:text-sm">
                      {t("hardcover.convertText")}
                    </p>
                  </div>

                  {/* CTA */}
                  <Link href="/create/step1?new=1" className="mt-auto">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full rounded-xl border-primary/30 py-4 text-sm font-semibold text-primary transition-all duration-300 hover:scale-105 hover:bg-primary/5 md:py-6 md:text-lg"
                    >
                      {t("hardcover.cta")}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bundle banner — only for TRY users */}
          {showBundle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 md:mt-8"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-brand-2 p-4 text-white shadow-lg md:p-6">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-col items-center gap-4 md:flex-row md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/20 p-2.5">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold md:text-lg">{t("bundle.title")}</h4>
                      <p className="text-xs text-white/80 md:text-sm">{t("bundle.subtitle")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold md:text-3xl">
                        {formatProductPrice("bundle", currency)}
                      </div>
                      {bundleSavings > 0 && (
                        <Badge className="mt-1 border-0 bg-white/20 text-xs text-white">
                          {t("bundle.save", { amount: `${currencyConfig.symbol}${bundleSavings}` })}
                        </Badge>
                      )}
                    </div>
                    <Link href="/create/step1?new=1">
                      <Button
                        size="sm"
                        className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-md transition-all hover:scale-105 hover:bg-white/90 md:px-6 md:py-3"
                      >
                        {t("bundle.cta")}
                        <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Trust indicators with icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 md:mt-12"
        >
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Shield className="h-4 w-4 text-primary" />
              <span>{t("trust.secure")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Zap className="h-4 w-4 text-primary" />
              <span>{t("trust.moneyBack")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4 text-primary" />
              <span>{t("trust.trustedBy")}</span>
            </div>
          </div>

          {/* Mini how-it-works */}
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500 md:mt-8 md:gap-3 md:text-sm">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t("miniSteps.step1")}</span>
            </div>
            <ArrowRight className="h-3 w-3 flex-shrink-0" />
            <span>{t("miniSteps.step2")}</span>
            <ArrowRight className="h-3 w-3 flex-shrink-0" />
            <span>{t("miniSteps.step3")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
