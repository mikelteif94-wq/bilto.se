import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, children, className }: SheetProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setContentReady(false);
    } else {
      const t = setTimeout(() => setContentReady(true), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            ref={contentRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.32 }}
            className={cn(
              'relative w-full sm:max-w-[460px] max-h-[92vh] bg-white rounded-t-2xl sm:rounded-b-none flex flex-col shadow-2xl',
              className
            )}
          >
            {/* Handle + close */}
            <div className="sticky top-0 z-10 flex items-center justify-center pt-3 pb-2 bg-white rounded-t-2xl">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {contentReady ? children : <SheetSkeleton />}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SheetSkeleton() {
  return (
    <div className="px-4 pt-2 pb-8 space-y-5">
      {/* Car image placeholder */}
      <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden flex items-center justify-center">
        <ShimmerOverlay />
        <svg viewBox="0 0 220 80" className="w-48 opacity-10" fill="none">
          <path d="M30 55 L30 45 Q30 38 38 36 L60 30 Q70 22 90 20 L140 20 Q160 20 170 30 L190 36 Q198 38 198 45 L198 55 Q198 60 193 60 L183 60 Q182 52 174 52 Q166 52 165 60 L75 60 Q74 52 66 52 Q58 52 57 60 L37 60 Q30 60 30 55 Z" fill="currentColor" className="text-slate-400" />
          <ellipse cx="66" cy="60" rx="8" ry="8" fill="currentColor" className="text-slate-300" />
          <ellipse cx="174" cy="60" rx="8" ry="8" fill="currentColor" className="text-slate-300" />
        </svg>
      </div>

      {/* Title + badge row */}
      <div className="space-y-2">
        <div className="relative h-6 w-44 rounded-lg bg-slate-100 overflow-hidden"><ShimmerOverlay /></div>
        <div className="relative h-4 w-28 rounded-lg bg-slate-100 overflow-hidden"><ShimmerOverlay /></div>
        <div className="flex gap-2 pt-1">
          <div className="relative h-6 w-16 rounded-full bg-slate-100 overflow-hidden"><ShimmerOverlay /></div>
          <div className="relative h-6 w-24 rounded-full bg-slate-100 overflow-hidden"><ShimmerOverlay /></div>
        </div>
      </div>

      {/* Price card */}
      <div className="relative rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 overflow-hidden">
        <ShimmerOverlay />
        <div className="h-3 w-32 rounded bg-slate-200" />
        <div className="h-7 w-48 rounded-lg bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100 mt-3" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
        <div className="h-4 w-4/6 rounded bg-slate-100" />
      </div>

      {/* CTA button */}
      <div className="relative h-14 rounded-2xl bg-slate-100 overflow-hidden"><ShimmerOverlay /></div>

      {/* Spec grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative h-16 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
            <ShimmerOverlay />
          </div>
        ))}
      </div>

      {/* Ratings */}
      <div className="relative rounded-2xl bg-slate-50 p-4 space-y-3 overflow-hidden">
        <ShimmerOverlay />
        <div className="h-4 w-32 rounded bg-slate-200" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-slate-200" />
            <div className="w-20 h-3 rounded bg-slate-200" />
            <div className="flex-1 h-2 rounded-full bg-slate-200" />
            <div className="w-6 h-3 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  );
}
