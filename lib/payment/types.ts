/**
 * @file Ödeme sistemi ortak TypeScript tipleri.
 *
 * Bu dosya yalnızca tip tanımları içerir (runtime kodu yok).
 * iyzico, Stripe ve ileride eklenecek sağlayıcılar bu tipler üzerinden çalışır.
 */

// ============================================================================
// Temel sabitler
// ============================================================================

export type PaymentProvider = 'iyzico' | 'stripe'

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'

/** Sipariş satır kalemi türleri */
export type OrderItemType = 'ebook' | 'hardcopy' | 'bundle'

/** Hardcopy fulfillment durumu */
export type FulfillmentStatus =
  | 'pending'
  | 'processing'
  | 'printed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

// ============================================================================
// DB satır tipleri (PostgreSQL → TypeScript)
// ============================================================================

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  /** DB sütunu: payment_provider (`provider` anahtar kelime çakışması yok) */
  payment_provider: PaymentProvider
  /** DB sütunu: order_currency */
  order_currency: string
  subtotal: number
  discount_amount: number
  total_amount: number
  promo_code: string | null
  promo_code_id: string | null
  billing_address: BillingAddress | null
  shipping_address: ShippingAddress | null
  notes: string | null
  failure_reason: string | null
  created_at: Date
  updated_at: Date
  paid_at: Date | null
  cancelled_at: Date | null
  refunded_at: Date | null
}

export interface OrderItem {
  id: string
  order_id: string
  book_id: string
  item_type: OrderItemType
  unit_price: number
  quantity: number
  total_price: number
  fulfillment_status: FulfillmentStatus
  tracking_number: string | null
  tracking_url: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
}

export interface Payment {
  id: string
  order_id: string
  payment_provider: PaymentProvider
  provider_payment_id: string | null
  provider_session_id: string | null
  status: PaymentStatus
  amount: number
  payment_currency: string
  provider_response: Record<string, unknown> | null
  three_d_secure_url: string | null
  created_at: Date
  updated_at: Date
}

export interface PaymentEvent {
  id: string
  order_id: string | null
  payment_id: string | null
  payment_provider: PaymentProvider
  provider_event_id: string | null
  event_type: string
  raw_payload: Record<string, unknown>
  processed: boolean
  processed_at: Date | null
  error_message: string | null
  received_at: Date
}

// ============================================================================
// Adres tipleri
// ============================================================================

export interface BillingAddress {
  name: string
  address: string
  city: string
  country: string
  zip?: string
  phone?: string
  identityNumber?: string  // iyzico — TR kullanıcıları için opsiyonel
}

export interface ShippingAddress extends BillingAddress {}

// ============================================================================
// DB fonksiyon input tipleri
// ============================================================================

export interface CreateOrderInput {
  userId: string
  provider: PaymentProvider
  currency: string
  subtotal: number
  discountAmount?: number
  totalAmount: number
  promoCode?: string
  billingAddress?: BillingAddress
  shippingAddress?: ShippingAddress
  items: CreateOrderItemInput[]
}

export interface CreateOrderItemInput {
  bookId: string
  itemType: OrderItemType
  unitPrice: number
  quantity?: number
}

export interface UpdateOrderStatusInput {
  status: OrderStatus
  paidAt?: Date
  cancelledAt?: Date
  refundedAt?: Date
  providerPaymentId?: string
  failureReason?: string
}

export interface CreatePaymentInput {
  orderId: string
  provider: PaymentProvider
  amount: number
  currency: string
  providerSessionId?: string
  status?: PaymentStatus
}

export interface SavePaymentEventInput {
  provider: PaymentProvider
  eventType: string
  rawPayload: Record<string, unknown>
  orderId?: string | null
  paymentId?: string | null
  providerEventId?: string | null
}

// ============================================================================
// API yanıt tipleri
// ============================================================================

/** GET /api/payment/provider yanıtı */
export interface PaymentProviderResponse {
  provider: PaymentProvider
  countryCode: string | null
  /** Stripe henüz aktif değilse true — frontend'de bilgilendirme gösterilebilir */
  stripeUnavailable: boolean
}

/** Sipariş özeti (kullanıcı ve admin sayfaları için) */
export interface OrderWithItems extends Order {
  items: OrderItem[]
}
