/**
 * @legal-document terms-of-service
 * @registry HK-LEGAL-TOS
 * @semver 1.2.0
 * @last-substantive-update 2026-04-11
 * @sync docs/legal/TASLAK_KULLANIM_KOSULLARI.md — güncellemelerde her iki yeri eşle.
 * Kullanıcı arayüzünde semver / taslak etiketi gösterilmez.
 */
import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Link } from "@/i18n/navigation"

export const metadata: Metadata = {
  title: "Kullanım Koşulları — HeroKidStory",
  description:
    "HeroKidStory kullanım koşulları: yapay zekâ içerik lisansı, kullanıcı sorumlulukları ve platform kuralları.",
  robots: { index: true },
}

const LAST_UPDATED_TR = "11 Nisan 2026"
const LAST_UPDATED_EN = "11 April 2026"

const SELLER = {
  name:    "Cüneyt Medetoğlu",
  title:   "Şahıs İşletmesi",
  address: "Atatürk Mah. Merkez İsimsiz91 Sk. Dema İnş B Blok No: 4/1 İç Kapı No: 3 Merkez / Tunceli, Türkiye",
  email:   "info@herokidstory.com",
  web:     "https://herokidstory.com",
  vd:      "Tunceli Vergi Dairesi",
  vkn:     "6130979062",
}

export default function TermsOfServicePage({
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
            {isTr ? "Kullanım Koşulları" : "Terms of Service"}
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            {isTr
              ? `Son güncelleme: ${LAST_UPDATED_TR}`
              : `Last updated: ${LAST_UPDATED_EN}`}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {isTr
              ? "Bu koşullar, HeroKidStory hizmetini kullanımınızı düzenler. Platformu kullanmaya devam ederek aşağıdaki koşulları kabul etmiş sayılırsınız."
              : "These terms govern your use of the HeroKidStory service. By continuing to use the platform, you agree to the terms below."}
          </p>
        </header>

        {isTr ? <TermsTR /> : <TermsEN />}

      </div>
    </main>
  )
}

/* ========================================================================== */
/* TR                                                                         */
/* ========================================================================== */

function TermsTR() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300">

      {/* 1 */}
      <Section title="1. Taraflar ve Kapsam">
        <SubSection title="1.1 Platform Sahibi">
          <InfoTable rows={[
            ["Ad Soyad",       SELLER.name],
            ["İşletme Türü",   SELLER.title],
            ["Adres",          SELLER.address],
            ["E-posta",        SELLER.email],
            ["Web",            SELLER.web],
            ["Vergi Dairesi",  SELLER.vd],
            ["VKN",            SELLER.vkn],
          ]} />
        </SubSection>
        <SubSection title="1.2 Kapsam">
          <p>
            Bu Kullanım Koşulları; HeroKidStory web sitesini (&quot;Platform&quot;) ziyaret eden,
            kayıt olan veya hizmetlerinden yararlanan tüm kullanıcılar (&quot;Kullanıcı&quot;) için
            geçerlidir. Platformu kullanmaya başladığınızda bu koşulları kabul etmiş sayılırsınız.
          </p>
        </SubSection>
        <SubSection title="1.3 Ek Yasal Belgeler">
          <p>Bu Kullanım Koşulları aşağıdaki belgelerle birlikte geçerlidir:</p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li><Link href="/privacy" className="text-primary underline underline-offset-2">Gizlilik Politikası</Link></li>
            <li><Link href="/cookies" className="text-primary underline underline-offset-2">Çerez Politikası</Link></li>
            <li><Link href="/mesafeli-satis" className="text-primary underline underline-offset-2">Mesafeli Satış Sözleşmesi</Link> (TR)</li>
            <li><Link href="/refund-policy" className="text-primary underline underline-offset-2">İade Politikası</Link></li>
          </ul>
        </SubSection>
      </Section>

      {/* 2 */}
      <Section title="2. Hizmetin Tanımı">
        <SubSection title="2.1 Platform Ne Sunar?">
          <p>
            HeroKidStory, yapay zeka teknolojisi kullanarak çocuklara özel kişiselleştirilmiş
            hikaye kitapları oluşturan bir platformdur.
          </p>
          <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
            <li>Karakter oluşturma (isim, görünüm, referans fotoğraftan AI illüstrasyon)</li>
            <li>AI destekli hikaye üretimi (metin + görseller)</li>
            <li>E-book (dijital kitap) üretimi ve indirme</li>
            <li>Sesli okuma (TTS) özelliği</li>
            <li>Basılı kitap siparişi (yalnızca Türkiye)</li>
            <li>Kitap kütüphanesi ve yönetimi</li>
          </ul>
        </SubSection>
        <SubSection title="2.2 Hizmet Sınırları">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Platform &quot;olduğu gibi&quot; (as-is) sunulmaktadır.</li>
            <li>Hizmetin kesintisiz veya hatasız olacağı garanti edilmez.</li>
            <li>AI ile üretilen içerik, her zaman kullanıcının beklentisini tam olarak karşılamayabilir.</li>
            <li>Bakım, güncelleme veya teknik nedenlerle geçici erişilemezlik olabilir.</li>
          </ul>
        </SubSection>
        <SubSection title="2.3 Ücretsiz Katman">
          <p>
            HeroKidStory sınırlı sayıda ücretsiz kitap oluşturma hakkı sunar. Ücretsiz katmanın
            kapsamı Platform tarafından önceden duyuru yapılarak değiştirilebilir.
          </p>
        </SubSection>
      </Section>

      {/* 3 */}
      <Section title="3. Hesap ve Üyelik">
        <SubSection title="3.1 Kayıt Koşulları">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Platformu kullanmak için <strong>18 yaşını doldurmuş</strong> olmanız gerekir.</li>
            <li>Kayıt sırasında doğru, güncel ve eksiksiz bilgi vermeyi kabul edersiniz.</li>
            <li>E-posta, Google veya Facebook hesabıyla giriş seçenekleri mevcuttur.</li>
          </ul>
        </SubSection>
        <SubSection title="3.2 Hesap Güvenliği">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Hesabınızın güvenliğinden siz sorumlusunuz.</li>
            <li>Şifrenizi başkalarıyla paylaşmayınız.</li>
            <li>Yetkisiz erişim tespit ederseniz derhal info@herokidstory.com adresine bildiriniz.</li>
            <li>Hesabınız altındaki tüm işlemlerden siz sorumlusunuz.</li>
          </ul>
        </SubSection>
        <SubSection title="3.3 Hesap Paylaşımı">
          <p>Bir hesap yalnızca kayıt sahibi tarafından kullanılabilir. Hesap kimlik bilgileri üçüncü kişilerle paylaşılamaz.</p>
        </SubSection>
      </Section>

      {/* 4 */}
      <Section title="4. Kullanıcı İçeriği ve Lisans">
        <SubSection title="4.1 Yüklediğiniz İçerik">
          <p>Platforma yüklediğiniz fotoğraf ve bilgiler üzerindeki mülkiyet hakkınız size aittir. Ancak bu içerikleri yükleyerek aşağıdaki sınırlı lisansı vermiş olursunuz:</p>
          <Callout type="info" title="Sınırlı Lisans">
            Hizmetimizi sunabilmemiz amacıyla — AI illüstrasyon üretimi, önizleme oluşturma, kitap render
            işlemi ve teknik altyapı gereksinimleri dahilinde — yüklediğiniz içerikleri işlemek için bize
            dünya çapında, telifsiz, alt lisanslanamaz ve münhasır olmayan bir lisans vermiş olursunuz.
          </Callout>
          <p className="mt-2 text-sm"><strong>Bu lisans şunları kapsamaz:</strong></p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>Açık izniniz olmadan reklam veya pazarlama materyali olarak kullanım</li>
            <li>Başka kullanıcıların kitaplarında kullanım</li>
            <li>AI model eğitimi amacıyla kullanım</li>
          </ul>
        </SubSection>
        <SubSection title="4.2 Fotoğraf Saklama">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Referans fotoğraflar yalnızca AI illüstrasyon üretimi sırasında geçici olarak işlenir.</li>
            <li>Kitap üretimi tamamlandıktan sonra orijinal fotoğraf kalıcı olarak silinir.</li>
            <li>Platformda yalnızca AI tarafından üretilmiş çizgi film tarzı illüstrasyon saklanır.</li>
          </ul>
        </SubSection>
        <SubSection title="4.3 Beyanlarınız">
          <p>Platforma içerik yükleyerek şunları beyan ve taahhüt edersiniz:</p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>Fotoğraf kendi çocuğunuza veya yasal vasisi olduğunuz kişiye aittir.</li>
            <li>Üçüncü kişilerin fotoğrafını rızaları olmadan yüklemiyorsunuz.</li>
            <li>İçerik telif hakkı ihlali içermemektedir.</li>
            <li>İçerik yasadışı, müstehcen, tehditkar veya ayrımcı nitelik taşımamaktadır.</li>
          </ul>
        </SubSection>
      </Section>

      {/* 5 */}
      <Section title="5. AI ile Üretilen İçeriğin Sahipliği">
        <SubSection title="5.1 Hukuki Durum">
          <p>
            HeroKidStory, üçüncü taraf yapay zekâ hizmetleri aracılığıyla hikaye metinleri, illüstrasyonlar ve
            sesli okuma dosyaları üretir. Türk hukukunda (FSEK) yapay zekânın tek başına eser sahibi olamayacağı kabul
            edilmektedir. AI çıktılarının telif statüsü hukuki tartışma konusu olmaya devam etmektedir.
          </p>
        </SubSection>
        <SubSection title="5.2 Lisans Modeli">
          <p><strong>Kullanıcıya tanınan haklar:</strong></p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>✅ Kişisel ve ailevi kullanım (okuma, saklama, yazdırma)</li>
            <li>✅ Hediye etme</li>
            <li>✅ Sosyal medyada paylaşım (HeroKidStory logolu önizleme ile)</li>
            <li>✅ Eğitim amaçlı kullanım (okul, terapi vb.)</li>
          </ul>
          <p className="mt-3"><strong>Kullanıcıya tanınmayan haklar:</strong></p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>❌ Ticari amaçla yeniden satış veya dağıtım</li>
            <li>❌ Toplu basım veya çoğaltma (özel anlaşma gerektirir)</li>
            <li>❌ İçeriği değiştirip kendi ürünü olarak satma</li>
            <li>❌ AI modellerini eğitmek için kullanma</li>
          </ul>
          <Note>
            HeroKidStory; portfolyo ve tanıtım amacıyla anonim, kişisel bilgi içermeyen kitap
            örneklerini kullanma hakkını saklı tutar. Çocuk ismi, fotoğrafı veya tanımlayıcı
            bilgi bu kapsamda kullanılmaz.
          </Note>
        </SubSection>
        <SubSection title="5.3 AI İçerik Şeffaflığı">
          <p>
            HeroKidStory&apos;de üretilen tüm hikaye metinleri ve illüstrasyonlar yapay zeka teknolojisi
            kullanılarak oluşturulmaktadır. Üretilen görseller gerçek fotoğraf değil, AI tarafından
            oluşturulmuş çizgi film/illüstrasyon tarzı görsellerdir.
          </p>
        </SubSection>
      </Section>

      {/* 6 */}
      <Section title="6. Kabul Edilemez Kullanımlar">
        <SubSection title="6.1 İçerik Kuralları">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Uygunsuz, müstehcen, şiddet içeren veya zararlı içerik oluşturmaya çalışmak</li>
            <li>Çocukları istismar eden, aşağılayan veya riskli duruma sokan içerik üretmek</li>
            <li>Nefret söylemi, ayrımcılık veya ırkçılık içeren temalar kullanmak</li>
            <li>Başkasının çocuğunun fotoğrafını rızası olmadan yüklemek</li>
          </ul>
        </SubSection>
        <SubSection title="6.2 Teknik Kurallar">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Platformu tersine mühendislik ile analiz etmek</li>
            <li>Otomatik scraping, bot veya crawler kullanmak</li>
            <li>Diğer kullanıcıların hesaplarına yetkisiz erişim</li>
            <li>Platformun altyapısını bozacak faaliyetler</li>
          </ul>
        </SubSection>
        <SubSection title="6.3 Ticari Kurallar">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Üretilen kitapları izinsiz ticari amaçla satmak</li>
            <li>Platform hizmetlerini üçüncü taraflara yeniden satmak</li>
            <li>Sahte hesaplar oluşturarak ücretsiz katmanı suistimal etmek</li>
          </ul>
        </SubSection>
      </Section>

      {/* 7 */}
      <Section title="7. Ücretler ve Ödemeler">
        <SubSection title="7.1 Fiyatlandırma">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Güncel fiyatlar ilgili ürün/hizmet sayfasında KDV dahil gösterilir.</li>
            <li>Fiyat değişiklikleri önceden duyurulur ve mevcut siparişleri etkilemez.</li>
          </ul>
        </SubSection>
        <SubSection title="7.2 Ödeme">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Ödemeler İyzico (TR) ve Stripe (global) üzerinden işlenir.</li>
            <li>Kart bilgileri HeroKidStory tarafından görülmez veya saklanmaz.</li>
            <li>Başarısız ödeme durumunda sipariş işleme alınmaz.</li>
          </ul>
        </SubSection>
        <SubSection title="7.3 İade">
          <p>
            İade koşulları <Link href="/refund-policy" className="text-primary underline underline-offset-2">İade Politikası</Link> sayfasında
            ayrıntılı olarak belirtilmiştir. Kişiselleştirilmiş dijital ve basılı ürünlerde,
            ilgili mevzuat kapsamında iade yapılmamaktadır. Üretim/baskı hatası veya kargo
            hasarında ücretsiz yeniden üretim veya iade yapılır.
          </p>
        </SubSection>
      </Section>

      {/* 8 */}
      <Section title="8. Fikri Mülkiyet">
        <SubSection title="8.1 Platforma Ait Haklar">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>HeroKidStory adı, logosu ve markası</li>
            <li>Platform tasarımı, UI ve UX</li>
            <li>Kaynak kodu ve teknik altyapı</li>
            <li>Platformun özgün içerikleri</li>
          </ul>
        </SubSection>
        <SubSection title="8.2 Üçüncü Taraf Hizmetleri">
          <InfoTable rows={[
            ["Yapay Zekâ Servisleri", "İçerik ve görsel üretimi (API)"],
            ["TTS / Ses Servisleri",  "Sesli okuma dosyası üretimi"],
            ["İyzico / Stripe",       "Ödeme işleme"],
          ]} />
          <p className="mt-1 text-xs text-slate-500">Bu hizmetlerin kullanımı ilgili sağlayıcıların kendi koşullarına tabidir. Kişisel veri işleyicileri hakkında ayrıntılı bilgi için <a href="/privacy" className="underline">Gizlilik Politikası</a>nı inceleyiniz.</p>
        </SubSection>
      </Section>

      {/* 9 */}
      <Section title="9. Garanti Reddi ve Sorumluluk Sınırlaması">
        <SubSection title="9.1 Garanti Reddi">
          <p>
            Platform &quot;olduğu gibi&quot; (AS-IS) ve &quot;mevcut haliyle&quot; (AS-AVAILABLE) sunulmaktadır.
            HeroKidStory; kesintisiz, hatasız veya güvenli hizmet, AI çıktısının kalitesi veya
            üçüncü taraf hizmetlerinin sürekliliği konusunda garanti vermez.
          </p>
        </SubSection>
        <SubSection title="9.2 Sorumluluk Sınırlaması">
          <p>
            HeroKidStory; hizmet kesintisi, mücbir sebepler, üçüncü taraf hizmet kesintileri,
            hesap güvenliği ihmali, AI çıktısının beklentiyi karşılamaması veya kullanıcı içeriğinden
            kaynaklanan hukuki sorunlardan dolayı doğrudan veya dolaylı zararlardan sorumlu değildir.
          </p>
          <Note>
            <strong>Tazminat üst sınırı:</strong> HeroKidStory&apos;nin herhangi bir talep karşısındaki
            toplam sorumluluğu, kullanıcının son 12 ay içinde Platforma ödediği toplam tutarı aşamaz.
          </Note>
        </SubSection>
      </Section>

      {/* 10 */}
      <Section title="10. Hesap silme ve platform tarafından kapatma">
        <Note>
          &quot;Hesap silme&quot;, hesabınızı kendiniz kapattığınız işlemdir. Silme sonrası Platform
          üzerinden içeriğe erişim için ayrı bir bekleme süresi yoktur.
        </Note>
        <SubSection title="10.1 Hesabınızı siz sildiğinizde">
          <p>
            <strong>Dashboard → Ayarlar → Hesabımı Sil</strong> adımlarıyla hesabınızı istediğiniz
            zaman silebilirsiniz. Silme işlemi tamamlandığı anda Platform üzerinden kitaplarınıza,
            karakterlerinize ve dijital içeriğinize erişiminiz <strong>derhal</strong> sona erer;
            ilgili kişisel veriler ve üretilen içerikler sistemden silinir. Sipariş ve fatura
            kayıtları VUK Md. 253 gereği 10 yıl saklanır. Tamamlanmış hizmetler için ödenen ücretler
            iade edilmez (istisnalar <Link href="/refund-policy" className="text-primary underline underline-offset-2">İade Politikası</Link>&apos;nda).
          </p>
        </SubSection>
        <SubSection title="10.2 HeroKidStory tarafından askıya alma veya kapatma">
          <p>Aşağıdaki durumlarda hesabınız askıya alınabilir veya kapatılabilir:</p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>Kullanım Koşulları ihlali</li>
            <li>Kötüye kullanım (sahte hesap, suistimal, yasadışı içerik)</li>
            <li>Ödeme dolandırıcılığı şüphesi</li>
          </ul>
          <p className="mt-2">
            Hesabınız Platform tarafından kapatıldığında da Platform üzerinden içeriğinize erişiminiz{" "}
            <strong>derhal</strong> sona erer; ilgili veriler silinir (yasal saklama yükümlülükleri
            hariç). Tamamlanmış hizmetler için ödenen ücretler iade edilmez; İade Politikası&apos;nda
            açıkça belirtilen istisnalar saklıdır.
          </p>
        </SubSection>
      </Section>

      {/* 11 */}
      <Section title="11. Değişiklikler">
        <ul className="space-y-1 text-sm list-disc pl-4">
          <li>HeroKidStory bu koşulları güncelleme hakkını saklı tutar.</li>
          <li>Önemli değişiklikler en az <strong>30 gün</strong> önceden e-posta ile bildirilir.</li>
          <li>Değişiklik sonrasında Platformu kullanmaya devam etmeniz güncel koşulları kabul ettiğiniz anlamına gelir.</li>
          <li>Kabul etmiyorsanız hesabınızı silerek Platformu kullanmayı durdurabilirsiniz.</li>
        </ul>
      </Section>

      {/* 12 */}
      <Section title="12. Geçerli Hukuk ve Yetki">
        <ul className="space-y-1 text-sm list-disc pl-4">
          <li>Bu koşullar <strong>Türkiye Cumhuriyeti hukuku</strong> çerçevesinde yorumlanır.</li>
          <li>Uyuşmazlıklarda <strong>Tunceli Mahkemeleri ve İcra Daireleri</strong> yetkilidir.</li>
          <li>AB kullanıcıları: GDPR kapsamındaki haklarınız bu maddeden etkilenmez.</li>
        </ul>
      </Section>

      {/* 13 */}
      <Section title="13. Bölünebilirlik">
        <p>
          Bu koşulların herhangi bir maddesi yetkili bir mahkeme tarafından geçersiz veya
          uygulanamaz bulunursa, diğer maddeler tam geçerliliğini korumaya devam eder.
        </p>
      </Section>

      {/* 14 */}
      <Section title="14. İletişim">
        <InfoTable rows={[
          ["E-posta",       SELLER.email],
          ["Adres",         SELLER.address],
          ["Yanıt Süresi",  "30 iş günü"],
        ]} />
      </Section>

    </div>
  )
}

/* ========================================================================== */
/* EN                                                                         */
/* ========================================================================== */

function TermsEN() {
  return (
    <div className="space-y-8 text-slate-700 dark:text-slate-300">

      {/* 1 */}
      <Section title="1. Parties and Scope">
        <SubSection title="1.1 Platform Owner">
          <InfoTable rows={[
            ["Name",          SELLER.name],
            ["Business Type", SELLER.title],
            ["Address",       SELLER.address],
            ["Email",         SELLER.email],
            ["Website",       SELLER.web],
          ]} />
        </SubSection>
        <SubSection title="1.2 Scope">
          <p>
            These Terms of Service apply to all visitors, registered users, and customers of
            HeroKidStory (&quot;Platform&quot;). By accessing or using the Platform, you agree to these Terms.
            If you do not agree, do not use the Platform.
          </p>
        </SubSection>
        <SubSection title="1.3 Related Policies">
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li><Link href="/privacy" className="text-primary underline underline-offset-2">Privacy Policy</Link></li>
            <li><Link href="/cookies" className="text-primary underline underline-offset-2">Cookie Policy</Link></li>
            <li><Link href="/refund-policy" className="text-primary underline underline-offset-2">Refund Policy</Link></li>
          </ul>
        </SubSection>
      </Section>

      {/* 2 */}
      <Section title="2. Service Description">
        <SubSection title="2.1 What We Offer">
          <p>HeroKidStory is an AI-powered platform for creating personalized children&apos;s storybooks:</p>
          <ul className="mt-2 space-y-1 text-sm list-disc pl-4">
            <li>Character creation (name, appearance, AI illustration from reference photo)</li>
            <li>AI-assisted story generation (text + illustrations)</li>
            <li>E-book production and download</li>
            <li>Text-to-speech read-along</li>
            <li>Printed book orders (Turkey only)</li>
            <li>Book library management</li>
          </ul>
        </SubSection>
        <SubSection title="2.2 Service Limitations">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>The Platform is provided &quot;as-is&quot; and &quot;as-available.&quot;</li>
            <li>We do not guarantee uninterrupted or error-free service.</li>
            <li>AI-generated content may not always meet your exact expectations.</li>
            <li>Temporary unavailability may occur due to maintenance or technical issues.</li>
          </ul>
        </SubSection>
        <SubSection title="2.3 Free Tier">
          <p>
            HeroKidStory offers a limited number of free book creations. The scope may
            be modified with prior notice.
          </p>
        </SubSection>
      </Section>

      {/* 3 */}
      <Section title="3. Accounts">
        <SubSection title="3.1 Registration">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>You must be at least <strong>18 years old</strong> to use the Platform.</li>
            <li>You agree to provide accurate, current, and complete information.</li>
            <li>Registration via email, Google, or Facebook is available.</li>
          </ul>
        </SubSection>
        <SubSection title="3.2 Account Security">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>You are responsible for maintaining account security.</li>
            <li>Do not share your credentials with others.</li>
            <li>Report unauthorized access immediately to info@herokidstory.com.</li>
            <li>You are responsible for all activity under your account.</li>
          </ul>
        </SubSection>
        <SubSection title="3.3 No Account Sharing">
          <p>Each account is for a single registered user only. Credentials may not be shared with third parties.</p>
        </SubSection>
      </Section>

      {/* 4 */}
      <Section title="4. User Content and License">
        <SubSection title="4.1 Content You Upload">
          <p>You retain ownership of photos and information you upload. By uploading, you grant us:</p>
          <Callout type="info" title="Limited License">
            A worldwide, royalty-free, non-sublicensable, non-exclusive license to process your
            content solely for providing the Service — including AI illustration generation, preview
            creation, book rendering, and technical infrastructure needs.
          </Callout>
          <p className="mt-2 text-sm"><strong>This license does NOT include:</strong></p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>Using your content for advertising without explicit consent</li>
            <li>Using your content in other users&apos; books</li>
            <li>Using your content for AI model training</li>
          </ul>
        </SubSection>
        <SubSection title="4.2 Photo Retention">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Reference photos are temporarily processed only during AI illustration generation.</li>
            <li>Original photos are permanently deleted after book production.</li>
            <li>Only the AI-generated cartoon-style illustration is retained.</li>
          </ul>
        </SubSection>
        <SubSection title="4.3 Your Representations">
          <p>By uploading content, you represent and warrant that:</p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>Photos are of your own child or a child under your legal guardianship.</li>
            <li>You are not uploading third-party photos without consent.</li>
            <li>Content does not infringe copyright.</li>
            <li>Content is not illegal, obscene, threatening, or discriminatory.</li>
          </ul>
        </SubSection>
      </Section>

      {/* 5 */}
      <Section title="5. AI-Generated Content Ownership">
        <SubSection title="5.1 Legal Status">
          <p>
            HeroKidStory uses third-party AI services to generate story text, illustrations,
            and audio narration. The copyright status of AI-generated content remains legally evolving worldwide.
          </p>
        </SubSection>
        <SubSection title="5.2 License Model">
          <p><strong>Rights granted to you:</strong></p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>✅ Personal and family use (reading, storing, printing)</li>
            <li>✅ Gifting (physical or digital copy)</li>
            <li>✅ Social media sharing (with HeroKidStory watermarked preview)</li>
            <li>✅ Educational use (school, therapy, etc.)</li>
          </ul>
          <p className="mt-3"><strong>Rights NOT granted:</strong></p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>❌ Commercial resale or distribution</li>
            <li>❌ Mass reproduction (separate agreement required)</li>
            <li>❌ Modifying and selling as your own product</li>
            <li>❌ Using to train AI models</li>
          </ul>
          <Note>
            We reserve the right to use anonymized, non-identifiable book samples for portfolio
            and promotional purposes. Child names, photos, or identifying information are never used.
          </Note>
        </SubSection>
        <SubSection title="5.3 AI Transparency">
          <p>
            All story text, illustrations, and audio on HeroKidStory are generated using artificial
            intelligence. Generated visuals are AI-created cartoon/illustration-style images, not real photographs.
          </p>
        </SubSection>
      </Section>

      {/* 6 */}
      <Section title="6. Prohibited Uses">
        <ul className="space-y-1 text-sm list-disc pl-4">
          <li>Creating inappropriate, obscene, violent, or harmful content</li>
          <li>Generating content that exploits or endangers children</li>
          <li>Using hate speech, discriminatory, or racist themes</li>
          <li>Uploading photos of someone else&apos;s child without consent</li>
          <li>Reverse-engineering the Platform</li>
          <li>Automated scraping, bots, or crawlers</li>
          <li>Unauthorized access to other accounts</li>
          <li>Overloading or disrupting Platform infrastructure</li>
          <li>Selling generated books without authorization</li>
          <li>Reselling Platform services to third parties</li>
          <li>Creating fake accounts to abuse the free tier</li>
        </ul>
      </Section>

      {/* 7 */}
      <Section title="7. Pricing and Payment">
        <SubSection title="7.1 Pricing">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Prices are displayed on product pages and include applicable taxes.</li>
            <li>Price changes are announced in advance and do not affect existing orders.</li>
          </ul>
        </SubSection>
        <SubSection title="7.2 Payment">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>Payments processed via Iyzico (Turkey) and Stripe (international).</li>
            <li>Card details are never seen or stored by HeroKidStory.</li>
            <li>Orders are not processed if payment fails.</li>
          </ul>
        </SubSection>
        <SubSection title="7.3 Refund">
          <p>
            Full details on our <Link href="/refund-policy" className="text-primary underline underline-offset-2">Refund Policy</Link> page.
            Personalized digital and printed products are non-refundable.
            Production defects or shipping damage qualify for free replacement or refund.
          </p>
        </SubSection>
      </Section>

      {/* 8 */}
      <Section title="8. Intellectual Property">
        <SubSection title="8.1 Platform Rights">
          <ul className="space-y-1 text-sm list-disc pl-4">
            <li>HeroKidStory name, logo, and brand</li>
            <li>Platform design, UI, and UX</li>
            <li>Source code and technical infrastructure</li>
            <li>Original platform content</li>
          </ul>
        </SubSection>
        <SubSection title="8.2 Third-Party Services">
          <InfoTable rows={[
            ["AI Services",     "Content and image generation (API)"],
            ["TTS / Audio",     "Text-to-speech narration"],
            ["Iyzico / Stripe", "Payment processing"],
          ]} />
          <p className="mt-1 text-xs text-slate-500">Each service is subject to its own terms. For details on data processors, see our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
        </SubSection>
      </Section>

      {/* 9 */}
      <Section title="9. Disclaimer and Limitation of Liability">
        <SubSection title="9.1 Disclaimer">
          <p className="text-xs font-semibold uppercase tracking-wide">
            THE PLATFORM IS PROVIDED &quot;AS-IS&quot; AND &quot;AS-AVAILABLE&quot; WITHOUT WARRANTY OF ANY KIND,
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
        </SubSection>
        <SubSection title="9.2 Limitation of Liability">
          <p>
            HeroKidStory shall not be liable for indirect, incidental, special, consequential,
            or punitive damages from service interruptions, force majeure, third-party service
            failures, account security neglect, AI output quality, or user-uploaded content issues.
          </p>
          <Note>
            <strong>Liability cap:</strong> Our total liability for any claim shall not exceed the
            total amount you paid to the Platform in the preceding 12 months.
          </Note>
        </SubSection>
      </Section>

      {/* 10 */}
      <Section title="10. Account deletion and platform-initiated closure">
        <Note>
          &quot;Account deletion&quot; means you close your own account. There is no grace period for
          accessing content on the Platform after deletion.
        </Note>
        <SubSection title="10.1 When you delete your account">
          <p>
            Delete your account anytime via <strong>Dashboard → Settings → Delete My Account</strong>.
            When deletion is complete, your access to books, characters, and digital content on the
            Platform <strong>ends immediately</strong>; related personal data and generated content are
            removed from our systems. Invoice records are retained for 10 years as required by law.
            No refunds for completed services (exceptions in our{" "}
            <Link href="/refund-policy" className="text-primary underline underline-offset-2">Refund Policy</Link>).
          </p>
        </SubSection>
        <SubSection title="10.2 Suspension or closure by HeroKidStory">
          <p>We may suspend or close your account for:</p>
          <ul className="mt-1 space-y-1 text-sm list-disc pl-4">
            <li>Violation of these Terms</li>
            <li>Abuse (fake accounts, fraud, illegal content)</li>
            <li>Suspected payment fraud</li>
          </ul>
          <p className="mt-2">
            If we close your account, your access to content on the Platform <strong>ends immediately</strong>{" "}
            and related data is deleted (except legally required records). No refunds for completed
            services, except where explicitly stated in the Refund Policy.
          </p>
        </SubSection>
      </Section>

      {/* 11 */}
      <Section title="11. Changes to Terms">
        <ul className="space-y-1 text-sm list-disc pl-4">
          <li>We reserve the right to update these Terms.</li>
          <li>Registered users notified by email at least <strong>30 days</strong> before significant changes.</li>
          <li>Continued use after changes constitutes acceptance.</li>
          <li>If you disagree, you may delete your account.</li>
        </ul>
      </Section>

      {/* 12 */}
      <Section title="12. Governing Law">
        <ul className="space-y-1 text-sm list-disc pl-4">
          <li>These Terms are governed by the laws of the <strong>Republic of Turkey</strong>.</li>
          <li>Courts of <strong>Tunceli, Turkey</strong> have jurisdiction.</li>
          <li>EU users: Your GDPR rights are not affected by this clause.</li>
        </ul>
      </Section>

      {/* 13 */}
      <Section title="13. Severability">
        <p>
          If any provision is found invalid or unenforceable, the remaining provisions
          continue in full force and effect.
        </p>
      </Section>

      {/* 14 */}
      <Section title="14. Contact">
        <InfoTable rows={[
          ["Email",         SELLER.email],
          ["Address",       SELLER.address],
          ["Response time", "30 days"],
        ]} />
      </Section>

    </div>
  )
}

/* ========================================================================== */
/* Shared UI Components                                                       */
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

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
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
      ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300"
  return (
    <div className={`mt-2 rounded-lg border p-3 text-sm ${colors}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{children}</p>
    </div>
  )
}

