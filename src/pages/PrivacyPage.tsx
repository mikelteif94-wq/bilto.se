import { ArrowLeft } from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';

interface PrivacyPageProps {
  onBackHome: () => void;
}

export default function PrivacyPage({ onBackHome }: PrivacyPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Till startsidan
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
        <h1 className="text-[36px] sm:text-[44px] font-semibold tracking-tight text-slate-900 leading-[1.1]">
          Integritetspolicy
        </h1>
        <p className="mt-3 text-slate-500 text-[15px]">Gäller från datum: 2026-05-07</p>

        <section className="mt-10 space-y-10 text-slate-700 text-[16px] leading-[1.7]">
          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Inledning</h2>
            <p>
              Din integritet är viktig för oss. Denna integritetspolicy beskriver hur ASA
              Consulting AB, org.nr 559501-5263 ("vi", "oss" eller "Bilto"), samlar in, använder
              och behandlar personuppgifter när du använder våra tjänster via Bilto eller
              relaterade domäner.
            </p>
            <p className="mt-4">
              Vi behandlar dina personuppgifter i enlighet med dataskyddsförordningen (GDPR) och
              annan tillämplig svensk och europeisk lagstiftning.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Personuppgiftsansvarig</h2>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900">ASA Consulting AB</p>
              <p className="mt-1">Org.nr: 559501-5263</p>
              <p className="mt-1">
                E-post:{' '}
                <a
                  href="mailto:kontakt@bilto.se"
                  className="text-[#0e6efe] hover:underline font-medium"
                >
                  kontakt@bilto.se
                </a>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">
              Vilka personuppgifter vi samlar in
            </h2>
            <p>
              Vi samlar endast in personuppgifter som är nödvändiga för att kunna tillhandahålla
              våra tjänster och förbättra användarupplevelsen.
            </p>
            <p className="mt-4">Detta kan inkludera:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Identitetsuppgifter: namn, e-postadress och telefonnummer</li>
              <li>
                Fordonsuppgifter: registreringsnummer, bilmärke, modell, skick, miltal, bilder och
                annan fordonsrelaterad information
              </li>
              <li>Kontoinformation: inloggningsuppgifter och användarpreferenser</li>
              <li>Teknisk information: IP-adress, webbläsarinställningar, enhetsinformation och cookies</li>
              <li>
                Försäljnings- och offertdata: bud, priser, kommunikation och information från
                bilhandlare eller potentiella köpare
              </li>
              <li>Användarbeteende: klick, sidvisningar, sessioner och formulärinlämningar via analysverktyg</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">
              Hur vi samlar in personuppgifter
            </h2>
            <p>Personuppgifter samlas in genom:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Formulär på våra webbplatser</li>
              <li>Offert- och försäljningsformulär i vår plattform</li>
              <li>CRM- och kundhanteringssystem</li>
              <li>Digital annonsering via exempelvis Google, Meta och TikTok</li>
              <li>
                Cookies och analysverktyg såsom Google Analytics, Google Tag Manager, Microsoft
                Clarity och liknande tjänster
              </li>
              <li>Kommunikation via e-post, telefon eller chatt</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">
              Rättslig grund för behandlingen
            </h2>
            <p>Vi behandlar personuppgifter med stöd av följande rättsliga grunder:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Avtal: för att kunna tillhandahålla våra tjänster och administrera försäljningsförmedling</li>
              <li>
                Berättigat intresse: för att förbättra tjänsten, analysera användarbeteende,
                motverka missbruk och marknadsföra våra tjänster
              </li>
              <li>Samtycke: för cookies, spårning och viss marknadsföring där samtycke krävs enligt lag</li>
              <li>Rättslig förpliktelse: när behandling krävs enligt lag, exempelvis bokföringslagen</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Syften med behandlingen</h2>
            <p>Vi behandlar personuppgifter för att:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Tillhandahålla tjänster för bilannonsering och försäljningsförmedling</li>
              <li>Publicera och marknadsföra fordonsannonser på olika plattformar</li>
              <li>Kommunicera med användare om erbjudanden, försäljning och support</li>
              <li>Matcha säljare med potentiella köpare och bilhandlare</li>
              <li>Förbättra tjänstens funktionalitet och användarupplevelse</li>
              <li>Förebygga bedrägerier, missbruk och tekniska säkerhetsproblem</li>
              <li>Uppfylla lagkrav och bokföringsskyldigheter</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Delning av personuppgifter</h2>
            <p>
              Vi delar inte personuppgifter med tredje part utan laglig grund eller samtycke,
              förutom när det är nödvändigt för att:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Potentiella köpare eller bilhandlare ska kunna lämna relevanta erbjudanden</li>
              <li>Publicera annonser på externa marknadsplatser och annonstjänster</li>
              <li>Tillhandahålla hosting, analys, betalningslösningar och CRM-tjänster</li>
              <li>Uppfylla rättsliga skyldigheter eller myndighetskrav</li>
              <li>Skydda våra rättigheter eller förebygga bedrägerier och missbruk</li>
            </ul>
            <p className="mt-4">
              Vi kan använda externa leverantörer och plattformar såsom Google, Meta, TikTok,
              HubSpot, MongoDB och liknande tjänster.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Överföring till tredje land</h2>
            <p>Vissa av våra leverantörer kan behandla personuppgifter utanför EU/EES.</p>
            <p className="mt-4">När sådan överföring sker säkerställer vi en adekvat skyddsnivå genom:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>EU-kommissionens standardavtalsklausuler (SCC)</li>
              <li>Leverantörers deltagande i relevanta certifieringsprogram</li>
              <li>Andra lämpliga skyddsåtgärder enligt GDPR</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Lagringstid</h2>
            <p>
              Vi sparar personuppgifter endast så länge det är nödvändigt för ändamålen med
              behandlingen eller enligt lagkrav.
            </p>
            <p className="mt-4">Exempel:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Kontouppgifter: så länge kontot är aktivt eller upp till 12 månader efter inaktivitet</li>
              <li>Offert- och försäljningsdata: upp till 24 månader</li>
              <li>Tekniska loggar och analysdata: upp till 24 månader</li>
              <li>Bokföringsrelaterade uppgifter: upp till 7 år enligt lag</li>
            </ul>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Dina rättigheter enligt GDPR</h2>
            <p>Du har rätt att:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Begära tillgång till dina personuppgifter</li>
              <li>Begära rättelse av felaktiga uppgifter</li>
              <li>Begära radering av dina uppgifter</li>
              <li>Invända mot behandling baserad på berättigat intresse</li>
              <li>Begränsa behandlingen av dina uppgifter</li>
              <li>Begära dataportabilitet</li>
              <li>Återkalla samtycke när behandlingen grundas på samtycke</li>
              <li>Lämna klagomål till Integritetsskyddsmyndigheten (IMY)</li>
            </ul>
            <p className="mt-4">
              För att utöva dina rättigheter kan du kontakta oss via e-post på:{' '}
              <a
                href="mailto:kontakt@bilto.se"
                className="text-[#0e6efe] hover:underline font-medium"
              >
                kontakt@bilto.se
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Säkerhet</h2>
            <p>
              Vi vidtar lämpliga tekniska och organisatoriska säkerhetsåtgärder för att skydda
              personuppgifter mot obehörig åtkomst, förlust, missbruk och manipulation.
            </p>
            <p className="mt-4">
              Endast behörig personal och samarbetspartners med behov av informationen har tillgång
              till personuppgifter.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Cookies</h2>
            <p>
              Bilto använder cookies och liknande tekniker för att förbättra användarupplevelsen,
              analysera trafik och anpassa marknadsföring.
            </p>
            <p className="mt-4">
              Genom att använda våra tjänster accepterar du användningen av cookies i enlighet med
              vår cookiepolicy. Du kan när som helst ändra dina cookieinställningar i din
              webbläsare eller via vårt cookieverktyg.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">Ändringar av policyn</h2>
            <p>Vi förbehåller oss rätten att uppdatera denna integritetspolicy vid behov.</p>
            <p className="mt-4">
              Den senaste versionen publiceras alltid på våra webbplatser och gäller från det
              datum som anges högst upp i dokumentet.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
