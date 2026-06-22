import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    a: 'Nej, det är helt kostnadsfritt för dig som privatperson. Bilto finansieras av ett blygsamt arvode från handlaren när en affär genomförs – det påverkar aldrig priset du betalar.',
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
    a: 'Ja. Vi jämför ränteerbjudanden från flera finansiärers och ser till att du inte betalar mer än du behöver. Vi kan även hjälpa dig med leasingavtal om det passar bättre.',
  },
  {
    q: 'Kan jag byta in min gamla bil?',
    a: 'Ja. Sätt "Ja, jag har en bil att byta in" i formuläret så ingår inbyteshantering i tjänsten – vi värdera din bil och matchar köp och sälj.',
  },
];

const CONCIERGE_FAQS: FaqItem[] = [
  {
    q: 'Vad kostar köphjälpstjänsten?',
    a: 'Helt gratis för dig. Vi tar aldrig betalt av privatpersoner. Bilto finansieras av ett litet arvode från handlaren när en affär görs – det påverkar inte priset du betalar.',
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
    a: 'Självklart. Vi bokar tid för provkörning hos den handlare eller säljare vi hittat. Du beslutar alltid sista ordet.',
  },
];

export default function BuyFlowFAQ({ variant = 'buy' }: BuyFlowFAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const faqs = variant === 'concierge' ? CONCIERGE_FAQS : BUY_FAQS;

  return (
    <section className="py-10 sm:py-14 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-[20px] sm:text-[24px] font-extrabold text-slate-900 mb-6 text-center">
          Vanliga frågor
        </h2>
        <div className="space-y-2">
          {faqs.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#faf8f5] transition"
              >
                <span className="text-[14px] font-semibold text-slate-800 pr-4 leading-snug">{item.q}</span>
                {openIdx === i
                  ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-[13px] sm:text-[14px] text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
