/**
 * @file iyzico ödeme doğrulama.
 *
 * Callback'ten gelen token ile iyzico API'ye sorgulama yapar.
 * Sonuç normalize edilerek döndürülür; ham yanıt audit log için `rawResult`'ta saklanır.
 *
 * ÖNEMLI: Bu fonksiyon her zaman resolve eder (reject etmez).
 * Ağ hatası bile `success: false` olarak normalize edilir.
 * Çağıran katman her iki durumu da işlemelidir.
 */

import { getIyzicoClient } from './client'
import type { IyzicoVerifyResult } from './types'

/**
 * iyzico Checkout Form sonucunu token üzerinden doğrular.
 *
 * `checkoutForm.retrieve` → `/payment/iyzipos/checkoutform/auth/ecom/detail`
 *
 * @param token - iyzico'nun callback POST'unda gönderdiği token
 */
export async function verifyIyzicoPayment(token: string): Promise<IyzicoVerifyResult> {
  const iyzico = getIyzicoClient()

  return new Promise<IyzicoVerifyResult>((resolve) => {
    iyzico.checkoutForm.retrieve(
      { locale: 'TR', token },
      (err, result) => {
        // Ağ / SDK hatası
        if (err) {
          return resolve({
            success:      false,
            errorMessage: err.message,
            rawResult:    { sdkError: err.message },
          })
        }

        // iyzico yanıtını normalize et
        const raw = result as typeof result & {
          errorCode?:    string
          errorMessage?: string
        }

        const isSuccess = result.paymentStatus === 'SUCCESS'

        resolve({
          success:       isSuccess,
          paymentId:     result.paymentId  || undefined,
          conversationId: result.conversationId || undefined,
          basketId:      result.basketId   || undefined,
          paidPrice:     isSuccess
            ? (typeof result.paidPrice === 'string'
                ? parseFloat(result.paidPrice)
                : result.paidPrice)
            : undefined,
          errorMessage:  isSuccess ? undefined : (raw.errorMessage ?? 'Ödeme başarısız'),
          errorCode:     isSuccess ? undefined : raw.errorCode,
          rawResult:     result as unknown as Record<string, unknown>,
        })
      }
    )
  })
}
