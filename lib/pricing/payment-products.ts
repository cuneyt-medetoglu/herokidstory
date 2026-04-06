/**
 * @file Ödeme ürün kataloğu ve fiyat hesaplama.
 *
 * Tüm fiyatlar bu dosyada tanımlıdır; kod içinde hardcoded tutar kullanılmaz.
 *
 * Genişletme noktaları:
 *  - Fiyat tablosuna yeni para birimi eklemek: PRICES nesnesine Currency ekle.
 *  - Yeni ürün tipi: ProductId'e ekle ve PRODUCT_CATALOG'a giriş yaz.
 *  - Sayfa sayısına göre varyant: varyantlar alanını doldur.
 */

import type { Currency } from '@/lib/currency'
import type { OrderItemType } from '@/lib/payment/types'

// ============================================================================
// Ürün ID'leri
// ============================================================================

export type ProductId = 'ebook' | 'hardcopy' | 'bundle'

// ============================================================================
// Para birimi → fiyat tablosu
// ============================================================================

/**
 * Ondalıklı değerler (12.99 gibi).
 * Stripe için centlere çevirme: Math.round(price * 100).
 * iyzico için doğrudan kullanılır (₺ tam ya da ondalık).
 */
export type PriceTable = Record<Currency, number>

const PRICES: Record<ProductId, PriceTable> = {
  ebook: {
    TRY: 299,
    USD: 9.99,
    EUR: 9.50,
    GBP: 8.50,
  },
  hardcopy: {
    TRY: 499,
    // Hardcopy şu an yalnızca TR'de mevcut.
    // Stripe geldiğinde aşağıdaki değerler aktifleştirilecek:
    USD: 0,
    EUR: 0,
    GBP: 0,
  },
  bundle: {
    TRY: 699,
    USD: 0,   // Stripe + hardcopy yurt dışı açılınca güncellenecek
    EUR: 0,
    GBP: 0,
  },
} as const

// ============================================================================
// Ürün kataloğu
// ============================================================================

export interface ProductDefinition {
  id: ProductId
  orderItemType: OrderItemType
  /** i18n anahtar yolu: "products.<id>.name" */
  nameKey: string
  /** i18n anahtar yolu: "products.<id>.description" */
  descriptionKey: string
  /** Hangi para birimlerinde kullanılabilir (boş = hepsi) */
  availableCurrencies: Currency[]
  prices: PriceTable
}

export const PRODUCT_CATALOG: Record<ProductId, ProductDefinition> = {
  ebook: {
    id: 'ebook',
    orderItemType: 'ebook',
    nameKey: 'products.ebook.name',
    descriptionKey: 'products.ebook.description',
    availableCurrencies: ['TRY', 'USD', 'EUR', 'GBP'],
    prices: PRICES.ebook,
  },
  hardcopy: {
    id: 'hardcopy',
    orderItemType: 'hardcopy',
    nameKey: 'products.hardcopy.name',
    descriptionKey: 'products.hardcopy.description',
    availableCurrencies: ['TRY'],   // Şimdilik sadece TR
    prices: PRICES.hardcopy,
  },
  bundle: {
    id: 'bundle',
    orderItemType: 'bundle',
    nameKey: 'products.bundle.name',
    descriptionKey: 'products.bundle.description',
    availableCurrencies: ['TRY'],   // Şimdilik sadece TR
    prices: PRICES.bundle,
  },
}

// ============================================================================
// Yardımcı fonksiyonlar
// ============================================================================

/**
 * Verilen ürün ve para birimi için fiyatı döndürür.
 * Ürün ilgili para biriminde mevcut değilse 0 döner (ör. hardcopy USD).
 */
export function getProductPrice(productId: ProductId, currency: Currency): number {
  return PRODUCT_CATALOG[productId].prices[currency] ?? 0
}

/**
 * Ürün belirtilen para biriminde satılabiliyor mu?
 */
export function isProductAvailableInCurrency(
  productId: ProductId,
  currency: Currency
): boolean {
  const product = PRODUCT_CATALOG[productId]
  return (
    product.availableCurrencies.includes(currency) &&
    (product.prices[currency] ?? 0) > 0
  )
}

/**
 * Sepet kalemleri için sunucu taraflı toplam hesaplama.
 * Frontend'den gelen fiyata güvenilmez; her zaman bu fonksiyon kullanılır.
 */
export function calculateOrderTotals(
  items: Array<{ productId: ProductId; quantity: number }>,
  currency: Currency
): { subtotal: number; discountAmount: number; totalAmount: number } {
  const subtotal = items.reduce((sum, item) => {
    return sum + getProductPrice(item.productId, currency) * item.quantity
  }, 0)

  return {
    subtotal,
    discountAmount: 0,    // İndirim kodu gelince burada hesaplanacak
    totalAmount: subtotal,
  }
}
