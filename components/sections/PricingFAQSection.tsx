"use client"

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { useTranslations } from "next-intl"

const FAQ_KEYS = [
  "included",
  "convertHardcover",
  "deliveryTime",
  "editAfterPurchase",
  "paymentMethods",
  "priceSameCountries",
] as const

const FAQAccordionItem = ({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
  index: number
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-bold text-slate-900 dark:text-white">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-primary" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="border-t border-slate-200 px-6 pb-6 pt-4 dark:border-slate-700">
          <p className="leading-relaxed text-slate-600 dark:text-slate-300">{answer}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function PricingFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const t = useTranslations("pricingFaq")

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="container relative mx-auto px-4 md:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            {t("title")}
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            {t("subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_KEYS.map((key, index) => (
            <FAQAccordionItem
              key={key}
              question={t(`items.${key}.question`)}
              answer={t(`items.${key}.answer`)}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
