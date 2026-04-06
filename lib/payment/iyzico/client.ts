/**
 * @file iyzico SDK istemcisi (singleton).
 *
 * - Uygulama boyunca tek bir Iyzipay örneği kullanılır.
 * - Ortam değişkenleri her zaman `lib/payment/config.ts` üzerinden okunur;
 *   bu dosya doğrudan process.env'e erişmez.
 * - Test ortamında `_resetIyzicoClient()` ile singleton sıfırlanabilir.
 */

import Iyzipay from 'iyzipay'
import { getPaymentConfig } from '@/lib/payment/config'

// ============================================================================
// Singleton
// ============================================================================

let _client: Iyzipay | null = null

/**
 * iyzico istemcisini döndürür.
 *
 * İlk çağrıda oluşturulur; sonraki çağrılarda aynı nesne döner.
 * Konfigürasyon eksikse (apiKey / secretKey / baseUrl) hata fırlatır —
 * bu, yapılandırma sorunlarının erken ve net biçimde görünmesini sağlar.
 */
export function getIyzicoClient(): Iyzipay {
  if (_client) return _client

  const { iyzico } = getPaymentConfig()

  if (!iyzico.enabled) {
    throw new Error(
      'iyzico entegrasyonu aktif değil. ' +
        'IYZICO_API_KEY ve IYZICO_SECRET_KEY ortam değişkenlerini kontrol edin.'
    )
  }

  _client = new Iyzipay({
    apiKey:    iyzico.apiKey,
    secretKey: iyzico.secretKey,
    uri:       iyzico.baseUrl,
  })

  return _client
}

/** Test ortamında singleton'ı sıfırlar (jest / vitest). */
export function _resetIyzicoClient(): void {
  _client = null
}
