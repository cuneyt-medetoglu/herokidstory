<!--
  HK-LEGAL-DOC: privacy-policy
  semver: 1.4.0
  last-update: 2026-04-11
  consumer-facing: app/[locale]/(public)/privacy/page.tsx (TR/EN; kullanıcıya semver/taslak etiketi gösterilmez)
  Bu .md: iç hukuk / avukat incelemesi ve CHANGELOG özeti; metin page.tsx ile senkron tutulmalıdır.
-->

# Gizlilik Politikası

**Kapsam:** Türkiye (KVKK), Avrupa Ekonomik Alanı / Birleşik Krallık (GDPR), ABD (COPPA ile uyumlu uygulamalar)  
**Versiyon (repo):** 1.4.0  
**Son güncelleme:** 11/04/2026  
**Yayın URL:** `/privacy` (locale: `tr` / `en` / …)

### Değişiklik geçmişi (CHANGELOG)

| Versiyon | Tarih | Statü | Değişiklik |
|---------|-------|-------|-----------|
| 1.0-draft | 11/04/2026 | 📝 draft | İlk taslak — gerçek veri modeline göre |
| 1.1-draft | 11/04/2026 | 📝 draft | Fotoğraf saklanmıyor olarak güncellendi; OpenAI mekanizması kapatıldı; hesap silme aktif olarak güncellendi |
| 1.2-draft | 11/04/2026 | 📝 draft | Hesap silme sonrası veri silme: 30 gün ifadesi kaldırıldı; hesap kapatılınca anında silinir |
| 1.3.0 | 11/04/2026 | 📝 draft | Kullanıcı arayüzünden taslak/semver kaldırıldı; Stripe, yurt dışı aktarım, yetkili merci, otomatik karar yok, ihlal bildirimi ayrımı; EN’de KVKK bölümü; `page.tsx` ile hizalama |
| 1.4.0 | 11/04/2026 | 📝 draft | AB m.27 temsilcisi yok (şeffaf ifade); Stripe küresel ödeme kesin ifade; referans fotoğraf / özel nitelik + minimizasyon netliği |

---

## 1. GİRİŞ

**Son Güncelleme:** 11 Nisan 2026

HeroKidStory, yapay zeka destekli kişiselleştirilmiş çocuk hikaye kitapları oluşturma hizmeti sunan bir platformdur.

**Veri Sorumlusu:**

| | |
|-|-|
| **Ad Soyad** | Cüneyt Medetoğlu |
| **İşletme Türü** | Şahıs İşletmesi |
| **Adres** | Atatürk Mah. Merkez İsimsiz91 Sk. Dema İnş B Blok No: 4/1 İç Kapı No: 3 Merkez / Tunceli |
| **E-posta** | info@herokidstory.com |
| **Web** | https://herokidstory.com |

Bu Gizlilik Politikası, HeroKidStory'nin hangi kişisel verileri topladığını, neden topladığını, nasıl kullandığını, kimlerle paylaştığını ve bu veriler üzerindeki haklarınızı açıklamaktadır.

> HeroKidStory'nin hedef kitlesi 2–10 yaş arası çocuklar içindir. Platform **yalnızca ebeveynler veya yasal veliler** tarafından kullanılır. Çocuklar doğrudan kayıt yapamaz.

---

## 2. TOPLANAN VERİLER

### 2.1 Hesap ve Profil Verileri (Kullanıcı/Ebeveyn)

| Veri | Nasıl Toplanır | Neden |
|------|---------------|-------|
| E-posta adresi | Kayıt formu veya Google/Facebook OAuth | Kimlik doğrulama, sipariş bildirimleri |
| Şifre (hash — düz metin asla saklanmaz) | Kayıt formu | Güvenlik |
| Ad Soyad | Profil / Ödeme formu | Hesap yönetimi, fatura |
| Profil fotoğrafı (isteğe bağlı) | Google/Facebook OAuth otomatik | Profil görüntüsü |
| Uygulama tercihleri | Otomatik (çocuk modu, dil, tema vb.) | Kullanıcı deneyimi |

### 2.2 Çocuk Karakter Verileri

> Bu veriler ebeveyn/veli tarafından, çocuk adına sağlanmaktadır.

| Veri | Nasıl Toplanır | Ne Kadar Saklanır |
|------|---------------|------------------|
| Çocuğun adı | Karakter formu | Kullanıcı hesabı aktif olduğu sürece |
| Çocuğun yaşı | Karakter formu | Kullanıcı hesabı aktif olduğu sürece |
| Cinsiyet | Karakter formu | Kullanıcı hesabı aktif olduğu sürece |
| Saç rengi, göz rengi | Karakter formu | Kullanıcı hesabı aktif olduğu sürece |
| AI tarafından üretilen karakter açıklaması | Otomatik (illüstrasyon promptu) | Kullanıcı hesabı aktif olduğu sürece |

**Çocuğun orijinal fotoğrafı hakkında:**

Karakter oluşturma sırasında bir referans fotoğraf yüklenebilir. Bu fotoğraf **yalnızca illüstrasyon üretimi sırasında geçici olarak işlenmektedir.** Kitap üretim süreci tamamlandıktan sonra orijinal fotoğraf sistemden kalıcı olarak silinmektedir. Platformda saklanan yalnızca **yapay zeka tarafından üretilmiş çizgi film tarzı illüstrasyondur** — bu, çocuğun gerçek görüntüsünü içermez.

Bu tasarım bilinçli bir gizlilik tercihidir: HeroKidStory, kullanıcı fotoğraflarını uzun süreli depolamaktan kaçınır.

### 2.3 Sipariş ve Ödeme Verileri

| Veri | Nasıl Toplanır | Neden |
|------|---------------|-------|
| Fatura adı/soyadı | Ödeme formu | Fatura düzenleme |
| Fatura adresi | Ödeme formu | Fatura ve muhasebe |
| Kargo adresi | Ödeme formu (basılı kitap için) | Teslimat |
| Sipariş tutarı, ürün, tarih | Otomatik | Sipariş yönetimi, fatura |
| Ödeme referans numarası | İyzico tarafından iletilir | Muhasebe |

> **Kredi/banka kartı bilgileri HeroKidStory tarafından görülmez veya saklanmaz.** Tüm ödeme işlemleri İyzico'nun PCI-DSS uyumlu altyapısında gerçekleştirilir.

### 2.4 Teknik Veriler (Otomatik Toplanan)

| Veri | Nasıl Toplanır | Neden |
|------|---------------|-------|
| IP adresi | Her oturumda otomatik | Güvenlik, para birimi tespiti |
| Tarayıcı türü ve versiyonu | Otomatik | Teknik uyumluluk |
| Cihaz türü | Otomatik | Teknik uyumluluk |
| Oturum verileri | Otomatik (NextAuth) | Kimlik doğrulama |
| Çerezler | Otomatik / kullanıcı onayı | Oturum yönetimi, tercihler |
| Uygulama hata logları | Otomatik | Teknik hata giderme |

---

## 3. VERİLERİN KULLANIM AMAÇLARI

| Amaç | İlgili Veriler | Hukuki Dayanak |
|------|----------------|----------------|
| Hesap oluşturma ve yönetimi | E-posta, şifre, ad | Sözleşme ifası |
| Kişiselleştirilmiş kitap üretimi | Karakter verileri, geçici fotoğraf | Açık rıza (ebeveyn) |
| Sipariş işleme ve fatura | Fatura bilgileri, sipariş verileri | Sözleşme ifası + Kanuni yükümlülük |
| Ödeme işleme | Ödeme verileri (İyzico'ya iletilir) | Sözleşme ifası |
| Kargo ve teslimat | Kargo adresi | Sözleşme ifası |
| Sipariş ve hesap bildirimleri | E-posta adresi | Sözleşme ifası |
| Güvenlik ve sahteciliği önleme | IP, cihaz bilgisi | Meşru menfaat |
| Para birimi tespiti | IP adresi | Meşru menfaat |
| Hizmet iyileştirme | Teknik loglar (anonim/toplu) | Meşru menfaat |
| Yasal yükümlülüklerin yerine getirilmesi | Sipariş ve fatura kayıtları | Kanuni yükümlülük |

---

## 4. VERİLERİN PAYLAŞIMI

HeroKidStory kişisel verilerinizi yalnızca hizmetin sunulması için zorunlu olan üçüncü taraflarla paylaşmaktadır. Kişisel verileriniz ticari amaçla üçüncü taraflara **satılmamaktadır.**

### 4.1 Ödeme Hizmeti

| Sağlayıcı | Aktarılan Veri | Konum | Amaç |
|-----------|---------------|-------|------|
| **İyzico** | Ad/soyad, fatura adresi, sipariş tutarı | Türkiye | Ödeme işleme |

İyzico, BDDK lisanslı ve KVKK uyumlu bir Türk ödeme kuruluşudur.

### 4.2 Barındırma ve Altyapı

| Sağlayıcı | Aktarılan Veri | Konum | Amaç |
|-----------|---------------|-------|------|
| **Amazon AWS** | Hesap verileri, sipariş kayıtları (şifreli) | ABD (us-east-1) | Sunucu barındırma |
| **Amazon S3** | Üretilen kitap görselleri, PDF'ler | ABD | Dosya depolama |
| **Vercel** (CDN) | IP adresi, istek logları | ABD/Global | İçerik dağıtımı |

> **Not:** Orijinal çocuk fotoğrafları S3'te saklanmamaktadır — üretim sonrası silinir.

### 4.3 Yapay Zeka Hizmetleri

| Sağlayıcı | Aktarılan Veri | Konum | Süre | Amaç |
|-----------|---------------|-------|------|------|
| **OpenAI** | Referans fotoğraf (geçici), hikaye parametreleri | ABD | Yalnızca üretim süresi | AI illüstrasyon + metin üretimi |
| **Google (Gemini)** | Hikaye metni | ABD | Yalnızca üretim süresi | TTS sesli okuma üretimi |

**OpenAI aktarımı hakkında önemli bilgiler:**
- Referans fotoğraf, illüstrasyon üretimi amacıyla OpenAI API'sine iletilir.
- OpenAI'ın API kullanım koşullarına göre, API aracılığıyla gönderilen veriler model eğitimi için kullanılmamaktadır.
- Üretim tamamlandıktan sonra referans fotoğraf hem HeroKidStory'nin sistemlerinden hem de API iletim sürecinin doğası gereği OpenAI'dan temizlenmektedir.
- Bu aktarım için karakter oluşturma adımında kullanıcının açık onayı alınmaktadır.

### 4.4 Kimlik Doğrulama

| Sağlayıcı | Aktarılan Veri | Konum | Amaç |
|-----------|---------------|-------|------|
| **Google OAuth** | E-posta, ad, profil fotoğrafı (yalnızca Google ile girişte) | ABD | Giriş |
| **Facebook OAuth** | E-posta, ad (yalnızca Facebook ile girişte) | ABD | Giriş |

### 4.5 E-posta Hizmeti

| Sağlayıcı | Aktarılan Veri | Konum | Amaç |
|-----------|---------------|-------|------|
| **Resend** | E-posta adresi, sipariş bilgileri | ABD/EU | Sipariş onayı, bildirimler |

### 4.6 Yasal Zorunluluk

Yasal yükümlülük, mahkeme kararı veya yetkili kamu otoritesinin talebi halinde kişisel veriler ilgili makamlarla paylaşılabilir.

---

## 5. VERİ SAKLAMA SÜRELERİ

| Veri Kategorisi | Saklama Süresi | Dayanak |
|----------------|---------------|---------|
| Hesap bilgileri (e-posta, ad, tercihler) | Hesap aktif olduğu sürece; hesap silindiğinde **anında** kalıcı silinir | Sözleşme ifası |
| Çocuk karakter verileri (ad, yaş, özellikler) | Kullanıcı karakteri veya hesabı silene kadar | Sözleşme ifası |
| Referans fotoğraf | **Kitap üretimi tamamlandıktan sonra otomatik silinir** | Veri minimizasyonu |
| Üretilen kitap görselleri ve PDF'ler | Kullanıcı kitabı siler veya hesabı kapatana kadar | Sözleşme ifası |
| Sipariş ve fatura kayıtları | **10 yıl** (VUK Madde 253 — yasal zorunluluk) | Kanuni yükümlülük |
| Ödeme referans kayıtları | 10 yıl | Kanuni yükümlülük |
| IP ve teknik loglar | 90 gün | Güvenlik / meşru menfaat |
| AI üretim logları (maliyet takibi) | 1 yıl | Meşru menfaat |
| E-posta iletişim kayıtları | 3 yıl | Meşru menfaat |

> **Önemli not — Fatura kayıtları:** Hesabınızı silseniz dahi, Türk Vergi Usul Kanunu (Madde 253) gereği fatura ve sipariş kayıtları 10 yıl süreyle saklanmak zorundadır. Bu kayıtlarda yalnızca ad/soyad ve fatura adresi gibi sipariş zorunluluğu olan veriler bulunur.

---

## 6. ÇOCUKLARIN GİZLİLİĞİ

Platform yalnızca **ebeveynler ve yasal veliler** tarafından kullanılabilir.

### 6.1 Fotoğraf Tasarım Tercihi

HeroKidStory, çocuk fotoğraflarını uzun süreli depolamama kararını bilinçli bir gizlilik önlemi olarak almıştır. Orijinal fotoğraf yalnızca AI üretim sürecinde anlık olarak kullanılır ve üretim tamamlandıktan sonra sistemden kalıcı olarak silinir. Kullanıcı kitaplığında saklanan görsel, gerçek fotoğrafın değil AI tarafından üretilmiş çizgi film tarzı illüstrasyonun kendisidir.

### 6.2 Çocuk Verisi İşleme Onayı

Platform, çocuğa ait veri işlemeden önce ebeveyn/veliden açık onay almaktadır. Karakter oluşturma adımındaki onay metni:

> _"Çocuğuma ait fotoğraf ve bilgilerin, kişiselleştirilmiş hikaye kitabı üretimi amacıyla yapay zeka hizmetine (OpenAI) geçici olarak iletileceğini, üretim sonrası orijinal fotoğrafın silineceğini anlıyor ve onay veriyorum."_

### 6.3 Yaş Doğrulama

Kayıt sırasında kullanıcıların 18 yaşından büyük olduğu beyan etmesi zorunludur. Çocuklar platformu doğrudan kullanamaz.

### 6.4 COPPA Uyumu (ABD Kullanıcıları)

13 yaş altı çocuklara ait verilerin işlenmesi yalnızca ebeveyn açık onayıyla gerçekleştirilmektedir. ABD'li ebeveynler, çocuklarına ait verilerin silinmesini info@herokidstory.com adresinden talep edebilir.

### 6.5 GDPR Çocuk Verileri (AB Kullanıcıları)

AB mevzuatı kapsamında 16 yaş altı çocuklar için ebeveyn onayı zorunludur. HeroKidStory bu onayı karakter oluşturma adımında almaktadır.

---

## 7. VERİ SAHİBİNİN HAKLARI

### 7.1 KVKK Kapsamında Türk Kullanıcıların Hakları (Madde 11)

- Kişisel verilerinizin işlenip işlenmediğini öğrenme
- İşlenmişse buna ilişkin bilgi talep etme
- İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
- Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme
- Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme
- KVKK Madde 7 çerçevesinde silinmesini veya yok edilmesini isteme
- Otomatik sistemler ile analiz edilmesi sonucu ortaya çıkan karara itiraz etme
- Kanuna aykırı işlenmesi sebebiyle zarara uğranılması halinde giderimini talep etme

### 7.2 GDPR Kapsamında AB Kullanıcılarının Hakları

- **Erişim hakkı** — işlenen verilerinizin kopyasını talep etme
- **Düzeltme hakkı** — yanlış verilerin düzeltilmesini isteme
- **Silme hakkı ("unutulma hakkı")** — belirli koşullarda verilerinizin silinmesini isteme
- **İşleme kısıtlama hakkı** — işlemenin kısıtlanmasını talep etme
- **Veri taşınabilirliği hakkı** — verilerinizin yapılandırılmış formatta teslimini isteme
- **İtiraz hakkı** — meşru menfaate dayalı işlemelere itiraz etme
- **Rızayı geri çekme hakkı** — rızaya dayalı her işlem için onayı istediğiniz zaman geri çekme
- **Şikayet hakkı** — ülkenizdeki Veri Koruma Otoritesi'ne şikayette bulunma

### 7.3 Hesap Silme

Hesabınızı silebilirsiniz: **Dashboard → Ayarlar → Hesabımı Sil**

Hesabınızı sildiğinizde şunlar gerçekleşir (işlem tamamlandığı anda; ayrı bir bekleme süresi yoktur):
- E-posta, ad, tercihler ve profil bilgileri silinir
- Oluşturduğunuz tüm kitaplar ve görseller silinir
- Tüm karakter verileri (ad, yaş, fiziksel özellikler) silinir
- Referans fotoğraflar zaten üretim sonrası silinmiş olduğundan ayrıca işlem gerekmez
- **İstisna:** Sipariş ve fatura kayıtları yasal zorunluluk nedeniyle 10 yıl saklanmaya devam eder (VUK Madde 253)

### 7.4 Haklarınızı Nasıl Kullanırsınız?

**E-posta:** info@herokidstory.com  
Konu satırına "KVKK Başvurusu" veya "GDPR Request" yazınız.

Başvurularınız **30 (otuz) gün** içinde yanıtlanacaktır.

Türk kullanıcılar Kişisel Verileri Koruma Kurulu'na (KVKK), AB kullanıcıları kendi ülkelerindeki Veri Koruma Otoritesi'ne başvurabilir.

---

## 8. GÜVENLİK

**Teknik Tedbirler:**
- Veriler AWS altyapısında şifreli (AES-256) olarak saklanmaktadır
- Aktarımda TLS/HTTPS şifrelemesi kullanılmaktadır
- Şifreler bcrypt ile hashlenir, düz metin asla saklanmaz
- Ödeme verileri PCI-DSS uyumlu İyzico altyapısında işlenir
- Erişim kontrolleri ve rol tabanlı yetkilendirme uygulanmaktadır

**İdari Tedbirler:**
- Kişisel verilere erişim yalnızca yetkili personelle sınırlıdır
- Üçüncü taraf sağlayıcılarla veri işleme anlaşmaları yapılmaktadır

Herhangi bir güvenlik ihlali durumunda, yasal süreler içinde (KVKK ve GDPR: 72 saat) yetkili kurumlara ve etkilenen kişilere bildirim yapılacaktır.

---

## 9. ÇEREZLER

Çerez kullanımı hakkında ayrıntılı bilgi için: [Çerez Politikası](/cookies)

Platform'da kullanılan temel çerez kategorileri:
- **Zorunlu çerezler:** Oturum yönetimi (NextAuth session), güvenlik
- **Tercih çerezleri:** Dil, tema, kullanıcı tercihleri
- **Analitik çerezler:** Yalnızca kullanıcı onayı halinde

---

## 10. POLİTİKA DEĞİŞİKLİKLERİ

Bu Gizlilik Politikası zaman zaman güncellenebilir. Önemli değişiklik yapıldığında:
- Politikanın üst kısmındaki "Son Güncelleme" tarihi değiştirilir
- Kayıtlı kullanıcılara e-posta ile bildirim yapılır
- Sitede banner gösterilebilir

Politikayı kullanmaya devam etmek, güncellenmiş versiyonu kabul ettiğiniz anlamına gelir.

---

## 11. İLETİŞİM VE BAŞVURU

| | |
|-|-|
| **E-posta** | info@herokidstory.com |
| **Posta Adresi** | Atatürk Mah. Merkez İsimsiz91 Sk. Dema İnş B Blok No: 4/1 İç Kapı No: 3 Merkez / Tunceli |
| **Yanıt Süresi** | 30 iş günü |

KVKK kapsamındaki başvurularınızda kimliğinizi doğrulayan bir belge eklemeniz gerekebilir.

---

<!--
  İç takip (markdown önizlemesinde gizlenmez — GitHub’da görünür; istersen bu bloğu sil veya ayrı issue’ya taşı):
  - VERBİS / KVKK temsilcisi: avukat değerlendirmesi
  - Karakter adımı OpenAI onayı, foto silme worker, hesap silme backend: ürün ekibi issue listesi
-->
