# 💳 Faz 6 — Test ve Canlıya Alış

**Bağlı Roadmap:** [PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md)  
**Durum:** ⬜ Bekliyor  
**Ön koşul:** Faz 0–5 tamamlanmış olmalı  
**Tahmini süre:** 2-3 gün

---

## 🎯 Bu Fazın Amacı

Tüm ödeme akışını kapsamlı biçimde test etmek ve canlıya güvenli geçiş yapmak.

---

## 1. Test Ortamı Kurulumu

### 1.1 Gereksinimler

- [ ] iyzico sandbox API key'leri `.env`'de
- [ ] Stripe test API key'leri `.env`'de
- [ ] Stripe webhook local yönlendirme: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- [ ] iyzico callback için: `ngrok http 3000` (veya localhost.run) → iyzico callback URL'ini güncelle
- [ ] DB: `orders`, `order_items`, `payments`, `payment_events` tabloları mevcut

### 1.2 Test Kullanıcıları

- Test kullanıcısı 1: TR IP simülasyonu (iyzico testi)
- Test kullanıcısı 2: US IP simülasyonu (Stripe testi)

> **IP Simülasyonu:** Geliştirmede Vercel geo header otomatik gelmiyor. Header'ı manuel ekle:
> ```
> x-vercel-ip-country: TR   → iyzico
> x-vercel-ip-country: US   → Stripe
> ```
> Ya da `lib/payment/provider.ts`'e geliştirme ortamında env override ekle:
> ```typescript
> if (process.env.DEV_FORCE_PROVIDER) return process.env.DEV_FORCE_PROVIDER
> ```

---

## 2. Test Senaryoları

### 2.1 iyzico Test Senaryoları

| # | Senaryo | Beklenen Sonuç |
|---|---------|----------------|
| 1 | TR kullanıcı → Checkout sayfası | iyzico formu görünür |
| 2 | Test kartı (5528790000000008) ile başarılı ödeme | `orders.status = 'paid'`, başarı sayfası |
| 3 | 3D Secure akışı (4766620000000001) | Banka sayfası açılır, döner, `paid` olur |
| 4 | Başarısız ödeme (geçersiz kart) | `orders.status = 'failed'`, hata sayfası |
| 5 | Callback endpoint imza doğrulama | Geçersiz token → 400 döner |
| 6 | Sipariş onayı e-postası | Kullanıcıya e-posta gönderildi mi? |
| 7 | Admin panelde sipariş görünür | `/admin/orders`'da yeni sipariş var |
| 8 | Kullanıcı `/orders`'da siparişi görür | Sipariş listesinde görünür |

### 2.2 Stripe Test Senaryoları

| # | Senaryo | Beklenen Sonuç |
|---|---------|----------------|
| 1 | TR olmayan kullanıcı → Checkout sayfası | Stripe butonu görünür |
| 2 | `stripe listen` aktif, session oluştur | Stripe sayfasına yönlendir |
| 3 | Test kartı (4242 4242 4242 4242) ile başarılı ödeme | `orders.status = 'paid'`, başarı sayfası |
| 4 | 3D Secure test kartı (4000 0025 0000 3155) | 3DS akışı çalışır |
| 5 | Başarısız ödeme (4000 0000 0000 9995) | `failed`, hata sayfası |
| 6 | Session expire testi | `cancelled`, hata sayfası |
| 7 | Webhook imza doğrulama | Geçersiz imza → 400 |
| 8 | `checkout.session.completed` event | Sipariş `paid` oldu mu? |
| 9 | Sipariş onayı e-postası | E-posta gönderildi mi? |
| 10 | Admin panelde sipariş görünür | `/admin/orders`'da yeni sipariş |

### 2.3 Genel Akış Testleri

| # | Senaryo | Beklenen Sonuç |
|---|---------|----------------|
| 1 | Ödeme başarılı → Sepet temizlenir | CartContext boşaldı |
| 2 | Başarı sayfasında "Kitaplığıma Git" butonu | `/dashboard`'a gider |
| 3 | `/orders` sayfası → Sipariş detayı | Doğru bilgiler gösteriliyor |
| 4 | E-book için "PDF İndir" | PDF indirme linki açılıyor |
| 5 | Giriş yapmadan `/checkout`'a git | Login sayfasına yönlendir |
| 6 | Boş sepetle `/checkout`'a git | Sepete yönlendir |
| 7 | Admin `/admin/orders` sayfası | Filtre, arama, sayfalama çalışıyor |
| 8 | Admin sipariş detayı | Tam bilgiler görünüyor |
| 9 | Duplicate webhook event | İkinci kez işlenmez (idempotency) |

---

## 3. Canlıya Alış Kontrol Listesi

### 3.1 iyzico Canlıya Alış

- [ ] iyzico başvurusu tamamlandı ve onaylandı
- [ ] Live API key ve Secret alındı
- [ ] `.env.production`'da live key'ler güncellendi
- [ ] Callback URL production domain'e güncellendi: `https://herokidstory.com/api/payment/iyzico/callback`
- [ ] İlk gerçek ödeme testi (küçük tutar) yapıldı

### 3.2 Stripe Canlıya Alış

- [ ] Stripe hesap aktivasyonu tamamlandı (şirket bilgileri)
- [ ] Live API key ve Publishable key alındı
- [ ] `.env.production`'da live key'ler güncellendi
- [ ] Production webhook endpoint güncellendi: `https://herokidstory.com/api/webhooks/stripe`
- [ ] Live webhook signing secret alındı ve `.env`'e eklendi
- [ ] İlk gerçek ödeme testi yapıldı

### 3.3 Genel Canlıya Alış

- [ ] `PAYMENT_ENABLED=true` production'da
- [ ] Tüm e-posta şablonları test edildi
- [ ] SSL sertifikası aktif (HTTPS zorunlu)
- [ ] Hata loglama aktif (production hataları izleniyor)
- [ ] Admin panelde orders sayfası çalışıyor
- [ ] Stripe Dashboard'da live işlemler görünüyor
- [ ] iyzico panelinde live işlemler görünüyor

---

## 4. Hata Durumları ve Fallback'ler

### 4.1 Potansiyel Sorunlar ve Çözümler

| Sorun | Sebep | Çözüm |
|-------|-------|-------|
| iyzico callback gelmiyor | Callback URL yanlış veya HTTPS yok | URL'yi kontrol et, HTTPS zorunlu |
| Stripe webhook imzası hatalı | `STRIPE_WEBHOOK_SECRET` yanlış | Dashboard'dan doğru secret al |
| Sipariş iki kez `paid` oldu | Duplicate webhook | `payment_events` tablosunda duplicate kontrolü ekle |
| iyzico form yüklenmiyor | Script inject edilemedi | CSP header'larını kontrol et (iyzico domain'e izin ver) |
| Ülke tespiti çalışmıyor | Local geliştirmede geo header yok | `DEV_FORCE_PROVIDER` env override |
| Callback sonrası kullanıcı kayboldu | Session süresi doldu | Callback'ten önce session yenile |

### 4.2 Content Security Policy (CSP) — iyzico

iyzico Checkout Form için CSP'ye eklenmesi gerekenler:

```
frame-src: https://sandbox-js.iyzipay.com https://js.iyzipay.com
script-src: https://sandbox-js.iyzipay.com https://js.iyzipay.com
```

Next.js `next.config.js`'te ayarlanacak.

---

## 5. Monitoring ve Alertler

Canlıya geçildikten sonra izlenecekler:

### 5.1 İzlenecek Metrikler
- Saatlik başarılı ödeme sayısı (iyzico + Stripe)
- Başarısız ödeme oranı (>%20 ise sorun var)
- Webhook işleme süresi
- `payment_events` tablosunda işlenemeyen eventler

### 5.2 Admin Dashboard Alarmları
- Ardışık 3+ başarısız ödeme → Admin'e e-posta
- Webhook gelmiyor (30 dk) → Log uyarısı
- Yeni hardcopy siparişi → Admin bildirim

---

## 6. Rollback Planı

Canlıda ciddi bir sorun çıkarsa:

1. `.env.production`'da `PAYMENT_ENABLED=false` yap → Checkout butonu gizlenir
2. Bekleyen siparişleri manuel kontrol et
3. Stripe/iyzico dashboard'dan işlem durumlarını kontrol et
4. Sorunu çöz, `PAYMENT_ENABLED=true` yap

---

## 7. Cursor: Ödeme uzmanı rule

- [ ] **Faz 6 tamamlandıktan sonra** `.cursor/rules/` altında ödeme uzmanı rule oluştur ([PAYMENT_ROADMAP.md](PAYMENT_ROADMAP.md) — “Cursor: Ödeme sistemi uzmanı”).
- [ ] Stripe (Faz 2) kodlandıktan sonra aynı rule’u **güncelle** (iki sağlayıcı + webhook’lar).

---

## 8. Post-Launch İyileştirmeler (Sonraki Versiyonlar)

| Özellik | Öncelik |
|---------|---------|
| Stripe Payment Element (embedded) — daha özelleştirilebilir | Orta |
| Taksit seçenekleri iyzico (halihazırda destekleniyor) | Düşük |
| Apple Pay / Google Pay (Stripe aracılığı ile) | Orta |
| Abonelik modeli (Stripe Subscriptions) | Yüksek |
| Fatura (e-arşiv fatura entegrasyonu) | Yüksek |
| İndirim kodu / kupon sistemi | Orta |
| Gelato.com entegrasyonu (yurt dışı hardcopy) | Düşük |

---

*Bu faz tamamlandığında ödeme sistemi tam anlamıyla canlıdır. Bundan sonraki geliştirmeler `PAYMENT_ROADMAP.md` güncellenmiş versiyonunda takip edilecektir.*
