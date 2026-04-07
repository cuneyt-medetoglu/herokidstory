/**
 * Currency detection and configuration
 * Detects user's country based on IP geolocation and returns appropriate currency
 */

import { getProductPrice } from "@/lib/pricing/payment-products"

export type Currency = "USD" | "TRY" | "EUR" | "GBP"

export interface CurrencyConfig {
  currency: Currency
  symbol: string
  price: string
}

// Country to Currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, Currency> = {
  TR: "TRY", // Turkey
  US: "USD", // United States
  GB: "GBP", // United Kingdom
  NL: "EUR", // Netherlands
  DE: "EUR", // Germany
  FR: "EUR", // France
  IT: "EUR", // Italy
  ES: "EUR", // Spain
  BE: "EUR", // Belgium
  AT: "EUR", // Austria
  PT: "EUR", // Portugal
  IE: "EUR", // Ireland
  FI: "EUR", // Finland
  GR: "EUR", // Greece
  // Add more EU countries
  LU: "EUR",
  MT: "EUR",
  CY: "EUR",
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
}

/** Sembol + para birimi; `price` alanı getCurrencyConfig ile doldurulur (katalog: ebook). */
const CURRENCY_SYMBOLS: Record<Currency, Omit<CurrencyConfig, "price">> = {
  USD: { currency: "USD", symbol: "$" },
  TRY: { currency: "TRY", symbol: "₺" },
  EUR: { currency: "EUR", symbol: "€" },
  GBP: { currency: "GBP", symbol: "£" },
}


function formatEbookListPrice(currency: Currency, amount: number): string {
  const sym = CURRENCY_SYMBOLS[currency].symbol
  if (currency === "TRY") {
    return `${sym}${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
  }
  return `${sym}${amount.toFixed(2)}`
}

/**
 * Detect currency based on country code
 * @param countryCode - 2-letter ISO country code (e.g., "TR", "US")
 * @returns Currency code
 */
export function detectCurrencyFromCountry(countryCode: string | null): Currency {
  if (!countryCode) {
    return "USD" // Default fallback
  }

  const upperCountryCode = countryCode.toUpperCase()
  return COUNTRY_CURRENCY_MAP[upperCountryCode] || "USD"
}

/**
 * Get currency configuration
 * @param currency - Currency code
 * @returns Currency configuration with price and symbol
 */
export function getCurrencyConfig(currency: Currency): CurrencyConfig {
  const base = CURRENCY_SYMBOLS[currency]
  const amount = getProductPrice("ebook", currency)
  return {
    ...base,
    price: formatEbookListPrice(currency, amount),
  }
}

/**
 * Detect currency from browser locale as fallback
 * @returns Currency code based on browser language
 */
export function detectCurrencyFromLocale(): Currency {
  if (typeof window === "undefined") {
    return "USD"
  }

  const locale = navigator.language || navigator.languages?.[0] || "en-US"
  
  // Check for Turkish
  if (locale.includes("tr")) {
    return "TRY"
  }
  
  // Check for European countries
  const euLocales = ["nl", "de", "fr", "it", "es", "be", "at", "pt", "ie", "fi", "gr"]
  if (euLocales.some(eu => locale.toLowerCase().includes(eu))) {
    return "EUR"
  }
  
  // Check for UK
  if (locale.includes("en-GB") || locale.includes("gb")) {
    return "GBP"
  }
  
  // Default to USD
  return "USD"
}

/**
 * Get user's currency (server-side)
 * Uses Vercel headers or fallback
 * @param headers - Next.js headers object
 * @returns Currency code
 */
export function getUserCurrency(headers: Headers): Currency {
  // Try Vercel geolocation header first (production)
  const countryCode = headers.get("x-vercel-ip-country")
  
  if (countryCode) {
    return detectCurrencyFromCountry(countryCode)
  }
  
  // Fallback: Try Cloudflare header
  const cfCountry = headers.get("cf-ipcountry")
  if (cfCountry) {
    return detectCurrencyFromCountry(cfCountry)
  }
  
  // Fallback: Try Accept-Language header
  const acceptLanguage = headers.get("accept-language")
  if (acceptLanguage) {
    // Simple check for Turkish
    if (acceptLanguage.toLowerCase().includes("tr")) {
      return "TRY"
    }
  }
  
  // Default fallback
  return "USD"
}
