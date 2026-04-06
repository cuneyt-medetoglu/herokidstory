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
        null,   // promo_code_id — ileride promo_codes FK
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
// Payments
// ============================================================================

/** Ödeme girişimi kaydı oluşturur. */
export async function createPaymentRecord(
  input: CreatePaymentInput
): Promise<Payment> {
  const { rows } = await pool.query<Payment>(
    `INSERT INTO payments (
      order_id, payment_provider, amount, payment_currency,
      provider_session_id, status
    ) VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`,
    [
      input.orderId,
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
}

export interface GetAdminOrdersOptions {
  page?: number
  limit?: number
  status?: string
  provider?: string
  search?: string    // sipariş ID, kullanıcı email
}

export async function getAdminOrders(
  opts: GetAdminOrdersOptions = {}
): Promise<{ rows: AdminOrderRow[]; total: number }> {
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
            u.name  AS user_name
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

  return { rows, total: parseInt(countRows[0].count, 10) }
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
