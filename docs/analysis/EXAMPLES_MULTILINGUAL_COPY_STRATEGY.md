# Örnek Kitaplar — Çok Dilli Kopyalama Stratejisi

**Tarih:** 7 Mart 2026  
**Durum:** Fikir aşaması — tartışma için  
**İlişkili:** `docs/analysis/LOCALIZATION_ANALYSIS.md`, `docs/implementation/LOCALIZATION_IMPLEMENTATION.md`

---

## 1. Problem

- **Examples sayfası** herkese açık, sitenin tanıtımı niteliğinde.
- Ziyaretçi **site diline** göre örnekleri **o dilde** görmeli: `/en/examples` → İngilizce başlık/açıklama/içerik, `/tr/examples` → Türkçe.
- **Kullanıcı kitapları** (Kitaplığım): Kitap hangi dilde üretildiyse o dilde kalır; site dili değişse bile içerik değişmez. Bu doğru davranış, değişmeyecek.

**Sorun:** Örnek kitaplar DB'den geldiğinde tek dilde (örn. sadece TR) olabilir. O zaman EN ziyaretçi TR içerik görür — tanıtım için istenen durum değil.

---

## 2. Mevcut Durum

| Kaynak | Davranış |
|--------|----------|
| **Mock data** (`examples/types.ts`) | Başlık/açıklama/tema `messages/en.json` ve `messages/tr.json` ile locale'e göre gösteriliyor. EN/TR uyumlu. |
| **DB'deki örnek kitaplar** (`is_example = true`) | Kitabın kaydedildiği dilde tek kayıt var. Site locale'e göre "bu dildeki versiyonu getir" mantığı yok. |

Yani: Mock ile tanıtım her iki dilde de tamam; gerçek DB örnekleri için "her dilde versiyon" henüz yok.

---

## 3. Hedef

- Examples sayfası **locale'e göre** o dildeki örnek kitapları göstersin.
- Desteklenen her site dili (en, tr, …) için **en az bir set** örnek kitap olsun.
- Eksik dillerde örnek yoksa: "bu dilde henüz örnek yok" ya da **mevcut bir dildeki örneklerin kopyasının** hedef dile üretilmesi.

---

## 4. Önerilen Çözüm: "Eksik Dillere Kopyalama"

**Fikir:** Bir dilde (örn. TR) örnek kitaplar varken, diğer dillerde (örn. EN) yoksa, bu kitapların **kopyasını** hedef dilde oluşturmak.

- **Kopya** = Yeni bir kitap kaydı (veya "çeviri / alternatif dil versiyonu" kaydı), hedef dilde başlık/açıklama/hikaye metni ile.
- **İçerik nasıl dolar?**
  - **Seçenek A:** AI ile çeviri (mevcut TR hikaye metni → EN).
  - **Seçenek B:** Admin manuel girer / düzenler.
  - **Seçenek C:** Kaynak kitap ile "çift dil" ilişkisi kurulur; aynı kapak/görseller, sadece metin alanları hedef dilde.

**Araçlar:**

| Araç | Ne zaman | Not |
|------|----------|-----|
| **Script** | Şimdi / kısa vadede | Örn. "TR'deki tüm örnek kitapları EN'e kopyala". CLI veya tek seferlik script. Admin panel yokken işi görür. |
| **Admin panel** | Sonra | "Eksik dillere kopyala" butonu veya benzeri akış. Script mantığının UI'a taşınmış hali. |

Bu strateji, analizdeki "daha sonra bakılacak" maddesiyle uyumlu: **Kitaplığım'daki kullanıcı kitapları** yerine, sadece **Examples (tanıtım)** için "eksik dillere kopyalama" planlanıyor.

---

## 5. Açık Noktalar (Tartışma)

1. **Kopya = yeni kitap mı, yoksa "çeviri versiyonu" mu?**
   - Yeni `books` satırı mı (örn. `source_example_book_id` ile bağlı)?
   - Yoksa mevcut kitabın "çeviri" alanları mı (örn. `title_en`, `title_tr`, `pages_json_en`, …)?

2. **Görseller:** Kopyada aynı kapak ve sayfa görselleri kullanılacak mı? (Genelde evet denir; sadece metin dil değişir.)

3. **Hangi diller?** Sadece site locale'leri (en, tr) mı, yoksa Step 3'teki tüm hikaye dilleri mi?

4. **Script tetiklemesi:** Periyodik mi, yoksa admin "şimdi kopyala" dediğinde mi?

5. **Admin panel notu:** "Örnek kitapları eksik dillere kopyalama, ileride admin panelde olacak" — roadmap / analiz dokümanında net yer almalı.

---

## 6. Sonraki Adım

Bu dokümandaki fikirler netleştikten sonra:

- [x] "Eksik dillere kopyalama" maddesi `LOCALIZATION_ANALYSIS.md` "Daha sonra bakılacak" tablosuna eklendi.
- [ ] Kararları bu dosyaya madde madde yazmak (isteğe bağlı).
- [x] **Uygulama planı:** `docs/analysis/EXAMPLES_MULTILINGUAL_COPY_IMPLEMENTATION_PLAN.md` — fazlar, DB, API, script, frontend ve admin panel işleri ayrıntılı planlandı.

---

*Kısa ve tartışmaya açık tutuldu. Güncellemeler bu dosyada yapılacak.*
