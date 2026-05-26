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
  // Defer rendering children until slide-up animation completes to avoid reflow jank
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setContentReady(false);
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
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            ref={contentRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.32 }}
            onAnimationComplete={(def) => {
              if (def === 'animate') setContentReady(true);
            }}
            className={cn(
              'relative w-full sm:max-w-[460px] max-h-[92vh] bg-white rounded-t-2xl sm:rounded-b-none flex flex-col shadow-2xl',
              className
            )}
          >
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
              {contentReady ? children : (
                <div className="px-4 pt-4 space-y-4 animate-pulse">
                  <div className="w-full h-44 bg-slate-100 rounded-xl" />
                  <div className="h-6 bg-slate-100 rounded-lg w-2/3" />
                  <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                  <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
