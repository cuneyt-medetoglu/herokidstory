# HeroKidStory — Çerez Politikası / Cookie Policy

**Versiyon:** 1.0-draft  
**Oluşturulma:** 11 Nisan 2026  
**Statü:** TASLAK — Avukat onayı öncesi  
**Kapsam:** 🌍 Global (TR + EN)  
**Sayfa URL:** `/cookies`

---

## CHANGELOG

| Tarih | Versiyon | Değişiklik |
|-------|----------|-----------|
| 11 Nisan 2026 | 1.0-draft | İlk taslak — aktif çerezler listelendi; analytics kullanılmıyor |

---

## 📋 TESPİTLER (Analiz Süreci)

| Konu | Durum |
|------|-------|
| Aktif analytics paketi (GA, Posthog vb.) | ❌ Yok — `package.json`'da analytics bağımlılığı yok |
| Facebook/Meta Pixel SDK | ❌ Yok — yalnızca OAuth akışı var, Pixel yüklenmiyor |
| Banner `/cookies` linki | ⚠️ Hâlâ `/privacy`'ye yönlendiriyor → bu PRde düzeltilecek |
| Banner timestamp kaydı | ⚠️ `localStorage`'a tarih damgası yok → bu PRde eklenecek |
| Pazarlama çerezi | ❌ Şu an aktif değil |
| Analitik çerezi | ❌ Şu an aktif değil |

---

# ÇEREZ POLİTİKASI (TR)

**Son Güncelleme:** 11 Nisan 2026  
**Versiyon:** 1.0-draft

## 1. Çerezler Hakkında

Çerezler (cookies), bir web sitesini ziyaret ettiğinizde tarayıcınıza yerleştirilen küçük metin dosyalarıdır. HeroKidStory bu dosyaları yalnızca platformun çalışması için zorunlu olan en az düzeyde kullanmaktadır.

Bu Çerez Politikası; hangi çerezleri kullandığımızı, neden kullandığımızı ve çerez tercihlerinizi nasıl yönetebileceğinizi açıklamaktadır.

Kişisel verilerinizin nasıl işlendiğine ilişkin kapsamlı bilgi için [Gizlilik Politikası](/privacy) sayfasını inceleyiniz.

---

## 2. Kullandığımız Çerezler

### 2.1 Zorunlu Çerezler (Her Zaman Aktif)

Bu çerezler platformun temel işlevleri için gereklidir; kapatılamaz.

| Çerez Adı | Kaynak | Süre | Amaç |
|-----------|--------|------|------|
| `next-auth.session-token` | NextAuth.js | Oturum (session) | Kullanıcı giriş oturumunu yönetir |
| `next-auth.csrf-token` | NextAuth.js | Oturum | CSRF saldırılarına karşı güvenlik |
| `__Secure-next-auth.session-token` | NextAuth.js | 30 gün | Güvenli bağlantıda oturum |
| `cookie-consent` | HeroKidStory | 1 yıl | Çerez tercih kararını kaydeder |
| `cookie-preferences` | HeroKidStory | 1 yıl | Detaylı çerez kategorisi tercihlerini saklar |
| `cookie-consent-timestamp` | HeroKidStory | 1 yıl | Onay/ret zamanını kaydeder (GDPR) |
| `NEXT_LOCALE` | Next.js i18n | 1 yıl | Dil tercihini saklar |

### 2.2 Analitik Çerezler (Onay Gerekli)

> **Güncel Durum:** HeroKidStory şu an üçüncü taraf analitik aracı kullanmamaktadır. Bu kategori, ileride analytics entegrasyonu eklendiğinde aktive edilecektir.

| Çerez Adı | Kaynak | Süre | Amaç |
|-----------|--------|------|------|
| — | — | — | Şu an analitik çerezi kullanılmıyor |

### 2.3 Pazarlama Çerezleri (Onay Gerekli)

> **Güncel Durum:** HeroKidStory şu an pazarlama veya reklam hedefleme aracı kullanmamaktadır. Yalnızca OAuth girişi için Facebook API bağlantısı yapılmaktadır; bu bağlantı pazarlama çerezi oluşturmaz.

| Çerez Adı | Kaynak | Süre | Amaç |
|-----------|--------|------|------|
| — | — | — | Şu an pazarlama çerezi kullanılmıyor |

---

## 3. Üçüncü Taraf Çerezler

| Sağlayıcı | Amaç | Çerez Türü | Gizlilik Politikası |
|-----------|------|-----------|---------------------|
| NextAuth.js | Kimlik doğrulama altyapısı | Zorunlu | — (açık kaynak kütüphane) |
| Google (OAuth) | Google ile giriş seçeneği | Zorunlu | [policies.google.com](https://policies.google.com) |
| Facebook (OAuth) | Facebook ile giriş seçeneği | Zorunlu | [facebook.com/privacy](https://www.facebook.com/privacy/policy) |
| Vercel | CDN, sayfa sunumu | Zorunlu | [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy) |

> **Not:** Google ve Facebook OAuth akışlarında yalnızca giriş işlemi için gerekli teknik bağlantı kurulmaktadır. Bu bağlantılar reklam veya izleme çerezi oluşturmaz.

---

## 4. Çerez Tercihlerinizi Yönetme

### 4.1 Banner Üzerinden

Sitemizi ilk ziyaretinizde görüntülenen çerez onay banner'ı üzerinden tercihlerinizi belirleyebilirsiniz:
- **Tümünü Kabul Et** — tüm çerezlere onay
- **Reddet** — yalnızca zorunlu çerezler
- **Özelleştir** — kategori bazlı seçim

### 4.2 Tercihlerinizi Güncellemek

Daha önce verdiğiniz onayı geri çekmek veya değiştirmek için:
- **Ayarlar → Çerez Tercihleri** bölümünden tercihlerinizi güncelleyebilirsiniz
- Tarayıcı ayarlarından `cookie-consent` çerezini silerek banner'ın yeniden görünmesini sağlayabilirsiniz

### 4.3 Tarayıcı Ayarları

Tüm çerezleri tarayıcı ayarlarından da yönetebilirsiniz:
- [Chrome](https://support.google.com/chrome/answer/95647)
- [Firefox](https://support.mozilla.org/tr/kb/cerezleri-silme-ve-web-sitelerinin-bilgisayariniza)
- [Safari](https://support.apple.com/tr-tr/guide/safari/sfri11471/mac)
- [Edge](https://support.microsoft.com/tr-tr/windows/microsoft-edge-de-cerezleri-sil-63947406-40ac-c3b8-57b9-2a946a29ae09)

> **Uyarı:** Zorunlu çerezleri tarayıcı üzerinden silmeniz durumunda giriş, dil tercihi gibi temel işlevler çalışmayabilir.

---

## 5. Gizlilik Politikası ile Bağlantı

Kişisel verilerinizin toplanması, işlenmesi ve haklarınız hakkında kapsamlı bilgi için [Gizlilik Politikası](/privacy) sayfasını inceleyiniz.

---

## 6. Değişiklikler

Bu Çerez Politikası güncellendiğinde "Son Güncelleme" tarihi değiştirilir. Analitik veya pazarlama araçları eklenmesi gibi önemli değişikliklerde kayıtlı kullanıcılara e-posta bildirimi yapılır.

---

## 7. İletişim

Çerez kullanımına ilişkin sorularınız için:

| Alan | Bilgi |
|------|-------|
| E-posta | info@herokidstory.com |
| Konu | "Çerez Politikası" |
| Yanıt Süresi | 30 iş günü |

---

# COOKIE POLICY (EN)

**Last Updated:** April 11, 2026  
**Version:** 1.0-draft

## 1. About Cookies

Cookies are small text files placed in your browser when you visit a website. HeroKidStory uses these files at the minimum level necessary for the platform to function.

This Cookie Policy explains which cookies we use, why we use them, and how you can manage your preferences.

For comprehensive information on how your personal data is processed, please review our [Privacy Policy](/privacy).

---

## 2. Cookies We Use

### 2.1 Essential Cookies (Always Active)

These cookies are required for the platform's basic functions and cannot be disabled.

| Cookie Name | Source | Duration | Purpose |
|-------------|--------|----------|---------|
| `next-auth.session-token` | NextAuth.js | Session | Manages user login session |
| `next-auth.csrf-token` | NextAuth.js | Session | CSRF attack protection |
| `__Secure-next-auth.session-token` | NextAuth.js | 30 days | Secure connection session |
| `cookie-consent` | HeroKidStory | 1 year | Stores your consent decision |
| `cookie-preferences` | HeroKidStory | 1 year | Stores detailed cookie category preferences |
| `cookie-consent-timestamp` | HeroKidStory | 1 year | Records when consent was given/declined (GDPR) |
| `NEXT_LOCALE` | Next.js i18n | 1 year | Stores language preference |

### 2.2 Analytics Cookies (Consent Required)

> **Current Status:** HeroKidStory does not currently use any third-party analytics tools. This category will be activated if analytics integration is added in the future.

| Cookie Name | Source | Duration | Purpose |
|-------------|--------|----------|---------|
| — | — | — | No analytics cookies in use |

### 2.3 Marketing Cookies (Consent Required)

> **Current Status:** HeroKidStory does not currently use any marketing or ad-targeting tools. Facebook API is used for OAuth login only; this does not place marketing cookies.

| Cookie Name | Source | Duration | Purpose |
|-------------|--------|----------|---------|
| — | — | — | No marketing cookies in use |

---

## 3. Third-Party Cookies

| Provider | Purpose | Cookie Type | Privacy Policy |
|----------|---------|-------------|----------------|
| NextAuth.js | Authentication infrastructure | Essential | — (open source library) |
| Google (OAuth) | Sign in with Google | Essential | [policies.google.com](https://policies.google.com) |
| Facebook (OAuth) | Sign in with Facebook | Essential | [facebook.com/privacy](https://www.facebook.com/privacy/policy) |
| Vercel | CDN, page delivery | Essential | [vercel.com/legal/privacy-policy](https://vercel.com/legal/privacy-policy) |

> **Note:** Google and Facebook OAuth connections are made only for the technical login flow. These connections do not place advertising or tracking cookies.

---

## 4. Managing Your Cookie Preferences

### 4.1 Via the Banner

The cookie consent banner shown on your first visit allows you to set preferences:
- **Accept All** — consent to all cookies
- **Decline** — essential cookies only
- **Customize** — category-by-category selection

### 4.2 Updating Your Preferences

To withdraw or change a previously given consent:
- Go to **Settings → Cookie Preferences** to update your choices
- Delete the `cookie-consent` cookie in your browser to trigger the banner again

### 4.3 Browser Settings

You can also manage all cookies through your browser settings:
- [Chrome](https://support.google.com/chrome/answer/95647)
- [Firefox](https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored)
- [Safari](https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac)
- [Edge](https://support.microsoft.com/en-us/windows/delete-cookies-in-microsoft-edge)

> **Warning:** Deleting essential cookies via your browser may break core functions such as login and language preference.

---

## 5. Connection to Privacy Policy

For full details on how your personal data is collected, processed, and your rights, see our [Privacy Policy](/privacy).

---

## 6. Changes

When this Cookie Policy is updated, the "Last Updated" date changes. For significant changes — such as adding analytics or marketing tools — registered users will be notified by email.

---

## 7. Contact

For questions about our use of cookies:

| Field | Information |
|-------|------------|
| Email | info@herokidstory.com |
| Subject | "Cookie Policy" |
| Response time | 30 days |
