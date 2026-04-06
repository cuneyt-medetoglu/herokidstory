/**
 * @file iyzico Checkout Form başlatma.
 *
 * iyzipay SDK'nın callback tabanlı API'sini Promise'e sarar.
 * Ödeme formu token'ı ve iframe HTML içeriği döndürür.
 *
 * Kullanım:
 *   const result = await initializeIyzicoCheckoutForm(params)
 *   // result.token → callback'te doğrulama için saklanır
 *   // result.checkoutFormContent → frontend'de inject edilir
 */

import { getIyzicoClient } from './client'
import type { IyzicoCheckoutFormRequest, IyzicoInitResult, IyzicoError } from './types'

// ============================================================================
// Yardımcı: Para birimi formatı
// ============================================================================

/**
 * Sayısal tutarı iyzico'nun beklediği string formatına çevirir.
 * Örnek: 299 → "299.00", 12.5 → "12.50"
 */
export function formatIyzicoAmount(amount: number): string {
  return amount.toFixed(2)
}

// ============================================================================
// Checkout Form Başlatma
// ============================================================================

/**
 * iyzico Checkout Form token'ı ve iframe HTML içeriği alır.
 *
 * Hata durumunda reject eder — çağıran katman (API route) try/catch ile yakalar.
 *
 * @throws {IyzicoError} iyzico API hatası veya ağ hatası
 */
export async function initializeIyzicoCheckoutForm(
  params: IyzicoCheckoutFormRequest
): Promise<IyzicoInitResult> {
  const iyzico = getIyzicoClient()

  return new Promise<IyzicoInitResult>((resolve, reject) => {
    /*
     * SDK TypeScript tanımı ThreeDSInitializePaymentRequestData bekliyor,
     * ancak checkout form biraz farklı istek yapısı kabul ediyor
     * (enabledInstallments dizisi, paymentCard yok).
     * SDK runtime'da JSON'ı olduğu gibi API'ye iletir; cast güvenli.
     */
    iyzico.checkoutFormInitialize.create(
      params as Parameters<typeof iyzico.checkoutFormInitialize.create>[0],
      (err, result) => {
        if (err) {
          return reject(err)
        }

        if (result.status !== 'success') {
          // iyzico hata yanıtını IyzicoError'a dönüştür
          const raw = result as typeof result & {
            errorCode?: string
            errorMessage?: string
            errorGroup?: string
            conversationId?: string
          }

          const error: IyzicoError = Object.assign(
            new Error(raw.errorMessage ?? 'iyzico checkout form başlatılamadı'),
            {
              errorCode:      raw.errorCode,
              errorGroup:     raw.errorGroup,
              conversationId: raw.conversationId,
            }
          )
          return reject(error)
        }

        resolve({
          token:               result.token,
          checkoutFormContent: result.checkoutFormContent,
        })
      }
    )
  })
}
