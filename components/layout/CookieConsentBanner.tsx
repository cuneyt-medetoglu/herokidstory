"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"

export function CookieConsentBanner() {
  const t = useTranslations("cookies")
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const saveConsent = (state: "accepted" | "declined") => {
    const ts = new Date().toISOString()
    localStorage.setItem("cookie-consent", state)
    localStorage.setItem("cookie-preferences", JSON.stringify({ essential: true, analytics: false, marketing: false }))
    localStorage.setItem("cookie-consent-timestamp", ts)
    localStorage.setItem("cookie-consent-version", "1.1")
    setShowBanner(false)
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-primary/20 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-brand-2 flex items-center justify-center">
                  <Cookie className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {t("title")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t("bannerDescription")}{" "}
                  <Link
                    href="/cookies"
                    className="text-primary hover:text-brand-2 underline transition-colors"
                  >
                    {t("learnMore")}
                  </Link>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => saveConsent("accepted")}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-brand-2 text-white font-semibold px-6 py-2 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  {t("acceptAll")}
                </Button>
                <Button
                  onClick={() => saveConsent("declined")}
                  variant="outline"
                  className="flex-1 sm:flex-none border-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold px-6 py-2 rounded-full transition-all duration-300 bg-transparent"
                >
                  {t("decline")}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
