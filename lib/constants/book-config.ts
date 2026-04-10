/**
 * Kitap üretim sabitleri — tek kaynak (single source of truth).
 *
 * Sayfa sayısıyla ilgili tüm hardcoded değerler buradan gelir.
 * API'ler, wizard adımları, prompt sistemi ve worker bu dosyayı import eder.
 */

/** Kullanıcı wizard'da sayfa sayısı girmediğinde kullanılan varsayılan. */
export const DEFAULT_PAGE_COUNT = 12

/** Wizard'ın kabul ettiği geçerli aralık (2–20). */
export const PAGE_COUNT_MIN = 2
export const PAGE_COUNT_MAX = 20

/** Veritabanı sınırları (checkout-placeholder ve DB kaydı için). */
export const PAGE_COUNT_DB_MAX = 64

/**
 * Debug/step-runner mod için yedek değer.
 * Tam kitap yolundan bağımsız; sadece hızlı test akışlarında kullanılır.
 */
export const PAGE_COUNT_DEBUG_FALLBACK = 4

/**
 * Verilen değerin geçerli bir sayfa sayısı olup olmadığını kontrol eder.
 * 2–20 aralığının dışındaysa false döner.
 */
export function isValidPageCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= PAGE_COUNT_MIN && value <= PAGE_COUNT_MAX
}

/**
 * Verilen değeri geçerli bir sayfa sayısına çözer.
 * Geçersiz veya eksikse DEFAULT_PAGE_COUNT döner.
 */
export function resolvePageCount(value: unknown): number {
  return isValidPageCount(value) ? value : DEFAULT_PAGE_COUNT
}
