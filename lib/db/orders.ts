/**
 * @file Sipariş, ödeme ve event tabloları için veritabanı yardımcıları.
 *
 * Her fonksiyon tek sorumluluk ilkesine göre yazılmıştır.
 * Ham SQL sorguları burada; üst katmanlar (API route'ları) iş mantığını yönetir.
 */

import { pool } from './pool'
import type { PoolClient } from 'pg'
import type {
  Order,
  OrderItem,
  OrderWithItems,
  Payment,
  PaymentEvent,
  CreateOrderInput,
  CreateOrderItemInput,
  UpdateOrderStatusInput,
  CreatePaymentInput,
  SavePaymentEventInput,
} from '@/lib/payment/types'

// ============================================================================
// Orders
// ============================================================================

/**
 * Yeni sipariş + satır kalemleri oluşturur (transaction içinde).
 * Fiyatlar her zaman sunucu tarafında hesaplanmalı; frontend'den gelen değer kullanılmaz.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const { rows } = await client.query<Order>(
      `INSERT INTO orders (
        user_id, payment_provider, order_currency,
        subtotal, discount_amount, total_amount,
        promo_code, promo_code_id,
        billing_address, shipping_address,
        status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')
      RETURNING *`,
      [
        input.userId,
        input.provider,
        input.currency,
        input.subtotal,
        input.discountAmount ?? 0,
        input.totalAmount,
        input.promoCode ?? null,
        input.promoCodeId ?? null,
        input.billingAddress  ? JSON.stringify(input.billingAddress)  : null,
        input.shippingAddress ? JSON.stringify(input.shippingAddress) : null,
      ]
    )
    const order = rows[0]

    // Satır kalemleri
    for (const item of input.items) {
      await _insertOrderItem(client, order.id, item)
    }

    await client.query('COMMIT')
    return order
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** Sipariş durumunu günceller. */
export async function updateOrderStatus(
  orderId: string,
  update: UpdateOrderStatusInput
): Promise<Order | null> {
  const setClauses: string[] = ['status = $2']
  const values: unknown[]    = [orderId, update.status]
  let idx = 3

  if (update.paidAt !== undefined) {
    setClauses.push(`paid_at = $${idx++}`)
    values.push(update.paidAt)
  }
  if (update.cancelledAt !== undefined) {
    setClauses.push(`cancelled_at = $${idx++}`)
    values.push(update.cancelledAt)
  }
  if (update.refundedAt !== undefined) {
    setClauses.push(`refunded_at = $${idx++}`)
    values.push(update.refundedAt)
  }
  if (update.failureReason !== undefined) {
    setClauses.push(`failure_reason = $${idx++}`)
    values.push(update.failureReason)
  }
  if (update.notes !== undefined) {
    setClauses.push(`notes = $${idx++}`)
    values.push(update.notes)
  }

  const { rows } = await pool.query<Order>(
    `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    values
  )
  return rows[0] ?? null
}

/** Sipariş + satır kalemleri (kullanıcı sahibiyse döner). */
export async function getOrderWithItems(
  orderId: string,
  userId?: string
): Promise<OrderWithItems | null> {
  const userClause = userId ? 'AND o.user_id = $2' : ''
  const params     = userId ? [orderId, userId] : [orderId]

  const { rows: orderRows } = await pool.query<Order>(
    `SELECT * FROM orders WHERE id = $1 ${userClause} LIMIT 1`,
    params
  )
  if (!orderRows[0]) return null

  const { rows: itemRows } = await pool.query<OrderItem>(
    `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at`,
    [orderId]
  )

  return { ...orderRows[0], items: itemRows }
}

/** Kullanıcının tüm siparişleri (son önce). */
export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const { rows } = await pool.query<Order>(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  )
  return rows
}

// ============================================================================
// User: sipariş + item + kitap bilgisi (settings / orders sayfası)
// ============================================================================

export interface OrderItemWithBook {
  id: string
  book_id: string
  item_type: string
  unit_price: number
  quantity: number
  total_price: number
  fulfillment_status: string
  book_title: string | null
  book_cover_url: string | null
}

export interface UserOrderWithItems extends Order {
  items: OrderItemWithBook[]
}

/**
 * Kullanıcının siparişlerini satır kalemleri ve kitap bilgisiyle döndürür.
 * Tek sorgu — JSON aggregation ile N+1 sorgusu önlenir.
 */
export async function getOrdersByUserWithItems(
  userId: string
): Promise<UserOrderWithItems[]> {
  const { rows } = await pool.query<UserOrderWithItems>(
    `SELECT o.*,
       COALESCE(
         json_agg(
           json_build_object(
             'id',                oi.id,
             'book_id',           oi.book_id,
             'item_type',         oi.item_type,
             'unit_price',        oi.unit_price,
             'quantity',          oi.quantity,
             'total_price',       oi.total_price,
             'fulfillment_status', oi.fulfillment_status,
             'book_title',        b.title,
             'book_cover_url',    b.cover_image_url
           )
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'::json
       ) AS items
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     LEFT JOIN books b ON b.id = oi.book_id
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  )
  return rows
}

// ============================================================================
// Payments
// ============================================================================

/** Ödeme girişimi kaydı oluşturur. */
export async function createPaymentRecord(
  input: CreatePaymentInput
): Promise<Payment> {
  const { rows } = await pool.query<Payment>(
    `INSERT INTO payments (
      order_id, user_id, payment_provider, amount, payment_currency,
      provider_session_id, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *`,
    [
      input.orderId,
      input.userId,
      input.provider,
      input.amount,
      input.currency,
      input.providerSessionId ?? null,
      input.status ?? 'initiated',
    ]
  )
  return rows[0]
}

/** Ödeme kaydını sağlayıcı ID'si ile günceller. */
export async function updatePaymentRecord(
  paymentId: string,
  update: {
    providerPaymentId?: string
    status?: Payment['status']
    providerResponse?: Record<string, unknown>
    threeDSecureUrl?: string
  }
): Promise<Payment | null> {
  const sets: string[]   = []
  const values: unknown[] = [paymentId]
  let idx = 2

  if (update.providerPaymentId !== undefined) {
    sets.push(`provider_payment_id = $${idx++}`)
    values.push(update.providerPaymentId)
  }
  if (update.status !== undefined) {
    sets.push(`status = $${idx++}`)
    values.push(update.status)
  }
  if (update.providerResponse !== undefined) {
    sets.push(`provider_response = $${idx++}`)
    values.push(JSON.stringify(update.providerResponse))
  }
  if (update.threeDSecureUrl !== undefined) {
    sets.push(`three_d_secure_url = $${idx++}`)
    values.push(update.threeDSecureUrl)
  }

  if (sets.length === 0) return null

  const { rows } = await pool.query<Payment>(
    `UPDATE payments SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    values
  )
  return rows[0] ?? null
}

// ============================================================================
// Payment Events (webhook / callback log)
// ============================================================================

/**
 * Webhook veya callback olayını kaydeder.
 * provider_event_id varsa idempotency unique index devreye girer —
 * aynı event ikinci kez gelirse INSERT başarısız olur (ON CONFLICT DO NOTHING).
 */
export async function savePaymentEvent(
  input: SavePaymentEventInput
): Promise<PaymentEvent | null> {
  const { rows } = await pool.query<PaymentEvent>(
    `INSERT INTO payment_events (
      payment_provider, event_type, raw_payload,
      order_id, payment_id, provider_event_id
    ) VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (payment_provider, provider_event_id)
      WHERE provider_event_id IS NOT NULL
    DO NOTHING
    RETURNING *`,
    [
      input.provider,
      input.eventType,
      JSON.stringify(input.rawPayload),
      input.orderId   ?? null,
      input.paymentId ?? null,
      input.providerEventId ?? null,
    ]
  )
  return rows[0] ?? null   // null = duplicate (idempotent olarak görmezden gel)
}

/**
 * Sipariş ID ve sağlayıcıya göre ödeme kaydını döndürür.
 * Callback handler'da ödeme kaydını güncellemek için kullanılır.
 */
export async function getPaymentByOrderId(
  orderId: string,
  provider: Payment['payment_provider']
): Promise<Payment | null> {
  const { rows } = await pool.query<Payment>(
    `SELECT * FROM payments
     WHERE order_id = $1 AND payment_provider = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [orderId, provider]
  )
  return rows[0] ?? null
}

/** İşlenmiş olarak işaretle. */
export async function markPaymentEventProcessed(
  eventId: string,
  errorMessage?: string
): Promise<void> {
  await pool.query(
    `UPDATE payment_events
     SET processed = TRUE,
         processed_at = NOW(),
         error_message = $2
     WHERE id = $1`,
    [eventId, errorMessage ?? null]
  )
}

// ============================================================================
// Admin: sipariş listesi
// ============================================================================

export interface AdminOrderRow extends Order {
  user_email: string
  user_name: string | null
  items: OrderItemWithBook[]
}

export interface GetAdminOrdersOptions {
  page?: number
  limit?: number
  status?: string
  provider?: string
  search?: string
}

export async function getAdminOrders(
  opts: GetAdminOrdersOptions = {}
): Promise<{ rows: AdminOrderRow[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const page  = Math.max(1, opts.page ?? 1)
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20))
  const offset = (page - 1) * limit

  const conditions: string[] = []
  const values: unknown[]    = []
  let idx = 1

  if (opts.status) {
    conditions.push(`o.status = $${idx++}`)
    values.push(opts.status)
  }
  if (opts.provider) {
    conditions.push(`o.payment_provider = $${idx++}`)
    values.push(opts.provider)
  }
  if (opts.search) {
    conditions.push(
      `(u.email ILIKE $${idx} OR o.id::text ILIKE $${idx})`
    )
    values.push(`%${opts.search}%`)
    idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query<AdminOrderRow>(
    `SELECT o.*,
            u.email AS user_email,
            u.name  AS user_name,
            (SELECT COALESCE(json_agg(
              json_build_object(
                'id',                oi.id,
                'book_id',           oi.book_id,
                'item_type',         oi.item_type,
                'unit_price',        oi.unit_price,
                'quantity',          oi.quantity,
                'total_price',       oi.total_price,
                'fulfillment_status', oi.fulfillment_status,
                'book_title',        b.title,
                'book_cover_url',    b.cover_image_url
              )
            ), '[]'::json)
            FROM order_items oi
            LEFT JOIN books b ON b.id = oi.book_id
            WHERE oi.order_id = o.id
            ) AS items
     FROM orders o
     JOIN public.users u ON u.id = o.user_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  )

  const { rows: countRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM orders o
     JOIN public.users u ON u.id = o.user_id
     ${where}`,
    values
  )

  const total = parseInt(countRows[0].count, 10)

  return {
    rows,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit) || 1,
  }
}

// ============================================================================
// Order detail (kullanıcı + admin)
// ============================================================================

export interface OrderDetailForUser extends Order {
  items: OrderItemWithBook[]
}

/**
 * Tek sipariş detayı — kullanıcı tarafı.
 * userId verilirse sahiplik kontrolü yapılır.
 */
export async function getOrderDetailForUser(
  orderId: string,
  userId: string
): Promise<OrderDetailForUser | null> {
  const { rows } = await pool.query<OrderDetailForUser>(
    `SELECT o.*,
       (SELECT COALESCE(json_agg(
         json_build_object(
           'id',                oi.id,
           'book_id',           oi.book_id,
           'item_type',         oi.item_type,
           'unit_price',        oi.unit_price,
           'quantity',          oi.quantity,
           'total_price',       oi.total_price,
           'fulfillment_status', oi.fulfillment_status,
           'book_title',        b.title,
           'book_cover_url',    b.cover_image_url
         )
       ), '[]'::json)
       FROM order_items oi
       LEFT JOIN books b ON b.id = oi.book_id
       WHERE oi.order_id = o.id
       ) AS items
     FROM orders o
     WHERE o.id = $1 AND o.user_id = $2
     LIMIT 1`,
    [orderId, userId]
  )
  return rows[0] ?? null
}

export interface AdminOrderDetail extends Order {
  user_email: string
  user_name: string | null
  items: OrderItemWithBook[]
  payments: Payment[]
  events: PaymentEvent[]
}

/**
 * Tek sipariş detayı — admin tarafı.
 * Kullanıcı bilgisi, ödeme kayıtları ve eventler dahil.
 */
export async function getOrderDetailForAdmin(
  orderId: string
): Promise<AdminOrderDetail | null> {
  const { rows: orderRows } = await pool.query(
    `SELECT o.*,
       u.email AS user_email,
       u.name  AS user_name,
       (SELECT COALESCE(json_agg(
         json_build_object(
           'id',                oi.id,
           'book_id',           oi.book_id,
           'item_type',         oi.item_type,
           'unit_price',        oi.unit_price,
           'quantity',          oi.quantity,
           'total_price',       oi.total_price,
           'fulfillment_status', oi.fulfillment_status,
           'book_title',        b.title,
           'book_cover_url',    b.cover_image_url
         )
       ), '[]'::json)
       FROM order_items oi
       LEFT JOIN books b ON b.id = oi.book_id
       WHERE oi.order_id = o.id
       ) AS items
     FROM orders o
     JOIN public.users u ON u.id = o.user_id
     WHERE o.id = $1
     LIMIT 1`,
    [orderId]
  )
  if (!orderRows[0]) return null

  const [paymentResult, eventResult] = await Promise.all([
    pool.query<Payment>(
      `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC`,
      [orderId]
    ),
    pool.query<PaymentEvent>(
      `SELECT * FROM payment_events WHERE order_id = $1 ORDER BY received_at DESC`,
      [orderId]
    ),
  ])

  return {
    ...orderRows[0],
    payments: paymentResult.rows,
    events: eventResult.rows,
  } as AdminOrderDetail
}

// ============================================================================
// Post-payment: sipariş + kullanıcı bilgisi (e-posta için)
// ============================================================================

export interface OrderForEmail {
  id: string
  status: string
  order_currency: string
  total_amount: number
  subtotal: number
  discount_amount: number
  promo_code: string | null
  promo_code_id: string | null
  billing_address: Record<string, unknown> | null
  user_id: string
  user_email: string
  user_name: string | null
  payment_provider: string
  items: Array<{
    id: string
    book_id: string
    item_type: string
    unit_price: number
    quantity: number
    total_price: number
    book_title: string | null
    book_cover_url: string | null
    fulfillment_status: string
  }>
}

/**
 * Post-payment handler için sipariş + kullanıcı bilgisi.
 * E-posta şablonlarına gerekli tüm veriyi tek sorguda getirir.
 */
export async function getOrderForEmail(
  orderId: string
): Promise<OrderForEmail | null> {
  const { rows } = await pool.query<OrderForEmail>(
    `SELECT o.*,
       u.email AS user_email,
       u.name  AS user_name,
       (SELECT COALESCE(json_agg(
         json_build_object(
           'id',                oi.id,
           'book_id',           oi.book_id,
           'item_type',         oi.item_type,
           'unit_price',        oi.unit_price,
           'quantity',          oi.quantity,
           'total_price',       oi.total_price,
           'fulfillment_status', oi.fulfillment_status,
           'book_title',        b.title,
           'book_cover_url',    b.cover_image_url
         )
       ), '[]'::json)
       FROM order_items oi
       LEFT JOIN books b ON b.id = oi.book_id
       WHERE oi.order_id = o.id
       ) AS items
     FROM orders o
     JOIN public.users u ON u.id = o.user_id
     WHERE o.id = $1
     LIMIT 1`,
    [orderId]
  )
  return rows[0] ?? null
}

// ============================================================================
// İç yardımcılar
// ============================================================================

async function _insertOrderItem(
  client: PoolClient,
  orderId: string,
  item: CreateOrderItemInput
): Promise<void> {
  const quantity   = item.quantity ?? 1
  const totalPrice = item.unitPrice * quantity

  await client.query(
    `INSERT INTO order_items (
      order_id, book_id, item_type,
      unit_price, quantity, total_price
    ) VALUES ($1,$2,$3,$4,$5,$6)`,
    [orderId, item.bookId, item.itemType, item.unitPrice, quantity, totalPrice]
  )
}
