/**
 * @file Ödeme sağlayıcısı seçim mantığı.
 *
 * Kural: TR → iyzico, diğer ülkeler → Stripe.
 * Stripe henüz aktif değilse stripeUnavailable: true döner;
 * çağıran katman kullanıcıya bilgilendirme gösterebilir.
 *
 * Geliştirme ortamında DEV_FORCE_PAYMENT_PROVIDER=iyzico ile override yapılabilir.
 */

import type { PaymentProvider, PaymentProviderResponse } from './types'
import { getPaymentConfig } from './config'
import { detectCurrencyFromCountry } from '@/lib/currency'

/** TR ülke kodu */
const IYZICO_COUNTRY = 'TR'

/**
 * Sunucu taraflı — request headers'tan ülke kodu ve sağlayıcıyı belirler.
 * Vercel geo, Cloudflare ve Accept-Language sırasıyla denenir.
 */
export function resolvePaymentProvider(headers: Headers): PaymentProviderResponse {
  const config = getPaymentConfig()

  // Geliştirme override
  if (config.devForceProvider) {
    return {
      provider: config.devForceProvider,
      countryCode: null,
      stripeUnavailable: !config.stripe.enabled,
    }
  }

  const countryCode =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    _guessCountryFromAcceptLanguage(headers.get('accept-language')) ||
    null

  const wantIyzico = countryCode?.toUpperCase() === IYZICO_COUNTRY

  if (wantIyzico && config.iyzico.enabled) {
    return { provider: 'iyzico', countryCode, stripeUnavailable: false }
  }

  if (!wantIyzico && config.stripe.enabled) {
    return { provider: 'stripe', countryCode, stripeUnavailable: false }
  }

  // Stripe aktif değil → iyzico'ya düşecek veya bilgilendirme gösterilecek
  if (config.iyzico.enabled) {
    return { provider: 'iyzico', countryCode, stripeUnavailable: !config.stripe.enabled }
  }

  // Hiçbir sağlayıcı aktif değil (geliştirme / hatalı env)
  return { provider: 'iyzico', countryCode, stripeUnavailable: true }
}

/**
 * Saf fonksiyon — ülke kodu string'inden sağlayıcı döndürür.
 * Testlerde headers mock'u olmadan kullanılabilir.
 */
export function getProviderForCountry(
  countryCode: string | null
): PaymentProvider {
  if (!countryCode) return 'stripe'
  return countryCode.toUpperCase() === IYZICO_COUNTRY ? 'iyzico' : 'stripe'
}

// ============================================================================
// Özel yardımcı
// ============================================================================

/** Accept-Language başlığından kaba ülke/dil tahmini (fallback) */
function _guessCountryFromAcceptLanguage(header: string | null): string | null {
  if (!header) return null
  // "tr-TR,tr;q=0.9,en;q=0.8" → "TR"
  const match = header.match(/([a-zA-Z]{2})-([a-zA-Z]{2})/)
  if (match) return match[2].toUpperCase()
  if (header.toLowerCase().startsWith('tr')) return 'TR'
  return null
}
