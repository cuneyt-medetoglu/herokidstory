"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Check,
  Download,
  Shield,
  Award,
  Heart,
  BookOpen,
  Palette,
  FileText,
  Sparkles,
  Paintbrush,
  Package,
  ArrowRight,
} from "lucide-react"
import { PricingFAQSection } from "@/components/sections/PricingFAQSection"
import { Link } from "@/i18n/navigation"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useTranslations } from "next-intl"
import { isProductAvailableInCurrency, getProductPrice } from "@/lib/pricing/payment-products"
import { formatProductPrice } from "@/lib/currency"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  const { currencyConfig, isLoading } = useCurrency()
  const t = useTranslations("pricing")

  const currency = currencyConfig.currency
  const showHardcover = !isLoading && isProductAvailableInCurrency("hardcopy", currency)
  const showBundle = !isLoading && isProductAvailableInCurrency("bundle", currency)

  const bundleSavings = showBundle
    ? getProductPrice("ebook", currency) + getProductPrice("hardcopy", currency) - getProductPrice("bundle", currency)
    : 0

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-brand-2/5 to-white py-8 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 md:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -left-20 bottom-20 h-64 w-64 rounded-full bg-brand-2/10 blur-3xl" />
        </div>

        <div className="container relative mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="mb-2 bg-gradient-to-r from-primary to-brand-2 bg-clip-text pb-1 text-3xl font-bold leading-tight text-transparent md:mb-4 md:text-5xl md:leading-normal">
              {t("hero.title")}
            </h1>
            <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300 md:text-lg">
              {t("hero.subtitle")}
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="mx-auto mt-6 max-w-5xl md:mt-12">
            <div
              className={cn(
                "grid gap-6 md:gap-8",
                showHardcover ? "md:grid-cols-2" : "mx-auto max-w-[500px]"
              )}
            >
              {/* E-Book Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="relative flex h-full flex-col rounded-3xl bg-white p-4 shadow-xl transition-shadow duration-300 hover:shadow-2xl dark:bg-slate-900 md:p-8">
                  <div className="mb-2 flex items-center justify-center md:mb-6">
                    <div className="rounded-2xl bg-primary/10 p-2 md:p-4">
                      <Download className="h-5 w-5 text-primary md:h-8 md:w-8" />
                    </div>
                  </div>

                  <div className="mb-2 text-center md:mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                      {t("ebook.type")}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("ebook.typeLabel")}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-2 text-center md:mb-4">
                    {isLoading ? (
                      <div className="mx-auto mb-1 h-10 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 md:h-16 md:w-40" />
                    ) : (
                      <div className="mb-1 bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
                        {currencyConfig.price}
                      </div>
                    )}
                    <div className="mt-1.5 flex justify-center md:mt-2">
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-xs text-primary md:text-sm"
                      >
                        {t("ebook.pages")}
                      </Badge>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="mb-4 grid flex-1 grid-cols-2 gap-1.5 md:mb-6 md:gap-3">
                    {(["feature1", "feature2", "feature3", "feature4"] as const).map((key, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                        className="flex items-start gap-1.5"
                      >
                        <div className="mt-0.5 flex-shrink-0 rounded-full bg-green-100 p-0.5 dark:bg-green-900/30">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400 md:h-4 md:w-4" />
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 md:text-base">
                          {t(`ebook.${key}`)}
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
                    <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                      {t("ebook.ctaSubtitle")}
                    </p>
                  </Link>
                </div>
              </motion.div>

              {/* Hardcover Card — only for TRY users */}
              {showHardcover && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="relative flex h-full flex-col rounded-3xl bg-white p-4 shadow-xl transition-shadow duration-300 hover:shadow-2xl dark:bg-slate-900 md:p-8">
                    <div className="mb-2 flex items-center justify-center md:mb-6">
                      <div className="rounded-2xl bg-primary/10 p-2 md:p-4">
                        <BookOpen className="h-5 w-5 text-primary md:h-8 md:w-8" />
                      </div>
                    </div>

                    <div className="mb-2 text-center md:mb-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                        {t("hardcover.title")}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t("hardcover.typeLabel")}
                      </p>
                    </div>

                    {/* Price from catalog */}
                    <div className="mb-2 text-center md:mb-4">
                      <div className="mb-1 bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
                        {formatProductPrice("hardcopy", currency)}
                      </div>
                      <div className="mt-1.5 flex justify-center md:mt-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-xs text-primary md:text-sm"
                        >
                          {t("ebook.pages")}
                        </Badge>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="mb-4 grid flex-1 grid-cols-2 gap-1.5 md:mb-6 md:gap-3">
                      {(["feature1", "feature2", "feature3", "feature4"] as const).map((key, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                          className="flex items-start gap-1.5"
                        >
                          <div className="mt-0.5 flex-shrink-0 rounded-full bg-green-100 p-0.5 dark:bg-green-900/30">
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400 md:h-4 md:w-4" />
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 md:text-base">
                            {t(`hardcover.${key}`)}
                          </span>
                        </motion.li>
                      ))}
                    </ul>

                    {/* Info */}
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
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
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
        </div>
      </section>

      {/* Appearance of the Book Section — only visible for TR/TRY users */}
      {showHardcover && (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-brand-2/5 to-white py-16 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 md:py-24">
          <div className="container relative mx-auto px-4 md:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl dark:bg-slate-900 md:p-12"
            >
              <h3 className="mb-8 bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-center text-2xl font-bold text-transparent md:text-4xl">
                {t("bookAppearance.title")}
              </h3>

              <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-4">
                    <div className="flex h-64 w-48 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-brand-2/10 shadow-md">
                      <BookOpen className="h-24 w-24 text-primary" />
                    </div>
                  </div>
                  <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                    <div className="font-semibold">{t("bookAppearance.format")}</div>
                    <div>{t("bookAppearance.dimensions")}</div>
                    <div>{t("bookAppearance.dimensionsCm")}</div>
                  </div>
                </div>

                <div>
                  <h4 className="mb-6 text-lg font-bold text-slate-900 dark:text-white md:text-2xl">
                    {t("bookAppearance.qualityTitle")}
                  </h4>
                  <ul className="space-y-4">
                    {([
                      { icon: BookOpen, titleKey: "quality1Title", descKey: "quality1Desc" },
                      { icon: Shield, titleKey: "quality2Title", descKey: "quality2Desc" },
                      { icon: Palette, titleKey: "quality3Title", descKey: "quality3Desc" },
                      { icon: FileText, titleKey: "quality4Title", descKey: "quality4Desc" },
                      { icon: Sparkles, titleKey: "quality5Title", descKey: "quality5Desc" },
                      { icon: Paintbrush, titleKey: "quality6Title", descKey: "quality6Desc" },
                    ] as const).map(({ icon: Icon, titleKey, descKey }) => (
                      <li key={titleKey} className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 rounded-full bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 md:text-base">
                          <strong>{t(`bookAppearance.${titleKey}`)}</strong>{" "}
                          {t(`bookAppearance.${descKey}`)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="bg-gradient-to-br from-primary/5 via-brand-2/5 to-white py-16 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <PricingFAQSection />
        </motion.div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-8 dark:bg-slate-950">
        <div className="container relative mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 text-center text-sm text-slate-500 dark:text-slate-400 md:gap-6">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>{t("trust.securePayment")}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span>{t("trust.moneyBack")}</span>
              </div>
              <span className="hidden md:inline">•</span>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span>{t("trust.trustedBy")}</span>
              </div>
            </div>

            {/* Payment logos */}
            <div className="flex items-center gap-4 opacity-50 grayscale">
              {/* Visa */}
              <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="#1434CB" />
                <path d="M18 21.5L20.5 10.5H23.5L21 21.5H18ZM32 11C31.5 10.8 30.7 10.5 29.5 10.5C26.5 10.5 24.5 12 24.5 14C24.5 16 27 16 27 17C27 17.5 26.5 18 25.5 18C24.5 18 23.5 17.5 23 17.5L22.5 20C23 20.5 24.5 21 26 21C29 21 31 19.5 31 17.5C31 15.5 28.5 15.5 28.5 14.5C28.5 14 29 13.5 30 13.5C30.8 13.5 31.5 13.7 32 14L32 11ZM37.5 10.5H35.5C35 10.5 34.5 10.7 34.5 11.5L30.5 21.5H33.5L34 19.5H37.5C37.6 20 38 21.5 38 21.5H40.5L37.5 10.5ZM34.5 17.5L36 13L37 17.5H34.5ZM17.5 10.5L14.5 18.5L14 16C13.5 14.5 12 12.5 10.5 11.5L13 21.5H16L21 10.5H17.5Z" fill="white" />
              </svg>
              {/* Mastercard */}
              <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="32" rx="4" fill="#EB001B" />
                <circle cx="18" cy="16" r="8" fill="#FF5F00" />
                <circle cx="30" cy="16" r="8" fill="#F79E1B" />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
