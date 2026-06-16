import { useState } from 'react';
import { CarData } from '../../pages/SellCarPage';
import FieldError from './FieldError';

interface CarDetailsFormProps {
  initialData: CarData;
  onNext: (data: CarData) => void;
}

export default function CarDetailsForm({ initialData, onNext }: CarDetailsFormProps) {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.regnummer.trim()) newErrors.regnummer = 'Registreringsnummer är obligatoriskt';
    if (!data.marke.trim()) newErrors.marke = 'Märke är obligatoriskt';
    if (!data.modell.trim()) newErrors.modell = 'Modell är obligatorisk';
    if (data.ar < 1900 || data.ar > new Date().getFullYear()) {
      newErrors.ar = 'Årgång är ogiltig';
    }
    if (data.miltal < 0) newErrors.miltal = 'Miltal kan inte vara negativt';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Registreringsnummer
        </label>
        <input
          type="text"
          value={data.regnummer}
          onChange={(e) => setData({ ...data, regnummer: e.target.value })}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            errors.regnummer ? 'border-red-300' : 'border-slate-300'
          }`}
          placeholder="ABC 123"
          maxLength="10"
        />
        <FieldError message={errors.regnummer} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Märke
          </label>
          <input
            type="text"
            value={data.marke}
            onChange={(e) => setData({ ...data, marke: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              errors.marke ? 'border-red-300' : 'border-slate-300'
            }`}
            placeholder="Volvo"
          />
          <FieldError message={errors.marke} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Modell
          </label>
          <input
            type="text"
            value={data.modell}
            onChange={(e) => setData({ ...data, modell: e.target.value })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              errors.modell ? 'border-red-300' : 'border-slate-300'
            }`}
            placeholder="XC90"
          />
          <FieldError message={errors.modell} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Årgång
          </label>
          <input
            type="number"
            value={data.ar}
            onChange={(e) => setData({ ...data, ar: parseInt(e.target.value) })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              errors.ar ? 'border-red-300' : 'border-slate-300'
            }`}
            min="1900"
            max={new Date().getFullYear()}
          />
          <FieldError message={errors.ar} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-900 mb-2">
            Miltal
          </label>
          <input
            type="number"
            value={data.miltal}
            onChange={(e) => setData({ ...data, miltal: parseInt(e.target.value) })}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 ${
              errors.miltal ? 'border-red-300' : 'border-slate-300'
            }`}
            min="0"
            placeholder="150000"
          />
          <FieldError message={errors.miltal} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">
          Skick
        </label>
        <select
          value={data.skick}
          onChange={(e) => setData({ ...data, skick: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="utmärkt">Utmärkt</option>
          <option value="mycket_bra">Mycket bra</option>
          <option value="bra">Bra</option>
          <option value="ok">OK</option>
          <option value="slitet">Slitet</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-amber-600 text-white font-semibold py-2 rounded-lg hover:bg-amber-700 transition mt-8"
      >
        Nästa
      </button>
    </form>
  );
}
