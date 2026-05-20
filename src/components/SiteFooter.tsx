export function SiteFooter() {
  return (
    <footer className="bg-[#0e6efe] text-white/80 pt-12 pb-8 px-6 sm:pt-14 sm:pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center md:hidden pb-8">
          <img
            src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
            alt="Bilto"
            className="h-40 w-auto object-contain"
          />
          <p className="mt-2 text-[14px] text-white/85 leading-relaxed max-w-xs">
            Sälj din bil tryggt och till bästa pris. Jämför bud från hundratals handlare.
          </p>
        </div>

        <div className="hidden md:grid md:grid-cols-4 gap-10 pb-10 border-b border-white/20">
          <div className="md:col-span-1">
            <img
              src="/ChatGPT_Image_9_maj_2026_15_33_44.png"
              alt="Bilto"
              className="h-20 lg:h-32 w-auto object-contain -ml-2"
            />
            <p className="mt-4 text-sm text-white/80 leading-relaxed max-w-xs">
              Sälj din bil tryggt och till bästa pris. Jämför bud från hundratals handlare.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Sälj</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="hover:text-white transition">Värdera din bil</a></li>
              <li><a href="/salj-din-bil" className="hover:text-white transition">Sälj din bil</a></li>
              <li><a href="/kop-bil" className="hover:text-white transition">Köp bil</a></li>
              <li><a href="#" className="hover:text-white transition">Elbilar</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Företag</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/om-oss" className="hover:text-white transition">Om Bilto</a></li>
              <li><a href="/sa-funkar-det" className="hover:text-white transition">Så funkar det</a></li>
              <li><a href="/blogg" className="hover:text-white transition">Blogg</a></li>
              <li><a href="/handlare/registrera" className="hover:text-white transition">Bli handlare</a></li>
              <li><a href="/handlare/logga-in" className="hover:text-white transition">Logga in som handlare</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Kontakt</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="tel:+46855550200" className="hover:text-white transition">08-5555 0200</a></li>
              <li><a href="mailto:hej@bilto.se" className="hover:text-white transition">hej@bilto.se</a></li>
              <li><a href="/anvandarvillkor" className="hover:text-white transition">Användarvillkor</a></li>
              <li><a href="/integritetspolicy" className="hover:text-white transition">Integritetspolicy</a></li>
            </ul>
          </div>
        </div>

        <div className="md:hidden grid grid-cols-2 gap-x-6 gap-y-8 py-8">
          <div>
            <h4 className="text-white font-semibold mb-3 text-[12px] uppercase tracking-wider">Sälj</h4>
            <ul className="space-y-2.5 text-[14px]">
              <li><a href="/" className="hover:text-white transition">Värdera din bil</a></li>
              <li><a href="/salj-din-bil" className="hover:text-white transition">Sälj din bil</a></li>
              <li><a href="/kop-bil" className="hover:text-white transition">Köp bil</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 text-[12px] uppercase tracking-wider">Företag</h4>
            <ul className="space-y-2.5 text-[14px]">
              <li><a href="/om-oss" className="hover:text-white transition">Om Bilto</a></li>
              <li><a href="/sa-funkar-det" className="hover:text-white transition">Så funkar det</a></li>
              <li><a href="/blogg" className="hover:text-white transition">Blogg</a></li>
              <li><a href="/handlare/registrera" className="hover:text-white transition">Bli handlare</a></li>
              <li><a href="/handlare/logga-in" className="hover:text-white transition">Logga in som handlare</a></li>
              <li><a href="/admin" className="hover:text-white transition">Admin</a></li>
            </ul>
          </div>
          <div className="col-span-2">
            <h4 className="text-white font-semibold mb-3 text-[12px] uppercase tracking-wider">Kontakt</h4>
            <ul className="space-y-2.5 text-[14px]">
              <li><a href="tel:+46855550200" className="hover:text-white transition">08-5555 0200</a></li>
              <li><a href="mailto:hej@bilto.se" className="hover:text-white transition">hej@bilto.se</a></li>
              <li><a href="/anvandarvillkor" className="hover:text-white transition">Användarvillkor</a></li>
              <li><a href="/integritetspolicy" className="hover:text-white transition">Integritetspolicy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[12px] sm:text-xs text-white/70 text-center">
          <p>&copy; {new Date().getFullYear()} Bilto AB. Alla rättigheter förbehållna.</p>
          <div className="flex items-center gap-4">
            <a href="/admin" className="hidden md:inline hover:text-white transition">Admin</a>
            <span className="hidden md:inline text-white/30">·</span>
            <p>Gjord med omsorg i Sverige.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
