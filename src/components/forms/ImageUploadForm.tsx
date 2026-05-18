import { useRef, useState } from 'react';
import { Camera, ImagePlus, X, Loader2, XCircle, PhoneCall } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { ImageFile } from '../../pages/SellCarPage';

interface ImageUploadFormProps {
  initialImages: ImageFile[];
  onNext: (images: ImageFile[]) => void;
}

const MIN_IMAGES = 3;
const MAX_IMAGES = 8;

export default function ImageUploadForm({ initialImages, onNext }: ImageUploadFormProps) {
  const [images, setImages] = useState<ImageFile[]>(initialImages);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const slotsLeft = MAX_IMAGES - images.length;
    if (slotsLeft <= 0) {
      setError(`Max ${MAX_IMAGES} bilder`);
      return;
    }

    const toProcess = Array.from(files).slice(0, slotsLeft);
    setCompressing(true);

    try {
      const compressed: ImageFile[] = [];
      for (const file of toProcess) {
        if (!file.type.startsWith('image/')) continue;

        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/jpeg',
        });

        compressed.push({
          file: compressedFile,
          preview: URL.createObjectURL(compressedFile),
          ordning: 0,
        });
      }

      setImages((prev) =>
        [...prev, ...compressed].map((img, i) => ({ ...img, ordning: i }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte bearbeta bilden');
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(images[index].preview);
    setImages((prev) =>
      prev.filter((_, i) => i !== index).map((img, i) => ({ ...img, ordning: i }))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length < MIN_IMAGES) return;
    onNext(images);
  };

  const canContinue = images.length >= MIN_IMAGES;
  const canAddMore = images.length < MAX_IMAGES;

  const handleSkip = () => {
    onNext([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-slate-500 mb-2">
          Ladda upp {MIN_IMAGES}–{MAX_IMAGES} bilder av bilen — utsida, insida och eventuella skador.
        </p>
        <div className="flex items-center justify-between text-sm">
          <span
            className={`font-semibold ${
              canContinue ? 'text-[#0e6efe]' : 'text-slate-400'
            }`}
          >
            {images.length} av minst {MIN_IMAGES}
          </span>
          <span className="text-slate-400">Max {MAX_IMAGES}</span>
        </div>
      </div>

      {/* Thumbnails grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group"
            >
              <img
                src={img.preview}
                alt={`Bild ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {i === 0 && (
                <span className="absolute top-2 left-2 text-[10px] font-bold bg-[#0e6efe] text-white px-2 py-0.5 rounded">
                  HUVUDBILD
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-2 right-2 w-7 h-7 bg-white/95 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition"
                aria-label="Ta bort"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons */}
      {canAddMore && (
        <div className="grid grid-cols-2 gap-3">
          <input
            ref={cameraInputRef}
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
            ref={galleryInputRef}
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
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#0e6efe] hover:bg-[#0e6efe]/5 transition disabled:opacity-50 group"
          >
            {compressing ? (
              <Loader2 className="w-6 h-6 text-[#0e6efe] animate-spin" />
            ) : (
              <Camera className="w-6 h-6 text-slate-500 group-hover:text-[#0e6efe] transition" />
            )}
            <span className="text-sm font-medium text-slate-700 group-hover:text-[#0e6efe]">Ta foto</span>
          </button>

          <button
            type="button"
            disabled={compressing}
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#0e6efe] hover:bg-[#0e6efe]/5 transition disabled:opacity-50 group"
          >
            {compressing ? (
              <Loader2 className="w-6 h-6 text-[#0e6efe] animate-spin" />
            ) : (
              <ImagePlus className="w-6 h-6 text-slate-500 group-hover:text-[#0e6efe] transition" />
            )}
            <span className="text-sm font-medium text-slate-700 group-hover:text-[#0e6efe]">Välj från bibliotek</span>
          </button>
        </div>
      )}

      {compressing && (
        <p className="text-sm text-slate-500 text-center">Komprimerar bilder...</p>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-[#0e6efe] text-white text-[14px] font-medium shadow-sm">
          <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-[1px]" strokeWidth={2.5} />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!canContinue || compressing}
        className="w-full h-12 bg-[#0e6efe] hover:bg-[#0b5cd8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-[15px] rounded-full transition shadow-sm"
      >
        {canContinue
          ? 'Nästa'
          : `Lägg till ${MIN_IMAGES - images.length} bild${
              MIN_IMAGES - images.length === 1 ? '' : 'er'
            } till`}
      </button>

      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[12px] uppercase tracking-[0.14em] text-slate-400 font-medium">
            Eller
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSkip}
        disabled={compressing}
        className="w-full h-12 bg-white border border-slate-200 hover:border-[#0e6efe] hover:bg-[#0e6efe]/5 disabled:opacity-50 text-slate-800 hover:text-[#0e6efe] font-semibold text-[14.5px] rounded-full transition flex items-center justify-center gap-2"
      >
        <PhoneCall className="w-4 h-4" strokeWidth={2.2} />
        Hoppa över — vi tar det med er direkt
      </button>
      <p className="text-center text-[12.5px] text-slate-500 leading-relaxed -mt-2">
        Har du inga bilder just nu? Vi ringer upp dig och hjälper dig vidare.
      </p>
    </form>
  );
}
