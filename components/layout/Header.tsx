"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  ShoppingCart,
  ChevronDown,
  BookOpen,
  Tag,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  Globe,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useCart } from "@/contexts/CartContext"
import { useTranslations, useLocale } from "next-intl"
import Image from "next/image"
import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { BrandWordmark } from "@/components/brand/BrandWordmark"

const countries = [
  { code: "US", flag: "🇺🇸", currency: "USD" },
  { code: "TR", flag: "🇹🇷", currency: "TRY" },
  { code: "GB", flag: "🇬🇧", currency: "GBP" },
  { code: "EU", flag: "🇪🇺", currency: "EUR" },
]

/** Para birimi seçici: Ödeme sistemleri (Stripe/İyzico) yapılınca tekrar açılacak. */
const SHOW_CURRENCY_SELECTOR = false

const LOCALE_META: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "EN" },
  tr: { flag: "🇹🇷", label: "TR" },
}

export function Header() {
  const t = useTranslations("nav")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const user = session?.user ?? null
  const isLoading = status === "loading"
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { getCartCount } = useCart()
  const cartCount = getCartCount()

  // nav links defined here so translations work
  const navLinks = [
    { labelKey: "examples" as const, href: "/examples", icon: BookOpen },
    { labelKey: "pricing" as const, href: "/pricing", icon: Tag },
  ]

  const handleLogout = () => {
    signOut({ callbackUrl: `/${locale}` })
  }

  const handleLocaleSwitch = (newLocale: string) => {
    // Persist preference so middleware remembers on next visit
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`
    router.replace(pathname, { locale: newLocale })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const currentLocaleMeta = LOCALE_META[locale] ?? LOCALE_META["en"]
  const otherLocales = Object.entries(LOCALE_META).filter(([code]) => code !== locale)

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 shadow-md backdrop-blur-sm dark:bg-slate-900/95"
          : "bg-white dark:bg-slate-900"
      }`}
    >
      {/*
        Üç bölgeli flex: logo (asla ezilmesin) | ara nav (yalnız xl+) | esnek boşluk | aksiyonlar.
        justify-between + ortada shrink-0 nav, dar ekranda (iPad) nav ile logo çakışıyordu.
        xl (1280px) altında yatay linkler kapatılıp hamburger — tablet/profesyonel kalıbı.
      */}
      <nav className="container mx-auto flex h-20 min-h-[5rem] w-full max-w-full min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-4 md:px-6">
        <Link
          href="/"
          className="shrink-0 pr-1 sm:pr-2"
        >
          <motion.div
            className="flex items-center gap-3 sm:gap-3.5 md:gap-4"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Image
              src="/brand/logo.png"
              alt="HeroKidStory"
              width={96}
              height={96}
              className="h-12 w-12 shrink-0 sm:h-[3.25rem] sm:w-[3.25rem] md:h-14 md:w-14 lg:h-[3.625rem] lg:w-[3.625rem]"
              priority
            />
            <BrandWordmark size="header" />
          </motion.div>
        </Link>

        {/* Yalnız geniş masaüstü: yan yana linkler; altında çakışma riski yok */}
        <div className="hidden shrink-0 items-center gap-6 pl-2 xl:flex 2xl:gap-8">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={link.href} className="block">
                <motion.span
                  className="whitespace-nowrap text-sm font-medium text-gray-800 transition-colors hover:text-primary dark:text-slate-100 lg:text-base"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {t(link.labelKey)}
                </motion.span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Logo ile sağ blok arasında kalan alan — nav bu satırda yer kaplamaz, sağa iter */}
        <div className="min-w-0 flex-1 shrink" aria-hidden="true" />

        {/* Right Side Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4">
          {/* Currency Selector — hidden until payment systems are in place */}
          {SHOW_CURRENCY_SELECTOR && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden gap-1 text-xs sm:text-sm lg:flex"
              >
                <span>{selectedCountry.flag}</span>
                <span className="font-medium hidden xl:inline">{selectedCountry.currency}</span>
                <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              {countries.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => setSelectedCountry(country)}
                  className="cursor-pointer gap-2"
                >
                  <span>{country.flag}</span>
                  <span>{country.currency}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          )}

          {/* Language Selector — Desktop */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hidden gap-1 text-xs sm:text-sm lg:flex items-center"
                aria-label="Switch language"
              >
                <Globe className="h-4 w-4" />
                <span className="font-medium">{currentLocaleMeta.flag} {currentLocaleMeta.label}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-28">
              {otherLocales.map(([code, meta]) => (
                <DropdownMenuItem
                  key={code}
                  onClick={() => handleLocaleSwitch(code)}
                  className="cursor-pointer gap-2"
                >
                  <span>{meta.flag}</span>
                  <span className="font-medium">{meta.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Shopping Cart */}
          <Link href="/cart">
            <motion.button
              className="relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              aria-label={t("shoppingCart")}
            >
              <ShoppingCart className="h-6 w-6 text-gray-800 dark:text-slate-100" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-400 text-xs font-bold text-white dark:bg-orange-300"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </Link>

          {/* Theme Toggle */}
          {mounted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-9 w-9 text-gray-800 dark:text-slate-100"
                aria-label={theme === "dark" ? t("lightMode") : t("darkMode")}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: theme === "dark" ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </motion.div>
              </Button>
            </motion.div>
          )}

          {/* Auth Buttons / User Menu - Desktop */}
          <div className="hidden items-center gap-2 lg:gap-3 md:flex shrink-0">
            {isLoading ? (
              <div className="flex items-center gap-2" aria-busy="true" aria-label={tCommon("loading")}>
                <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="hidden h-8 w-20 animate-pulse rounded-md bg-gray-200 dark:bg-slate-700 sm:block" />
              </div>
            ) : user ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="shrink-0"
                >
                  <Link href="/create/step1?new=1">
                    <Button className="bg-gradient-to-r from-primary to-brand-2 font-semibold text-white shadow-lg transition-all hover:shadow-xl text-xs sm:text-sm px-2 sm:px-3 lg:px-4">
                      <span className="hidden lg:inline">{t("createBook")}</span>
                      <span className="lg:hidden">{t("create")}</span>
                    </Button>
                  </Link>
                </motion.div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 font-medium">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-brand-2 text-white">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="hidden lg:inline">{user.name || user.email?.split("@")[0]}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        {t("myLibrary")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        {t("myOrders")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        {t("settings")}
                      </Link>
                    </DropdownMenuItem>
                    {(user as { role?: string }).role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          {t("adminPanel")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="font-medium text-gray-800 hover:text-primary dark:text-slate-100">
                    {t("signIn")}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="ghost" className="font-medium text-gray-800 hover:text-primary dark:text-slate-100">
                    {t("signUp")}
                  </Button>
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="shrink-0"
                >
                  <Link href="/create/step1?new=1">
                    <Button className="bg-gradient-to-r from-primary to-brand-2 font-semibold text-white shadow-lg transition-all hover:shadow-xl text-xs sm:text-sm px-2 sm:px-3 lg:px-4">
                      <span className="hidden lg:inline">{t("createBook")}</span>
                      <span className="lg:hidden">{t("create")}</span>
                    </Button>
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobil + tablet + iPad (xl altı): tam genişlikte nav sheet */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="xl:hidden" aria-label={t("openMenu")}>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              hideCloseButton
              className="w-[320px] max-w-[calc(100vw-2rem)] rounded-l-3xl border-l-0 bg-white dark:bg-slate-900"
            >
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex h-full min-h-0 flex-col overflow-y-auto"
              >
                {/* 1. Üst: Logo + Kapat */}
                <div className="mb-6 flex min-w-0 shrink-0 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                    <Image
                      src="/brand/logo.png"
                      alt="HeroKidStory"
                      width={80}
                      height={80}
                      className="h-12 w-12 shrink-0 sm:h-[3.25rem] sm:w-[3.25rem]"
                    />
                    <BrandWordmark size="drawer" />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-label={tCommon("close")}
                    className="h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation rounded-full hover:bg-primary/10 dark:hover:bg-slate-700"
                  >
                    <X className="h-5 w-5 text-gray-800 dark:text-slate-100" />
                  </Button>
                </div>

                {/* 2. Kullanıcı bölümü (giriş yaptıysa) */}
                {!isLoading && user && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-brand-2 text-white">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-gray-900 dark:text-slate-100">
                          {user.name || "User"}
                        </p>
                        <p className="truncate text-sm text-gray-600 dark:text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span className="font-medium">{t("myLibrary")}</span>
                      </Button>
                    </Link>
                    <Link href="/orders" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span className="font-medium">{t("myOrders")}</span>
                      </Button>
                    </Link>
                    <Link href="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span className="font-medium">{t("settings")}</span>
                      </Button>
                    </Link>
                    {(user as { role?: string }).role === "admin" && (
                      <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          <span className="font-medium">{t("adminPanel")}</span>
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {/* 3. Ana CTA */}
                <div className="mt-4">
                  <Link href="/create/step1?new=1" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-primary to-brand-2 font-semibold text-white shadow-lg transition-all hover:shadow-xl">
                      {t("createBook")}
                    </Button>
                  </Link>
                  {!isLoading && !user && (
                    <div className="mt-2 flex gap-2">
                      <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                        <Button variant="outline" className="w-full bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700">
                          <span className="font-medium">{t("signIn")}</span>
                        </Button>
                      </Link>
                      <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)} className="flex-1">
                        <Button variant="outline" className="w-full bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700">
                          <span className="font-medium">{t("signUp")}</span>
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 4. Ayırıcı */}
                <div className="my-4 border-t border-gray-200 dark:border-slate-700" />

                {/* 5. Navigasyon */}
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:bg-primary/10 dark:hover:bg-slate-800"
                      >
                        <Icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                        <span className="text-base font-medium text-gray-800 dark:text-slate-100">
                          {t(link.labelKey)}
                        </span>
                      </Link>
                    )
                  })}
                </nav>

                {/* 6. Ayırıcı */}
                <div className="my-4 border-t border-gray-200 dark:border-slate-700" />

                {/* 7. Araçlar: Sepet, Dil, Tema */}
                <div className="space-y-2">
                  <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-slate-100">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        {t("shoppingCart")}
                      </span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-400 text-xs font-bold text-white dark:bg-orange-300">
                        {cartCount}
                      </span>
                    </div>
                  </Link>
                  {SHOW_CURRENCY_SELECTOR && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700"
                        >
                          <span className="flex items-center gap-2">
                            <span>{selectedCountry.flag}</span>
                            <span className="font-medium">{selectedCountry.currency}</span>
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[272px]">
                        {countries.map((country) => (
                          <DropdownMenuItem
                            key={country.code}
                            onClick={() => setSelectedCountry(country)}
                            className="cursor-pointer gap-2"
                          >
                            <span>{country.flag}</span>
                            <span>{country.currency}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span className="font-medium">
                            {currentLocaleMeta.flag} {currentLocaleMeta.label}
                          </span>
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[272px]">
                      {otherLocales.map(([code, meta]) => (
                        <DropdownMenuItem
                          key={code}
                          onClick={() => {
                            handleLocaleSwitch(code)
                            setIsMobileMenuOpen(false)
                          }}
                          className="cursor-pointer gap-2"
                        >
                          <span>{meta.flag}</span>
                          <span className="font-medium">{meta.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {mounted && (
                    <Button
                      variant="ghost"
                      className="w-full justify-between bg-muted/50 hover:bg-muted dark:bg-slate-800 dark:hover:bg-slate-700"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                      <span className="flex items-center gap-2">
                        {theme === "dark" ? (
                          <Sun className="h-4 w-4" />
                        ) : (
                          <Moon className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {theme === "dark" ? t("lightMode") : t("darkMode")}
                        </span>
                      </span>
                    </Button>
                  )}
                </div>

                {/* 8. Çıkış (sadece giriş yaptıysa) */}
                {!isLoading && user && (
                  <>
                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-700" />
                    <Button
                      variant="outline"
                      className="mt-4 w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="font-medium">{t("logout")}</span>
                    </Button>
                  </>
                )}
              </motion.div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  )
}
