export function SiteFooter() {
  return (
    <footer className="bg-[#0b1220] text-slate-400">
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pb-12 border-b border-white/8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              loading="lazy"
              decoding="async"
              className="h-20 w-auto object-contain -ml-1 mb-4 brightness-0 invert opacity-90"
            />
            <p className="text-[14px] leading-relaxed text-slate-400 max-w-[220px]">
              Sälj din bil tryggt och till bästa pris. Jämför bud från hundratals handlare.
            </p>
          </div>

          {/* Sälj */}
          <div>
            <h4 className="text-white text-[12px] font-bold uppercase tracking-[0.14em] mb-4">Sälj</h4>
            <ul className="space-y-3 text-[14px]">
              {[
                { label: 'Värdera din bil', href: '/' },
                { label: 'Sälj din bil', href: '/salj-din-bil' },
                { label: 'Köp bil', href: '/kop-bil' },
                { label: 'Elbilar', href: '#' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="hover:text-white transition-colors duration-200">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Företag */}
          <div>
            <h4 className="text-white text-[12px] font-bold uppercase tracking-[0.14em] mb-4">Företag</h4>
            <ul className="space-y-3 text-[14px]">
              {[
                { label: 'Om Bilto', href: '/om-oss' },
                { label: 'Så funkar det', href: '/sa-funkar-det' },
                { label: 'Blogg', href: '/blogg' },
                { label: 'Bli handlare', href: '/handlare/registrera' },
                { label: 'Logga in som handlare', href: '/handlare/logga-in' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="hover:text-white transition-colors duration-200">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h4 className="text-white text-[12px] font-bold uppercase tracking-[0.14em] mb-4">Kontakt</h4>
            <ul className="space-y-3 text-[14px]">
              {[
                { label: '08-5555 0200', href: 'tel:+46855550200' },
                { label: 'hej@bilto.se', href: 'mailto:hej@bilto.se' },
                { label: 'Användarvillkor', href: '/anvandarvillkor' },
                { label: 'Integritetspolicy', href: '/integritetspolicy' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="hover:text-white transition-colors duration-200">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[12px] text-slate-500">
          <p>&copy; {new Date().getFullYear()} Bilto AB. Alla rättigheter förbehållna.</p>
          <div className="flex items-center gap-5">
            <a href="/admin" className="hover:text-slate-300 transition-colors">Admin</a>
            <span className="text-slate-700">&middot;</span>
            <span>Gjord med omsorg i Sverige.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
