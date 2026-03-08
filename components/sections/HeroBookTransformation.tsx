"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Sparkles, Star, Wand2, ArrowRight } from "lucide-react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { heroTransformationConfig } from "@/lib/config/hero-transformation"

// 12 parçacık, sabit seed — mobilde kapatılacak; rotate/Sparkles yok (GPU tasarrufu)
const PARTICLE_DATA = Array.from({ length: 12 }, (_, i) => ({
  xEnd: `${(i * 137.5) % 100}%`,
  yEnd: `${(i * 97.3) % 100}%`,
  duration: 2 + (i % 4) * 0.5,
  delay: (i * 0.4) % 3,
}))

// Floating magical particles — seed tabanlı, remount’ta aynı animasyon
function MagicalParticles({ colors, enabled }: { colors: string[]; enabled: boolean }) {
  if (!enabled) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLE_DATA.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ x: "50%", y: "50%", opacity: 0, scale: 0 }}
          animate={{
            x: p.xEnd,
            y: p.yEnd,
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut",
          }}
        >
          {i % 2 === 0 ? (
            <Star className="h-3 w-3 text-yellow-400" fill="currentColor" />
          ) : (
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}

// Transformation arrow with magic effect
function MagicArrow() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 1, duration: 0.8, type: "spring" }}
      className="relative z-20 flex items-center justify-center"
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="rounded-full bg-gradient-to-r from-primary to-brand-2 p-2.5 shadow-2xl md:p-2.5 lg:p-4"
      >
        <Wand2 className="h-4 w-4 text-white md:h-4 md:w-4 lg:h-6 lg:w-6" />
      </motion.div>

      {/* Sparkle effect around arrow */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], rotate: [0, 180] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          style={{
            left: `${50 + 30 * Math.cos((i * Math.PI) / 3)}%`,
            top: `${50 + 30 * Math.sin((i * Math.PI) / 3)}%`,
          }}
        >
          <Sparkles className="h-3 w-3 text-yellow-400" />
        </motion.div>
      ))}
    </motion.div>
  )
}

export function HeroBookTransformation() {
  const t = useTranslations("hero.transformation")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const currentItem = heroTransformationConfig[currentIndex]
  const Icon = currentItem.icon

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroTransformationConfig.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const set = () => setIsMobile(mq.matches)
    set()
    mq.addEventListener("change", set)
    return () => mq.removeEventListener("change", set)
  }, [])

  // Sıradaki hikaye görselini arka planda preload et; carousel geçişinde hazır olsun
  useEffect(() => {
    const nextIndex = (currentIndex + 1) % heroTransformationConfig.length
    const img = new window.Image()
    img.src = heroTransformationConfig[nextIndex].storyCharacter.src
  }, [currentIndex])
    <div className="relative flex w-full flex-col items-center justify-center px-3 pb-2 sm:px-4 sm:pb-12 md:h-full md:pb-0 md:px-3 lg:px-4">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-2 text-center sm:mb-3 md:mb-2 lg:mb-4"
      >
        <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-gray-800 dark:text-white sm:text-xl md:text-lg md:gap-1.5 lg:text-xl xl:text-2xl">
          <Wand2 className="h-4 w-4 text-primary sm:h-5 sm:w-5 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
          <span className="bg-gradient-to-r from-primary to-brand-2 bg-clip-text text-transparent">
            {t("title")}
          </span>
          <Wand2 className="h-4 w-4 scale-x-[-1] text-brand-2 sm:h-5 sm:w-5 md:h-4 md:w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
        </h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 sm:mt-2 sm:text-sm md:mt-1.5 md:text-xs lg:mt-2 lg:text-sm"
        >
          {t("subtitle")}
        </motion.p>
      </motion.div>

      {/* Main Transformation Container */}
      <div className="relative w-full max-w-2xl sm:max-w-3xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-5xl">
        {/* Background glow */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute inset-0 -z-10 rounded-3xl bg-gradient-to-r ${currentItem.gradient} blur-3xl transition-colors duration-700`}
        />

        {/* Theme indicator — key yok, sadece transition ile; unmount/remount tetiklenmez */}
        <div className="mb-2 flex items-center justify-center gap-2 sm:mb-3 md:mb-2 md:gap-1.5 lg:mb-3 transition-all duration-500">
          <div
            className="rounded-full p-1.5 shadow-lg md:p-1 lg:p-1.5 transition-colors duration-500"
            style={{ backgroundColor: currentItem.sparkleColors[0] }}
          >
            <Icon className="h-3 w-3 text-white md:h-3 md:w-3 lg:h-4 lg:w-4" />
          </div>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 md:text-xs lg:text-sm">
            {t(`themes.${currentItem.id}`)}
          </span>
        </div>

        {/* Transformation Grid */}
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-4 lg:gap-6">
          {/* Left: Real Photo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="relative"
          >
            <div className="group relative overflow-hidden rounded-2xl bg-white p-2 shadow-2xl ring-2 ring-primary/20 dark:bg-slate-800 md:p-2 lg:p-3">
              <div className="mb-1.5 flex items-center justify-center gap-2 md:mb-1 lg:mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t("realPhotoLabel")}</span>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-600">
                <Image
                  src={currentItem.realPhoto.src}
                  alt="Child photo"
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              </div>
              <div className="rounded-b-xl bg-white/95 px-2 py-1.5 text-center dark:bg-slate-800/95 md:px-2 md:py-1.5 lg:px-3 lg:py-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("realPhotoName")}, {t("realPhotoAge")}</p>
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-white/80 p-1.5 shadow-lg dark:bg-slate-700/80">
                <Star className="h-3 w-3 text-primary" fill="currentColor" />
              </div>
            </div>
          </motion.div>

          {/* Center: Arrows */}
          <div className="hidden md:flex md:items-center md:justify-center">
            <MagicArrow />
          </div>
          <div className="flex items-center justify-center md:hidden">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ArrowRight className="h-8 w-8 rotate-90 text-primary" strokeWidth={3} />
              </motion.div>
              <span className="text-xs font-bold text-primary">{t("magicLabel")}</span>
            </motion.div>
          </div>

          {/* Right: Character Illustration — sabit kabuk, tüm görseller üst üste opacity ile */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            <div className="group relative overflow-hidden rounded-2xl bg-white p-2 shadow-2xl ring-2 ring-brand-2/20 dark:bg-slate-800 md:p-2 lg:p-3">
              <div className="mb-1.5 flex items-center justify-center gap-2 md:mb-1 lg:mb-2">
                <Sparkles className="h-3 w-3 text-brand-2" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {t("storyCharacterLabel")}
                </span>
                <Sparkles className="h-3 w-3 text-brand-2" />
              </div>

              {/* Tüm görsellerin üst üste bindiği sabit kutu — layout shift yok */}
              <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-100 dark:bg-slate-700">
                {heroTransformationConfig.map((item, index) => {
                  const isActive = index === currentIndex
                  return (
                    <div
                      key={item.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
                      <Image
                        src={item.storyCharacter.src}
                        alt={`${t(`themes.${item.id}`)} ${t("character")}`}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 40vw"
                        priority={index === 0}
                      />
                      {isActive && (
                        <MagicalParticles colors={item.sparkleColors} enabled={!isMobile} />
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="rounded-b-xl bg-white/95 px-2 py-1.5 text-center dark:bg-slate-800/95 md:px-2 md:py-1.5 lg:px-3 lg:py-2">
                <div className="flex items-center justify-center gap-1.5 transition-colors duration-300">
                  <Icon className="h-3 w-3 text-primary" />
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t(`themes.${currentItem.id}`)}
                  </p>
                </div>
              </div>

              <div className="absolute left-3 top-3 z-20 rounded-full bg-white/80 p-1.5 shadow-lg dark:bg-slate-700/80">
                <Sparkles className="h-3 w-3 text-brand-2" />
              </div>

              <motion.div
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-r ${currentItem.gradient} blur-xl will-change-[opacity] transition-colors duration-700`}
              />
            </div>
          </motion.div>
        </div>

        {/* Theme selector dots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-4 flex justify-center gap-2.5 md:mt-3 lg:mt-6"
        >
          {heroTransformationConfig.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              style={index === currentIndex ? { backgroundColor: item.sparkleColors[0] } : undefined}
              className={`h-3 w-3 rounded-full transition-all duration-300 hover:scale-125 active:scale-90 ${
                index === currentIndex
                  ? "shadow-md ring-2 ring-slate-800/40 dark:ring-white/50 scale-110"
                  : "bg-slate-300 hover:bg-slate-400 dark:bg-slate-400 dark:hover:bg-slate-300"
              }`}
              aria-label={t("ariaSwitchTheme", { name: t(`themes.${item.id}`) })}
            />
          ))}
        </motion.div>
      </div>

      {/* Stat badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="mt-4 mb-20 flex flex-wrap justify-center gap-2 sm:mb-6 md:mb-0 md:mt-3 md:gap-2 lg:mt-5 lg:gap-3"
      >
        {[
          { labelKey: "aiPowered", icon: Sparkles },
          { labelKey: "personalized", icon: Star },
        ].map((stat, index) => (
          <motion.div
            key={stat.labelKey}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 + index * 0.1, duration: 0.4 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md backdrop-blur-sm ring-1 ring-gray-200 dark:bg-slate-800/90 dark:text-gray-200 dark:ring-slate-700 md:gap-1 md:px-2.5 md:py-1 lg:gap-1.5 lg:px-4 lg:py-2"
          >
            <stat.icon className="h-3.5 w-3.5 text-primary md:h-3 md:w-3 lg:h-4 lg:w-4" />
            <span className="whitespace-nowrap">{t(stat.labelKey)}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
