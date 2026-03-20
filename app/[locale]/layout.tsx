import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { CartProvider } from '@/contexts/CartContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { NavigationProgress } from '@/components/providers/NavigationProgress'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { buildPageMetadata } from '@/lib/metadata'

const inter = Inter({ subsets: ['latin'] })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return buildPageMetadata(locale, 'home', '')
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <NavigationProgress />
            <SessionProvider>
              <CurrencyProvider>
                <CartProvider>
                  {children}
                </CartProvider>
              </CurrencyProvider>
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
