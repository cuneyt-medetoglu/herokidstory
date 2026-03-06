## 📝 Notlar ve Fikirler

### Örnek Hikaye Fikirleri Havuzu (14 Şubat 2026)
- **Kategori:** İş mantığı / İçerik
- **Öncelik:** 🟡 Planlandı
- **Açıklama:** Magical Children's Book Ideas benzeri örnek kitap fikirleri; GPT ile üretim, kategoriler, 12 sayfa senaryo, yaş aralığı, prompt saklama. Custom Request’te veya “aynı örnekten” akışında kullanılacak. Dil şimdilik TR.
- **Analiz:** `docs/analysis/STORY_IDEAS_GENERATION_ANALYSIS.md`
- **Roadmap:** Faz 2 – 2.4.5.4

### Hikaye Kalitesi: İki Aşamalı Üretim + Önizleme + Debug Model (14 Şubat 2026)
- **Kategori:** İş mantığı / AI / Create Book
- **Öncelik:** 🟡 Planlandı
- **Açıklama:** Hikaye kalitesini artırmak için E seçeneği (iki aşamalı: outline → expand). Hedef: Kitabı üretmeden önce hikayeyi ve modele giden input'ları görselden önce görebilmek.
- **Plan maddeleri:** (1) E – İki aşamalı hikaye (outline → expand; customRequests outline'a entegre). (2) Hikaye önizleme: görselden önce hikaye + input'ları göster, onay/tekrar üret. (3) Debug modda story model seçimi (gpt-4o-mini / gpt-4o) — A/B test için.
- **Model notu:** Araştırma: gpt-4o yaratıcı yazımda mini'den belirgin daha iyi; mini "derinlikten yoksun". Analiz: `docs/analysis/STORY_QUALITY_IMPROVEMENT_ANALYSIS.md`. Roadmap: Faz 3 – Create Book.

### ✅ TTS Play butonu çalışmıyor (8 Şubat 2026) – ÇÖZÜLDÜ (9 Şubat 2026)
- **Kategori:** Bug / E-book viewer
- **Öncelik:** 🔴 DO (yapıldı)
- **Tarih:** 8 Şubat 2026 | **Çözüm:** 9 Şubat 2026
- **Durum:** ✅ Çözüldü
- **Açıklama:** Kitap görüntüleyicide Play’e basıldığında ses çalmıyor. API 200 dönüyor (TTS cache hit), ancak tarayıcıda oynatma başarısız.
- **Yapılan kolay deneme:** `hooks/useTTS.ts` – audioUrl kontrolü, load() sonrası canplaythrough/error bekleniyor, net hata mesajı (CORS / zaman aşımı). Bu değişiklik yükleme hatasını görünür kılar.
- **Olası nedenler:** S3’ten dönen ses URL’i cross-origin; tarayıcı CORS nedeniyle sesi yükleyemiyor olabilir. Alternatif: sesi API üzerinden proxy ile sunmak (same-origin).
- **Yapılacaklar (sen sonra bakacaksın):**
  - [ ] E-book viewer’da Play’e basıp konsol / UI’da hata mesajını kontrol et.
  - [ ] Hata “Ses yüklenemedi. Ağ veya CORS hatası olabilir.” ise: S3 bucket CORS’ta uygulama origin’ine GET izni ver veya TTS sesini API proxy ile sun (örn. GET /api/tts/audio?hash=…).
  - [ ] Gerekirse `app/api/tts/generate/route.ts` ve `hooks/useTTS.ts` dokümantasyonunu güncelle.

### 🚨 API Hata Yönetimi Sistemi (28 Ocak 2026)
- **Kategori:** Teknik / Error Handling
- **Öncelik:** 🔴 Yüksek (MVP)
- **Tarih:** 28 Ocak 2026
- **Durum:** ⏳ Planlandı
- **Açıklama:** Story oluşturma veya görsel generate ederken API'den hata alındığında kullanıcıya gösterilecek ortak bir hata yönetimi sistemi. İlk fazda temel hata mesajları, sonraki fazlarda detaylı hata yönetimi eklenecek.
- **Faz 1 - Temel Hata Yönetimi:**
  - [ ] Ortak hata component'i (`components/ui/error-message.tsx`)
  - [ ] API error response standardizasyonu
  - [ ] Story generation hatası için kullanıcı dostu mesaj
  - [ ] Image generation hatası için kullanıcı dostu mesaj
  - [ ] Cover generation hatası için kullanıcı dostu mesaj
  - [ ] Loading state sırasında hata yakalama
  - [ ] Toast notification entegrasyonu
- **Faz 2 - Detaylı Hata Yönetimi (Sonra):**
  - [ ] Retry butonu ve otomatik retry mekanizması
  - [ ] Hata türüne göre farklı mesajlar (network, timeout, API limit, vb.)
  - [ ] Hata loglama ve tracking (Sentry entegrasyonu)
  - [ ] Kullanıcıya alternatif öneriler (farklı tema, farklı stil dene)
  - [ ] Admin dashboard'da hata istatistikleri
- **Etkilenen Alanlar:**
  - `app/api/books/route.ts` - Kitap oluşturma API
  - `app/api/generate-story/route.ts` - Story generation
  - `app/api/generate-cover/route.ts` - Cover generation
  - `app/api/generate-images/route.ts` - Image generation
  - `app/create/step6/page.tsx` - Wizard son adım (generation başlıyor)
  - `components/book-viewer/` - Kitap görüntüleme
- **Örnek Hata Mesajları:**
  - Story: "Hikaye oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin."
  - Image: "Görsel oluşturulurken bir sorun oluştu. Farklı bir tema deneyebilirsiniz."
  - Network: "Bağlantı hatası. İnternet bağlantınızı kontrol edin."
  - Timeout: "İşlem çok uzun sürdü. Lütfen tekrar deneyin."
- **İlgili İşler:**
  - `3.5.13 Retry ve hata yönetimi` (ertelendi, bu işle birleştirilebilir)
  - `5.5.5 Error tracking (Sentry)`
  - `2.1.4 Loading states ve error boundaries`
- **Not:** Bu sistem MVP için kritik. Kullanıcıların hata durumunda ne yapacaklarını bilmeleri önemli.

### Debug / Feature Flags Sistemi (29 Ocak 2026)
- **Kategori:** Teknik / Config
- **Öncelik:** 🟡 Önemli (test ve admin için)
- **Tarih:** 29 Ocak 2026
- **Durum:** ✅ Tamamlandı (29 Ocak 2026)
- **Sorun:** Create book ödemeye bağlı olduğu için admin olarak ödeme yapmadan test yapılamıyor. İleride admin dashboard gibi özellikler de sadece yetkili kullanıcıda görünmeli.
- **Önerilen çözüm:** Config tabanlı DEBUG/feature flags + kullanıcı rolü (admin). DEBUG açıkken veya admin kullanıcı + ilgili flag açıkken: ödemesiz kitap oluşturma, debug UI, ileride admin dashboard görünsün.
- **Analiz dokümanı:** `docs/strategies/DEBUG_AND_FEATURE_FLAGS_ANALYSIS.md`
- **İmplementasyon takibi:** `docs/implementation/DEBUG_FEATURE_FLAGS_IMPLEMENTATION.md`
- **Yapılanlar:**
  - [x] `lib/config.ts` içinde feature flags (skipPaymentForCreateBook, showAdminDashboard)
  - [x] Env: `DEBUG_SKIP_PAYMENT` (sadece server, opsiyonel). Görünürlük DB admin rolü ile.
  - [x] users tablosunda role (migration 015 + ilk admin manuel atanır)
  - [x] Create book API: skipPayment yetkisi (DEBUG veya admin+flag)
  - [x] Step 6: "Create without payment (Debug)" butonu; sadece API canSkipPayment (admin veya DEBUG_SKIP_PAYMENT)
  - [ ] Admin dashboard yapıldığında aynı config/role ile görünürlük (ileride)

### Mobil/Tablet Wizard Step İyileştirmeleri (25 Ocak 2026)
- **Kategori:** UI/UX İyileştirmeleri / Responsive Design
- **Öncelik:** 🟡 Önemli
- **Tarih:** 25 Ocak 2026
- **Açıklama:** Kitap oluşturma wizard'ındaki step'lerin mobil ve tablet görünümlerinde tek sayfaya sığacak şekilde optimize edilmesi gerekiyor.
- **Maddeler:**
  1. **Step 1 - Mobil/Tablet Tek Sayfa Optimizasyonu:**
     - [ ] Step 1 mobil ve tablet görünümde tek sayfaya sığacak şekilde düzenlenmeli
     - [ ] Name ve Age alanları yan yana olmalı (mobil/tablet)
     - [ ] Boy ve Girl seçenekleri yan yana olmalı (mobil/tablet)
     - [ ] Hair Color ve Eye Color alanları yan yana olmalı (mobil/tablet)
     - **İlgili Dosya:** `app/create/step1/page.tsx`
     - **Durum:** ⏳ Bekliyor
  2. **Step 2 - Mobil/Tablet Tek Sayfa Optimizasyonu:**
     - [ ] Step 2 mobil ve tablette tek sayfada görüntülenebilmeli (ilk hali - 1 karakter için)
     - [ ] Ek karakter eklenirse uzayabilir, ancak ilk hali tek sayfaya sığmalı
     - **İlgili Dosya:** `app/create/step2/page.tsx`
     - **Durum:** ⏳ Bekliyor
  3. **Step 3 - Theme'ler 2'li Düzen:**
     - [ ] Step 3 mobil görünümde aşağı doğru çok uzuyor
     - [ ] Theme kartları 2'li olarak düzenlenmeli (mobil/tablet)
     - **İlgili Dosya:** `app/create/step3/page.tsx`
     - **Durum:** ⏳ Bekliyor
  4. **Edit Alanları Veri Kaybı Kontrolü:**
     - [ ] Tüm step'lerde (ara step'ler ve son step) edit alanları kontrol edilecek
     - [ ] Edit diyince veri kaybı olup olmadığı test edilecek
     - [ ] Hem Step 2'deki "Edit" butonu hem de Step 6'daki edit işlevleri test edilmeli
     - **İlgili Dosyalar:** `app/create/step2/page.tsx`, `app/create/step6/page.tsx`
     - **Durum:** ⏳ Bekliyor
  5. **Maliyet Takibi Sistemi:**
     - [ ] 1 karakter için sayfa başı maliyet yaklaşık $0.12 (hikaye, karakter oluşturma ve görseller dahil)
     - [ ] Bu maliyeti takip edebileceğimiz bir yer oluşturulmalı
     - [ ] Dashboard'da veya admin panelinde maliyet takibi gösterilmeli
     - [ ] Her kitap oluşturma işleminde maliyet hesaplanmalı ve kaydedilmeli
     - **İlgili Dosyalar:** `app/api/books/route.ts`, `app/dashboard/page.tsx`
     - **Durum:** ⏳ Bekliyor
  6. **Custom Request Bilgilendirme Metni:**
     - [ ] Step 5'te custom request alanına bilgilendirme metni eklenmeli
     - [ ] "Tell us about any specific elements, characters, or scenarios you'd like to include in the story" yazısının devamına eklenecek
     - [ ] Metin: "If left empty, AI will automatically create a story for you" gibi bir bilgi
     - [ ] Dikkat çekmesi için vurgulu gösterilmeli
     - **İlgili Dosya:** `app/create/step5/page.tsx`
     - **Durum:** ⏳ Bekliyor
  7. **Black Word Teması Karakter Formatı Sorunu:**
     - [ ] Black word (block_world) temasında ortam doğru formatta ama karakter doğru formatta değil
     - [ ] Karakter de block_world stiline uygun olmalı (Minecraft-like, pixelated, blocky)
     - [ ] Şu an ortam block_world ama karakter smooth/cartoon style görünüyor
     - [ ] Image generation prompt'larında karakter için block_world direktifleri güçlendirilmeli
     - **İlgili Dosyalar:** `lib/prompts/image/character.ts`, `lib/prompts/image/style-descriptions.ts`
     - **Durum:** ⏳ Bekliyor
- **Not:** Bu iyileştirmeler kullanıcı deneyimini önemli ölçüde artıracak, özellikle mobil kullanıcılar için wizard daha kullanışlı hale gelecek.

### Pazarlama ve Satış Stratejisi (23 Ocak 2026)
- **Kategori:** Pazarlama / Marketing
- **Öncelik:** 🟡 Önemli
- **Açıklama:** Roadmap'te pazarlama, marketing ve satış alanları eklenmeli. Bu konulardaki fikirler ilgili yerlere eklenmeli.
- **Eklenenler:**
  - ✅ Faz 5.9: Pazarlama ve Marketing bölümü eklendi
  - ✅ Product Hunt yayınlama planı
  - ✅ There's an AI for That yayınlama planı
  - ✅ Diğer pazarlama kanalları listesi
  - ✅ Ürün Değer Önerisi ve Pazarlama Mesajları (26 Ocak 2026) - Evergreen/kalıcı değer vurgusu
  - ✅ Sesli Hikaye Özelliği Pazarlama ve İletişim (26 Ocak 2026)
  - ✅ Gelato.com Entegrasyonu - TR Dışı Hardcopy Baskı (26 Ocak 2026)
- **Not:** Detaylı pazarlama stratejisi Faz 5.9 bölümünde yer alıyor.

### Product Manager Agent (23 Ocak 2026)
- **Kategori:** Agent / Yönetim
- **Öncelik:** 🟡 Önemli
- **Açıklama:** Ürünü sahiplenen bir product manager agent oluşturulmalı. Her şeyi bilen ve ihtiyaç durumunda bize fikir verebilen.
- **Özellikler:**
  - Tüm projeyi bilir (ROADMAP, dokümantasyon, kod yapısı)
  - Ürün stratejisi konusunda fikir verebilir
  - Önceliklendirme yapabilir
  - Kullanıcı geri bildirimlerini analiz edebilir
  - Feature önerileri yapabilir
  - Teknik ve ürün kararları konusunda danışmanlık
- **İlgili Dosyalar:**
  - `.cursor/rules/product-manager.mdc` (oluşturulacak)
  - `docs/ROADMAP.md` - Tüm proje bilgisi
  - `docs/DOCUMENTATION.md` - Teknik dokümantasyon
- **Not:** Bu agent @project-manager'dan farklı olarak ürün stratejisi ve kullanıcı deneyimi odaklı çalışacak.

### Sosyal Medya Agent (23 Ocak 2026)
- **Kategori:** Agent / Pazarlama
- **Öncelik:** 🟡 Önemli
- **Açıklama:** Sosyal medya hesapları yeni açılacak. Bu işten sorumlu bir agent olmalı. Takipçiler gerekiyor. Bu işi düşünmesi lazım.
- **Özellikler:**
  - Sosyal medya stratejisi geliştirme
  - İçerik planlama ve önerileri
  - Takipçi büyütme stratejileri
  - Hazır takipçi satan yerler var, satın alınabilir (araştırılacak)
  - Sosyal medya uzmanı bir agent yapılacak
  - Platform yönetimi: Instagram, Facebook, TikTok, Pinterest, Twitter/X
  - Araştırılıp öneriler varsa onlar da eklenir
  - Engagement analizi ve optimizasyon
- **İlgili Dosyalar:**
  - `.cursor/rules/social-media-manager.mdc` (oluşturulacak)
  - Sosyal medya hesapları (yeni açılacak)
- **Not:** Bu agent pazarlama ve sosyal medya odaklı çalışacak, takipçi büyütme ve engagement artırma konusunda uzman olacak.

### 🚨 PDF Generation Bug - Eksik Sayfalar ve Son Sayfa Text Problemi (25 Ocak 2026)
- **Kategori:** Faz 5.7 - PDF Tasarım İyileştirmesi
- **Durum:** 🔴 Kritik Bug (Açık)
- **Öncelik:** 🔴 Yüksek
- **Tarih:** 25 Ocak 2026
- **Açıklama:** PDF generation'da layout bug var. 5 story page'li kitap sadece 3 spread oluşturuyor, bazı sayfalar eksik ve son sayfanın text'i görünmüyor.
- **Detaylar:** Faz 5.7 bölümünde "BİLİNEN SORUN" altında detaylı dokümante edildi.
- **İlgili Dosyalar:**
  - `lib/pdf/generator.ts` → `prepareSpreads()` fonksiyonu (layout mantığı yanlış)
  - Terminal log'lar: Spread sayısı ile page sayısı uyuşmuyor
- **Çözüm Önceliği:** 🔴 Kritik - PDF indirme özelliği çalışmıyor doğru şekilde
- **Not:** Bu bug PDF generation'ın temel işlevselliğini etkiliyor. Düzeltilmeden production'a geçilemez.

### Examples Sayfası İyileştirmeleri (25 Ocak 2026)
- **Kategori:** Faz 2.7.8 - Examples Sayfası
- **Durum:** ✅ Tasarım Tamamlandı, İyileştirmeler Gelecek Fazda
- **Öncelik:** 🟡 Önemli
- **Tarih:** 25 Ocak 2026
- **Tamamlananlar:**
  - ✅ Mobil-first responsive tasarım
  - ✅ ExampleBooksCarousel iyileştirmeleri (25 Ocak 2026):
    - ✅ Desktop/tablet görünümünde yatay slider (grid'den flex'e geçiş, alt satıra inmemesi için)
    - ✅ Navigation butonları spacing ayarlamaları (`mt-2 md:-mt-2`)
    - ✅ Mock data entegrasyonu (`mockExampleBooks.slice(0, 6)`)
    - ✅ Image fallback mekanizması (`onError` handler ile placeholder)
    - ✅ Age group badge formatı ("X-Y years" veya "10+ years")
    - ✅ Link href güncellemeleri (`/examples#book-${book.id}`)
  - ✅ Yaş grubu filtreleme (flex-wrap, responsive padding)
  - ✅ Kitap kartları ve "Used Photos" modal
  - ✅ Görseller public klasörüne kopyalandı
  - ✅ Image fallback mekanizması
  - ✅ Tüm metinler İngilizceye çevrildi
  - ✅ **Pagination Sistemi (25 Ocak 2026):** Responsive pagination eklendi
    - Mobil: 4 kitap/sayfa (1 sütun)
    - Tablet: 6 kitap/sayfa (2 sütun)
    - Desktop: 8 kitap/sayfa (3 sütun)
    - Large Desktop: 8 kitap/sayfa (4 sütun)
    - Pagination component (shadcn/ui) entegre edildi
    - Sayfa değişiminde scroll to top
    - Ellipsis gösterimi (çok sayfa varsa)
    - Test için 24 kitap mock data eklendi
- **Gelecek İyileştirmeler:**
  - [ ] **Before/After Toggle:** Modal'da "After" görseli şu an boş. Gelecekte transformedImage'ları database'den çekip gösterecek sistem eklenecek. Örnek kitaplar database'e eklendiğinde, her fotoğraf için originalPhoto ve transformedImage URL'leri kaydedilecek.
  - [ ] **Swipe Navigation İyileştirmesi:** Modal'da fotoğraflar arasında swipe gesture ile geçiş yapılabilir. Şu an arrow butonları var, touch gesture (sağa/sola kaydırma) geliştirilecek. `handleTouchStart` ve `handleTouchEnd` fonksiyonları mevcut ama daha smooth hale getirilebilir.
  - [ ] **"View Example" Route:** `/book/[id]` route'u oluşturulacak, örnek kitabı görüntüleme sayfası eklenecek.
  - [ ] **API Entegrasyonu:** Mock data yerine gerçek API çağrısı yapılacak, örnek kitaplar database'den çekilecek.
  - [ ] **Gerçek Örnek Kitaplar:** Test için eklenen duplicate kitaplar yerine gerçek, farklı örnek kitaplar eklenecek.
- **İlgili Faz:** Faz 2.7.8
- **Notlar:** 
  - Sayfa şu an mock data ile çalışıyor
  - Tüm UI metinleri İngilizce (localization sonrası TR desteği eklenecek)
  - Mobil optimizasyon tamamlandı (iPhone 14 Pro Max test edildi)

### PDF Tasarım İyileştirmesi (11 Ocak 2026)
- **Kategori:** Faz 5.7 - Polish ve Lansman
- **Durum:** ⏳ Planlandı
- **Öncelik:** 🟡 Önemli
- **Açıklama:** Mevcut PDF generation çalışıyor ancak tasarım profesyonel değil. Çocuk kitabına uygun, çekici bir PDF tasarımı yapılmalı.
- **İlgili Faz:** Faz 5.7
- **Notlar:** 
  - Cover page tasarımı iyileştirilmeli
  - Sayfa layout'u daha profesyonel olmalı
  - Font ve renk seçimi çocuk kitabına uygun olmalı
  - Görsel kalitesi optimize edilmeli

### Character Consistency (10 Ocak 2026)
- [x] **GPT-image API Integration** - REST API ile `/v1/images/edits` endpoint ✅ (15 Ocak 2026)
  - Kategori: MVP (Tamamlandı - Organization verification bekleniyor)
  - İlgili Faz: Faz 3 (AI Integration)
  - Notlar: 
    - Endpoint: `/v1/images/edits` (FormData ile multimodal input)
    - Reference image: Base64 → Blob conversion, FormData ile gönderiliyor
    - Model seçenekleri: gpt-image-1.5, gpt-image-1, gpt-image-1-mini
    - Size seçenekleri: 1024x1024, 1024x1792, 1792x1024
    - ⚠️ Organization verification gerekli (OpenAI organizasyon doğrulaması)
  - Dokümantasyon: `docs/strategies/CHARACTER_CONSISTENCY_IMPROVEMENT.md`
  - Status: API hazır, organization verification sonrası test edilecek
- [ ] **Character Similarity Testing** - GPT-image API ile benzerlik değerlendirmesi
  - Kategori: MVP
  - İlgili Faz: Faz 3
  - Notlar: Model karşılaştırması (1.5 vs 1 vs mini), benzerlik skorlaması
- [x] ~~**Character Analysis İyileştirme**~~ - OpenAI Vision API kaldırıldı (2026-03-01). Tüm karakterler form verisi + referans görsel ile oluşturuluyor. Detay: `docs/analysis/VISION_ANALYSIS_NECESSITY.md`.
  - Notlar: GPT-image yeterli olmazsa uygulama, yüz hatları detayı artırma
- [ ] **Multi-Attempt Generation** - 3x cover üret, en iyisini seç
  - Kategori: Post-MVP
  - İlgili Faz: Faz 4
  - Notlar: Trade-off: 3x maliyet vs daha iyi sonuç
- [ ] **Custom Model Training** - LoRA/DreamBooth per character (uzak gelecek)
  - Kategori: Gelecek
  - İlgili Faz: Faz 6+
  - Notlar: Training time 5-15 dk, GPU cost, storage per user

### Hardcopy Basım Ekranı - "Appearance of the Book" (24 Ocak 2026)
- **Kategori:** UI/UX Fikirleri / Hardcopy / Print-on-Demand
- **Öncelik:** 🟡 Önemli (Post-MVP)
- **Tarih:** 24 Ocak 2026
- **Açıklama:** Hardcopy basım için örnek bilgiler içeren bir ekran ve yer ayırmalıyız. Kullanıcılar basılı kitap siparişi vermeden önce kitabın fiziksel özelliklerini görebilmeli.
- **Ekran İçeriği:**
  - **Başlık:** "Appearance of the Book"
  - **Giriş Metni:** "Do you want to hold your own story in your hands? Then consider printing your book and bringing your creation to life!"
  - **Kitap Önizlemesi:**
    - Sol tarafta kitap illüstrasyonu
    - Boyutlar: 11.69 inches (yükseklik) x 8.27 inches (genişlik)
  - **Kalite ve Detaylar (Quality and Details):**
    - 📐 **Large A4 Format (8.27 x 11.69 inches):** Perfect for colorful illustrations and an optimal reading experience.
    - 📖 **Durable Hardcover Finish:** Remains beautiful, even after countless page turns.
    - 🎨 **Premium Color Quality:** Brilliant and vibrant colors bring the story to life.
    - 📄 **High-Quality Coated Paper:** For a luxurious appearance and extra protection against stains.
    - ✨ **24 Pages Full of Magic:** Enough space for a beautiful story and enchanting images.
    - 🖌️ **Matte or Glossy Cover:** Choose the desired finish for the hardcover cover yourself.
- **İlgili Faz:** Faz 5+ (Post-MVP - Print-on-Demand)
- **Notlar:**
  - Bu ekran hardcopy sipariş akışının bir parçası olacak
  - Kullanıcılar kitabın fiziksel özelliklerini görerek sipariş kararı verebilecek
  - Görsel referans: Ekte paylaşılan tasarım örneği
  - Print-on-Demand özelliği MVP'ye dahil değil, gelecek fazlarda eklenecek

### Ülkeye Göre Pricing Sistemi (26 Ocak 2026)
- **Kategori:** İş Mantığı / E-ticaret / Pricing
- **Öncelik:** 🟡 Önemli
- **Tarih:** 26 Ocak 2026
- **Açıklama:** Her ülke için farklı fiyatlandırma stratejisi hazırlanmalı. Ülkeye göre fiyatlar, vergiler, kargo maliyetleri ve yerel ödeme yöntemleri dikkate alınmalı.
- **Gereksinimler:**
  - [ ] Ülkeye göre fiyat matrisi oluşturulmalı (USD, EUR, GBP, TRY, vb.)
  - [ ] Her ülke için yerel para birimi desteği
  - [ ] Ülkeye göre vergi hesaplama (VAT, KDV, Sales Tax, vb.)
  - [ ] Kargo maliyetlerinin ülkeye göre hesaplanması (hardcopy için)
  - [ ] Yerel ödeme yöntemleri entegrasyonu (Stripe, İyzico, vb.)
  - [ ] Currency conversion API entegrasyonu (gerçek zamanlı döviz kurları)
  - [ ] Pricing sayfasında ülkeye göre dinamik fiyat gösterimi
  - [ ] Checkout sayfasında ülkeye göre vergi ve kargo hesaplama
- **İlgili Fazlar:** Faz 4 (E-ticaret ve Ödeme), Faz 5 (Polish ve Lansman)
- **İlgili Dosyalar:**
  - `lib/currency.ts` - Currency detection sistemi (mevcut)
  - `app/pricing/page.tsx` - Pricing sayfası (mevcut)
  - `app/api/currency/route.ts` - Currency API (mevcut)
  - Yeni: `lib/pricing/` - Ülkeye göre pricing hesaplama modülü (oluşturulacak)
- **Not:** Currency detection sistemi zaten mevcut (IP-based geolocation). Bu sistem üzerine ülkeye göre fiyatlandırma mantığı eklenecek.

### Hardcopy Ülke Kısıtlaması ve UI Bilgilendirmesi (26 Ocak 2026)
- **Kategori:** UI/UX Fikirleri / Hardcopy / E-ticaret
- **Öncelik:** 🟡 Önemli
- **Tarih:** 26 Ocak 2026
- **Açıklama:** Hardcopy şu an için sadece Türkiye'de mevcut. Diğer ülkelerde zamanla eklenecek. Bu bilgi kullanıcılara açıkça gösterilmeli.
- **UI Gereksinimleri:**
  - [ ] Pricing sayfasında hardcopy kartında "Currently available only in Turkey" bilgisi gösterilmeli
  - [ ] Hardcopy butonları (My Library, Sepet, vb.) TR dışı kullanıcılar için disabled olmalı veya bilgilendirme mesajı gösterilmeli
  - [ ] "Hardcopy is currently only available in Turkey. We're working on expanding to more countries soon!" gibi bir mesaj eklenmeli
  - [ ] Checkout sayfasında ülke kontrolü: TR dışı ülkelerden hardcopy siparişi verilemez
  - [ ] Sepet sayfasında hardcopy item'ları için ülke kontrolü ve bilgilendirme
  - [ ] My Library'de hardcopy butonları için ülke kontrolü
- **Gelecek Planlama:**
  - Diğer ülkelerde zamanla hardcopy desteği eklenecek
  - Her yeni ülke eklendiğinde UI'da bu bilgi güncellenecek
  - Ülke bazlı hardcopy durumu database'de tutulabilir (availability table)
- **İlgili Fazlar:** Faz 4.4.6 (Hardcopy sadece TR), Faz 5 (Polish)
- **İlgili Dosyalar:**
  - `app/pricing/page.tsx` - Pricing sayfası
  - `app/dashboard/page.tsx` - My Library hardcopy butonları
  - `app/cart/page.tsx` - Sepet sayfası
  - `app/checkout/page.tsx` - Checkout sayfası
- **Not:** Bu özellik kullanıcı deneyimini iyileştirecek ve yanlış sipariş vermeyi önleyecek.

### Bekleyen Kararlar
- [ ] Domain adı belirlenmedi
- [ ] Fiyatlar netleştirilmedi (TL/USD)
- [ ] Basılı kitap (Print-on-Demand) MVP'ye dahil mi?
- [ ] **AI Tool Seçimi:** Hikaye üretimi için hangi AI? (GPT-4o, Gemini, Groq, Claude)
- [x] **AI Tool Seçimi:** GPT-image API (gpt-image-1.5, gpt-image-1, gpt-image-1-mini) ✅
- [x] **UI Builder:** v0.app seçildi ✅
- [x] **OpenAI Organization Verification:** GPT-image API için organization verification ✅ (10 Ocak 2026)
  - **Tarih:** 10 Ocak 2026
  - **Durum:** ✅ Onaylandı (Individual verification tamamlandı)
  - **Kategori:** Faz 3.5 - AI Entegrasyonu
  - **Notlar:** 
    - Verification onaylandı, GPT-image API kullanılabilir
    - Detaylı analiz: `docs/reports/GPT_IMAGE_COVER_GENERATION_ERROR_ANALYSIS.md`
  - **Aksiyon:** Test edildi, çalışıyor

### Dil Seçimi Özelliği (24 Ocak 2026)
- [x] **Dil Seçimi Özelliği** - Hikaye oluşturma akışına dil seçimi eklendi
  - **Tarih:** 24 Ocak 2026
  - **Kategori:** MVP
  - **Öncelik:** 🔴 Kritik
  - **İlgili Fazlar:** Faz 2.4.3 (Step 3), Faz 3.5 (AI Entegrasyonu)
  - **Açıklama:**
    - Step 3'e dil seçimi bölümü eklendi (tema ve yaş grubundan sonra)
    - 8 dil desteği: Türkçe (tr), İngilizce (en), Almanca (de), Fransızca (fr), İspanyolca (es), Çince (zh), Portekizce (pt), Rusça (ru)
    - Dil seçimi UI kartları eklendi (2x4 grid layout, responsive)
    - Form validation'a dil seçimi eklendi
    - localStorage'a dil bilgisi kaydediliyor
    - Step 6'da dil bilgisi review'da gösteriliyor
    - Book creation request'inde dil parametresi gönderiliyor
  - **Dil Karışıklığı Çözümü (24 Ocak 2026):**
    - Prompt'lara güçlü dil talimatları eklendi
    - "CRITICAL - LANGUAGE REQUIREMENT" bölümü eklendi
    - "ONLY use [language] words" direktifi
    - "DO NOT use ANY English words" yasağı
    - Final check mekanizması eklendi
    - System message'a dil talimatı eklendi (API route'larda)
    - İngilizce kelime kullanımı yasaklandı
  - **Gelecek Geliştirmeler:**
    - Site dili algılama: Gelecekte site dili (i18n) sistemi eklendiğinde, default dil seçimi site diline göre yapılabilir
    - Daha fazla dil: İleride daha fazla dil eklenebilir (sadece prompt ve UI güncellemesi gerekir)
  - **Implementasyon:**
    - `app/create/step3/page.tsx` - Dil seçimi UI eklendi
    - `app/create/step6/page.tsx` - Dil bilgisi review'da gösteriliyor
    - `lib/prompts/story/base.ts` - Dil desteği genişletildi, güçlü dil talimatları eklendi
    - `app/api/books/route.ts` - System message güçlendirildi
    - `app/api/ai/generate-story/route.ts` - System message güçlendirildi
    - `lib/prompts/types.ts` - Type definitions güncellendi (8 dil)
  - **Status:** ✅ Tamamlandı

### Karakter Yönetimi Sistemi (Character Library) (15 Ocak 2026)
- [ ] **Karakter Yönetimi Sistemi** - Kullanıcıların birden fazla çocuğu için karakter profilleri oluşturması ve yönetmesi
  - **Tarih:** 15 Ocak 2026
  - **Kategori:** MVP
  - **Öncelik:** 🟡 Önemli
  - **İlgili Fazlar:** Faz 2.6 (Dashboard), Faz 2.4.2 (Step 2), Faz 3.4 (API)
  - **Açıklama:** 
    - Kullanıcılar birden fazla çocuğu için ayrı karakter profilleri oluşturabilecek
    - MyLibrary'de "Characters" tab'ı eklenecek
    - Story create'te (Step 2) mevcut karakterler seçilebilecek veya yeni karakter oluşturulabilecek
    - İlk karakter otomatik default olur, kullanıcı değiştirebilir
    - Karakter seçildiğinde Step 1 verileri otomatik doldurulur (kullanıcı isterse edit edebilir)
    - Edit yapılırsa karakter de güncellenir
  - **Güncelleme (23 Ocak 2026):**
    - Kullanıcılar oluşturdukları karakterleri görebilmeli ve seçebilmeli
    - Yeni kitap oluştururken aynı karakteri tekrar kullanabilmeli
    - Karakter seçimi ve görüntüleme sistemi geliştirilmeli
  - **Özellikler:**
    - **Dashboard Characters Tab:**
      - Grid layout (karakter kartları)
      - Her kart: thumbnail, isim, yaş, kitap sayısı
      - "Set as Default" butonu
      - "Edit" butonu
      - "Delete" butonu
      - "Create New Character" butonu
    - **Step 2 Karakter Seçimi:**
      - Eğer kullanıcının karakterleri varsa:
        - "Select Character" bölümü gösterilir
        - Karakter listesi (grid/cards)
        - "Upload New Photo" butonu (yeni karakter için)
      - Eğer karakteri yoksa:
        - Mevcut flow (sadece fotoğraf yükleme)
    - **Karakter Kartı Component:**
      - Thumbnail image
      - Name, Age
      - Book count badge
      - "Select" button
      - "Edit" button (opsiyonel)
    - **Workflow:**
      - Step 1 → Step 2:
        - Karakterleri varsa: "Select Character" veya "Upload New Photo"
        - Karakteri yoksa: Mevcut flow (upload)
      - Karakter seçildiğinde:
        - Step 1 verileri otomatik doldurulur (name, age, gender)
        - Kullanıcı isterse edit edebilir
        - Edit yapılırsa karakter güncellenir (PATCH /api/characters/:id)
      - Create Book:
        - Seçilen karakter: character_id ile book oluştur
        - Yeni karakter: Önce character oluştur, sonra book oluştur
  - **Database:**
    - ✅ Zaten hazır (characters tablosu kullanıcıya özel, is_default mekanizması var)
    - ✅ RLS policies hazır
    - ✅ books tablosunda character_id var
  - **API:**
    - ✅ GET /api/characters (kullanıcının tüm karakterleri) - var
    - ✅ GET /api/characters/:id (karakter detayı) - var
    - ✅ PATCH /api/characters/:id (karakter güncelle) - var
    - ✅ DELETE /api/characters/:id (karakter sil) - var
    - ⏳ API iyileştirmeleri: total_books, last_used_at bilgileri eklenmeli
  - **Frontend:**
    - ⏳ Dashboard Characters tab (Faz 2.6)
    - ⏳ Step 2 karakter seçimi UI (Faz 2.4.2)
    - ⏳ Character card component
    - ⏳ Character selection modal/section
  - **Detaylı Plan:** `docs/strategies/CHARACTER_LIBRARY_STRATEGY.md` (oluşturulacak)

### Gelecek Özellikler (Post-MVP)
- [ ] **Hakkımızda (About) Sayfası** - Şirket hikayesi, ekip bilgileri, misyon/vizyon
  - **Tarih:** 25 Ocak 2026
  - **Kategori:** Post-MVP / Backlog
  - **Durum:** ⏸️ Ertelendi - MVP için gerekli değil
  - **Not:** Header ve Footer'dan About linki kaldırıldı. Gelecekte ihtiyaç duyulduğunda eklenebilir.
- [x] **Multi-karakter desteği (5 karaktere kadar)** - ✅ **MVP'ye taşındı (4 Ocak 2026); limit 5'e çıkarıldı (1 Mart 2026)**
  - **Tarih:** 4 Ocak 2026
  - **Kategori:** MVP / Faz 2.4.2
  - **Özellikler:**
    - 5 karaktere kadar destek (örnek: 2 çocuk 1 köpek 1 kedi, vb.)
    - Her karakter için ayrı fotoğraf yükleme
    - Karakter tipi seçimi (Çocuk, Köpek, Kedi, vb.)
    - Ücretsiz özellik (MVP'de dahil)
  - **Detaylar:** Faz 2.4.2'ye bakın
- [x] Multi-karakter desteği genişletme (5 karaktere kadar) - ✅ **Tamamlandı (1 Mart 2026)**
- [ ] Pet ve oyuncak karakterleri (genişletilmiş liste)
- [ ] Görsel yeniden oluşturma (revize)
- [ ] Sesli kitap (text-to-speech)
- [ ] Video hikayeler / Çizgi film (23 Ocak 2026)
  - Video ile çizgi film yapmak satış ve ARGE açısından iyi bir yere gidebilir
  - Hemen değil ama roadmap'te kesinlikle olmalı
  - Kişiye özel çizgi film
  - Google Veo3 veya bize en uygun sonuc vereceklerden deneyebiliriz
  - Araştırılması lazım
  - **Kategori:** Gelecek / ARGE
  - **Not:** Şu an için sadece fikir aşamasında, teknoloji ve maliyet analizi gerekli
- [x] Mobil uygulama - ✅ **Faz 6'ya taşındı** (PWA yaklaşımı ile)
- [ ] Abonelik modeli
- [ ] Referral programı
- [ ] Blog sayfası
- [ ] **Kullanıcı review sayfası** – Kullanıcı yorumları ve puanları (10,000+ mutlu aile, 4.9/5 vb.) için ayrı sayfa. Anasayfadaki Trust Indicators bölümü kaldırıldı; review içeriği bu sayfada toplanacak.
  - **Kategori:** Post-MVP / Gelecek Özellikler
  - **Not:** Anasayfa UI iyileştirmeleri kapsamında Trust Indicators kaldırıldı (Şubat 2026).
- [ ] **B2B (Business-to-Business) Özelliği** - Kreşler, özel okullar gibi şirketler için toplu kitap oluşturma sistemi
  - **Tarih:** 4 Ocak 2026
  - **Kategori:** Post-MVP / Gelecek Özellikler
  - **Detaylı Analiz:** `docs/strategies/B2B_FEATURE_ANALYSIS.md`
  - **Özellikler:**
    - Şirket/kurum kayıt sistemi (admin paneli)
    - Toplu kitap oluşturma (10+ çocuk için)
    - Ebeveynlerle link ile paylaşma
    - Toplu baskı yapma
    - Adetlere göre özel fiyatlandırma
    - Şirket dashboard'u (oluşturulan kitapları görüntüleme)

### Yasal ve Uyumluluk (Production Sonrası)
- [ ] **ETBİS Kayıt İşlemi** - ETBİS sistemine kayıt olunması gerekiyor
  - **Tarih:** 24 Ocak 2026
  - **Kategori:** Post-MVP / Production Sonrası
  - **Öncelik:** 🔴 Kritik (Production sonrası)
  - **Açıklama:** ETBİS (Elektronik Ticaret Bilgi Sistemi) sistemine kayıt olunması gerekiyor. Bu, Türkiye'de e-ticaret yapan işletmeler için yasal bir gerekliliktir.
  - **Not:** Production'a geçmeden önce veya hemen sonrasında bu işlem tamamlanmalıdır.
  - **Araştırılacaklar:**
    - ETBİS kayıt süreci ve gereksinimleri
    - Gerekli belgeler ve bilgiler
    - Kayıt süresi ve maliyeti
    - Kayıt sonrası yükümlülükler

### Referans Siteden (magicalchildrensbook.com) Eksik Özellikler

#### MVP'ye Eklenmeli (Önemli)
- [x] **Multi-karakter desteği (5 karaktere kadar)** - ✅ **MVP'ye eklendi (4 Ocak 2026); limit 5'e çıkarıldı (1 Mart 2026)**
  - **Tarih:** 4 Ocak 2026
  - **Kategori:** MVP / Faz 2.4.2
  - **Açıklama:** Hikaye oluştururken 5 karaktere kadar eklenebilmeli (örnek: 2 çocuk 1 köpek, 1 çocuk 1 kedi, vb.)
  - **Özellikler:**
    - "Add Character" butonu (maksimum 5 karakter)
    - Her karakter için ayrı upload alanı
    - Karakter tipi seçimi (Çocuk, Köpek, Kedi, vb.)
    - Ücretsiz özellik
  - **UI Yaklaşımı:** v0.app ile yeni component çizdirmek önerilir (daha temiz UX)
  - **Detaylar:** Faz 2.4.2'ye bakın
- [ ] **Cookie Banner** - GDPR/KVKK uyumluluk için cookie onayı
- [ ] **Ülke/Para Birimi Seçici** - Header'da ülke ve para birimi değiştirme
- [ ] **Sepet İkonu** - Header'da sepet göstergesi (shopping bag)
- [ ] **10+ Yaş Kategorisi** - Şu an sadece 0-2, 3-5, 6-9 var, 10+ eklenmeli
- [ ] **Kampanya Banner'ları** - "Free shipping when you buy 2+ books", "50% off 3rd book" gibi
- [ ] **"View Example" Butonları** - Örnek kitapları görüntüleme butonları
- [x] **"Used Photos" Gösterimi** - Örneklerde hangi fotoğrafların kullanıldığını gösterme ✅ (6 Mart 2026)
  - **Karar (4 Ocak 2026):** Örnek Kitaplar Carousel (2.2.3) içinde gösterilecek - Her kitap kartında kullanılan fotoğraf (solda) → Kitap kapağı (sağda) şeklinde before/after gösterimi
  - **Implementasyon (6 Mart 2026):** API güncellendi - generation_metadata.usedPhotos varsa kullan, yoksa characterIds → characters tablosu batch sorgusu. Sadece /examples sayfası.
- [ ] **Tema Kartları Görsel Gösterimi** - Her tema için görsel thumbnail
- [ ] **"View All Examples" Linki** - Tüm örnekleri görüntüleme
- [ ] **"View All Themes" Linki** - Tüm temaları görüntüleme
- [ ] **"Show More Reviews" Butonu** - Reviews bölümünde daha fazla göster

#### Post-MVP (Gelecekte)
- [ ] **Localization (i18n) Sistemi** - Çoklu dil desteği (TR, EN ve gelecekte 25+ dil)
  - [ ] Dil seçici component (header'da)
  - [ ] Tüm UI metinlerinin çevirisi
  - [ ] Dinamik dil değiştirme
  - [ ] URL-based dil routing (/tr/, /en/, vb.)
  - [ ] Cookie/localStorage ile dil tercihi saklama
  - [ ] **Localization Agent (23 Ocak 2026):** Bu işten sorumlu bir agent olmalı. Tüm düzeni bilir ve bu işleri hep onunla yaparız. Tüm localization işleri bu agent üzerinden yönetilmeli.
  - **Not:** Şu an tüm UI EN olarak geliştiriliyor, localization Faz 5 veya Post-MVP'de eklenecek
  - **Sektör Standartları ve URL Yapısı (26 Ocak 2026):**
    - **Önerilen Yapı: Subdirectory (Alt Dizin)** - `kidstorybook.com/tr/`, `kidstorybook.com/en/`, `kidstorybook.com/de/`
    - **Neden Subdirectory?**
      - SEO equity tek domain'de toplanır (daha iyi SEO performansı)
      - Daha düşük maliyet (tek SSL sertifikası, birleşik hosting)
      - Daha basit analytics ve implementasyon
      - Shopify, Stripe, Notion gibi büyük şirketler bu yöntemi kullanıyor
    - **Alternatifler (Önerilmez):**
      - Subdomain (`tr.kidstorybook.com`): SEO'yu böler, daha karmaşık analytics
      - ccTLD (`kidstorybook.tr`, `kidstorybook.de`): En pahalı, ayrı hosting ve SSL gerektirir
    - **Implementasyon:**
      - Next.js 14 App Router ile `app/[locale]/` yapısı kullanılabilir
      - `next-intl` veya `next-i18next` gibi kütüphaneler kullanılabilir
      - Otomatik dil algılama: IP-based geolocation veya browser language
      - Default dil: İngilizce (EN), fallback mekanizması
- [ ] **Çoklu Para Birimi** - USD, EUR, GBP, TRY, vb. otomatik dönüşüm
- [ ] **26 Ülkeye Kargo** - Basılı kitap için geniş kargo ağı
- [ ] **Erişilebilirlik Özellikleri** - Screen reader, keyboard navigation, vb.
- [ ] **Reviews/Testimonials Sayfası** - Detaylı kullanıcı yorumları sayfası

### Keyboard Shortcuts (E-book Viewer)

| Tuş | Fonksiyon |
|-----|-----------|
| `→` / `Space` | Sonraki sayfa |
| `←` / `Backspace` | Önceki sayfa |
| `Home` | İlk sayfaya git |
| `End` | Son sayfaya git |
| `F` | Fullscreen toggle |
| `Esc` | Fullscreen'den çık / Thumbnails'ı kapat |
| `P` | TTS Play/Pause (autoplay kapalıyken) |
| `A` | Autoplay toggle |
| `B` | Bookmark toggle (mevcut sayfayı işaretle/kaldır) |
| `T` | Thumbnails (sayfa önizlemeleri) |
| `S` | Share (paylaş) |

### E-book Viewer Notları (4 Ocak 2026)
**Kritik Önem:** E-book viewer kullanıcının en çok etkileşimde bulunacağı kısım. Mükemmel olmalı.

**Detaylı Strateji:** `docs/strategies/EBOOK_VIEWER_STRATEGY.md`

**Settings UI İyileştirmesi (6 Ocak 2026):**
- **Mevcut Durum:** Sağ üstte Settings dropdown mevcut (debug için)
- **Sorun:** Çok fazla seçenek var, karmaşık görünüyor, kullanıcı dostu değil
- **Planlanan İyileştirmeler:**
  - Settings dropdown'ı daha güzel bir yere taşınacak (örn: bottom bar'da ayrı bir buton, veya slide-in panel)
  - Daha sade ve anlaşılır hale getirilecek
  - Kullanıcı dostu tasarım (daha az teknik terim, daha çok görsel ipuçları)
  - Gerekli ayarlar öne çıkarılacak, gelişmiş ayarlar gizlenecek veya ayrı bir bölüme alınacak
- **Zamanlama:** Faz 2.5.5 (UX İyileştirmeleri) veya Faz 3 (Polish) sırasında

**Görsel Kırpılma Sorunu (10 Ocak 2026):**
- **Sorun:** E-book viewer'da ekran boyutuna göre metin altta (portrait) veya yanda (landscape) olabiliyor, ancak görsel kırpılıyor (`object-cover` kullanılıyor)
- **Mevcut Durum:** 
  - Portrait mode: Görsel üstte, metin altta (stacked layout)
  - Landscape mode: Görsel solda, metin sağda (side-by-side)
  - Görsel `object-cover` ile gösteriliyor, bu da görselin kırpılmasına neden oluyor
- **Çözüm Önerileri:**
  - `object-contain` kullanarak görselin tamamını göstermek (kenarlarda boşluk olabilir)
  - Görsel için dinamik aspect ratio hesaplama
  - Zoom özelliği ekleyerek kullanıcının görseli yakınlaştırmasına izin vermek
  - Görsel için `object-position` ile önemli kısmın ortalanması
  - Responsive görsel boyutlandırma (farklı ekran boyutları için farklı aspect ratio'lar)
- **İlgili Dosyalar:**
  - `components/book-viewer/book-page.tsx` - Görsel gösterimi burada yapılıyor
  - `components/book-viewer/book-viewer.tsx` - Ana viewer component
- **Zamanlama:** Faz 2.5.1.7 (Zoom in/out) veya Faz 2.5.5 (UX İyileştirmeleri) sırasında ele alınacak
- **Kategori:** UI/UX İyileştirmesi / Responsive Design

**Temel Gereksinimler:**
1. **Responsive Layout:**
   - Portrait (dikey): Tek sayfa gösterimi
   - Landscape (yatay): Çift sayfa - bir taraf görsel, bir taraf yazı
   - Orientation detection: Otomatik layout değişimi

2. **Sayfa Geçiş Animasyonları:**
   - Flip effect (varsayılan): Gerçek kitap gibi
   - Slide, Fade, Curl: Alternatif animasyonlar
   - Kullanıcı seçebilmeli

3. **Sesli Okuma (TTS):**
   - 3-5 farklı ses seçeneği (kadın, erkek, çocuk)
   - Speed control (0.5x - 2x)
   - Volume control
   - Sayfa vurgulama (okunan kelime/cümle)
   - Otomatik sayfa ilerleme (ses bitince)

4. **Otomatik Oynatma (Autoplay):**
   - Manuel, Timed, TTS Synced modları
   - Kullanıcı ayarlayabilir hız (5s, 10s, 15s, 20s per page)
   - Ekrana dokunarak duraklama
   - Visual indicator (countdown, progress ring)

5. **Ekstra Özellikler:**
   - Zoom in/out (görselleri yakınlaştırma)
   - Fullscreen mode
   - Page thumbnails / mini map
   - Bookmark system
   - Reading progress tracking (nerede kaldı)
   - Share functionality
   - Download as PDF
   - Keyboard shortcuts (desktop)
   - Touch gestures (mobile)

6. **Accessibility:**
   - WCAG 2.1 AA uyumluluk
   - High contrast mode
   - Font size control
   - Dyslexia-friendly font
   - Reduced motion option
   - Screen reader support

**Implementation Plan:**
- Faz 1: Temel görüntüleme ve navigasyon (2-3 gün)
- Faz 2: Gelişmiş özellikler (2-3 gün)
- Faz 3: Sesli okuma (2-3 gün)
- Faz 4: Autoplay ve UX (1-2 gün)
- Faz 5: Polish ve optimizasyon (1-2 gün)
- **Toplam:** 8-13 gün (1.5-2.5 hafta)

**Başlamadan Önce:**
1. Technical research (react-pageflip vs alternatives)
2. Design mockups (v0.app ile birkaç versiyon)
3. User testing plan
4. Beta kullanıcı feedback

**Not:** v0.app'de birkaç versiyon denemek gerekebilir. İlk seferde mükemmel olmayabilir, iterasyon şart.

---

### Teknik Notlar
- POC'taki prompt template'leri production'a taşınacak
- Karakter tutarlılığı için reference image + detaylı prompt yaklaşımı
- İlk aşamada %50 otomatik, %50 manuel kontrol (kalite için)
- **ROADMAP CSV Sistemi (23 Ocak 2026):** ✅ **TAMAMLANDI**
  - **Dosyalar:**
    - `docs/roadmap.csv` - Google Sheets'e import edilebilir CSV dosyası (Gizli)
    - `docs/roadmap-viewer.html` - HTML tablo görüntüleyici ⭐ (filtreleme, sıralama, arama) (Gizli)
    - `scripts/generate-roadmap-csv.js` - CSV oluşturma script'i
    - `docs/ROADMAP_CSV_README.md` - CSV kullanım rehberi
  - **Özellikler:**
    - ROADMAP.md'den otomatik CSV oluşturma (`npm run roadmap`)
    - CSV sadece `docs/` klasörüne yazılır (güvenlik için `public/` klasöründe değil)
    - HTML Viewer: Tarayıcıda çalışan interaktif tablo (Excel açmaya gerek yok!)
    - HTML Viewer `docs/` klasöründe (son kullanıcılar erişemez)
    - Google Sheets'te filtreleme, sıralama, grafik oluşturma
    - Draft fikirler ekleme desteği
    - 10 kolon: ID, Faz, Alt Faz, Başlık, Durum, Öncelik, Kategori, Notlar, Tarih, Link
    - ID kolonunun başında tab karakteri var (Excel/Google Sheets'te tarih olarak algılanmaması için)
  - **Kullanım:**
    - CSV oluşturma: `npm run roadmap`
    - HTML Viewer: `docs/roadmap-viewer.html` dosyasını tarayıcıda aç (otomatik CSV yükleme)
    - Google Sheets'e import: Dosya → İçe Aktar → Dosya yükle
    - Filtreleme: Durum, Öncelik, Faz, Kategori bazlı
  - **Güvenlik:**
    - CSV ve HTML Viewer `docs/` klasöründe (son kullanıcılar erişemez)
    - `public/` klasöründe değil (herkese açık olmaz)
  - **Sync:**
    - ROADMAP.md → CSV: Otomatik (script ile)
    - CSV → ROADMAP.md: Manuel (draft fikirler için)
  - **Detaylar:** `docs/ROADMAP_CSV_README.md`
- **Docker:** Docker desteği gelecekte eklenecek (Faz 1.3 veya Faz 5)
  - Dockerfile ve docker-compose.yml
  - Local development için Supabase Docker setup
  - Production deployment için Docker image
- **Storage Geçiş Planı:** Supabase Storage → AWS S3 (gelecekte)
  - **Şu an:** Supabase Storage kullanılacak (MVP için yeterli)
  - **Geçiş Zamanı:** Database dolmaya yakın (500MB limitine yaklaşıldığında)
- **Görsel Yönetimi ve Folder Yapısı (4 Ocak 2026):**
  - **Sorun:** Şu an görseller `public/` klasöründe düz olarak tutuluyor (örn: `arya-photo.jpg`)
  - **Gereksinim:** Görseller için standart bir isimlendirme ve folder yapısı oluşturulmalı
  - **Çözüm:** 
    - Görseller proje içinde değil, S3'te tutulmalı (Storage geçiş planı ile birlikte)
    - S3'te folder yapısı: `{user_id}/{book_id}/{image_type}/{filename}`
    - Örnek: `users/123/books/456/photos/arya-photo.jpg`, `users/123/books/456/covers/cover-1.jpg`
    - İsimlendirme: `{character-name}-{type}-{timestamp}.{ext}` (örn: `arya-photo-20260104.jpg`)
  - **Not:** Bu konu S3 geçişi ile birlikte ele alınacak, şimdilik `public/` klasöründe mock görseller kullanılabilir
- **Faz 2.1 Ertelenen İşler (4 Ocak 2026):**
  - **Typography (Faz 2.1.3):** Çocuk dostu fontlar (Fredoka, Quicksand) eklenmesi ertelendi. Şu an Inter kullanılıyor, yeterli. Faz 2.2 sonrası tekrar ele alınacak.
  - **Loading States ve Error Boundaries (Faz 2.1.4):** Global loading states ve error boundary component'leri ertelendi. Faz 2.2 (Ana Sayfa) tamamlandıktan sonra eklenmesi planlanıyor. Neden: Ana içerik geliştirmesi öncelikli, loading/error handling sonra optimize edilebilir.
  - **Geçiş Planı:**
    - [ ] AWS S3 bucket oluştur
    - [ ] IAM policy ayarla
    - [ ] Upload utility'leri S3'e migrate et
    - [ ] Mevcut dosyaları S3'e taşı
    - [ ] Supabase Storage kodlarını S3'e çevir
    - [ ] URL'ler Supabase DB'de kalır (S3 URL'leri)
  - **Tahmini Süre:** 1-2 hafta (geçiş zamanı geldiğinde)
  - **Not:** Hibrit yaklaşım - Supabase (DB) + AWS S3 (Storage)
- **Authentication Issues & Workarounds (10 Ocak 2026):**
  - **Sorun 1:** Register sonrası email verification durumu belirsiz
    - Geçici çözüm: Session kontrolü yapılıyor, varsa dashboard, yoksa verify-email
    - Düzgün çözüm: Faz 3'te Supabase email verification durumunu kontrol et
    - Konum: `app/auth/register/page.tsx`, `docs/guides/AUTHENTICATION_ISSUES.md`
  - **Sorun 2:** `public.users` tablosu boş (migration 005 henüz uygulanmadı)
    - Geçici çözüm: Register sonrası manuel update yapılıyor (ama trigger yok)
    - Düzgün çözüm: Migration 005'i Supabase'de çalıştır (trigger otomatik kayıt yapacak)
    - Konum: `supabase/migrations/005_fix_user_references.sql`, `docs/guides/AUTHENTICATION_ISSUES.md`
  - **Sorun 3:** Dashboard auth kontrolü sadece client-side
    - Geçici çözüm: `useEffect` ile kontrol + loading state
    - Düzgün çözüm: Faz 3'te middleware'de server-side protection
    - Konum: `app/dashboard/page.tsx`, `docs/guides/AUTHENTICATION_ISSUES.md`
  - **Sorun 4:** Header auth state sadece client-side (hydration riski)
    - Geçici çözüm: `useEffect` + `onAuthStateChange` listener
    - Düzgün çözüm: Faz 3'te server-side auth state yönetimi
    - Konum: `components/layout/Header.tsx`, `docs/guides/AUTHENTICATION_ISSUES.md`
  - **Detaylı Dokümantasyon:** `docs/guides/AUTHENTICATION_ISSUES.md`
- **Text-to-Speech (TTS) Stratejisi (15 Ocak 2026 - GÜNCELLENDİ):**
  - ✅ **Gemini Pro TTS'e Geçiş (15 Ocak 2026):**
    - ✅ Google Cloud Gemini Pro TTS modeli aktif
    - ✅ Achernar sesi default olarak kullanılıyor
    - ✅ WaveNet ve Standard sesler kaldırıldı
    - **Fiyatlandırma:**
      - Input: $1.00 / 1M text token
      - Output: $20.00 / 1M audio token (25 token/saniye)
      - Örnek maliyet: ~500 karakter → ~$0.005/okuma
  - ✅ **TTS Cache Mekanizması (15 Ocak 2026 - TAMAMLANDI):**
    - ✅ Implementasyon tamamlandı (`app/api/tts/generate/route.ts`)
    - ✅ Text'i SHA-256 hash'le (unique identifier)
    - ✅ İlk okuma: API'den al, Supabase Storage'a kaydet (`tts-cache/{hash}.mp3`)
    - ✅ Sonraki okumalar: Storage'dan çek (ücretsiz, API çağrısı yok)
    - ✅ Migration: `supabase/migrations/008_create_tts_cache_bucket.sql`
    - ✅ Cleanup: 30 günden eski dosyalar otomatik silinir
    - **Maliyet Tasarrufu:** Aynı metin 10 kez okutulursa → 9 API çağrısı bedava
  - ✅ **8 Dil Desteği (15 Ocak 2026):**
    - ✅ Türkçe (TR), İngilizce (EN), Almanca (DE), Fransızca (FR)
    - ✅ İspanyolca (ES), Portekizce (PT), Rusça (RU), Çince (ZH)
    - ✅ Her dil için özel prompt'lar (`lib/prompts/tts/v1.0.0/`)
    - ✅ Dil mapping sistemi (PRD kodu → Gemini TTS kodu)
  - **TTS Gelişmiş Özellikler (Gelecek):**
    - [ ] **TTS Cache Temizleme (Hikaye Değişikliğinde):** Hikaye metni değiştiğinde eski cache dosyasını sil, yeni ses oluştur - ⏳ Planlanıyor (15 Ocak 2026)
      - **Sorun:** Hikaye metni düzenlendiğinde eski cache'den yanlış ses çalıyor
      - **Çözüm:** Hikaye güncellendiğinde ilgili sayfaların cache hash'lerini hesapla, eski dosyaları Supabase Storage'dan sil
      - **Implementasyon:** Book edit API'sinde veya sayfa metni değiştiğinde cache temizleme fonksiyonu çağır
    - [ ] Otomatik Dil Algılama: Localization altyapısı ile birlikte (Faz 5)
    - [ ] Yaş Grubuna Göre Özelleştirme: 3-5 yaş (yavaş), 6-8 yaş (normal), 9-12 yaş (hızlı)
    - [ ] Modlar: Uyku modu (yavaş), Neşeli mod (enerjik), Samimi mod (sıcak)
    - [ ] Alternatif Gemini Pro Sesler: 30 ses mevcut, eklenebilir
    - **Strateji Dokümanı:** `docs/strategies/TTS_STRATEGY.md` (v2.0 - 15 Ocak 2026)

### v0.app vs bolt.new Karşılaştırması

#### v0.app (Vercel)
**Avantajlar:**
- ✅ Vercel tarafından yapılmış (Next.js ile mükemmel entegrasyon)
- ✅ Ücretsiz tier mevcut
- ✅ GitHub entegrasyonu (kod direkt repo'ya push edilebilir)
- ✅ Vercel deployment (tek tıkla deploy)
- ✅ shadcn/ui componentleri ile çalışıyor
- ✅ Modern, güçlü prompt sistemi
- ✅ Design mode (görsel düzenleme)

**Dezavantajlar:**
- ⚠️ Premium hesap gerekebilir (yoğun kullanım için)
- ⚠️ Rate limiting (ücretsiz tier'de)

**Fiyatlandırma:**
- Ücretsiz: Sınırlı kullanım
- Pro: $20/ay (daha fazla kullanım)

#### bolt.new
**Avantajlar:**
- ✅ Ücretsiz (şu an)
- ✅ Hızlı prototipleme
- ✅ Modern UI
- ✅ Kolay kullanım

**Dezavantajlar:**
- ⚠️ Henüz yeni, ekosistem tam gelişmemiş
- ⚠️ GitHub entegrasyonu sınırlı olabilir
- ⚠️ Vercel entegrasyonu yok

**Fiyatlandırma:**
- Ücretsiz (şu an)

#### Öneri
**v0.app önerilir çünkü:**
- ✅ Vercel ekosistemi (Next.js + Vercel deployment)
- ✅ GitHub entegrasyonu (kod direkt repo'ya gider)
- ✅ shadcn/ui desteği (projede kullanıyoruz)
- ✅ Production-ready çıktılar
- ✅ Design mode ile fine-tuning

**Not:** İlk başta ücretsiz tier ile başla, gerekirse Pro'ya geç.

### Ücretsiz Kapak Hakkı Sistemi

#### Özellik Detayları
- **Her yeni üyeye 1 adet ücretsiz kapak hakkı verilir**
- **Sadece kapak (sayfa 1) - tam kitap değil**
- **Database'de takip:** `users.free_cover_used` (boolean)
- **Kullanıldığında:** `true` olarak işaretlenir
- **UI'da gösterim:** Dashboard'da "1 Ücretsiz Kapak Hakkı" badge'i
- **Wizard'da:** "Ücretsiz Kapak Oluştur" butonu (hakkı varsa aktif)

#### İş Akışı
1. Kullanıcı kayıt olur → `free_cover_used = false`
2. Dashboard'da "1 Ücretsiz Kapak Hakkı" görünür
3. Kitap oluşturma wizard'ında "Ücretsiz Kapak Oluştur" butonu aktif
4. Kullanıcı kapak oluşturur → API çağrısı yapılır
5. Backend kontrol eder: `free_cover_used === false`?
6. Kapak oluşturulur → `free_cover_used = true` yapılır
7. Sonraki kapaklar için ödeme gerekir

#### Üyesiz (Guest) Kullanıcılar (27 Ocak 2026)
- **1 ücretsiz kapak / e-posta:** `guest_free_cover_used` tablosu (email UNIQUE)
- **Create Free Cover API guest dalı:** Body'de `email` zorunlu; `wizardData` → `characterData`, `theme`, `style` türetimi
- **Sadece drafts (user_id=null):** Kitap oluşturulmaz; kapak `drafts` tablosuna kaydedilir
- **IP rate limit:** 5 istek / IP / 24 saat (create-free-cover içinde); aşımda 429
- **Step 6:** "Pay & Create My Book" sadece üyeli gösterilir (`!user` iken gizli); üyesizde "1 Free Cover" + email input + "Create Free Cover"
- **Migration 014:** `guest_free_cover_used` tablosu, `drafts` için "Allow guest draft insert" RLS
- **Spec:** `docs/guides/STEP6_PAY_AND_GUEST_FREE_COVER_SPEC.md`

#### API Endpoint
```
POST /api/ai/generate-cover
Body: {
  characterName: string,
  characterAge: number,
  characterGender: string,
  theme: string,
  illustrationStyle: string,
  photo: File
}
Response: {
  success: boolean,
  coverUrl: string,
  freeCoverUsed: true
}
```

### Teknoloji Seçim Açıklamaları

#### Next.js 14 Neden?
- **Stabil ve Olgun:** Next.js 14 (App Router) production-ready, geniş topluluk desteği var
- **Next.js 15/16:** Henüz çok yeni, breaking changes olabilir, ekosistem henüz tam adapte olmamış
- **App Router:** Modern, performanslı, SEO dostu
- **Vercel Entegrasyonu:** Next.js'in yaratıcısı Vercel, mükemmel entegrasyon
- **Not:** İleride Next.js 15/16'ya geçiş kolay (aynı framework)

#### Supabase Neden Firebase Değil?
- **PostgreSQL:** İlişkisel veritabanı, e-commerce için ideal (Firebase NoSQL)
- **SQL Sorguları:** Karmaşık sorgular için SQL daha güçlü
- **Açık Kaynak:** Vendor lock-in riski daha düşük
- **Fiyatlandırma:** Supabase daha şeffaf ve uygun fiyatlı
- **Real-time:** Her ikisi de real-time desteği var
- **Auth:** Her ikisi de güçlü auth sistemi
- **Storage:** Her ikisi de dosya depolama sunuyor
- **Not:** Firebase de kullanılabilir, ama Supabase projemiz için daha uygun

### Yararlı Linkler
- [magicalchildrensbook.com](https://magicalchildrensbook.com/) - Referans site
- [v0.app](https://v0.app/) - UI builder
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Supabase](https://supabase.com/) - Backend

---

## 🔔 Post-MVP: Hata Bildirimleri (Operasyonel İzleme)

### Master Illustration – Kullanıcı/Admin Bildirimi (2026-03-01)
**Bağlam:** Kitap oluşturma sırasında master karakter illüstrasyonu oluşturulamadığında (örn. OpenAI moderation block sonrası retry'da da başarısız) kullanıcıya hata mesajı gösteriliyor ve kitap oluşturma durduruluyor.

**Eksik:** Şu an bu hata sadece kullanıcıya toast mesajı olarak görünüyor. Mail/bildirim altyapısı kurulmadığı için admin bildirimi yok.

**İstenen:** Mail altyapısı (Resend, SendGrid, SES vb.) kurulduktan sonra:
- Kullanıcıya: "Bir sorun oluştu, tekrar deneyebilirsiniz, sorun devam ederse destek@... ile iletişime geçin" emaili
- Admin'e: Hangi kullanıcı, hangi kitap, hangi hata kodu, kaç retry yapıldı bilgisini içeren operasyonel alert

**Öncelik:** Post-MVP (mail altyapısı gerektiriyor)  
**İlgili:** `app/api/books/route.ts` → `generateMasterCharacterIllustration`, call site catch blokları  
**Kategori:** Operasyonel izleme / kullanıcı deneyimi

---

