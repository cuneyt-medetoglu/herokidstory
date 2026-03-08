import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/metadata'
import { Hero } from '@/components/sections/Hero'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { ExampleBooksCarousel } from '@/components/sections/ExampleBooksCarousel'
import { FeaturesSection } from '@/components/sections/FeaturesSection'
import { PricingSection } from '@/components/sections/PricingSection'
import { FAQSection } from '@/components/sections/FAQSection'

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
      <HowItWorks />
      <ExampleBooksCarousel />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
    </>
  )
}
