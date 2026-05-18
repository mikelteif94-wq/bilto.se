import { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export interface PendingImage {
  file: File;
  preview: string;
  ordning: number;
}

interface CarImageUploaderProps {
  images: PendingImage[];
  onChange: (imgs: PendingImage[]) => void;
  maxImages?: number;
  hint?: string;
}

export default function CarImageUploader({
  images,
  onChange,
  maxImages = 12,
  hint,
}: CarImageUploaderProps) {
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const slotsLeft = maxImages - images.length;
    if (slotsLeft <= 0) {
      setError(`Max ${maxImages} bilder`);
      return;
    }
    const toProcess = Array.from(files).slice(0, slotsLeft);
    setCompressing(true);
    try {
      const next: PendingImage[] = [];
      for (const f of toProcess) {
        if (!f.type.startsWith('image/')) continue;
        const compressed = await imageCompression(f, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg',
        });
        next.push({
          file: compressed,
          preview: URL.createObjectURL(compressed),
          ordning: 0,
        });
      }
      onChange(
        [...images, ...next].map((img, i) => ({ ...img, ordning: i })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kunde inte bearbeta bilden');
    } finally {
      setCompressing(false);
    }
  };

  const remove = (idx: number) => {
    URL.revokeObjectURL(images[idx].preview);
    onChange(
      images.filter((_, i) => i !== idx).map((img, i) => ({ ...img, ordning: i })),
    );
  };

  const canAdd = images.length < maxImages;

  return (
    <div className="space-y-3">
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-700">
          {images.length} {images.length === 1 ? 'bild' : 'bilder'}
        </span>
        <span>Max {maxImages}</span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200"
            >
              <img src={img.preview} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-[#0e6efe] text-white px-1.5 py-0.5 rounded">
                  HUVUDBILD
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-sm"
                aria-label="Ta bort"
              >
                <X className="w-3.5 h-3.5 text-slate-700" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canAdd && (
        <div className="grid grid-cols-2 gap-2">
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={compressing}
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#0e6efe] hover:bg-[#0e6efe]/5 transition disabled:opacity-50 group"
          >
            {compressing ? (
              <Loader2 className="w-5 h-5 text-[#0e6efe] animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-slate-500 group-hover:text-[#0e6efe]" />
            )}
            <span className="text-xs font-medium text-slate-700 group-hover:text-[#0e6efe]">
              Ta foto
            </span>
          </button>
          <button
            type="button"
            disabled={compressing}
            onClick={() => galleryRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-[#0e6efe] hover:bg-[#0e6efe]/5 transition disabled:opacity-50 group"
          >
            {compressing ? (
              <Loader2 className="w-5 h-5 text-[#0e6efe] animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5 text-slate-500 group-hover:text-[#0e6efe]" />
            )}
            <span className="text-xs font-medium text-slate-700 group-hover:text-[#0e6efe]">
              Välj från bibliotek
            </span>
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export async function uploadCarImages(
  supabase: { storage: { from: (b: string) => { upload: (p: string, f: File, o: object) => Promise<{ error: unknown }>; getPublicUrl: (p: string) => { data: { publicUrl: string } } } }; from: (t: string) => { insert: (rows: unknown) => Promise<{ error: unknown }> } },
  carId: string,
  imgs: PendingImage[],
  startOrdning = 0,
): Promise<{ ok: boolean; error?: string }> {
  if (imgs.length === 0) return { ok: true };
  const uploaded: { storage_url: string; ordning: number }[] = [];
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const ext = img.file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${carId}/${Date.now()}_${startOrdning + i}.${ext}`;
    const { error: upErr } = await supabase.storage.from('car-images').upload(path, img.file, {
      cacheControl: '3600',
      contentType: img.file.type || 'image/jpeg',
      upsert: false,
    });
    if (upErr) {
      return { ok: false, error: `Bild ${i + 1} kunde inte laddas upp.` };
    }
    const { data } = supabase.storage.from('car-images').getPublicUrl(path);
    uploaded.push({ storage_url: data.publicUrl, ordning: startOrdning + i });
  }
  const { error: insErr } = await supabase.from('car_images').insert(
    uploaded.map((u) => ({ car_id: carId, storage_url: u.storage_url, ordning: u.ordning })),
  );
  if (insErr) return { ok: false, error: 'Bilder uppladdade men kunde inte sparas.' };
  return { ok: true };
}
