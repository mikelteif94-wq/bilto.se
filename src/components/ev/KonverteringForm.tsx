import { useState } from 'react';
import { User, Phone, Mail, CheckCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function KonverteringForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('leads').insert({
      namn: name,
      telefon: phone,
      email,
      source: 'Elbilsbyte - Konvertering',
    });
    try {
      const notifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-lead`;
      await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telefon: phone, regnummer: '', email, source: 'Elbilsbyte' }),
      });
    } catch { /* best effort */ }
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)] p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle className="w-9 h-9 text-emerald-600" strokeWidth={1.8} />
          </div>
        </div>
        <h3 className="text-[22px] font-bold text-slate-900 mb-2">Tack, {name.split(' ')[0]}!</h3>
        <p className="text-[15px] text-slate-500 leading-relaxed max-w-sm mx-auto">
          Vi hör av oss inom 24 timmar. En rådgivare går igenom din situation och hjälper dig med hela bytet — från värdering till laddning.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-[13px] text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" strokeWidth={1.8} />
          Inga dolda avgifter · Du bestämmer
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
      <div className="p-5 sm:p-6">
        <h3 className="text-[18px] font-bold text-slate-900 mb-1">Vi tar hand om hela bytet</h3>
        <p className="text-[14px] text-slate-500 mb-5">Du pratar aldrig med en bilhandlare. Vi företräder dig genom hela processen.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Namn</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="För- och efternamn"
                className="w-full h-12 pl-10 pr-4 text-[15px] bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Telefon</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="070-123 45 67"
                className="w-full h-12 pl-10 pr-4 text-[15px] bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-slate-700 mb-1.5">E-post</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.8} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="namn@email.se"
                className="w-full h-12 pl-10 pr-4 text-[15px] bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold text-[15px] transition active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Skickar...
              </span>
            ) : 'Få hjälp med bytet'}
          </button>

          <p className="text-center text-[12px] text-slate-400">
            Genom att skicka godkänner du att vi kontaktar dig. Inga dolda avgifter.
          </p>
        </form>
      </div>
    </div>
  );
}
