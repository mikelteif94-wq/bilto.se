import { Phone, Mail, Shield, MapPin } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #060e1e 0%, #030b16 100%)' }}>
      {/* Top accent bar */}
      <div className="h-[2px]" style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(14,110,254,0.6) 30%, rgba(56,189,248,0.5) 60%, transparent 100%)',
      }} />

      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-64 rounded-xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(14,110,254,0.06) 0%, transparent 70%)' }} />
      <div className="absolute top-0 right-1/4 w-64 h-48 rounded-xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto px-6 pt-14 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              loading="lazy"
              decoding="async"
              className="h-20 w-auto object-contain -ml-1 mb-4 brightness-0 invert opacity-85"
            />
            <p className="text-[13.5px] leading-relaxed text-slate-400 max-w-[210px] mb-5">
              Din bilaffär, förenklad. Sälj tryggare - köp smartare.
            </p>
            <div className="flex flex-col gap-2.5">
              <a href="tel:+46855550200" className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-white transition-colors duration-200 group">
                <Phone className="w-3.5 h-3.5 text-bilto-500 group-hover:text-bilto-400 shrink-0" />
                08-5555 0200
              </a>
              <a href="mailto:hej@bilto.se" className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-white transition-colors duration-200 group">
                <Mail className="w-3.5 h-3.5 text-bilto-500 group-hover:text-bilto-400 shrink-0" />
                hej@bilto.se
              </a>
              <span className="flex items-center gap-2 text-[13px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                Stockholm, Sverige
              </span>
            </div>
          </div>

          {/* Sälj */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5 text-slate-300">Sälj & Köp</h4>
            <ul className="space-y-3">
              {[
                { label: 'Värdera din bil', href: '/' },
                { label: 'Sälj din bil', href: '/salj-din-bil' },
                { label: 'Köp bil med hjälp', href: '/kop-bil' },
                { label: 'Bästa bilaffärerna', href: '/nya-bilar' },
                { label: 'Jämför bilar sida vid sida', href: '/jamfor-bilar' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-[13.5px] text-slate-500 hover:text-white transition-colors duration-200 hover:pl-1 inline-block transition-all">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Företag */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5 text-slate-300">Företag</h4>
            <ul className="space-y-3">
              {[
                { label: 'Om Bilto', href: '/om-oss' },
                { label: 'Så funkar det', href: '/sa-funkar-det' },
                { label: 'Blogg', href: '/blogg' },
                { label: 'Bli handlare', href: '/handlare/registrera' },
                { label: 'Handlare logga in', href: '/handlare/logga-in' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-[13.5px] text-slate-500 hover:text-white transition-colors duration-200 hover:pl-1 inline-block transition-all">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] mb-5 text-slate-300">Trygghet</h4>
            <ul className="space-y-3 mb-6">
              {[
                { label: 'Användarvillkor', href: '/anvandarvillkor' },
                { label: 'Integritetspolicy', href: '/integritetspolicy' },
                { label: 'Cookies', href: '/integritetspolicy' },
                { label: 'Webbplatskarta', href: '/webbplatskarta' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-[13.5px] text-slate-500 hover:text-white transition-colors duration-200 hover:pl-1 inline-block transition-all">{label}</a>
                </li>
              ))}
            </ul>
            {/* Trust signals */}
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                GDPR-anpassad
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                <Shield className="w-3.5 h-3.5 text-bilto-500" />
                SSL-krypterad
              </span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-slate-600">
          <p>&copy; {new Date().getFullYear()} Bilto AB · Alla rättigheter förbehållna</p>
          <div className="flex items-center gap-5">
            <a href="/admin" className="hover:text-slate-400 transition-colors">Admin</a>
            <span style={{ color: 'rgba(255,255,255,0.12)' }}>&middot;</span>
            <span className="text-slate-600">Gjord med omsorg i Sverige</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
