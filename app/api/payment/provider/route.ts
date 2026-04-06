/**
 * GET /api/payment/provider
 *
 * Kullanıcının IP / geo bilgisine göre hangi ödeme sağlayıcısının
 * gösterileceğini döndürür.
 *
 * Yanıt:  PaymentProviderResponse
 *   - provider:         'iyzico' | 'stripe'
 *   - countryCode:      'TR' | 'US' | null (lokal geliştirme)
 *   - stripeUnavailable: Stripe henüz aktif değilse true
 *
 * Cache: force-dynamic — her istek IP'ye özgüdür.
 */

import { type NextRequest }  from 'next/server'
import { resolvePaymentProvider } from '@/lib/payment/provider'
import { successResponse, handleAPIError } from '@/lib/api/response'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const result = resolvePaymentProvider(request.headers)
    return successResponse(result)
  } catch (err) {
    return handleAPIError(err)
  }
}
