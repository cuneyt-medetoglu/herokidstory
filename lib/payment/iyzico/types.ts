/**
 * @file iyzico entegrasyonu için uygulama-düzeyi TypeScript tipleri.
 *
 * @types/iyzipay paketini tamamlar; SDK'nın checkout form ile ilgili
 * eksik/yanlış tiplerini düzeltir ve normalize edilmiş sonuç arayüzleri ekler.
 */

// ============================================================================
// Checkout Form İstek Tipi
// ============================================================================

/**
 * iyzico Checkout Form initialize isteği.
 *
 * @types/iyzipay `checkoutFormInitialize.create`'i `ThreeDSInitializePaymentRequestData`
 * ile tanımlar; ancak checkout form'a özgü farklar var:
 *  - `installments` (tek tamsayı) yerine `enabledInstallments` (dizi) kullanılır.
 *  - `paymentCard` gönderilmez — kart bilgilerini iyzico formu kendisi toplar.
 *  - `price` ve `paidPrice` string olarak gönderilir ("299.00" gibi).
 */
export interface IyzicoCheckoutFormRequest {
  locale?: 'TR' | 'EN'
  /** Korelasyon ID'si — bizim orderId'imizle aynı değer */
  conversationId: string
  /** Toplam tutar, string: "299.00" */
  price: string
  /** Ödenecek tutar (indirim yoksa price ile aynı), string: "299.00" */
  paidPrice: string
  currency: 'TRY' | 'EUR' | 'USD' | 'GBP'
  basketId?: string
  paymentGroup?: 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION'
  /** iyzico'nun callback POST atağı yapacağı URL */
  callbackUrl: string
  /** Aktif taksit seçenekleri. Tek seferlik ödeme: [1] */
  enabledInstallments?: number[]
  buyer: IyzicoBuyer
  shippingAddress: IyzicoAddress
  billingAddress: IyzicoAddress
  basketItems: IyzicoBasketItem[]
}

export interface IyzicoBuyer {
  id: string
  name: string
  surname: string
  gsmNumber?: string
  email?: string
  /**
   * TC Kimlik No (zorunlu alan — sandbox'ta "11111111111" kullanılabilir).
   * Prodüksiyonda gerçek kimlik doğrulaması için müşteriden alınmalıdır.
   */
  identityNumber: string
  lastLoginDate?: string
  registrationDate?: string
  registrationAddress: string
  ip: string
  city: string
  country: string
  zipCode?: string
}

export interface IyzicoAddress {
  contactName: string
  city: string
  country: string
  address: string
  zipCode?: string
}

export interface IyzicoBasketItem {
  id: string
  name: string
  category1: string
  category2?: string
  /** VIRTUAL = dijital ürün (e-book), PHYSICAL = fiziksel (hardcopy) */
  itemType: 'PHYSICAL' | 'VIRTUAL'
  /** Kalem tutarı, string: "299.00" */
  price: string
}

// ============================================================================
// Normalize Sonuç Tipleri
// ============================================================================

/**
 * iyzico checkout form başlatma sonucu (normalize edilmiş).
 * Hata durumlarında initializeIyzicoCheckoutForm fırlatır (resolve etmez).
 */
export interface IyzicoInitResult {
  token: string
  checkoutFormContent: string
}

/**
 * iyzico ödeme doğrulama sonucu (normalize edilmiş).
 *
 * `rawResult` payment_events tablosuna kaydedilir — tam iyzico yanıtını saklar.
 */
export interface IyzicoVerifyResult {
  success: boolean
  /** iyzico tarafından atanan ödeme ID'si (başarı durumunda) */
  paymentId?: string
  /**
   * conversationId — checkout form initialize'da gönderdiğimiz orderId.
   * Callback'te siparişi bulmak için kullanılır.
   */
  conversationId?: string
  basketId?: string
  /** Gerçekte ödenen tutar (indirim/taksit farkı varsa farklı olabilir) */
  paidPrice?: number
  errorMessage?: string
  errorCode?: string
  /** Ham iyzico yanıtı — audit log için */
  rawResult: Record<string, unknown>
}

// ============================================================================
// iyzico SDK hata nesnesi (Promise reject'te kullanılır)
// ============================================================================

export interface IyzicoError extends Error {
  errorCode?: string
  errorGroup?: string
  conversationId?: string
}
