import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { buildPageMetadata } from '@/lib/metadata'
import { Hero } from '@/components/sections/Hero'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { ExampleBooksCarousel } from '@/components/sections/ExampleBooksCarousel'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { PricingSection } from '@/components/sections/PricingSection'
import { FAQSection } from '@/components/sections/FAQSection'

// İlk yüklemede JS/hydration’ı azaltmak için alt bölümler ayrı chunk (bkz. HERO_TRANSFORMATION_PERFORMANCE_ANALYSIS.md – ilk yükleme gözlemi)
const DynamicHowItWorks = dynamic(
  () => import('@/components/sections/HowItWorks').then((m) => ({ default: m.HowItWorks })),
  { ssr: true }
)
const DynamicExampleBooksCarousel = dynamic(
  () => import('@/components/sections/ExampleBooksCarousel').then((m) => ({ default: m.ExampleBooksCarousel })),
  { ssr: true }
)
const DynamicFeaturesSection = dynamic(
  () => import('@/components/sections/FeaturesSection').then((m) => ({ default: m.FeaturesSection })),
  { ssr: true }
)
const DynamicPricingSection = dynamic(
  () => import('@/components/sections/PricingSection').then((m) => ({ default: m.PricingSection })),
  { ssr: true }
)
const DynamicFAQSection = dynamic(
  () => import('@/components/sections/FAQSection').then((m) => ({ default: m.FAQSection })),
  { ssr: true }
)

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string }
}): Promise<Metadata> {
  return buildPageMetadata(locale, 'home', '')
}

export default function Home() {
  return (
    <>
      <Hero />
      <DynamicHowItWorks />
      <DynamicExampleBooksCarousel />
      <DynamicFeaturesSection />
      <DynamicPricingSection />
      <DynamicFAQSection />
    </>
  )
}
