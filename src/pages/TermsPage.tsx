import { ArrowLeft } from 'lucide-react';
import { SiteFooter } from './BrokerageLanding';

interface TermsPageProps {
  onBackHome: () => void;
}

export default function TermsPage({ onBackHome }: TermsPageProps) {
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
          Användarvillkor
        </h1>
        <p className="mt-3 text-slate-500 text-[15px]">Gäller från datum: 2026-05-07</p>

        <section className="mt-10 space-y-10 text-slate-700 text-[16px] leading-[1.7]">
          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">1. Om tjänsten</h2>
            <p>
              Bilto tillhandahålls av ASA Consulting AB (org.nr 559501-5263). Vi erbjuder en
              tjänst för försäljning och förmedling av fordon där privatpersoner kan få hjälp att
              sälja sina bilar genom vår plattform och vårt nätverk av köpare och bilhandlare.
            </p>
            <p className="mt-4 font-semibold text-slate-900">Tjänsten omfattar:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Att bilägare skickar in information och bilder på sitt fordon</li>
              <li>Att Bilto skapar och publicerar annonser på olika marknadsplatser och plattformar</li>
              <li>Att Bilto marknadsför och förmedlar kontakt mellan säljare och potentiella köpare</li>
              <li>Ett system där bilägare kan följa upp sin försäljningsprocess och inkomna erbjudanden</li>
            </ul>
            <p className="mt-4">
              Bilto säljer inte själv bilar och är inte part i det slutliga försäljningsavtalet
              mellan säljare och köpare.
            </p>
            <p className="mt-4">
              Bilto och kunden kommer gemensamt överens om ett förväntat försäljningspris innan
              annonsering sker. Kunden har dock alltid full rätt att själv bestämma om bilen ska
              säljas eller inte.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">2. Användarkonton</h2>
            <p>
              För att använda tjänsten krävs att du skapar ett konto. Du ansvarar för att de
              uppgifter du lämnar är korrekta och aktuella. Kontot är personligt och får inte
              överlåtas.
            </p>
            <p className="mt-4">
              Vi förbehåller oss rätten att stänga av eller radera konton som bryter mot dessa
              villkor, använder falsk information eller på annat sätt missbrukar tjänsten.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">3. Roller</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Privatpersoner använder tjänsten för att få bud på sina fordon</li>
              <li>Bilhandlare använder tjänsten för att lämna bud via sitt företagskonto</li>
            </ul>
            <p className="mt-4">
              Bilto förmedlar kontakten mellan parterna men ansvarar inte för själva transaktionen
              eller eventuella avtal mellan användarna.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">4. Offertförfrågningar</h2>
            <p>
              En offertförfrågan är inte bindande. Både bilägare och bilhandlare har full frihet
              att avstå från att gå vidare efter ett lämnat bud.
            </p>
            <p className="mt-4">
              Inget bindande avtal ingås via plattformen. Eventuellt köpeavtal uppstår först efter
              direkt överenskommelse mellan parterna.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">5. Kostnader</h2>
            <p>
              För att Bilto ska annonsera och marknadsföra ett fordon debiteras kunden en
              uppläggningsavgift om 1 295 kr.
            </p>
            <p className="mt-4">
              Vid genomförd försäljning har Bilto rätt till en provision om 2 % av det slutliga
              försäljningspriset.
            </p>
            <p className="mt-4">
              Om kunden säljer bilen privat eller via annan part under tiden ett aktivt avtal med
              Bilto gäller, återbetalas inte uppläggningsavgiften. Bilto har dessutom rätt att
              debitera en avtals- och administrationsavgift om 5 000 kr för att täcka kostnader
              för marknadsföring, annonsering och nedlagd arbetstid.
            </p>
            <p className="mt-4">
              Provision utgår endast vid genomförd försäljning där Bilto varit delaktig i
              förmedlingen.
            </p>
            <p className="mt-4">
              Eventuella avgifter ska betalas enligt faktura och Bilto förbehåller sig rätten att
              vid sen betalning debitera dröjsmålsränta och påminnelseavgifter enligt lag.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">6. Immateriella rättigheter</h2>
            <p>
              Allt innehåll på Bilto, inklusive texter, logotyper, design, funktionalitet och
              tekniska lösningar, tillhör ASA Consulting AB eller dess licensgivare.
            </p>
            <p className="mt-4">
              Det är förbjudet att kopiera, distribuera eller använda innehåll från tjänsten utan
              skriftligt tillstånd.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">7. Ansvarsbegränsning</h2>
            <p>Bilto ansvarar inte för:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>Bilhandlares eller köpares agerande, erbjudanden eller eventuella fel i affären</li>
              <li>Felaktig eller vilseledande information som lämnas av användare</li>
              <li>Driftstörningar, avbrott eller tekniska problem</li>
              <li>Förlust av data, utebliven vinst eller indirekta skador</li>
              <li>Fel, brister eller dolda fel på fordon som annonseras via tjänsten</li>
            </ul>
            <p className="mt-4">
              Kunden ansvarar fullt ut för att all information om fordonet är korrekt och att
              bilen uppfyller gällande lagkrav. Kunden ansvarar även för eventuella fel eller
              brister på bilen efter försäljning.
            </p>
            <p className="mt-4">
              Bilto friskriver sig från allt ansvar kopplat till fordonets skick, funktion,
              historik eller eventuella framtida krav mellan köpare och säljare.
            </p>
            <p className="mt-4">
              Tjänsten tillhandahålls i befintligt skick utan några uttryckliga eller
              underförstådda garantier.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">8. Missbruk</h2>
            <p>
              Vi förbehåller oss rätten att neka tillgång till tjänsten eller stänga av användare
              som bryter mot dessa villkor, tillämplig lag eller använder tjänsten på ett
              otillbörligt sätt.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">9. Tillämplig lag</h2>
            <p>Dessa villkor regleras av svensk lag.</p>
            <p className="mt-4">
              Eventuella tvister ska i första hand lösas genom dialog mellan parterna och i andra
              hand avgöras av svensk allmän domstol.
            </p>
          </div>

          <div>
            <h2 className="text-[22px] font-semibold text-slate-900 mb-3">10. Kontakt</h2>
            <p>För frågor om tjänsten eller dessa användarvillkor kan du kontakta:</p>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
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
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
