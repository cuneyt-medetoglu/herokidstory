# Sihirbaz ve navigasyon yükleme — manuel test kontrol listesi

## Erişilebilirlik

- [ ] “İleri” / ödeme / ücretsiz kapak butonları pending iken `aria-busy="true"` (Tarayıcı erişilebilirlik ağacı veya ekran okuyucu ile spot kontrol).
- [ ] Klavye ile gönderim: Enter ile Step1 gönderiminde çift gönderim oluşmuyor (pending sırasında buton devre dışı).

## Create adımları (step1–6)

- [ ] Her adımda “İleri”: spinner + metin (`Kaydediliyor…` / `Yükleniyor…`) görünür; geçiş sonrası bir sonraki sayfa yüklenir.
- [ ] Step2: fotoğraf yokken toast; fotoğrafla geçişte pending.
- [ ] Step5: doğrulama hata verince navigasyon yok; başarılı validasyonda pending + step6.
- [ ] Step6: “Pay & Create” tıklanınca navigasyon pending; ücretsiz kapak / debug oluşturma mevcut tam ekran overlay ile uyumlu.

## From-example

- [ ] Özet adımında sepete git: pending + üst progress çubuğu.
- [ ] “Create without payment” debug: `pleaseWait` + spinner.

## Genel site

- [ ] Locale değiştirmeden herhangi bir `Link` / `router.push` sonrası üstte ince progress çubuğu (`nextjs-toploader`).
- [ ] `/create/*` ve `/dashboard` ilk yüklemede `loading.tsx` fallback’i kısa süre görünebilir (yavaş bağlantıda).

## Sepet

- [ ] “Ödemeye geç” (proceed to checkout): pending sırasında spinner + `create.common.navigating`.
- [ ] Boş sepette “Kütüphaneye git”: aynı kalıp.

## Prefetch

- [ ] Ağ sekmesinde wizard adımları arasında bir sonraki route için önceden yükleme isteği görülebilir (isteğe bağlı doğrulama).
