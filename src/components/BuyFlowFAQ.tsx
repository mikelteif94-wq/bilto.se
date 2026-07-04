import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

interface BuyFlowFAQProps {
  variant?: 'buy' | 'concierge';
}

const BUY_FAQS: FaqItem[] = [
  {
    q: 'Kostar det något att använda Biltos köptjänst?',
    a: 'Ja – tjänsten kostar 1 995 kr och betalas bara om affären faktiskt blir av. Inget köp, ingen kostnad. Snittbesparingen vi förhandlar fram är 18 000 kr per affär, så de flesta kunder tjänar mångfalt mer än de betalar.',
  },
  {
    q: 'Är det bindande att skicka in en förfrågan?',
    a: 'Absolut inte. Du förbinder dig till ingenting. Förfrågan är en signal till oss att du vill ha hjälp – vi ringer upp, lyssnar och lägger upp en plan. Vill du inte gå vidare säger du bara nej.',
  },
  {
    q: 'Hur snabbt hör ni av er?',
    a: 'Vi återkommer normalt inom en arbetsdag – ofta inom några timmar. Du väljer om du föredrar samtal eller SMS.',
  },
  {
    q: 'Kan ni hjälpa mig om jag redan hittat en bil?',
    a: 'Ja! Skicka länken eller berätta var du hittat bilen. Vi granskar historik, kontrollerar att priset är rimligt och förhandlar med säljaren åt dig.',
  },
  {
    q: 'Vad händer efter jag skickat in formuläret?',
    a: 'En av våra bilrådgivare ringer upp dig. Ni pratar igenom vad du söker, din budget och eventuellt inbyte. Sedan tar vi vid och söker i hela marknaden.',
  },
  {
    q: 'Hjälper ni även med finansiering?',
    a: 'Ja. Vi jämför ränteerbjudanden från flera finansiärer och ser till att du inte betalar mer än du behöver. Vi kan även hjälpa dig med leasingavtal om det passar bättre.',
  },
  {
    q: 'Kan jag byta in min gamla bil?',
    a: 'Ja. Välj "Jag har en bil att byta in" i formuläret så ingår inbyteshantering i tjänsten – vi värderar din bil och matchar köp och sälj.',
  },
];

const CONCIERGE_FAQS: FaqItem[] = [
  {
    q: 'Vad kostar köphjälpstjänsten?',
    a: 'Tjänsten kostar 1 995 kr och betalas bara om affären blir av. Inget köp, ingen kostnad. Snittbesparingen vi förhandlar fram är 18 000 kr – de flesta kunder tjänar mångfalt mer.',
  },
  {
    q: 'Är det bindande att kontakta er?',
    a: 'Nej. Du förbinder dig ingenting. Hör du av dig är det bara ett samtal – du bestämmer om du vill gå vidare.',
  },
  {
    q: 'Hur lång tid tar hela processen?',
    a: 'Det beror på hur specifika dina krav är. Enkla sökningar tar ofta 2–5 dagar. Mer specifika önskemål som ovanliga färger eller utrustning kan ta 1–2 veckor.',
  },
  {
    q: 'Söker ni bara begagnade bilar, eller även nya?',
    a: 'Båda. Vi söker på hela marknaden – nya bilar direkt från märkeshandlare, certifierade begagnade och privata säljare. Vi väljer det som ger dig bäst värde.',
  },
  {
    q: 'Hur kontrollerar ni bilens historik?',
    a: 'Vi kör alltid fordonsfakta, kontrollerar besiktningshistorik, eventuella skulder och om bilen är rätt registrerad. Trygg handel är grunden för allt vi gör.',
  },
  {
    q: 'Kan jag vara med och provköra bilen?',
    a: 'Självklart. Vi bokar tid för provkörning hos den handlare eller säljare vi hittat. Du bestämmer alltid sista ordet.',
  },
];

export default function BuyFlowFAQ({ variant = 'buy' }: BuyFlowFAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const faqs = variant === 'concierge' ? CONCIERGE_FAQS : BUY_FAQS;

  return (
    <section className="bg-[#0e6efe] px-4 sm:px-6 py-16 sm:py-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 sm:mb-14">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-3">Vanliga frågor</p>
          <h2 className="text-[28px] sm:text-[38px] font-bold text-white tracking-[-0.02em] leading-[1.08]">
            Vanliga frågor – vi svarar rakt på sak.
          </h2>
        </div>
        <div className="divide-y divide-white/15 border-y border-white/15">
          {faqs.map((item, idx) => {
            const open = openIdx === idx;
            return (
              <button
                key={item.q}
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                className="w-full text-left py-5 flex items-start gap-4 group"
              >
                <div className="flex-1">
                  <h3 className="text-[16px] font-semibold text-white leading-snug">{item.q}</h3>
                  {open && (
                    <p className="mt-3 text-[14px] text-white/75 leading-[1.65]">{item.a}</p>
                  )}
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-white/50 mt-0.5 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-white/80' : ''}`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
