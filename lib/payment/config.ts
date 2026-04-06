/**
 * @file Ödeme sistemi konfigürasyonu.
 *
 * Tüm sağlayıcı ayarları buradan okunur.
 * Kod içinde process.env.IYZICO_* gibi doğrudan erişim yerine bu modül kullanılır.
 */

import type { PaymentProvider } from './types'

// ============================================================================
// iyzico
// ============================================================================

export interface IyzicoConfig {
  apiKey: string
  secretKey: string
  baseUrl: string
  /** Sandbox mı, canlı mı? (baseUrl'den otomatik tespit) */
  isSandbox: boolean
  enabled: boolean
}

function buildIyzicoConfig(): IyzicoConfig {
  const apiKey    = process.env.IYZICO_API_KEY    ?? ''
  const secretKey = process.env.IYZICO_SECRET_KEY ?? ''
  const baseUrl   = process.env.IYZICO_BASE_URL   ?? 'https://sandbox-api.iyzipay.com'

  return {
    apiKey,
    secretKey,
    baseUrl,
    isSandbox: baseUrl.includes('sandbox'),
    enabled: Boolean(apiKey && secretKey),
  }
}

// ============================================================================
// Stripe (şimdilik pasif — Faz 2'de aktifleşecek)
// ============================================================================

export interface StripeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
  isSandbox: boolean
  enabled: boolean
}

function buildStripeConfig(): StripeConfig {
  const secretKey      = process.env.STRIPE_SECRET_KEY                  ?? ''
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
  const webhookSecret  = process.env.STRIPE_WEBHOOK_SECRET              ?? ''

  return {
    secretKey,
    publishableKey,
    webhookSecret,
    isSandbox: secretKey.startsWith('sk_test_'),
    enabled: Boolean(secretKey),
  }
}

// ============================================================================
// Ana payment config
// ============================================================================

export interface PaymentConfig {
  iyzico: IyzicoConfig
  stripe: StripeConfig
  /**
   * Hangi sağlayıcılar aktif?
   * Stripe henüz entegre edilmediğinde enabled: false olur;
   * provider seçicisi bunu kontrol eder.
   */
  enabledProviders: PaymentProvider[]
  /**
   * Geliştirme ortamında sağlayıcıyı override etmek için:
   * .env içinde DEV_FORCE_PAYMENT_PROVIDER=iyzico
   */
  devForceProvider: PaymentProvider | null
}

let _config: PaymentConfig | null = null

/** Singleton — her yerde aynı nesne okunur */
export function getPaymentConfig(): PaymentConfig {
  if (_config) return _config

  const iyzico = buildIyzicoConfig()
  const stripe  = buildStripeConfig()

  const enabledProviders: PaymentProvider[] = []
  if (iyzico.enabled) enabledProviders.push('iyzico')
  if (stripe.enabled)  enabledProviders.push('stripe')

  const rawForce = process.env.DEV_FORCE_PAYMENT_PROVIDER
  const devForceProvider: PaymentProvider | null =
    rawForce === 'iyzico' || rawForce === 'stripe' ? rawForce : null

  _config = { iyzico, stripe, enabledProviders, devForceProvider }
  return _config
}

/** Test ortamında config'i sıfırlamak için (jest vb.) */
export function _resetPaymentConfigCache() {
  _config = null
}
