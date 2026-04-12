"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  ArrowUp,
} from "lucide-react"
import { useTranslations, useLocale } from "next-intl"
import { Link } from "@/i18n/navigation"
import { BrandWordmark } from "@/components/brand/BrandWordmark"

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter/X" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
]

/** Show scroll-to-top button only when this many px from the bottom */
const SCROLL_TOP_SHOW_WHEN_PX_FROM_BOTTOM = 400

export function Footer() {
  const t      = useTranslations("footer")
  const locale = useLocale()
  const isTr   = locale === "tr"

  const [email, setEmail] = useState("")
  const [showScrollTop, setShowScrollTop] = useState(false)

  // link arrays inside component so translations work
  const quickLinks = [
    { labelKey: "examples" as const, href: "/examples" },
    { labelKey: "pricing" as const, href: "/pricing" },
  ]

  const supportLinks = [
    { labelKey: "helpCenter" as const, href: "/help" },
    { labelKey: "contact" as const, href: "/contact" },
    { labelKey: "faq" as const, href: "/faq" },
    { labelKey: "terms" as const, href: "/terms" },
  ]

  const legalLinks = [
    { labelKey: "privacyPolicy" as const, href: "/privacy" },
    { labelKey: "termsOfService" as const, href: "/terms" },
    { labelKey: "cookiePolicy" as const, href: "/cookies" },
    { labelKey: "refundPolicy" as const, href: "/refund-policy" },
    ...(isTr
      ? [{ labelKey: "distanceSales" as const, href: "/mesafeli-satis" }]
      : []),
  ]

  useEffect(() => {
    const update = () => {
      if (typeof window === "undefined") return
      const { scrollY, innerHeight } = window
      const scrollHeight = document.documentElement.scrollHeight
      const isScrollable = scrollHeight > innerHeight
      const nearBottom =
        scrollY + innerHeight >= scrollHeight - SCROLL_TOP_SHOW_WHEN_PX_FROM_BOTTOM
      setShowScrollTop(Boolean(isScrollable && nearBottom))
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Newsletter signup:", email)
    setEmail("")
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-b from-white via-primary/5 to-brand-2/5 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950"
    >
      <div className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        {/*
          xl öncesi 4 dar sütun yerine 2×2: tablet/web ara genişliklerde nefes.
          Marka: xl altında ikon üstü + wordmark altı (yatay sıkışmayı önler).
        */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 xl:grid-cols-4 xl:gap-x-8 xl:gap-y-10">
          {/* Column 1: Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="min-w-0 space-y-4 sm:max-xl:pr-2"
          >
            <Link href="/" className="inline-block max-w-full min-w-0 rounded-lg outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <div className="flex min-w-0 flex-col items-start gap-2.5 xl:flex-row xl:items-center xl:gap-3.5">
                <Image
                  src="/brand/logo.png"
                  alt="HeroKidStory"
                  width={80}
                  height={80}
                  className="h-12 w-12 shrink-0 sm:h-[3.25rem] sm:w-[3.25rem] xl:h-12 xl:w-12"
                />
                <h3 className="m-0 min-w-0 max-w-full font-normal leading-none">
                  <BrandWordmark size="footer" />
                </h3>
              </div>
            </Link>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {t("tagline")}
            </p>
            {/* Social Media Icons */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon
                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-gradient-to-r hover:from-primary hover:to-brand-2 hover:text-white dark:bg-slate-800 dark:text-slate-400"
                  >
                    <Icon className="h-5 w-5" />
                  </motion.a>
                )
              })}
            </div>
          </motion.div>

          {/* Column 2: Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="min-w-0 space-y-4 sm:max-xl:pl-2"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {t("quickLinks")}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="group relative inline-block text-sm text-gray-600 transition-colors hover:text-primary dark:text-slate-400"
                  >
                    {t(`links.${link.labelKey}`)}
                    <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-brand-2 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Column 3: Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="min-w-0 space-y-4"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {t("support")}
            </h4>
            <ul className="space-y-2">
              {supportLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="group relative inline-block text-sm text-gray-600 transition-colors hover:text-primary dark:text-slate-400"
                  >
                    {t(`supportLinks.${link.labelKey}`)}
                    <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-brand-2 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Column 4: Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="min-w-0 space-y-4"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              {t("newsletter")}
            </h4>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {t("newsletterDesc")}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 focus:border-primary focus:ring-primary dark:border-slate-700 dark:bg-slate-800/50"
                />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-brand-2 font-semibold text-white shadow-md transition-all hover:shadow-lg"
                >
                  {t("subscribe")}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="my-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-slate-700"
        />

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Copyright */}
            <p className="text-center text-sm text-gray-600 dark:text-slate-400">
              © {new Date().getFullYear()} HeroKidStory. {t("allRightsReserved")}
            </p>

            {/* Legal Links */}
            <div className="flex flex-wrap justify-center gap-4">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-gray-600 transition-colors hover:text-primary dark:text-slate-400"
                >
                  {t(`legalLinks.${link.labelKey}`)}
                </Link>
              ))}
            </div>
          </div>

        </motion.div>
      </div>

      {/* Scroll to Top Button */}
      <motion.button
        onClick={scrollToTop}
        animate={{ opacity: showScrollTop ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        whileHover={showScrollTop ? { scale: 1.1 } : undefined}
        whileTap={showScrollTop ? { scale: 0.9 } : undefined}
        className={`fixed bottom-8 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-brand-2 text-white shadow-lg transition-all hover:shadow-xl ${!showScrollTop ? "pointer-events-none" : ""}`}
        aria-label={t("scrollToTop")}
        aria-hidden={!showScrollTop}
        tabIndex={showScrollTop ? 0 : -1}
      >
        <ArrowUp className="h-6 w-6" />
      </motion.button>
    </motion.footer>
  )
}
