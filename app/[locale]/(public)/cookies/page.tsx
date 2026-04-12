/**
 * @legal-document cookie-policy
 * @registry HK-LEGAL-COOKIE
 * @semver 1.1.0
 * @last-substantive-update 2026-04-11
 * @sync docs/legal/TASLAK_CEREZ_POLITIKASI.md — güncellemelerde her iki yeri eşle.
 * Kullanıcı arayüzünde semver / taslak etiketi gösterilmez.
 */
import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"

export const metadata: Metadata = {
  title: "Çerez Politikası — HeroKidStory",
  description:
    "HeroKidStory çerez politikası: hangi çerezleri kullandığımız, neden kullandığımız ve tercihlerinizi nasıl yönetebilirsiniz.",
  robots: { index: true },
}

const LAST_UPDATED_TR  = "11 Nisan 2026"
const LAST_UPDATED_EN  = "11 April 2026"

export default function CookiePolicyPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const isTr = locale === "tr"

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-background dark:from-slate-900 dark:to-slate-950">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <header className="mb-10 border-b border-slate-200 pb-8 dark:border-slate-700">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
            {isTr ? "Çerez Politikası" : "Cookie Policy"}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {isTr
              ? `Son güncelleme: ${LAST_UPDATED_TR}`
              : `Last updated: ${LAST_UPDATED_EN}`}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {isTr
              ? "Bu Politika, HeroKidStory'nin hangi çerezleri kullandığını, neden kullandığını ve tercihlerinizi nasıl yönetebileceğinizi açıklar."
              : "This Policy describes which cookies HeroKidStory uses, why, and how you can manage your preferences."}
          </p>
        </header>

        {isTr ? <CookiesTR /> : <CookiesEN />}

      </div>
    </main>
  )
}

/* ========================================================================== */
/* TR                                                                         */
/* ========================================================================== */

function CookiesTR() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300">

      <Section title="1. Çerezler Hakkında">
        <p>
          Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınıza yerleştirilen küçük metin
          dosyalarıdır. HeroKidStory bu dosyaları yalnızca platformun çalışması için zorunlu olan
          en az düzeyde kullanmaktadır.
        </p>
        <p className="mt-2">
          Bu politika, hangi çerezleri kullandığımızı ve tercihlerinizi nasıl yönetebileceğinizi
          açıklamaktadır. Kişisel verilerinizin nasıl işlendiğine ilişkin kapsamlı bilgi için{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            Gizlilik Politikası
          </Link>{" "}
          sayfasını inceleyiniz.
        </p>
      </Section>

      <Section title="2. Kullandığımız Çerezler">
        <SubSection title="2.1 Zorunlu Çerezler — Her Zaman Aktif">
          <p>
            Bu çerezler platformun temel işlevleri (giriş, dil, güvenlik) için gereklidir ve
            kapatılamaz.
          </p>
          <CookieTable rows={[
            ["next-auth.session-token",               "NextAuth.js",      "Oturum",  "Kullanıcı giriş oturumunu yönetir"],
            ["next-auth.csrf-token",                  "NextAuth.js",      "Oturum",  "CSRF saldırılarına karşı güvenlik"],
            ["__Secure-next-auth.session-token",      "NextAuth.js",      "30 gün",  "HTTPS bağlantıda kalıcı oturum"],
            ["cookie-consent",                        "HeroKidStory",     "1 yıl",   "Çerez tercih kararını kaydeder"],
            ["cookie-preferences",                    "HeroKidStory",     "1 yıl",   "Kategori bazlı çerez tercihlerini saklar"],
            ["cookie-consent-timestamp",              "HeroKidStory",     "1 yıl",   "Onay zamanını kaydeder (GDPR)"],
            ["NEXT_LOCALE",                           "Next.js i18n",     "1 yıl",   "Dil tercihini saklar"],
          ]} />
        </SubSection>

        <SubSection title="2.2 Analitik Çerezler — Onay Gerekli">
          <Callout type="info" title="Şu An Kullanılmıyor">
            HeroKidStory henüz üçüncü taraf analitik aracı kullanmamaktadır. Bu kategori, ileride
            analytics entegrasyonu eklendiğinde aktive edilecek ve politika güncellenecektir.
          </Callout>
        </SubSection>

        <SubSection title="2.3 Pazarlama Çerezleri — Onay Gerekli">
          <Callout type="info" title="Şu An Kullanılmıyor">
            HeroKidStory şu an pazarlama veya reklam hedefleme aracı kullanmamaktadır. Facebook
            API yalnızca OAuth girişi için bağlantı kurmakta; bu bağlantı pazarlama çerezi
            oluşturmaz.
          </Callout>
        </SubSection>
      </Section>

      <Section title="3. Üçüncü Taraf Çerezler">
        <CookieTable
          headers={["Sağlayıcı", "Amaç", "Çerez Türü", "Gizlilik"]}
          rows={[
            ["Google (OAuth)",   "Google ile giriş",        "Zorunlu", "policies.google.com"],
            ["Facebook (OAuth)", "Facebook ile giriş",      "Zorunlu", "facebook.com/privacy"],
            ["Vercel",           "CDN, sayfa sunumu",        "Zorunlu", "vercel.com/legal/privacy-policy"],
          ]}
        />
        <Note>
          Google ve Facebook OAuth bağlantıları yalnızca teknik giriş akışı için kurulur. Bu
          bağlantılar reklam veya izleme çerezi oluşturmaz.
        </Note>
      </Section>

      <Section title="4. Çerez Tercihlerinizi Yönetme">
        <SubSection title="4.1 Banner Üzerinden">
          <p>Sitemizi ilk ziyaretinizde görüntülenen çerez onay banner&apos;ı üzerinden:</p>
          <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
            <li><strong>Tümünü Kabul Et</strong> — tüm çerezlere onay</li>
            <li><strong>Reddet</strong> — yalnızca zorunlu çerezler</li>
            <li><strong>Özelleştir</strong> — kategori bazlı seçim</li>
          </ul>
        </SubSection>
        <SubSection title="4.2 Tercihlerinizi Güncellemek">
          <p>
            Önceki tercihinizi değiştirmek için tarayıcı geliştirici araçlarından
            <code className="mx-1 rounded bg-slate-100 px-1 dark:bg-slate-800">cookie-consent</code>
            çerezini silerek banner&apos;ın yeniden görünmesini sağlayabilirsiniz.
          </p>
        </SubSection>
        <SubSection title="4.3 Tarayıcı Ayarları">
          <p>Tüm çerezleri tarayıcı ayarlarından da yönetebilirsiniz:</p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Chrome</a></li>
            <li><a href="https://support.mozilla.org/tr/kb/cerezleri-silme-ve-web-sitelerinin-bilgisayariniza" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Firefox</a></li>
            <li><a href="https://support.apple.com/tr-tr/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Safari</a></li>
            <li><a href="https://support.microsoft.com/tr-tr/windows/microsoft-edge-de-cerezleri-sil-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Edge</a></li>
          </ul>
          <Note>
            Zorunlu çerezleri tarayıcı üzerinden silmeniz durumunda giriş, dil tercihi gibi temel
            işlevler çalışmayabilir.
          </Note>
        </SubSection>
      </Section>

      <Section title="5. Gizlilik Politikası ile Bağlantı">
        <p>
          Kişisel verilerinizin toplanması, işlenmesi ve haklarınız hakkında kapsamlı bilgi için{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            Gizlilik Politikası
          </Link>{" "}
          sayfasını inceleyiniz.
        </p>
      </Section>

      <Section title="6. Değişiklikler">
        <p>
          Bu politika güncellendiğinde &quot;Son Güncelleme&quot; tarihi değiştirilir. Analitik veya
          pazarlama araçları eklenmesi gibi önemli değişikliklerde kayıtlı kullanıcılara e-posta
          bildirimi yapılır.
        </p>
      </Section>

      <Section title="7. İletişim">
        <InfoTable rows={[
          ["E-posta",       "info@herokidstory.com"],
          ["Konu",          "Çerez Politikası"],
          ["Yanıt Süresi",  "30 iş günü"],
        ]} />
      </Section>

    </div>
  )
}

/* ========================================================================== */
/* EN                                                                         */
/* ========================================================================== */

function CookiesEN() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300">

      <Section title="1. About Cookies">
        <p>
          Cookies are small text files placed in your browser when you visit a website.
          HeroKidStory uses these files at the minimum level necessary for the platform to function.
        </p>
        <p className="mt-2">
          This policy explains which cookies we use and how you can manage your preferences.
          For comprehensive information on how your personal data is processed, see our{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            Privacy Policy
          </Link>.
        </p>
      </Section>

      <Section title="2. Cookies We Use">
        <SubSection title="2.1 Essential Cookies — Always Active">
          <p>
            These cookies are required for core platform functions (login, language, security)
            and cannot be disabled.
          </p>
          <CookieTable rows={[
            ["next-auth.session-token",               "NextAuth.js",    "Session",  "Manages user login session"],
            ["next-auth.csrf-token",                  "NextAuth.js",    "Session",  "CSRF attack protection"],
            ["__Secure-next-auth.session-token",      "NextAuth.js",    "30 days",  "Persistent session on HTTPS"],
            ["cookie-consent",                        "HeroKidStory",   "1 year",   "Stores your consent decision"],
            ["cookie-preferences",                    "HeroKidStory",   "1 year",   "Stores category-level cookie preferences"],
            ["cookie-consent-timestamp",              "HeroKidStory",   "1 year",   "Records when consent was given (GDPR)"],
            ["NEXT_LOCALE",                           "Next.js i18n",   "1 year",   "Stores language preference"],
          ]} />
        </SubSection>

        <SubSection title="2.2 Analytics Cookies — Consent Required">
          <Callout type="info" title="Not Currently in Use">
            HeroKidStory does not currently use any third-party analytics tools. This category
            will be activated if analytics integration is added in the future, and this policy
            will be updated accordingly.
          </Callout>
        </SubSection>

        <SubSection title="2.3 Marketing Cookies — Consent Required">
          <Callout type="info" title="Not Currently in Use">
            HeroKidStory does not currently use any marketing or ad-targeting tools. Facebook
            API is connected for OAuth login only; this connection does not place marketing cookies.
          </Callout>
        </SubSection>
      </Section>

      <Section title="3. Third-Party Cookies">
        <CookieTable
          headers={["Provider", "Purpose", "Type", "Privacy"]}
          rows={[
            ["Google (OAuth)",   "Sign in with Google",  "Essential", "policies.google.com"],
            ["Facebook (OAuth)", "Sign in with Facebook", "Essential", "facebook.com/privacy"],
            ["Vercel",           "CDN, page delivery",    "Essential", "vercel.com/legal/privacy-policy"],
          ]}
        />
        <Note>
          Google and Facebook OAuth connections are made only for the technical login flow.
          These connections do not place advertising or tracking cookies.
        </Note>
      </Section>

      <Section title="4. Managing Your Cookie Preferences">
        <SubSection title="4.1 Via the Banner">
          <p>The consent banner shown on your first visit lets you:</p>
          <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
            <li><strong>Accept All</strong> — consent to all cookies</li>
            <li><strong>Decline</strong> — essential cookies only</li>
            <li><strong>Customize</strong> — category-by-category selection</li>
          </ul>
        </SubSection>
        <SubSection title="4.2 Updating Your Preferences">
          <p>
            To change a previous choice, delete the{" "}
            <code className="mx-1 rounded bg-slate-100 px-1 dark:bg-slate-800">cookie-consent</code>{" "}
            cookie in your browser&apos;s developer tools to trigger the banner again.
          </p>
        </SubSection>
        <SubSection title="4.3 Browser Settings">
          <p>You can also manage all cookies through your browser settings:</p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/delete-cookies-remove-info-websites-stored" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/windows/delete-cookies-in-microsoft-edge" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Edge</a></li>
          </ul>
          <Note>
            Deleting essential cookies via your browser may break core functions such as login
            and language preference.
          </Note>
        </SubSection>
      </Section>

      <Section title="5. Connection to Privacy Policy">
        <p>
          For full details on personal data collection, processing, and your rights, see our{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2">
            Privacy Policy
          </Link>.
        </p>
      </Section>

      <Section title="6. Changes">
        <p>
          When this policy is updated, the &quot;Last Updated&quot; date changes. For significant changes —
          such as adding analytics or marketing tools — registered users will be notified by email.
        </p>
      </Section>

      <Section title="7. Contact">
        <InfoTable rows={[
          ["Email",         "info@herokidstory.com"],
          ["Subject",       "Cookie Policy"],
          ["Response time", "30 days"],
        ]} />
      </Section>

    </div>
  )
}

/* ========================================================================== */
/* Shared UI                                                                  */
/* ========================================================================== */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-slate-200 pb-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-slate-100">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
      {children}
    </div>
  )
}

function InfoTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="mt-2 w-full text-sm">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-slate-100 dark:border-slate-800">
            <td className="whitespace-nowrap py-1.5 pr-4 font-medium text-slate-700 dark:text-slate-300">
              {label}
            </td>
            <td className="py-1.5 text-slate-600 dark:text-slate-400">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CookieTable({
  rows,
  headers,
}: {
  rows: [string, string, string, string][]
  headers?: [string, string, string, string]
}) {
  const h = headers ?? (["Çerez Adı / Cookie", "Kaynak / Source", "Süre / Duration", "Amaç / Purpose"] as [string, string, string, string])
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b-2 border-slate-200 dark:border-slate-700">
            {h.map((col) => (
              <th key={col} className="py-2 pr-3 text-left font-semibold text-slate-700 dark:text-slate-300">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([a, b, c, d]) => (
            <tr key={a} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-1.5 pr-3 font-mono text-slate-800 dark:text-slate-200">{a}</td>
              <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-400">{b}</td>
              <td className="py-1.5 pr-3 text-slate-600 dark:text-slate-400">{c}</td>
              <td className="py-1.5 text-slate-600 dark:text-slate-400">{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
      {children}
    </p>
  )
}

function Callout({ type, title, children }: { type: "info"; title: string; children: ReactNode }) {
  return (
    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  )
}

