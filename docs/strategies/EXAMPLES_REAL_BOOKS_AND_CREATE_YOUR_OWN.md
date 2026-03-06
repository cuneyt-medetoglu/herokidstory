# Examples: Gerçek Kitaplar + Create Your Own

**Tarih:** 30 Ocak 2026  
**ROADMAP:** 5.6.1, 2.7.8 (Karakter Ekleme)  
**Bu doküman ilerleyiş boyunca güncel tutulacaktır.**

---

## Amaç

1. **Gerçek örnek kitaplar:** Dummy içerik kaldırılacak; admin mevcut create akışıyla gerçek kitaplar oluşturup "example" olarak işaretleyecek.
2. **Create your own:** Örnek kitaptan hikaye + görsel yapısı aynı kalacak; kullanıcı sadece kendi karakter(ler)ini ekleyip görselleri kendi karakterlerine göre yeniden ürettirecek.

---

## Kararlar (Cevap Özeti)

| Konu | Karar |
|------|--------|
| **Örnek kitap üretimi** | Mevcut create akışının sonunda (Step 6) sadece admin kullanıcıya "Create example book" butonu. Admin bu butonla kitabı example olarak işaretler. |
| **Referans fotoğraflar** | Admin normal akışta karakter referansı olarak görsel yükler; ayrı stok/config tutulmaz. |
| **İlk hedef** | En az 1 örnek kitap oluşturmak yeterli; zamanla yenileri eklenir. |
| **Çoklu karakter** | Örnekte kaç karakter varsa "Create your own"da kullanıcıdan o kadar karakter istenecek. |
| **View Example** | Example kitaplar **herkes** tarafından görülebilir ve okunabilir; üye olsun olmasın fark etmez. Giriş zorunlu değil. |
| **View Example route** | `/examples/[id]` — Satın alınan/oluşturulan kitap viewer’dan ayrı; karışıklık olmasın. |
| **API / güvenlik** | Ayrı API gerekmez. `books` + RLS: okuma sadece `(user_id = auth.uid() OR is_example = true)`. `is_example = true` sadece admin atar. |

---

## Açık Noktalar – Kararlar (Özet)

### 1) View Example route: `/book/[id]` mi, `/examples/[id]` mi?

**Öneri: `/examples/[id]`**

- Satın alınıp / kullanıcının oluşturduğu kitap ile **karışmasın**: Kendi kitabı `/books/view/[id]` (veya mevcut pattern), örnek kitap `/examples/[id]` olsun.
- URL’den niyet net olsun: “Örnek kitap görüntüle” vs “Kitaplığımdan kitap aç.”
- Tek route’ta hem “benim kitabım” hem “herkese açık örnek” izinleri bir arada olmasın; unutma hatası (örn. örnek sayfada “Düzenle” göstermek) riski azalır.

**Karar:** View Example için route **`/examples/[id]`** kullanılacak. Satın alınan/oluşturulan kitaplar mevcut kitap viewer route’unda kalacak.

### 2) Ayrı API gerekir mi? `is_example = true` güvenlik sorunu yaratır mı?

**Öneri: Ayrı API gerekmez. Mevcut `books` tablosu + RLS yeterli.**

- **Okuma:** RLS kuralı şöyle olabilir: `SELECT` izni **sadece** `(user_id = auth.uid() OR is_example = true)` iken verilsin. Yani:
  - Giriş yapmamış kullanıcı → sadece `is_example = true` olan kitapları görebilir.
  - Giriş yapmış kullanıcı → kendi kitapları + tüm example kitapları görebilir.
- **“Diğer kişilere ait kitaplar”:** Sadece **is_example = true** işaretli kitaplar herkese açık. Normal kullanıcı kitapları `is_example = false` (varsayılan) kalır; onlar sadece sahibi tarafından görülür. Yani `is_example = true` olunca “başkasının kitabını açıyoruz” değil, “sadece bizim herkese açık yaptığımız kitaplar açılıyor” olur; ek güvenlik sorunu yok.
- **Kim işaretleyebilir:** `is_example = true` **sadece admin** tarafından set edilmeli (Step 6’daki “Create example book” sadece admin’de). Normal kullanıcı kendi kitabını example yapamamalı; bu API/backend’de role kontrolü ile sağlanacak.

**Karar:** Ayrı examples API’si zorunlu değil. `books` tablosunda `is_example` + RLS (okuma: kendi kitapların veya example olanlar) ve sadece admin’in `is_example = true` atayabilmesi yeterli.

*(Yukarıdaki kararlar Kararlar tablosuna da işlendi.)*

---

## Madde 1: Gerçek Örnek Kitaplar Üretimi

### Üretim yöntemi

Mevcut create akışı (Step 1–6) aynen kullanılır. Son adımda (Step 6) sadece **admin** kullanıcıya "Create example book" butonu gösterilir. Admin tıklayınca kitap oluşturulur ve example olarak işaretlenir; Examples sayfasında listelenir.

### Veri modeli (kısa)

- `books` tablosunda **`is_example BOOLEAN`** (varsayılan false). Ayrı tablo gerekmez.
- **Okuma (RLS):** `SELECT` izni: `(user_id = auth.uid() OR is_example = true)`. Böylece example kitaplar herkese (girişsiz dahil) açık; diğer kitaplar sadece sahibine görünür.
- **Yazma:** `is_example = true` **sadece admin** atayabilsin (Step 6 “Create example book” + backend role kontrolü).
- **View Example route:** `/examples/[id]` (satın alınan/oluşturulan kitap viewer’dan ayrı).

**Migration 016 ne zaman uygulanır?**  
`supabase/migrations/016_add_is_example_to_books.sql` dosyası, **örnek kitap özelliğini ilk kez kullanmadan önce** (Create example book veya Examples sayfası API'sini test etmeden önce) uygulanmalı. Uygulanmazsa `books` tablosunda `is_example` kolonu olmaz ve hata alırsın.  
**Nasıl:** Supabase Dashboard → SQL Editor → 016 dosyasının tüm içeriğini kopyala → yapıştır → Run. (Alternatif: Supabase CLI kuruluysa `npx supabase db push` ile tüm bekleyen migration'lar uygulanır.)

### Fazlar (Madde 1)

| Faz | İş | Durum |
|-----|----|--------|
| 1.1 | `books.is_example` kolonu + RLS (okuma: sahip veya is_example). View Example route `/examples/[id]`. Sadece admin is_example atayabilsin. | Bekliyor |
| 1.2 | Step 6’da admin kontrolü: `user.role === 'admin'` ise "Create example book" butonu. Tıklanınca kitap example olarak işaretlenir. | Bekliyor |
| 1.3 | Examples sayfası veri kaynağı: Mock kaldırılır; API’den `is_example=true` kitaplar çekilir. | Bekliyor |
| 1.4 | En az 1 örnek kitabın admin ile oluşturulması; zamanla yenileri eklenir. | Bekliyor |

**Test:** Madde 1 (1.1–1.4) bittikten sonra **1 test** yapılacak.
| Ne test edilecek |
|-------------------|
| Migration/RLS: example kitap anonymous okunabiliyor mu; normal kitap sadece sahibine mi? `/examples/[id]` route açılıyor mu? |
| Admin: Step 6’da "Create example book" sadece admin’de görünüyor mu; tıklanınca kitap is_example oluyor mu? Normal kullanıcıda buton yok mu? |
| Examples sayfası: Mock yok, API’den example kitaplar geliyor mu; filtre/pagination çalışıyor mu? |
| En az 1 örnek kitap oluşturuldu mu; View Example ile herkes (girişsiz) okuyabiliyor mu? |

---

## Madde 2: Create Your Own (Karakter Değiştirme)

### Gereksinim

- Kullanıcı bir örnek kitap seçer. Hikaye ve sayfa yapısı **aynı** kalır.
- Karakter(ler): Örnekte kaç karakter varsa kullanıcıdan **o kadar** karakter istenir; hepsi kullanıcının kendi karakterleriyle değişir.
- Görseller: Aynı sahne prompt’ları, sadece karakter referansları kullanıcının karakterleriyle değiştirilerek yeniden üretilir (full re-gen with character swap).

### Teknik öneri

Örnek kitabın `story_data` + sayfa prompt’ları kopyalanır; kullanıcının seçtiği karakter(ler) ile yeni draft kitap oluşturulur; görseller mevcut image generation akışıyla (karakter swap’lı prompt) üretilir.

### Fazlar (Madde 2)

| Faz | İş | Durum |
|-----|----|--------|
| 2.1 | Örnek kitap detayında "Create your own" butonu → yeni route (örn. `/create/from-example?exampleId=...`). | Bekliyor |
| 2.2 | API: "Clone from example" – story_data + metadata alınır; kullanıcıya ait draft kitap oluşturulur. | Bekliyor |
| 2.3 | Karakter seçimi: Örnekteki karakter sayısı kadar kullanıcıdan karakter seçimi (mevcut Step1/karakter akışı). | Bekliyor |
| 2.4 | Görsel üretimi: Aynı sahne prompt’ları + yeni karakter tanımları ile kapak ve sayfa görselleri. | Bekliyor |
| 2.5 | Ödeme/onay: Mevcut create flow ile aynı (sepete ekleme, checkout vb.). | Bekliyor |

**Test:** Madde 2 (2.1–2.5) bittikten sonra **full test** yapılacak.
| Ne test edilecek |
|-------------------|
| "Create your own" butonu doğru route’a gidiyor mu; exampleId geçiyor mu? |
| Clone API: Örnek kitaptan draft oluşuyor mu; story_data + metadata doğru mu? |
| Karakter sayısı örnekle eşleşiyor mu; eksik/fazla karakter engelleniyor mu? |
| Görseller yeni karakterlerle üretiliyor mu; sahne aynı kalıyor mu? |
| Sepet/checkout akışı create flow ile aynı çalışıyor mu? |
| Uçtan uca: Örnek kitap seç → Create your own → karakter(ler) seç → görseller üret → sepete ekle / checkout (isteğe bağlı). |

---

## Öneriler

- Örnek kitaplarda yaş grupları ve temalarda çeşitlilik (0–2, 3–5, 6–9, 10+ ve farklı temalar).
- `usedPhotos` yapısı create flow’daki karakter–sayfa eşlemesiyle tutarlı tutulsun.
- View Example: `/examples/[id]` route’u; giriş zorunlu değil. Ayrı API gerekmez; mevcut books API’si RLS ile example kitapları da döner.

---

## İlerleme Özeti (Güncel Tutulacak)

| Tarih | Yapılan | Sonraki |
|-------|---------|---------|
| 30 Ocak 2026 | Doküman oluşturuldu, ön analiz ve kararlar. | 1.1 veri modeli + public okuma, 1.2 admin butonu. |
| 30 Ocak 2026 | Sadeleştirme: ayrı HTML kaldırıldı, 1.3 (stok) kaldırıldı, 1 kitap yeterli, View Example herkese açık eklendi. | — |
| 30 Ocak 2026 | Açık noktalar: View Example route = `/examples/[id]`; ayrı API yok, RLS ile is_example; sadece admin is_example atar. | — |
| 30 Ocak 2026 | Faz sonrası test adımları eklendi (Madde 1 ve 2); her fazdan sonra kısa doğrulama yapılacak. | — |
| 30 Ocak 2026 | Test yapısı güncellendi: Madde 1 bittikten sonra 1 test, Madde 2 bittikten sonra full test. | — |
| 30 Ocak 2026 | **Madde 1 Faz 1.1–1.3 tamamlandı:** Migration (is_example), /examples/[id] route, admin butonu, Examples page API. Faz 1.4 manuel (admin create). | Madde 1 test hazır, Madde 2'ye geçilebilir. |
| 31 Ocak 2026 | **Görsel kalite analizi:** 5 problem tespit edildi (log karmaşası, kıyafet değişimi, yan bakış, page bozulma, genel yapay görünüm). Detaylı analiz: `EXAMPLE_BOOKS_CUSTOM_REQUESTS.md` | Full çözüm planı hazırlandı. |
| 31 Ocak 2026 | **Full çözüm planı:** 4 fazlı implementasyon planı oluşturuldu (`IMAGE_QUALITY_IMPROVEMENT_PLAN.md`). Hedef: %90+ görsel kalite iyileştirmesi. | Faz 1-2 başlayabilir. |
| 6 Mart 2026 | **Used Photos (Examples):** GET /api/examples usedPhotos presigned URL (24h), modal object-contain, sadece karakter thumbnail'ları (ok + kapak kaldırıldı). Detay: `docs/features/EXAMPLES_USED_PHOTOS_FEATURE.md`. | — |

---

**İlgili:** `app/examples/page.tsx`, `app/examples/types.ts`, `app/api/books/route.ts`, `app/create/step6/page.tsx`, `lib/db/books.ts`, `docs/ROADMAP.md`, **`docs/strategies/EXAMPLE_BOOKS_CUSTOM_REQUESTS.md`** (Görsel kalite sorunları), **`docs/implementation/IMAGE_QUALITY_IMPROVEMENT_PLAN.md`** (Full çözüm planı).
