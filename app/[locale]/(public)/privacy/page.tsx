/**
 * @legal-document privacy-policy
 * @registry HK-LEGAL-PRIVACY
 * @semver 1.4.0
 * @last-substantive-update 2026-04-11
 * @sync docs/legal/TASLAK_GIZLILIK_POLITIKASI.md — güncellemelerde her iki yeri eşle.
 * Kullanıcı arayüzünde semver / taslak etiketi gösterilmez.
 */
import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"

export const metadata: Metadata = {
  title: "Gizlilik Politikası — HeroKidStory",
  description:
    "HeroKidStory gizlilik politikası: kişisel verilerin işlenmesi, haklarınız ve veri güvenliği.",
  robots: { index: true },
}

const LAST_UPDATED_TR = "11 Nisan 2026"
const LAST_UPDATED_EN = "11 April 2026"

const SELLER = {
  name: "Cüneyt Medetoğlu",
  title: "Şahıs İşletmesi",
  address:
    "Atatürk Mah. Merkez İsimsiz91 Sk. Dema İnş B Blok No: 4/1 İç Kapı No: 3 Merkez / Tunceli, Türkiye",
  email: "info@herokidstory.com",
  web: "https://herokidstory.com",
} as const

export default function PrivacyPolicyPage({
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
            {isTr ? "Gizlilik Politikası" : "Privacy Policy"}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {isTr
              ? `Son güncelleme: ${LAST_UPDATED_TR}`
              : `Last updated: ${LAST_UPDATED_EN}`}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {isTr
              ? "Bu Politika, HeroKidStory hizmetini kullanırken kişisel verilerinizin nasıl işlendiğini açıklar. Veri sorumlusu ve iletişim bilgileri aşağıda yer almaktadır."
              : "This Policy explains how HeroKidStory processes personal data when you use our services. The data controller and contact details are set out below."}
          </p>
        </header>

        {isTr ? <PrivacyTR /> : <PrivacyEN />}
      </div>
    </main>
  )
}

function PrivacyTR() {
  return (
    <div className="space-y-10 text-slate-700 dark:text-slate-300">
      <Section title="1. Kapsam ve yasal dayanak">
        <p>
          Bu Gizlilik Politikası, HeroKidStory platformuna (web sitesi ve bağlı dijital hizmetler)
          erişim ve kullanımınız sırasında işlenen kişisel veriler için geçerlidir. Politika;
          6698 sayılı Kişisel Verilerin Korunması Kanunu («<strong>KVKK</strong>»), Avrupa Ekonomik
          Alanı ve Birleşik Krallık&apos;taki kullanıcılar bakımından Genel Veri Koruma Tüzüğü
          («<strong>GDPR</strong>») ile Birleşik Devletler&apos;de ebeveyn onayına ilişkin
          uygulamalarda Çocukların Çevrimiçi Gizliliğinin Korunması Yasası («<strong>COPPA</strong>
          ») çerçevesinde hazırlanmıştır.
        </p>
        <InfoTable
          rows={[
            ["Veri sorumlusu", SELLER.name],
            ["İşletme türü", SELLER.title],
            ["Adres", SELLER.address],
            ["E-posta", SELLER.email],
            ["İnternet sitesi", SELLER.web],
          ]}
        />
        <Note>
          Hizmet, 2–10 yaş aralığındaki çocuklar için kişiselleştirilmiş içerik üretir; platform
          yalnızca <strong>18 yaşını doldurmuş ebeveyn veya yasal veli</strong> tarafından
          kullanılabilir. Çocuklar doğrudan hesap oluşturamaz.
        </Note>
      </Section>

      <Section title="2. İşlenen kişisel veriler">
        <SubSection title="2.1 Hesap ve profil (ebeveyn / kullanıcı)">
          <InfoTable
            rows={[
              ["E-posta", "Kayıt veya Google / Facebook OAuth — kimlik doğrulama, bildirimler"],
              ["Şifre", "Yalnızca tek yönlü hash (bcrypt); düz metin saklanmaz"],
              ["Ad ve soyad", "Profil ve ödeme / fatura süreçleri"],
              ["Profil fotoğrafı", "İsteğe bağlı; OAuth ile aktarılabilir"],
              ["Uygulama tercihleri", "Dil, tema, çocuk modu vb."],
            ]}
          />
        </SubSection>

        <SubSection title="2.2 Çocuk karakter bilgileri">
          <p>Bu bilgiler, çocuk adına yalnızca ebeveyn veya veli tarafından girilir.</p>
          <InfoTable
            rows={[
              ["Ad", "Hikâyede kullanım"],
              ["Yaş", "Yaş grubuna uygun içerik"],
              ["Cinsiyet", "Karakter tasviri"],
              ["Saç ve göz rengi", "Görsel üretim parametreleri"],
              ["Yapay zekâ ile oluşturulan karakter betimlemesi", "Tutarlı görsel stil"],
            ]}
          />
          <Callout type="info" title="Referans fotoğraf">
            İsteğe bağlı yüklenen referans fotoğraf, yalnızca illüstrasyon üretimi süresince
            işlenir; üretim tamamlandıktan sonra sistemlerimizden kalıcı olarak silinir.
            Saklanan görsel, çocuğun biyometrik olarak tanınabilir fotoğrafı değil; yapay zekâ
            ile üretilmiş çizgi film tarzı illüstrasyondur.
          </Callout>
        </SubSection>

        <SubSection title="2.3 Sipariş, fatura ve teslimat">
          <InfoTable
            rows={[
              ["Fatura unvanı ve adresi", "Fatura düzenleme ve muhasebe"],
              ["Teslimat adresi", "Basılı ürün siparişlerinde kargo"],
              ["Sipariş içeriği ve tutarı", "Sipariş yönetimi"],
              ["Ödeme referansı", "Ödeme kuruluşundan iletilen işlem referansı"],
            ]}
          />
          <Note>
            Ödeme kartı numarası, son kullanma tarihi veya güvenlik kodu HeroKidStory
            sunucularında <strong>işlenmez ve saklanmaz</strong>. Türkiye&apos;ye yönelik
            tahsilatlar BDDK lisanslı <strong>İyzico A.Ş.</strong> üzerinden; Türkiye dışından
            yapılan kartla ödemeler ise <strong>Stripe, Inc.</strong> ve bağlı ödeme kuruluşları
            tarafından PCI-DSS uyumlu ortamda tahsil edilir — kart verisi doğrudan bize
            iletilmez.
          </Note>
        </SubSection>

        <SubSection title="2.4 Otomatik olarak toplanan teknik veriler">
          <InfoTable
            rows={[
              ["IP adresi", "Güvenlik ve para birimi / bölge tespiti"],
              ["Tarayıcı ve cihaz bilgisi", "Uyumluluk ve güvenlik"],
              ["Oturum bilgisi", "Kimlik doğrulama (NextAuth)"],
              ["Çerezler", "Çerez Politikasına tabi"],
              ["Hata ve güvenlik logları", "Arıza giderme ve kötüye kullanımın önlenmesi"],
            ]}
          />
        </SubSection>
      </Section>

      <Section title="3. İşleme amaçları ve hukuki sebepler">
        <InfoTable
          rows={[
            ["Hesap açma ve yönetimi", "Sözleşmenin kurulması ve ifası (KVKK m. 5/2-c; GDPR m. 6(1)(b))"],
            ["Kişiselleştirilmiş kitap üretimi", "Açık rıza — özellikle yapay zekâ ve yurt dışı aktarım (KVKK m. 5/1, m. 9; GDPR m. 6(1)(a), m. 9(2)(a))"],
            ["Sipariş, fatura ve teslimat", "Sözleşmenin ifası ve hukuki yükümlülük (KVKK m. 5/2-ç; GDPR m. 6(1)(b)(c))"],
            ["Ödeme tahsili", "Ödeme kuruluşuna iletim — sözleşmenin ifası"],
            ["Bildirimler", "Sözleşmenin ifası veya meşru menfaat"],
            ["Güvenlik ve dolandırıcılığın önlenmesi", "Meşru menfaat (KVKK m. 5/2-f; GDPR m. 6(1)(f))"],
            ["Vergi ve muhasebe kayıtları", "Hukuki yükümlülük (ör. VUK m. 253)"],
          ]}
        />
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          Referans fotoğraf yalnızca illüstrasyon üretimi için geçici işlenir; biyometrik şablon
          veya kimlik doğrulama amaçlı kalıcı veri tabanı oluşturulmaz, üretim tamamlandıktan sonra
          orijinal görüntü kalıcı olarak silinir. Saklanan yalnızca yapay zekâ ile üretilmiş
          çizgi film tarzı illüstrasyondur. Görüntü işleme, özel nitelikli kişisel veri
          niteliği doğurabilecek hallerde dahi ebeveynin açık rızası, aydınlatma ve veri
          minimizasyonu ile sınırlandırılır (KVKK m. 6 ve m. 10; GDPR m. 9(2)(a)).
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Yasal anlamda veya benzer şekilde önemli sonuçlar doğuran, tamamen otomatik karar verme
          veya bu sonucu üretecek şekilde profilleme yapılmamaktadır.
        </p>
      </Section>

      <Section title="4. Verilerin aktarılması">
        <p>
          Kişisel verileriniz, hizmetin sunulması için gerekli ve ölçülü olduğu ölçüde seçilmiş
          işleyenlere aktarılır; <strong>profil oluşturma veya üçüncü kişilere satış amacıyla</strong>{" "}
          ticari olarak devredilmez.
        </p>

        <SubSection title="4.1 Ödeme kuruluşları">
          <InfoTable
            rows={[
              ["İyzico A.Ş. (Türkiye)", "Kimlik ve fatura bilgisi, işlem tutarı — tahsilat"],
              ["Stripe, Inc. ve bağlı kuruluşlar (ABD / ilgili bölge)", "Küresel kart ödemelerinde — kart verisi doğrudan bize iletilmez"],
            ]}
          />
        </SubSection>

        <SubSection title="4.2 Barındırma ve içerik dağıtımı">
          <InfoTable
            rows={[
              ["Amazon Web Services (AWS)", "Uygulama ve veri tabanı barındırma (ör. ABD bölgesi)"],
              ["Amazon S3", "Üretilen görseller ve PDF dosyaları — orijinal referans fotoğrafı saklanmaz"],
              ["Vercel Inc.", "CDN ve istek günlükleri"],
            ]}
          />
        </SubSection>

        <SubSection title="4.3 Yapay zekâ ve ses üretimi">
          <InfoTable
            rows={[
              ["OpenAI", "Geçici referans görüntü ve metin parametreleri — illüstrasyon ve metin üretimi"],
              ["Google (Gemini)", "Metin tabanlı sesli okuma (TTS) üretimi için geçici metin işleme"],
            ]}
          />
          <Callout type="info" title="OpenAI ve model eğitimi">
            OpenAI API&apos;sine iletilen içerik, OpenAI&apos;nin ticari API koşulları uyarınca
            modellerini eğitmek için kullanılmaz. Üretim tamamlandıktan sonra referans görüntü
            platformumuzdan kaldırılır; işlem zinciri içinde üçüncü tarafta tutulmaması için
            teknik ve sözleşmesel önlemler uygulanır. İlgili aktarım için karakter oluşturma
            adımında açık rıza alınır.
          </Callout>
        </SubSection>

        <SubSection title="4.4 Kimlik doğrulama ve e-posta">
          <InfoTable
            rows={[
              ["Google LLC / Meta Platforms, Inc.", "Yalnızca seçilen OAuth giriş yönteminde gerekli kimlik öğeleri"],
              ["Resend veya benzeri iletişim sağlayıcısı", "İşlem ve hesap bildirimleri"],
            ]}
          />
        </SubSection>

        <SubSection title="4.5 Yurt dışına aktarım">
          <p className="text-sm leading-relaxed">
            Bazı işleyenler Türkiye veya Avrupa Ekonomik Alanı dışında yerleşiktir. Aktarım;
            açık rızanız (özellikle yapay zekâ işlemleri), sözleşmenin ifası, ilgili işleyenle
            akdedilen veri işleme sözleşmeleri ve Avrupa Komisyonu&apos;nun standart sözleşme
            maddeleri veya GDPR&apos;da öngörülen diğer uygun güvenceler ile KVKK&apos;nın 9.
            maddesi kapsamında gerçekleştirilir. Ayrıntılı çerez bilgisi için{" "}
            <Link href="/cookies" className="text-primary underline underline-offset-2">
              Çerez Politikası
            </Link>
            na başvurabilirsiniz.
          </p>
        </SubSection>

        <SubSection title="4.6 Yetkili merciler">
          <p className="text-sm leading-relaxed">
            Kanunda öngörülen hallerde veya bağlayıcı idari veya yargı kararıyla, verileriniz
            yetkili kamu kurum ve kuruluşlarıyla paylaşılabilir.
          </p>
        </SubSection>
      </Section>

      <Section title="5. Saklama süreleri">
        <InfoTable
          rows={[
            ["Hesap ve profil", "Hesap aktif olduğu sürece; hesap silinince derhal silinir"],
            ["Karakter ve kitap içeriği", "Siz silinceye veya hesap kapanıncaya kadar"],
            ["Referans fotoğraf", "Üretim tamamlanınca otomatik silinir"],
            ["Sipariş ve fatura kayıtları", "VUK m. 253 uyarınca on yıl"],
            ["IP ve güvenlik logları", "Tipik olarak 90 gün"],
            ["Maliyet ve üretim logları", "Tipik olarak bir yıl"],
            ["E-posta iletişim kayıtları", "Tipik olarak üç yıl"],
          ]}
        />
        <Note>
          Hesap silinse dahi fatura ve sipariş kayıtlarındaki asgari veriler (ör. unvan, adres,
          tutar, tarih) vergi mevzuatı gereği saklanmaya devam eder.
        </Note>
      </Section>

      <Section title="6. Çocukların gizliliği ve yaş beyanı">
        <SubSection title="6.1 Tasarım ilkesi">
          <p className="text-sm leading-relaxed">
            Çocuğa ait referans fotoğrafı <strong>arşivlenmez veya galeri olarak tutulmaz</strong>
            : yalnızca üretim oturumu boyunca işlenir, illüstrasyon oluşturulduktan sonra
            orijinal dosya silinir. Platformda kalan, çocuğun gerçek fotoğrafı değil; üretilmiş
            çizgi film tarzı illüstrasyondur. Bu yaklaşım, gereksiz görüntü saklamayı önleyen
            veri minimizasyonu tedbiridir.
          </p>
        </SubSection>
        <SubSection title="6.2 Ebeveyn rızası (örnek metin)">
          <p className="text-sm">
            Karakter oluşturma sırasında, çocuğa ait verilerin işlenmesi ve yurt dışına
            aktarılması için açık onay metni sunulur; örnek ifade:
          </p>
          <blockquote className="mt-2 rounded-lg border-l-4 border-primary/50 bg-slate-100 px-4 py-3 text-sm italic text-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
            «Çocuğuma ait fotoğraf ve bilgilerin, kişiselleştirilmiş hikâye kitabı üretimi amacıyla
            yapay zekâ hizmet sağlayıcısına geçici olarak aktarılacağını; üretim sonrasında
            orijinal fotoğrafın silineceğini anlıyor ve onaylıyorum.»
          </blockquote>
        </SubSection>
        <SubSection title="6.3 Kayıt ve yaş">
          <p className="text-sm leading-relaxed">
            Kayıt sırasında 18 yaşını doldurduğunuzu beyan etmeniz gerekir. COPPA kapsamında 13
            yaş altı çocuklara ait veriler yalnızca ebeveyn rızasıyla işlenir; silme talepleri{" "}
            <a href={`mailto:${SELLER.email}`} className="text-primary underline underline-offset-2">
              {SELLER.email}
            </a>{" "}
            üzerinden değerlendirilir.
          </p>
        </SubSection>
        <SubSection title="6.4 AB kullanıcıları">
          <p className="text-sm leading-relaxed">
            GDPR uyarınca 16 yaş altı için ebeveyn veya veli onayı zorunludur; bu onay karakter
            adımında toplanır.
          </p>
        </SubSection>
      </Section>

      <Section title="7. Haklarınız ve başvuru">
        <SubSection title="7.1 KVKK (Türkiye&apos;de ikamet edenler)">
          <p className="mb-2 text-sm">KVKK m. 11 kapsamında özetle:</p>
          <ul className="space-y-1.5 text-sm list-disc pl-5">
            <li>İşlenip işlenmediğini öğrenme ve bilgi talep etme</li>
            <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içi / yurt dışı aktarılan üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Kanunda öngörülen şartlarla silinmesini veya yok edilmesini isteme</li>
            <li>Otomatik sistemlerle analize itiraz ve zararın giderilmesini talep etme</li>
          </ul>
        </SubSection>
        <SubSection title="7.2 GDPR (EEA / Birleşik Krallık)">
          <ul className="space-y-1.5 text-sm list-disc pl-5">
            <li>Erişim, düzeltme, silme, işlemeyi kısıtlama, taşınabilirlik</li>
            <li>Meşru menfaate dayalı işlemeye itiraz ve rızayı geri çekme</li>
            <li>Şikâyet: ikamet ettiğiniz ülkedeki denetleyici otoriteye başvuru</li>
          </ul>
        </SubSection>
        <SubSection title="7.3 Hesabın kapatılması">
          <p className="text-sm leading-relaxed">
            <strong>Kontrol Paneli → Ayarlar → Hesap</strong> bölümünden <strong>Hesabı Sil</strong>{" "}
            seçeneğini kullanarak hesabınızı kapatabilirsiniz. İşlem tamamlandığında hesap,
            kitaplar, karakterler ve saklanan üretim dosyaları derhal silinir. Vergi mevzuatı
            gereği sipariş ve fatura kayıtları asgari içerikle saklanmaya devam eder.
          </p>
        </SubSection>
        <SubSection title="7.4 Başvuru usulü">
          <p className="text-sm leading-relaxed">
            Taleplerinizi{" "}
            <a href={`mailto:${SELLER.email}`} className="text-primary underline underline-offset-2">
              {SELLER.email}
            </a>{" "}
            adresine, konu satırında «KVKK / GDPR Başvurusu» ibaresiyle iletiniz. Kimliğinizi
            doğrulamak için ek bilgi veya belge isteme hakkımız saklıdır. Başvurular, ilgili
            mevzuatta öngörülen süreler içinde (KVKK için en geç otuz gün) sonuçlandırılır.
            Türkiye&apos;de Kişisel Verileri Koruma Kurulu&apos;na şikâyet hakkınız saklıdır.
          </p>
        </SubSection>
      </Section>

      <Section title="8. Güvenlik">
        <ul className="space-y-1.5 text-sm list-disc pl-5">
          <li>Veri aktarımında TLS (HTTPS); saklamada şifreleme ve erişim kontrolleri</li>
          <li>Şifreler tek yönlü hash ile saklanır</li>
          <li>Ödeme kartı verisi yalnızca sertifikalı ödeme kuruluşlarında işlenir</li>
          <li>Çalışan ve taşeron erişimleri «gerekli olduğu kadar» ilkesiyle sınırlıdır; işleyenlerle gizlilik / veri işleme taahhütleri kullanılır</li>
        </ul>
        <Note>
          Kişisel veri ihlali tespitinde, yasal yükümlülükler çerçevesinde denetleyici otoriteye
          bildirim süreleri (GDPR: yetkili otoriteye genel olarak 72 saat) ile etkilenen
          kişilere, risk yüksekliğine bağlı olarak gecikmeksizin bildirim sağlanır.
        </Note>
      </Section>

      <Section title="9. Çerezler">
        <p className="text-sm">
          Ayrıntılar için{" "}
          <Link href="/cookies" className="text-primary underline underline-offset-2">
            Çerez Politikası
          </Link>
          na bakınız.
        </p>
      </Section>

      <Section title="10. Politikanın güncellenmesi">
        <p className="text-sm leading-relaxed">
          Bu metin güncellenebilir. Önemli değişikliklerde «Son güncelleme» tarihi yenilenir;
          kayıtlı kullanıcılara e-posta veya uygulama içi bildirimle duyuru yapılabilir. Mevzuatın
          gerektirdiği hallerde ayrıca bilgilendirme veya açık rıza talep edilir.
        </p>
      </Section>

      <Section title="11. İletişim">
        <InfoTable
          rows={[
            ["E-posta", SELLER.email],
            ["Posta adresi", SELLER.address],
          ]}
        />
      </Section>
    </div>
  )
}

function PrivacyEN() {
  return (
    <div className="space-y-10 text-slate-700 dark:text-slate-300">
      <Section title="1. Scope and legal framework">
        <p>
          This Privacy Policy describes how HeroKidStory (&quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;) processes personal data when you access or use our website and related
          digital services. It is designed to align with the Turkish Personal Data Protection Law
          No. 6698 (&quot;<strong>KVKK</strong>&quot;) for users in Türkiye, the UK General Data
          Protection Regulation and EU GDPR for users in the United Kingdom and European
          Economic Area, and with COPPA-aligned practices for child-related data where U.S. law
          applies.
        </p>
        <InfoTable
          rows={[
            ["Data controller", SELLER.name],
            ["Legal form", SELLER.title],
            ["Registered / postal address", SELLER.address],
            ["Contact email", SELLER.email],
            ["Website", SELLER.web],
          ]}
        />
        <Note>
          The service produces personalized content for children aged approximately 2–10, but
          the platform may only be used by <strong>parents or legal guardians aged 18 or over</strong>.
          Children cannot create accounts.
        </Note>
        <Note>
          We do not have an establishment in the United Kingdom or the European Economic Area and
          have <strong>not appointed a representative in the Union</strong> under Article 27
          GDPR. If you are in the EEA or UK, you may exercise your rights by contacting the data
          controller at the email and postal address above, and you may lodge a complaint with
          your local supervisory authority.
        </Note>
      </Section>

      <Section title="2. Categories of personal data">
        <SubSection title="2.1 Account and profile (parent / user)">
          <InfoTable
            rows={[
              ["Email address", "Registration or Google / Facebook OAuth — authentication, notices"],
              ["Password", "Stored only as a one-way hash (bcrypt); never in plain text"],
              ["Name", "Profile, billing and invoicing"],
              ["Profile image", "Optional; may be imported via OAuth"],
              ["Preferences", "Language, theme, kid mode, etc."],
            ]}
          />
        </SubSection>

        <SubSection title="2.2 Child character information">
          <p>Entered solely by a parent or guardian on the child&apos;s behalf.</p>
          <InfoTable
            rows={[
              ["Name", "Used in the narrative"],
              ["Age", "Age-appropriate content"],
              ["Gender", "Character depiction"],
              ["Hair and eye colour", "Illustration parameters"],
              ["AI-generated character description", "Consistent visual style"],
            ]}
          />
          <Callout type="info" title="Reference photograph">
            An optional reference photo is processed only for the duration of illustration
            generation and is permanently deleted from our systems once production is complete.
            What remains in your library is an AI-generated cartoon-style illustration, not the
            original photograph.
          </Callout>
        </SubSection>

        <SubSection title="2.3 Orders, billing and delivery">
          <InfoTable
            rows={[
              ["Billing name and address", "Invoicing and accounting"],
              ["Delivery address", "Printed product fulfilment where applicable"],
              ["Order contents and amount", "Order management"],
              ["Payment reference", "Transaction reference from the payment processor"],
            ]}
          />
          <Note>
            Card numbers, expiry dates and security codes are <strong>never processed or stored</strong>{" "}
            on HeroKidStory servers. Payments for customers using our Turkish checkout flows are
            processed by <strong>Iyzico A.Ş.</strong> (BDDK-licensed). <strong>International card
            payments</strong> are processed by <strong>Stripe, Inc.</strong> and its affiliates in
            a PCI-DSS compliant environment; card data is tokenised or handled entirely on
            Stripe&apos;s systems.
          </Note>
        </SubSection>

        <SubSection title="2.4 Technical data collected automatically">
          <InfoTable
            rows={[
              ["IP address", "Security and currency / region detection"],
              ["Browser and device data", "Compatibility and security"],
              ["Session data", "Authentication (NextAuth)"],
              ["Cookies", "As described in the Cookie Policy"],
              ["Error and security logs", "Troubleshooting and abuse prevention"],
            ]}
          />
        </SubSection>
      </Section>

      <Section title="3. Purposes and legal bases">
        <InfoTable
          rows={[
            ["Account administration", "Performance of a contract (GDPR Art. 6(1)(b))"],
            ["Personalized book production", "Explicit consent — including AI processing and transfers (Art. 6(1)(a), Art. 9(2)(a) where applicable)"],
            ["Orders, invoices and delivery", "Contract and legal obligation (Art. 6(1)(b)(c))"],
            ["Payment collection", "Transmission to payment processors — contract"],
            ["Notifications", "Contract or legitimate interests"],
            ["Fraud prevention and security", "Legitimate interests (Art. 6(1)(f))"],
            ["Tax and accounting records", "Legal obligation"],
          ]}
        />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          We do not perform solely automated decision-making, including profiling, that produces
          legal or similarly significant effects concerning you.
        </p>
      </Section>

      <Section title="4. Recipients and disclosures">
        <p>
          We share personal data only with selected processors where necessary to provide the
          service and in proportion to that need. We do <strong>not</strong> sell personal data.
        </p>

        <SubSection title="4.1 Payment processors">
          <InfoTable
            rows={[
              ["Iyzico A.Ş. (Türkiye)", "Identity and billing data, transaction amount"],
              ["Stripe, Inc. and affiliates", "International card payments — card data is not sent to our servers"],
            ]}
          />
        </SubSection>

        <SubSection title="4.2 Hosting and content delivery">
          <InfoTable
            rows={[
              ["Amazon Web Services (AWS)", "Application and database hosting (e.g. US regions)"],
              ["Amazon S3", "Generated images and PDFs — original reference photos are not stored"],
              ["Vercel Inc.", "CDN and request logs"],
            ]}
          />
        </SubSection>

        <SubSection title="4.3 AI and audio">
          <InfoTable
            rows={[
              ["OpenAI", "Temporary reference image and text parameters for illustration and text generation"],
              ["Google (Gemini)", "Temporary text processing for text-to-speech"],
            ]}
          />
          <Callout type="info" title="OpenAI API use">
            Content sent via the commercial API is not used to train OpenAI&apos;s models under
            applicable API terms. After production, the reference image is removed from our
            systems; contractual and technical measures address retention by subprocessors.
            Explicit consent is obtained at character creation for this processing and transfer.
          </Callout>
        </SubSection>

        <SubSection title="4.4 Authentication and email">
          <InfoTable
            rows={[
              ["Google LLC / Meta Platforms, Inc.", "Elements required for the OAuth method you choose"],
              ["Resend (or similar provider)", "Transactional email"],
            ]}
          />
        </SubSection>

        <SubSection title="4.5 International transfers">
          <p className="text-sm leading-relaxed">
            Some processors are located outside your country of residence (including the United
            States). Transfers rely, as applicable, on your explicit consent (notably for AI
            processing), performance of the contract, our agreements with processors, and EU
            Standard Contractual Clauses or other safeguards recognised under GDPR Chapter V.
            For cookie details, see our{" "}
            <Link href="/cookies" className="text-primary underline underline-offset-2">
              Cookie Policy
            </Link>
            .
          </p>
        </SubSection>

        <SubSection title="4.6 Public authorities">
          <p className="text-sm leading-relaxed">
            We may disclose data where required by applicable law or by a competent court or
            administrative order.
          </p>
        </SubSection>
      </Section>

      <Section title="5. Retention">
        <InfoTable
          rows={[
            ["Account and profile", "While the account exists; deleted immediately on account deletion"],
            ["Characters and book content", "Until you delete them or close the account"],
            ["Reference photograph", "Deleted automatically after production completes"],
            ["Order and invoice records", "Ten years where required by Turkish tax law (VUK Art. 253)"],
            ["IP and security logs", "Typically 90 days"],
            ["Production and cost logs", "Typically one year"],
            ["Email correspondence logs", "Typically three years"],
          ]}
        />
        <Note>
          After account deletion, minimum invoice and order data (e.g. name, address, amount,
          date) may be retained to meet tax and accounting obligations.
        </Note>
      </Section>

      <Section title="6. Children, consent and age">
        <SubSection title="6.1 Data minimisation for photos">
          <p className="text-sm leading-relaxed">
            We <strong>do not archive or keep a gallery</strong> of the child&apos;s reference
            photo: it is used only during the production session to generate illustrations, then
            the original file is permanently deleted. What remains is the AI-generated cartoon
            illustration, not the real photograph — a deliberate minimisation measure.
          </p>
        </SubSection>
        <SubSection title="6.2 Parental consent (illustrative wording)">
          <p className="text-sm">
            Before processing a child&apos;s data and transferring it for AI illustration, we
            present wording along the following lines:
          </p>
          <blockquote className="mt-2 rounded-lg border-l-4 border-primary/50 bg-slate-100 px-4 py-3 text-sm italic text-slate-800 dark:bg-slate-800/80 dark:text-slate-200">
            &quot;I understand that my child&apos;s photo and information will be transferred
            temporarily to an AI service provider to generate a personalized storybook, and that
            the original photo will be deleted after production.&quot;
          </blockquote>
        </SubSection>
        <SubSection title="6.3 Registration age and COPPA">
          <p className="text-sm leading-relaxed">
            You must confirm that you are at least 18 years old when registering. Processing of
            data relating to children under 13 in the United States is based on verifiable
            parental consent; deletion requests may be sent to{" "}
            <a href={`mailto:${SELLER.email}`} className="text-primary underline underline-offset-2">
              {SELLER.email}
            </a>
            .
          </p>
        </SubSection>
        <SubSection title="6.4 EU / UK children">
          <p className="text-sm leading-relaxed">
            Under GDPR, parental authorisation is required for children below the digital consent
            age in your member state (commonly 16, or lower if provided by local law). We collect
            this at character creation.
          </p>
        </SubSection>
      </Section>

      <Section title="7. Your rights and how to exercise them">
        <SubSection title="7.1 GDPR (EEA and UK users)">
          <ul className="space-y-1.5 text-sm list-disc pl-5">
            <li>Access, rectification, erasure, restriction, data portability</li>
            <li>Object to processing based on legitimate interests; withdraw consent at any time where processing is consent-based</li>
            <li>Lodge a complaint with your supervisory authority</li>
          </ul>
        </SubSection>
        <SubSection title="7.2 KVKK (users in Türkiye)">
          <p className="text-sm leading-relaxed">
            If you are habitually resident in the Republic of Türkiye, Articles 10 and 11 of
            Law No. 6698 grant you rights including information, access, correction, deletion where
            conditions are met, and the right to complain to the Turkish Personal Data Protection
            Authority. Submit requests to{" "}
            <a href={`mailto:${SELLER.email}`} className="text-primary underline underline-offset-2">
              {SELLER.email}
            </a>{" "}
            with the subject line &quot;KVKK / GDPR Request&quot;. We respond without undue delay
            and in any event within the statutory period (including, for KVKK applications, up to
            thirty days where applicable).
          </p>
        </SubSection>
        <SubSection title="7.3 Account deletion">
          <p className="text-sm leading-relaxed">
            Go to <strong>Dashboard → Settings → Account</strong> and use the{" "}
            <strong>Delete account</strong> control. When deletion completes, account data,
            books, characters and stored deliverables are removed immediately, subject to
            retention of minimum invoice and order records as required by law.
          </p>
        </SubSection>
        <SubSection title="7.4 Identity verification">
          <p className="text-sm leading-relaxed">
            To protect your privacy, we may request reasonable additional information to verify
            your identity before fulfilling rights requests.
          </p>
        </SubSection>
      </Section>

      <Section title="8. Security">
        <ul className="space-y-1.5 text-sm list-disc pl-5">
          <li>TLS (HTTPS) in transit; encryption and access controls at rest where appropriate</li>
          <li>Passwords stored using one-way hashing</li>
          <li>Card data processed only by certified payment providers</li>
          <li>Staff and vendor access on a least-privilege basis; written processor commitments</li>
        </ul>
        <Note>
          In the event of a personal data breach, we will notify supervisory authorities within
          statutory timeframes (including, under GDPR, without undue delay and where feasible
          within 72 hours of becoming aware) and will inform affected individuals when required by
          law, in particular where the breach is likely to result in a high risk to rights and
          freedoms.
        </Note>
      </Section>

      <Section title="9. Cookies">
        <p className="text-sm">
          See our{" "}
          <Link href="/cookies" className="text-primary underline underline-offset-2">
            Cookie Policy
          </Link>{" "}
          for categories, purposes and your choices.
        </p>
      </Section>

      <Section title="10. Changes to this Policy">
        <p className="text-sm leading-relaxed">
          We may update this Policy from time to time. Material changes will be reflected in the
          &quot;Last updated&quot; date and, where appropriate, notified by email or in-product
          notice. Where the law requires fresh consent, we will obtain it separately.
        </p>
      </Section>

      <Section title="11. Contact">
        <InfoTable
          rows={[
            ["Email", SELLER.email],
            ["Postal address", SELLER.address],
          ]}
        />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-slate-200 pb-2 text-base font-semibold tracking-tight text-slate-900 dark:border-slate-700 dark:text-slate-100">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-4 first:mt-0">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
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
            <td className="align-top py-2 pr-4 font-medium text-slate-800 dark:text-slate-200">
              {label}
            </td>
            <td className="py-2 text-slate-600 dark:text-slate-400">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
      {children}
    </p>
  )
}

function Callout({
  type,
  title,
  children,
}: {
  type: "info" | "warning"
  title: string
  children: ReactNode
}) {
  const colors =
    type === "info"
      ? "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
      : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"

  return (
    <div className={`mt-3 rounded-lg border px-3 py-2.5 text-sm ${colors}`}>
      <p className="font-semibold">{title}</p>
      <div className="mt-1.5 leading-relaxed">{children}</div>
    </div>
  )
}
