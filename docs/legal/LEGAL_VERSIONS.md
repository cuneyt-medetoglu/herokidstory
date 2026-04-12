# HeroKidStory — Yasal Belge Versiyon Takibi

**Son güncelleme:** Nisan 2026 — `LEGAL_OVERVIEW.md` ile senkron

---

## Versiyon Yönetim Sistemi

### Semantik Versiyon Kuralları

```
MAJOR.MINOR
  │      └── Küçük düzeltme, bilgi güncellemesi, format değişikliği
  └───────── Hukuki içerik / kapsam / statü değişikliği (avukat onayı gerekli)

Örnekler:
  1.0-draft   → İlk taslak (avukata gönderilmedi)
  1.1-draft   → Taslakta küçük güncelleme
  1.0-review  → Avukatta incelemede
  1.0         → Avukat onaylı, yayına hazır
  1.0-live    → Sitede aktif
  2.0-draft   → Büyük değişiklik (yeni madde, kapsam genişlemesi)
  1.0-archive → Devre dışı / arşivlendi
```

### Statü Akışı

```
draft → review → approved → live → archived
  ↑                                    ↓
  └────────────────────────────────────┘
           (yeni versiyon başlar)
```

---

## Merkezi Belge Tablosu

| # | Belge | Dosya | Versiyon (`@semver`) | Son Değişiklik |
|---|-------|-------|----------------------|---------------|
| 1 | Mesafeli Satış Sözleşmesi | `TASLAK_MESAFELI_SATIS_SOZLESMESI.md` + `mesafeli-satis/page.tsx` | 1.2.0 | Nisan 2026 |
| 2 | Ön Bilgilendirme Formu | `TASLAK_ON_BILGILENDIRME_FORMU.md` | 1.1.0 | Nisan 2026 |
| 3 | Gizlilik Politikası | `TASLAK_GIZLILIK_POLITIKASI.md` + `privacy/page.tsx` | 1.4.0 | Nisan 2026 |
| 4 | Kullanım Koşulları | `TASLAK_KULLANIM_KOSULLARI.md` + `terms/page.tsx` | 1.2.0 | Nisan 2026 |
| 5 | Çerez Politikası | `TASLAK_CEREZ_POLITIKASI.md` + `cookies/page.tsx` | 1.1.0 | Nisan 2026 |
| 6 | İade ve Kalite Politikası | `07_IADE_VE_KALITE_POLITIKASI.md` + `refund-policy/page.tsx` | 1.1.0 | Nisan 2026 |

### Statü Göstergeleri

| Sembol | Anlam |
|--------|-------|
| 📝 draft | Taslak hazırlandı, avukata gönderilmedi |
| 🔍 review | Avukatta incelemede |
| ✅ approved | Avukat onayladı |
| 🟢 live | Sitede aktif, kullanıcılara gösteriliyor |
| 🗄️ archive | Devre dışı, eski versiyon |

---

## Sitede yayında olan belgeler

> Versiyonlar yalnızca `page.tsx` JSDoc bloğunda (`@semver`) takip edilir; kullanıcı arayüzünde görünmez.

| Sayfa URL | Belge | `@semver` | Not |
|-----------|-------|-----------|-----|
| `/mesafeli-satis` | MSS | 1.2.0 | Yalnızca TR locale |
| *(checkout)* | ÖBF | 1.1.0 | Ayrı sayfa yok; TR checkout modali |
| `/privacy` | Gizlilik Politikası | 1.4.0 | TR + EN |
| `/terms` | Kullanım Koşulları | 1.2.0 | TR + EN |
| `/cookies` | Çerez Politikası | 1.1.0 | TR + EN |
| `/refund-policy` | İade ve Kalite | 1.1.0 | TR/EN tek route |

---

## Güncelleme Prosedürü

### Küçük Değişiklik (MINOR → örn: 1.0 → 1.1)

1. İlgili `.md` dosyasını düzenle
2. Dosya başındaki `**Versiyon:**` satırını güncelle
3. Dosya başındaki CHANGELOG tablosuna satır ekle
4. Bu dosyada (`LEGAL_VERSIONS.md`) versiyon ve tarihi güncelle
5. Git commit: `docs(legal): update MSS v1.1 - minor correction`

### Büyük Değişiklik (MAJOR → örn: 1.0 → 2.0)

1. Eski canlı versiyonu `docs/legal/archive/` klasörüne kopyala (ör: `MSS_v1.0_live.md`)
2. Yeni taslağı düzenle → versiyon `2.0-draft`
3. Avukata gönder → `2.0-review`
4. Onay alındı → `2.0-approved`
5. Siteye deploy → `2.0-live`, eskisi `1.0-archive`
6. Bu dosyada tabloyu güncelle
7. Git commit: `docs(legal): MSS v2.0 approved and deployed`

### Zorunlu Güncelleme Tetikleyicileri

- Türk tüketici mevzuatında değişiklik
- KVKK / GDPR güncellemesi
- İş modelinde değişiklik (yeni ülke, yeni ürün, yeni ödeme yöntemi)
- Yeni ürün özelliği (örn: abonelik sistemi eklenmesi)
- Avukat tavsiyesi
- KDV/vergi oranı değişikliği

---

## Arşiv

> Henüz arşivlenmiş versiyon yok. İlk `live` versiyonlar deploy edildiğinde doldurulacak.

---

## Notlar

- Git geçmişi her değişikliğin tam kaydını tutar — bu dosya *insan için* özet takiptir
- Tüm aktif yasal belgeler avukat onayından geçmeden `live` statüsüne geçemez
- Kullanıcıya gösterilen versiyonu takip etmek için `orders` tablosuna `contract_version` alanı eklenmeli (database schema: `LEGAL_OVERVIEW.md` bakınız)
