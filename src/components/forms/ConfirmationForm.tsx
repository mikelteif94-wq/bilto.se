import { useState } from 'react';
import { ArrowRight, Check, Loader2, Gavel, Phone, Clock, Mail, Home } from 'lucide-react';
import { CustomerData, CarData, ImageFile } from '../../pages/SellCarPage';
import { supabase } from '../../lib/supabase';

interface ConfirmationFormProps {
  customer: CustomerData;
  car: CarData;
  images: ImageFile[];
  salesType?: 'auction';
  onSubmit: () => Promise<void>;
  loading: boolean;
  onError: (error: string) => void;
  onGoHome?: () => void;
}

const SKICK_LABELS: Record<string, string> = {
  mycket_bra: 'Mycket bra',
  bra: 'Bra',
  okej: 'Okej',
  slitet: 'Slitet',
  skadat: 'Skadat',
};

type UploadStage = 'idle' | 'customer' | 'car' | 'images' | 'done';

export default function ConfirmationForm({
  customer,
  car,
  images,
  salesType = 'auction',
  onError,
  onGoHome,
}: ConfirmationFormProps) {
  const [stage, setStage] = useState<UploadStage>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [savedToken, setSavedToken] = useState<string>('');

  const submitting = stage !== 'idle' && stage !== 'done';
  const submitted = stage === 'done';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Create customer — link to auth account if already logged in
    setStage('customer');
    const { data: { session: existingSession } } = await supabase.auth.getSession();
    const loggedInUserId = existingSession?.user?.id ?? null;

    const customerId = crypto.randomUUID();
    const { error: customerError } = await supabase
      .from('customers')
      .insert([{
        id: customerId,
        namn: customer.namn,
        telefon: customer.telefon,
        mejl: customer.mejl,
        user_id: loggedInUserId,
      }]);

    if (customerError) {
      setStage('idle');
      onError('Kunde inte spara dina kontaktuppgifter. Försök igen.');
      return;
    }
    const customerRow = { id: customerId };

    // 2. Create car
    setStage('car');
    const accessToken = generateToken();
    const carId = crypto.randomUUID();
    const { error: carError } = await supabase
      .from('cars')
      .insert([{
        id: carId,
        regnummer: car.regnummer.toUpperCase(),
        marke: car.marke || '',
        modell: car.modell || '',
        ar: car.ar ?? new Date().getFullYear(),
        miltal: car.miltal,
        skick: car.skick,
        skick_kommentar: car.skickKommentar,
        utrustning: car.utrustning,
        customer_id: customerRow.id,
        access_token: accessToken,
        sales_type: salesType,
        status: 'ny',
      }]);

    if (carError) {
      setStage('idle');
      onError('Kunde inte spara uppgifterna om bilen. Försök igen.');
      return;
    }
    const carRow = { id: carId };

    // 3. Upload images to storage
    setStage('images');
    setProgress({ current: 0, total: images.length });

    const uploaded: { url: string; ordning: number }[] = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const ext = img.file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${carRow.id}/${Date.now()}_${i}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(path, img.file, {
          cacheControl: '3600',
          contentType: img.file.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        setStage('idle');
        onError(
          `Kunde inte ladda upp bild ${i + 1} av ${images.length}. Försök igen.`
        );
        return;
      }

      const { data: pub } = supabase.storage
        .from('car-images')
        .getPublicUrl(path);

      uploaded.push({ url: pub.publicUrl, ordning: img.ordning });
      setProgress({ current: i + 1, total: images.length });
    }

    // 4. Insert car_images rows
    if (uploaded.length > 0) {
      const { error: imagesError } = await supabase.from('car_images').insert(
        uploaded.map((u) => ({
          car_id: carRow.id,
          storage_url: u.url,
          ordning: u.ordning,
        }))
      );

      if (imagesError) {
        setStage('idle');
        onError('Bilderna laddades upp men kunde inte sparas. Kontakta oss.');
        return;
      }
    }

    const origin = import.meta.env.VITE_APP_URL ?? 'https://bilto.se';
    const trackingUrl = `${origin.replace(/\/$/, '')}/min-bil/${accessToken}`;

    const headers = {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    };

    // Bekräftelsemejl till kund
    void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-customer-submitted`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ car_id: carRow.id, tracking_url: trackingUrl }),
    }).catch(() => {});

    // Notis till admin om ny bil
    void fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-new-car`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'INSERT',
        table: 'cars',
        schema: 'public',
        record: {
          id: carRow.id,
          regnummer: car.regnummer.toUpperCase(),
          marke: car.marke || '',
          modell: car.modell || '',
          ar: car.ar ?? new Date().getFullYear(),
          miltal: car.miltal,
          skick: car.skick,
          status: 'ny',
          customer_id: customerRow.id,
          created_at: new Date().toISOString(),
        },
      }),
    }).catch(() => {});

    setSavedToken(accessToken);
    setStage('done');
  };

  function generateToken(): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  }

  if (submitted) {
    const firstName = customer.namn.trim().split(/\s+/)[0] || '';
    const firstName_cap = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    const maskedPhone = maskPhone(customer.telefon);
    const reg = car.regnummer.toUpperCase();
    const trackUrl = savedToken
      ? `/logga-in?mejl=${encodeURIComponent(customer.mejl)}&skapa=1`
      : '';

    return (
      <div className="py-2 sm:py-4">
        <div className="text-center mb-7">
          <div className="w-16 h-16 bg-[#0e6efe]/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check className="w-9 h-9 text-[#0e6efe]" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {firstName_cap ? `Tack ${firstName_cap}!` : 'Tack!'}
          </h2>
          <p className="text-slate-600 px-2 mb-5">
            Vi har tagit emot din bil och hör av oss när budgivningen är klar — du behöver inte göra något mer.
          </p>
          {trackUrl && (
            <a
              href={trackUrl}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-[#0e6efe] hover:bg-[#0b5cd8] text-white font-semibold text-[14px] rounded-full transition shadow-sm"
            >
              Följ din bil
              <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
            </a>
          )}
        </div>

        <div className="bg-gradient-to-br from-[#0e6efe] to-[#0b5cd8] text-white rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-wide text-white/80 mb-1">
                Vår expert ringer dig
              </p>
              <p className="text-[17px] font-semibold leading-snug">
                {maskedPhone ? <>Vi ringer dig på <span className="text-white">{maskedPhone}</span></> : 'Vi ringer dig så snart som möjligt'}
              </p>
            </div>
          </div>
          <p className="text-sm text-white/85 pl-[52px]">
            Vi går igenom marknaden med dig så att vi kan maximera ditt pris innan vi skickar till handlare.
          </p>
        </div>

        <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 mb-6">
          <h3 className="text-xs font-semibold text-[#0e6efe] uppercase tracking-wide mb-5">
            Så här går det till
          </h3>
          <ol className="relative space-y-5">
            <li className="flex gap-4">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#0e6efe] text-white flex items-center justify-center">
                  <Check className="w-4.5 h-4.5" strokeWidth={2.5} />
                </div>
                <span className="absolute left-1/2 top-9 -translate-x-1/2 w-px h-[calc(100%+1.25rem)] bg-slate-200" aria-hidden="true" />
              </div>
              <div className="pb-1">
                <p className="text-sm font-semibold text-slate-900">Bilen är inskickad</p>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5">
                  Vi granskar uppgifterna och förbereder din annons.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#0e6efe]/10 text-[#0e6efe] flex items-center justify-center ring-2 ring-[#0e6efe]/30">
                  <Phone className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
                <span className="absolute left-1/2 top-9 -translate-x-1/2 w-px h-[calc(100%+1.25rem)] bg-slate-200" aria-hidden="true" />
              </div>
              <div className="pb-1">
                <p className="text-sm font-semibold text-slate-900">Expertrådgivning per telefon</p>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5">
                  En av våra experter ringer dig för att gå igenom marknaden, bilens värde och hur vi bäst positionerar den — så att vi kan pressa upp priset maximalt.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="shrink-0">
                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <Gavel className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Auktion bland hundratals handlare</p>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-0.5">
                  Vi skickar din bil till handlare och låter dem buda mot varandra. Du väljer själv om du vill acceptera det högsta budet — utan förpliktelser.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="bg-[#0e6efe]/5 border border-[#0e6efe]/20 rounded-xl p-4 sm:p-5 text-sm space-y-2 mb-4">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Bil</span>
            <span className="font-semibold text-slate-900 tracking-widest">{reg}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-slate-500 shrink-0">Bud skickas till</span>
            <span className="font-semibold text-slate-900 break-all text-right">{customer.mejl}</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5 mb-4">
          <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13px] text-amber-800 leading-relaxed">
            Vi har skickat en bekräftelse till <span className="font-semibold">{customer.mejl}</span>. Hamnar den inte i inkorgen? Kolla skräpposten eller spam-mappen.
          </p>
        </div>

        {trackUrl && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 mb-4">
            <p className="text-[13px] text-slate-600 leading-relaxed">
              Vill du följa budgivningen? Vi skickar också länken via mejl när det första budet kommer.
            </p>
            <a
              href={trackUrl}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[12.5px] rounded-full transition whitespace-nowrap"
            >
              Följ bilen
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
            </a>
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 mt-4 text-[12px] text-slate-500">
          <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
          Helt kostnadsfritt och utan förpliktelser
        </p>

        {onGoHome && (
          <div className="mt-6 text-center">
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
            >
              <Home className="w-4 h-4" strokeWidth={2} />
              Gå till startsidan
            </button>
          </div>
        )}
      </div>
    );
  }

  function maskPhone(phone: string): string {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 6) return phone.trim();
    const first = digits.slice(0, 3);
    const last = digits.slice(-2);
    const middle = 'X'.repeat(Math.max(2, digits.length - 5));
    return `${first}-${middle.match(/.{1,3}/g)?.join(' ') ?? middle} ${last}`;
  }

  const statusText = () => {
    if (stage === 'customer') return 'Sparar kontaktuppgifter...';
    if (stage === 'car') return 'Sparar bilens uppgifter...';
    if (stage === 'images')
      return `Laddar upp bilder (${progress.current}/${progress.total})...`;
    return 'Skicka in och få bud';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div className="bg-[#0e6efe]/5 border border-[#0e6efe]/15 rounded-xl p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-semibold text-[#0e6efe] uppercase tracking-wide">
            Bil
          </h3>
          <div className="flex justify-between text-sm gap-3">
            <span className="text-slate-500">Regnummer</span>
            <span className="font-semibold text-slate-900 tracking-widest">
              {car.regnummer.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between text-sm gap-3">
            <span className="text-slate-500">Miltal</span>
            <span className="font-semibold text-slate-900">
              {car.miltal.toLocaleString('sv-SE')} mil
            </span>
          </div>
          {car.ar && (
            <div className="flex justify-between text-sm gap-3">
              <span className="text-slate-500">Årsmodell</span>
              <span className="font-semibold text-slate-900">{car.ar}</span>
            </div>
          )}
          <div className="flex justify-between text-sm gap-3">
            <span className="text-slate-500">Skick</span>
            <span className="font-semibold text-slate-900">
              {SKICK_LABELS[car.skick] ?? car.skick}
            </span>
          </div>
          {car.utrustning.length > 0 && (
            <div className="flex justify-between text-sm gap-3">
              <span className="text-slate-500 shrink-0">Utrustning</span>
              <span className="font-semibold text-slate-900 text-right">
                {car.utrustning.join(', ')}
              </span>
            </div>
          )}
          {car.skickKommentar && (
            <div className="text-sm">
              <span className="text-slate-500 block mb-1">Kommentar om skicket</span>
              <span className="text-slate-900 whitespace-pre-wrap">
                {car.skickKommentar}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm gap-3">
            <span className="text-slate-500">Bilder</span>
            <span className="font-semibold text-slate-900">{images.length} st</span>
          </div>
        </div>

        <div className="bg-[#0e6efe]/5 border border-[#0e6efe]/15 rounded-xl p-4 sm:p-5 space-y-3">
          <h3 className="text-xs font-semibold text-[#0e6efe] uppercase tracking-wide">
            Kontakt
          </h3>
          <div className="flex justify-between text-sm gap-3">
            <span className="text-slate-500">Namn</span>
            <span className="font-semibold text-slate-900 text-right">{customer.namn}</span>
          </div>
          <div className="flex justify-between text-sm gap-3">
            <span className="text-slate-500">Telefon</span>
            <span className="font-semibold text-slate-900">{customer.telefon}</span>
          </div>
          <div className="flex justify-between text-sm gap-3">
            <span className="text-slate-500 shrink-0">E-post</span>
            <span className="font-semibold text-slate-900 break-all text-right">{customer.mejl}</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold text-[15px] rounded-full transition flex items-center justify-center gap-2 shadow-sm"
      >
        {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
        {statusText()}
      </button>

      {submitting && (
        <p className="text-center text-sm text-slate-500">
          Stäng inte sidan – det tar bara några sekunder.
        </p>
      )}
    </form>
  );
}
