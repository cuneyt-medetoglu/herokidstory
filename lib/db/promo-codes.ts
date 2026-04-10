/**
 * @file Promo kodu veritabanı yardımcıları.
 *
 * Doğrulama, CRUD ve kullanım kaydı fonksiyonları.
 */

import { pool } from './pool'

// ============================================================================
// Tipler
// ============================================================================

export type DiscountType = 'percent' | 'fixed'

export interface PromoCode {
  id:                string
  code:              string
  discount_type:     DiscountType
  discount_value:    number
  currency:          string | null
  max_uses:          number | null
  used_count:        number
  max_uses_per_user: number | null
  valid_from:        Date | null
  valid_until:       Date | null
  min_order_amount:  number | null
  applicable_to:     string[] | null
  is_active:         boolean
  description:       string | null
  created_at:        Date
  updated_at:        Date
}

export interface ValidatePromoResult {
  valid:          boolean
  error?:         PromoValidationError
  code?:          string
  promoCodeId?:   string
  discountType?:  DiscountType
  discountValue?: number
  discountAmount: number
  finalAmount?:   number
}

export type PromoValidationError =
  | 'not_found'
  | 'inactive'
  | 'expired'
  | 'not_started'
  | 'limit_reached'
  | 'user_limit_reached'
  | 'min_order_not_met'
  | 'product_not_applicable'
  | 'currency_mismatch'

export interface ValidatePromoInput {
  code:         string
  userId:       string
  subtotal:     number
  currency:     string
  itemTypes:    string[]   // ör. ['ebook'], ['hardcopy']
}

export interface CreatePromoCodeInput {
  code:             string
  discountType:     DiscountType
  discountValue:    number
  currency?:        string | null
  maxUses?:         number | null
  maxUsesPerUser?:  number | null
  validFrom?:       Date | null
  validUntil?:      Date | null
  minOrderAmount?:  number | null
  applicableTo?:    string[] | null
  isActive?:        boolean
  description?:     string | null
}

export interface UpdatePromoCodeInput {
  discountType?:    DiscountType
  discountValue?:   number
  currency?:        string | null
  maxUses?:         number | null
  maxUsesPerUser?:  number | null
  validFrom?:       Date | null
  validUntil?:      Date | null
  minOrderAmount?:  number | null
  applicableTo?:    string[] | null
  isActive?:        boolean
  description?:     string | null
}

// ============================================================================
// Doğrulama (kullanıcı tarafı + sunucu tarafı iyzico initialize)
// ============================================================================

/**
 * Promo kodunu doğrular ve indirim tutarını hesaplar.
 * Tüm kontroller veritabanında yapılır — idempotent, kod kullanımını kaydetmez.
 */
export async function validatePromoCode(
  input: ValidatePromoInput
): Promise<ValidatePromoResult> {
  const { code, userId, subtotal, currency, itemTypes } = input

  const { rows } = await pool.query<PromoCode>(
    `SELECT * FROM promo_codes WHERE LOWER(code) = LOWER($1) LIMIT 1`,
    [code.trim()]
  )

  if (rows.length === 0) return { valid: false, error: 'not_found', discountAmount: 0 }

  const promo = rows[0]

  if (!promo.is_active)
    return { valid: false, error: 'inactive', discountAmount: 0 }

  const now = new Date()
  if (promo.valid_from && promo.valid_from > now)
    return { valid: false, error: 'not_started', discountAmount: 0 }

  if (promo.valid_until && promo.valid_until < now)
    return { valid: false, error: 'expired', discountAmount: 0 }

  if (promo.max_uses !== null && promo.used_count >= promo.max_uses)
    return { valid: false, error: 'limit_reached', discountAmount: 0 }

  if (promo.currency && promo.currency !== currency)
    return { valid: false, error: 'currency_mismatch', discountAmount: 0 }

  // Kullanıcı başı limit kontrolü
  if (promo.max_uses_per_user !== null) {
    const { rows: usageRows } = await pool.query<{ cnt: string }>(
      `SELECT COUNT(*) AS cnt FROM promo_code_usages
       WHERE promo_code_id = $1 AND user_id = $2`,
      [promo.id, userId]
    )
    const userUsageCount = parseInt(usageRows[0]?.cnt ?? '0', 10)
    if (userUsageCount >= promo.max_uses_per_user) {
      return { valid: false, error: 'user_limit_reached', discountAmount: 0 }
    }
  }

  if (promo.min_order_amount !== null && subtotal < promo.min_order_amount)
    return { valid: false, error: 'min_order_not_met', discountAmount: 0 }

  // Ürün tipi kısıtlaması
  if (promo.applicable_to && promo.applicable_to.length > 0) {
    const hasApplicableItem = itemTypes.some((type) =>
      (promo.applicable_to as string[]).includes(type)
    )
    if (!hasApplicableItem)
      return { valid: false, error: 'product_not_applicable', discountAmount: 0 }
  }

  // İndirim tutarını hesapla
  let discountAmount: number
  if (promo.discount_type === 'percent') {
    discountAmount = Math.round((subtotal * promo.discount_value) / 100 * 100) / 100
  } else {
    discountAmount = Math.min(promo.discount_value, subtotal)
  }

  const finalAmount = Math.max(0, subtotal - discountAmount)

  return {
    valid:         true,
    code:          promo.code,
    promoCodeId:   promo.id,
    discountType:  promo.discount_type,
    discountValue: promo.discount_value,
    discountAmount,
    finalAmount,
  }
}

// ============================================================================
// Kullanım kaydı (post-payment)
// ============================================================================

/**
 * Başarılı ödeme sonrası promo kodu kullanımını kaydeder ve used_count'u artırır.
 * Transaction içinde çalışır.
 */
export async function recordPromoCodeUsage(input: {
  promoCodeId:    string
  userId:         string
  orderId:        string
  discountAmount: number
}): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO promo_code_usages (promo_code_id, user_id, order_id, discount_amount)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (promo_code_id, order_id) DO NOTHING`,
      [input.promoCodeId, input.userId, input.orderId, input.discountAmount]
    )

    await client.query(
      `UPDATE promo_codes SET used_count = used_count + 1
       WHERE id = $1 AND (max_uses IS NULL OR used_count < max_uses)`,
      [input.promoCodeId]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ============================================================================
// Admin CRUD
// ============================================================================

export interface PromoCodeListRow extends PromoCode {
  usage_count: number
}

export interface ListPromoCodesOptions {
  limit?:  number
  offset?: number
  search?: string
}

export async function listPromoCodes(
  opts: ListPromoCodesOptions = {}
): Promise<{ rows: PromoCode[]; total: number }> {
  const { limit = 50, offset = 0, search } = opts
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (search) {
    conditions.push(`(LOWER(code) LIKE LOWER($${idx}) OR LOWER(description) LIKE LOWER($${idx}))`)
    values.push(`%${search}%`)
    idx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*) AS total FROM promo_codes ${where}`,
    values
  )

  const dataResult = await pool.query<PromoCode>(
    `SELECT * FROM promo_codes ${where}
     ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  )

  return {
    rows:  dataResult.rows,
    total: parseInt(countResult.rows[0]?.total ?? '0', 10),
  }
}

export async function getPromoCode(id: string): Promise<PromoCode | null> {
  const { rows } = await pool.query<PromoCode>(
    `SELECT * FROM promo_codes WHERE id = $1`,
    [id]
  )
  return rows[0] ?? null
}

export async function createPromoCode(input: CreatePromoCodeInput): Promise<PromoCode> {
  const { rows } = await pool.query<PromoCode>(
    `INSERT INTO promo_codes (
      code, discount_type, discount_value, currency,
      max_uses, max_uses_per_user,
      valid_from, valid_until,
      min_order_amount, applicable_to,
      is_active, description
    ) VALUES (
      UPPER($1), $2, $3, $4,
      $5, $6,
      $7, $8,
      $9, $10,
      $11, $12
    ) RETURNING *`,
    [
      input.code.trim(),
      input.discountType,
      input.discountValue,
      input.currency ?? null,
      input.maxUses ?? null,
      input.maxUsesPerUser ?? 1,
      input.validFrom ?? null,
      input.validUntil ?? null,
      input.minOrderAmount ?? null,
      input.applicableTo ? JSON.stringify(input.applicableTo) : null,
      input.isActive ?? true,
      input.description ?? null,
    ]
  )
  return rows[0]
}

export async function updatePromoCode(
  id: string,
  input: UpdatePromoCodeInput
): Promise<PromoCode | null> {
  const setClauses: string[] = []
  const values: unknown[] = [id]
  let idx = 2

  if (input.discountType !== undefined) {
    setClauses.push(`discount_type = $${idx++}`)
    values.push(input.discountType)
  }
  if (input.discountValue !== undefined) {
    setClauses.push(`discount_value = $${idx++}`)
    values.push(input.discountValue)
  }
  if ('currency' in input) {
    setClauses.push(`currency = $${idx++}`)
    values.push(input.currency ?? null)
  }
  if ('maxUses' in input) {
    setClauses.push(`max_uses = $${idx++}`)
    values.push(input.maxUses ?? null)
  }
  if ('maxUsesPerUser' in input) {
    setClauses.push(`max_uses_per_user = $${idx++}`)
    values.push(input.maxUsesPerUser ?? null)
  }
  if ('validFrom' in input) {
    setClauses.push(`valid_from = $${idx++}`)
    values.push(input.validFrom ?? null)
  }
  if ('validUntil' in input) {
    setClauses.push(`valid_until = $${idx++}`)
    values.push(input.validUntil ?? null)
  }
  if ('minOrderAmount' in input) {
    setClauses.push(`min_order_amount = $${idx++}`)
    values.push(input.minOrderAmount ?? null)
  }
  if ('applicableTo' in input) {
    setClauses.push(`applicable_to = $${idx++}`)
    values.push(input.applicableTo ? JSON.stringify(input.applicableTo) : null)
  }
  if (input.isActive !== undefined) {
    setClauses.push(`is_active = $${idx++}`)
    values.push(input.isActive)
  }
  if ('description' in input) {
    setClauses.push(`description = $${idx++}`)
    values.push(input.description ?? null)
  }

  if (setClauses.length === 0) return getPromoCode(id)

  const { rows } = await pool.query<PromoCode>(
    `UPDATE promo_codes SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    values
  )
  return rows[0] ?? null
}

export async function deletePromoCode(id: string): Promise<boolean> {
  // Yalnızca kullanımı olmayan kodlar silinebilir
  const { rows: usages } = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM promo_code_usages WHERE promo_code_id = $1`,
    [id]
  )
  if (parseInt(usages[0]?.cnt ?? '0', 10) > 0) {
    throw new Error('PROMO_HAS_USAGES')
  }

  const { rowCount } = await pool.query(
    `DELETE FROM promo_codes WHERE id = $1`,
    [id]
  )
  return (rowCount ?? 0) > 0
}

export async function getPromoCodeUsages(promoCodeId: string) {
  const { rows } = await pool.query(
    `SELECT pcu.*, u.email AS user_email, u.name AS user_name
     FROM promo_code_usages pcu
     JOIN public.users u ON u.id = pcu.user_id
     WHERE pcu.promo_code_id = $1
     ORDER BY pcu.used_at DESC`,
    [promoCodeId]
  )
  return rows
}
