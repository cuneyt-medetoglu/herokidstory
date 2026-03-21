"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

interface SiteFooterBrandProps {
  tagline?: string
}

export function SiteFooterBrand({ tagline }: SiteFooterBrandProps) {
  return (
    <div className="space-y-2">
      <Link
        href="/"
        aria-label="HeroKidStory — home"
        className="inline-block"
      >
        <motion.div
          className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-brand-2/5 px-2.5 py-1 dark:border-primary/10 dark:from-primary/10 dark:to-brand-2/10"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Image
            src="/logo.png"
            alt="HeroKidStory mark"
            width={40}
            height={40}
            className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9 md:h-10 md:w-10"
          />
          <Image
            src="/brand.png"
            alt="HeroKidStory"
            width={256}
            height={36}
            className="h-6 w-auto max-w-[min(100%,220px)] shrink object-contain object-left sm:h-7 md:h-8 md:max-w-[256px]"
          />
        </motion.div>
      </Link>
      {tagline && (
        <p className="text-sm text-muted-foreground">{tagline}</p>
      )}
    </div>
  )
}
