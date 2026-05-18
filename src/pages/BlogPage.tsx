import { useState } from 'react';
import { ArrowLeft, Calendar, User, Check, Loader2, Car } from 'lucide-react';
import { SiteFooter } from './BrokerageLanding';
import { supabase } from '../lib/supabase';
import ErrorBanner from '../components/ErrorBanner';

interface BlogPageProps {
  onBackHome: () => void;
}

export default function BlogPage({ onBackHome }: BlogPageProps) {
  const [regnummer, setRegnummer] = useState('');
  const [telefon, setTelefon] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reg = regnummer.trim().toUpperCase().replace(/\s/g, '');
    const tel = telefon.trim();
    if (!reg) {
      setError('Ange registreringsnummer');
      return;
    }
    if (!/^[A-Z]{3}[0-9]{2}[A-Z0-9]$/.test(reg)) {
      setError('Registreringsnummer måste vara 3 bokstäver följt av 3 tecken (t.ex. ABC123)');
      return;
    }
    if (!tel || tel.replace(/\D/g, '').length < 7) {
      setError('Ange ett giltigt telefonnummer');
      return;
    }
    setError('');
    setSubmitting(true);
    const { error: insertError } = await supabase.from('leads').insert({
      regnummer: reg,
      telefon: tel,
    });
    setSubmitting(false);
    if (insertError) {
      setError('Något gick fel. Försök igen.');
      return;
    }
    try {
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`;
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon: tel, regnummer: reg, source: 'Blogg' }),
      });
    } catch { /* best effort */ }
    setSuccess(true);
    setRegnummer('');
    setTelefon('');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center">
          <button
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Till startsidan
          </button>
        </div>
      </header>

      <div className="relative w-full h-[340px] sm:h-[460px] overflow-hidden">
        <img
          src="https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Bil i solnedgång"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 max-w-4xl mx-auto px-6 pb-10 sm:pb-14">
          <span className="inline-block text-[11px] font-semibold tracking-wider uppercase text-white/90 bg-[#0e6efe] px-3 py-1.5 rounded-full">
            Guide
          </span>
          <h1 className="mt-4 text-white text-[32px] sm:text-[48px] leading-[1.1] font-semibold tracking-tight max-w-3xl">
            Att tänka på när du ska sälja din begagnade bil
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-white/85 text-[14px]">
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Publicerad: 2026-05-07
            </span>
            <span className="inline-flex items-center gap-2">
              <User className="w-4 h-4" />
              Skriven av: Bilto Expert
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-14 sm:py-20">
        <article className="space-y-10 text-slate-700 text-[17px] leading-[1.75]">
          <section className="space-y-5">
            <p className="text-[19px] text-slate-800 font-medium leading-[1.6]">
              Att sälja sin bil kan kännas både stressigt och tidskrävande. Många funderar på hur
              man får bäst betalt, undviker oseriösa köpare och samtidigt gör affären trygg och
              smidig.
            </p>
            <p>
              Med rätt förberedelser blir bilförsäljningen betydligt enklare. I den här guiden går
              vi igenom allt du behöver tänka på innan du säljer din bil – från värdering och
              annonsering till betalning, ägarbyte och vanliga misstag att undvika.
            </p>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              När är bästa tiden att sälja bilen?
            </h2>
            <p className="mb-5">Tidpunkten påverkar ofta både efterfrågan och priset på din bil.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { titel: 'Våren', text: 'Generellt den bästa tiden att sälja bil. Efterfrågan ökar och fler köpare är aktiva, vilket ofta leder till bättre priser.' },
                { titel: 'Sommaren', text: 'Fortsatt stark, särskilt för cabrioleter och sportigare modeller.' },
                { titel: 'Hösten', text: 'Efterfrågan börjar minska och priserna kan bli något lägre.' },
                { titel: 'Vintern', text: 'Fyrhjulsdrivna bilar och kombimodeller är mer attraktiva under vintern.' },
              ].map((s) => (
                <div key={s.titel} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900 mb-1.5">{s.titel}</h3>
                  <p className="text-[15px] text-slate-600 leading-[1.6]">{s.text}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-8 text-[19px] font-semibold text-slate-900 mb-3">Tänk på vilken typ av bil du säljer</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Cabrioleter säljs oftast bäst under våren och sommaren</li>
              <li>SUV:ar och fyrhjulsdrivna bilar är populära under höst och vinter</li>
              <li>Bränslesnåla pendlarbilar är efterfrågade året runt</li>
            </ul>
          </section>

          <figure className="my-4">
            <img
              src="https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Bilnyckel överlämnas"
              className="w-full h-[280px] sm:h-[360px] object-cover rounded-xl"
            />
          </figure>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Kan man sälja en bil med billån?
            </h2>
            <p className="mb-4">
              Ja, det går att sälja en bil trots att det finns ett billån kopplat till den. Det
              viktigaste är att lånet löses innan ägarbytet genomförs.
            </p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-2 mt-6">Sälja privat</h3>
            <p>
              Vid privat försäljning behöver lånet vanligtvis lösas innan bilen kan överlåtas till
              den nya ägaren.
            </p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-2 mt-6">Sälja till bilhandlare</h3>
            <p>
              Många bilhandlare kan hjälpa till att lösa lånet direkt i samband med affären, vilket
              gör processen betydligt enklare.
            </p>
            <p className="mt-4">
              Bilto samarbetar med seriösa bilhandlare som i många fall kan hjälpa till att lösa
              befintliga lån vid försäljningen.
            </p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-2 mt-6">
              Kan någon annan ta över mitt billån?
            </h3>
            <p>
              Det är ovanligt att en privat köpare tar över ett befintligt billån. Banken måste
              alltid godkänna den nya låntagaren, vilket ofta gör processen komplicerad.
            </p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">
              Tips för att lösa billånet tryggt
            </h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Begär ett aktuellt lösenbelopp från banken</li>
              <li>Säkerställ att skulden löses i samband med försäljningen</li>
              <li>Be om ett skriftligt kvitto eller intyg när lånet är avslutat</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Kan man sälja en privatleasad bil?
            </h2>
            <p>Nej. En privatleasad bil ägs av leasingbolaget och kan därför inte säljas.</p>
            <p className="mt-4">
              I vissa fall kan leasingavtalet dock överlåtas till en annan person efter godkännande
              från leasingföretaget.
            </p>
            <p className="mt-4">
              Om du annonserar en leasingöverlåtelse är det viktigt att tydligt skriva:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>Månadskostnad</li>
              <li>Återstående leasingtid</li>
              <li>Tillåten körsträcka</li>
              <li>Eventuella avgifter för överlåtelse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Förbered bilen inför försäljningen
            </h2>
            <p>
              Första intrycket är extremt viktigt när du säljer en bil. En välvårdad och ren bil
              uppfattas som mer seriös och kan ge ett högre slutpris.
            </p>
          </section>

          <figure>
            <img
              src="https://images.pexels.com/photos/6873080/pexels-photo-6873080.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Bil tvättas"
              className="w-full h-[280px] sm:h-[360px] object-cover rounded-xl"
            />
            <figcaption className="mt-2 text-sm text-slate-500 text-center">
              En ren bil skapar förtroende och säljer snabbare.
            </figcaption>
          </figure>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Värdera bilen rätt
            </h2>
            <p className="mb-4">Innan du säljer bilen bör du ta reda på marknadsvärdet.</p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Så kan du uppskatta värdet</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Jämför liknande annonser online</li>
              <li>Kontrollera miltal, skick och utrustning</li>
              <li>Se vad liknande modeller faktiskt säljs för</li>
            </ul>
            <p className="mt-4">
              Många säljare överskattar värdet på sin egen bil. Försök att vara realistisk när du
              sätter priset.
            </p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Tänk på detta när du sätter priset</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Köpare förväntar sig ofta att kunna pruta</li>
              <li>Lägg gärna priset något högre än ditt lägsta accepterade pris</li>
              <li>Bestäm i förväg vad du minst kan tänka dig att sälja bilen för</li>
            </ul>
            <p className="mt-4">
              Bilto hjälper dig att få en realistisk marknadsvärdering baserad på aktuella
              försäljningspriser.
            </p>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Städa bilen ordentligt
            </h2>
            <p>En ren bil säljer snabbare och skapar ett bättre intryck.</p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Viktigt att göra invändigt</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Dammsug säten och golv</li>
              <li>Tvätta mattor</li>
              <li>Putsa rutorna</li>
              <li>Torka av instrumentpanel och interiör</li>
              <li>Ta bort personliga saker</li>
              <li>Fräscha upp lukten i bilen</li>
            </ul>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-2 mt-6">Röklukt kan sänka priset</h3>
            <p>
              Bilar som luktar rök är ofta svårare att sälja och kan minska värdet.
            </p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Viktigt att göra utvändigt</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tvätta bilen noggrant</li>
              <li>Ta bort asfalt och tjärfläckar</li>
              <li>Polera lacken</li>
              <li>Putsa fälgar och kromdetaljer</li>
              <li>Se till att rutorna är rena</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Fixa småfel innan försäljning
            </h2>
            <p className="mb-4">
              Mindre skador och kosmetiska fel kan påverka priset mer än många tror.
            </p>
            <p>Det kan därför vara värt att:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>laga mindre repor</li>
              <li>byta trasiga lampor</li>
              <li>fixa enklare skador</li>
            </ul>
            <p className="mt-4">
              På äldre eller billigare bilar kan det dock vara bättre att sälja bilen i befintligt
              skick istället för att lägga pengar på reparationer.
            </p>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Besiktning och skatt
            </h2>
            <p className="mb-4">
              En nybesiktigad bil skapar trygghet hos köparen och gör bilen enklare att sälja.
            </p>
            <p>Många köpare föredrar även:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>att bilen är skattad</li>
              <li>att servicehistorik finns dokumenterad</li>
              <li>att bilen är redo att användas direkt</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Samla ihop alla tillbehör och dokument
            </h2>
            <p>Ha allt redo innan försäljningen.</p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Viktiga saker att ha framme</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Servicebok</li>
              <li>Kvitton och fakturor</li>
              <li>Extra nycklar</li>
              <li>Vinterhjul</li>
              <li>Låsmuttrar</li>
              <li>Registreringsbevis</li>
            </ul>
            <p className="mt-4">
              Det signalerar att bilen är välskött och inger förtroende hos köparen.
            </p>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Sälja privat eller till bilhandlare?
            </h2>
            <p className="mb-5">Det finns fördelar och nackdelar med båda alternativen.</p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-[15px]">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Faktor</th>
                    <th className="px-4 py-3 font-semibold">Sälja privat</th>
                    <th className="px-4 py-3 font-semibold">Sälja till bilhandlare</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {[
                    ['Pris', 'Ofta högre', 'Ofta lägre'],
                    ['Tidsåtgång', 'Tar längre tid', 'Snabbt och enkelt'],
                    ['Säkerhet', 'Större risk', 'Tryggare process'],
                    ['Ansvar', 'Mer ansvar för säljaren', 'Handlaren tar större ansvar'],
                    ['Administration', 'Du gör allt själv', 'Handlaren hjälper till'],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="px-4 py-3 font-medium text-slate-900">{row[0]}</td>
                      <td className="px-4 py-3">{row[1]}</td>
                      <td className="px-4 py-3">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-8">Fördelar med att sälja privat</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Du kan få högre slutpris</li>
              <li>Du styr hela försäljningen själv</li>
              <li>Du väljer vem du säljer till</li>
            </ul>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Nackdelar</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tar mycket tid</li>
              <li>Kräver annonsering och visningar</li>
              <li>Högre risk för bedrägerier</li>
              <li>Du ansvarar för mycket av administrationen</li>
            </ul>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Fördelar med att sälja till bilhandlare</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Snabb och enkel affär</li>
              <li>Mindre administration</li>
              <li>Tryggare betalning</li>
              <li>Handlaren hanterar ofta pappersarbete och lån</li>
            </ul>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Nackdelar</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Du får vanligtvis något mindre betalt</li>
            </ul>
          </section>

          <figure>
            <img
              src="https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Bilnyckel och avtal"
              className="w-full h-[280px] sm:h-[360px] object-cover rounded-xl"
            />
          </figure>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Så skapar du en bra bilannons
            </h2>
            <p>En bra annons ökar chanserna att sälja bilen snabbt.</p>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Bra bilder är avgörande</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Tvätta bilen innan fotografering</li>
              <li>Fotografera i dagsljus</li>
              <li>Visa bilen från flera vinklar</li>
              <li>Ta bilder både invändigt och utvändigt</li>
            </ul>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Skriv en tydlig beskrivning</h3>
            <p>Berätta om:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>utrustning</li>
              <li>servicehistorik</li>
              <li>skick</li>
              <li>eventuella skador</li>
              <li>tidigare ägare</li>
              <li>däck och tillbehör</li>
            </ul>
            <p className="mt-4">Var alltid ärlig i annonsen.</p>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Provkörning och säkerhet
            </h2>
            <p>När någon vill provköra bilen:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>Be alltid om legitimation</li>
              <li>Följ med under provkörningen</li>
              <li>Visa eventuella kända fel öppet och ärligt</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Så tar du betalt tryggt
            </h2>
            <p>Undvik:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>kontanter</li>
              <li>utländska checkar</li>
              <li>avbetalningar mellan privatpersoner</li>
            </ul>
            <h3 className="text-[19px] font-semibold text-slate-900 mb-3 mt-6">Säkra betalningsmetoder</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Swish</li>
              <li>Banköverföring på bankkontor</li>
              <li>Postväxel vid större belopp</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">Ägarbyte</h2>
            <p>Ägarbytet kan göras:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>via Transportstyrelsens app</li>
              <li>via deras e-tjänst</li>
              <li>med registreringsbevis del 2</li>
            </ul>
            <p className="mt-4">
              Det är viktigt att ägarbytet registreras direkt för att undvika framtida problem.
            </p>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Viktigt – skriv alltid avtal
            </h2>
            <p>Använd alltid ett skriftligt köpeavtal.</p>
            <p className="mt-4">
              Ett tydligt avtal skyddar både köpare och säljare om det skulle uppstå problem efter
              affären.
            </p>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">
              Kan man bli ansvarig för fel efter försäljning?
            </h2>
            <p>Ja, i vissa fall.</p>
            <p className="mt-4">Du kan bli ansvarig om:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>du medvetet undanhållit fel</li>
              <li>du lämnat felaktig information</li>
              <li>bilen är i betydligt sämre skick än köparen rimligen kunnat förvänta sig</li>
            </ul>
            <p className="mt-4">Var därför alltid tydlig och ärlig kring bilens skick.</p>
          </section>

          <section className="rounded-2xl bg-slate-900 text-white p-8 sm:p-10">
            <h2 className="text-[28px] font-semibold mb-4 leading-tight">Sälj bilen enkelt med Bilto</h2>
            <p className="text-white/85">Bilto hjälper dig att sälja bilen snabbt, tryggt och enkelt.</p>
            <h3 className="text-[18px] font-semibold mt-6 mb-3">Så fungerar det</h3>
            <ul className="list-disc pl-5 space-y-2 text-white/85">
              <li>Registrera bilen online</li>
              <li>Skicka in bilder och information</li>
              <li>Bilto annonserar och marknadsför bilen</li>
              <li>Seriösa köpare och handlare kontaktas</li>
              <li>Du väljer själv om du vill sälja</li>
            </ul>
            <h3 className="text-[18px] font-semibold mt-6 mb-3">Fördelar med Bilto</h3>
            <ul className="list-disc pl-5 space-y-2 text-white/85">
              <li>Mindre administration</li>
              <li>Hjälp med annonsering</li>
              <li>Större exponering</li>
              <li>Tryggare försäljningsprocess</li>
              <li>Seriösa köpare och handlare</li>
              <li>Möjlighet att få ett konkurrenskraftigt marknadspris</li>
            </ul>
            <p className="mt-6 text-white/85">
              Du bestämmer alltid själv om du vill acceptera ett bud eller genomföra försäljningen.
            </p>
          </section>

          <section>
            <h2 className="text-[28px] font-semibold text-slate-900 mb-5 leading-tight">Sammanfattning</h2>
            <p>Att sälja en bil behöver inte vara komplicerat. Genom att:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2">
              <li>förbereda bilen ordentligt</li>
              <li>sätta rätt pris</li>
              <li>använda säkra betalningsmetoder</li>
              <li>ha tydliga avtal</li>
            </ul>
            <p className="mt-4">
              kan du göra försäljningen både tryggare och mer lönsam.
            </p>
            <p className="mt-4">
              Vill du slippa krånglet med annonser, samtal och osäkra köpare kan Bilto hjälpa dig
              genom hela processen – från värdering till färdig affär.
            </p>
          </section>
        </article>
      </main>

      <section className="bg-slate-50 py-14 sm:py-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#0e6efe]/10 text-[#0e6efe] mb-5">
              <Car className="w-7 h-7" />
            </div>
            <h2 className="text-[30px] sm:text-[36px] font-semibold tracking-tight text-slate-900 leading-[1.15]">
              Sälj din bil
            </h2>
            <p className="mt-3 text-slate-600 text-[16px]">
              Ange registreringsnummer och ditt telefonnummer så kontaktar vi dig med en
              värdering.
            </p>
          </div>

          {success ? (
            <div className="mt-8 rounded-2xl bg-white border border-emerald-200 p-8 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-[20px] font-semibold text-slate-900">Tack!</h3>
              <p className="mt-2 text-slate-600">
                Vi har tagit emot din förfrågan och ringer upp dig så snart som möjligt.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-6 text-[#0e6efe] hover:underline font-medium"
              >
                Skicka en till
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4"
            >
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Registreringsnummer
                </label>
                <input
                  type="text"
                  value={regnummer}
                  onChange={(e) => setRegnummer(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={7}
                  className="form-control tracking-wider"
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="070-123 45 67"
                  className="form-control"
                />
              </div>
              <ErrorBanner message={error} />
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-lg bg-[#0e6efe] hover:bg-[#0b5cd9] text-white font-semibold transition inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  'Sälj min bil'
                )}
              </button>
              <p className="text-[12px] text-slate-500 text-center pt-1">
                Genom att skicka godkänner du vår integritetspolicy.
              </p>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
