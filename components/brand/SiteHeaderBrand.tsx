"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

export function SiteHeaderBrand() {
  return (
    <Link
      href="/"
      aria-label="HeroKidStory — home"
      className="shrink-0"
    >
      <motion.div
        className="flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-brand-2/5 px-3 py-1.5 dark:border-primary/10 dark:from-primary/10 dark:to-brand-2/10"
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Image
          src="/logo.png"
          alt="HeroKidStory mark"
          width={48}
          height={48}
          className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11 md:h-12 md:w-12"
          priority
        />
        <Image
          src="/brand.png"
          alt="HeroKidStory"
          width={320}
          height={44}
          className="h-8 w-auto max-w-[min(100%,280px)] shrink object-contain object-left sm:h-10 md:h-11 md:max-w-[320px]"
          priority
        />
      </motion.div>
    </Link>
  )
}
