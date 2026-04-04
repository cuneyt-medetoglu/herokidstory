/**
 * Kapak görseli için referans URL listesi — tek politika.
 *
 * Yalnızca karakter master görselleri kullanılır; entity master URL'leri eklenmez.
 * Entity görselleri kapak sahnesinde kimlik karışıklığına veya
 * modelin kapağı entity etrafında kurgulamasına neden olabiliyor (Faz 4 gözlemi).
 *
 * Fallback: master yoksa karakterlerin reference_photo_url alanları.
 *
 * Çağrı noktaları: image-pipeline.ts (worker), app/api/books/route.ts (senkron).
 */
export function getCoverReferenceImageUrls(
  masterIllustrations: Record<string, string | undefined | null | boolean>,
  characters: ReadonlyArray<{ reference_photo_url?: string | null }>
): string[] {
  const fromMasters = Object.values(masterIllustrations).filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  )
  if (fromMasters.length > 0) return fromMasters

  return characters
    .map((c) => c.reference_photo_url)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
}
