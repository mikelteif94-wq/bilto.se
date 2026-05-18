import { useState, useRef, useEffect, type ReactNode, createContext, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  displayValue: string;
  setDisplayValue: (v: string) => void;
}

const SelectContext = createContext<SelectContextType>({
  open: false,
  setOpen: () => {},
  displayValue: '',
  setDisplayValue: () => {},
});

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [open]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, displayValue, setDisplayValue }}>
      <div ref={containerRef} className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps {
  className?: string;
  children: ReactNode;
}

export function SelectTrigger({ className, children }: SelectTriggerProps) {
  const { open, setOpen } = useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        'flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0047B3]/50 transition-colors',
        className
      )}
    >
      {children}
      <ChevronDown className={cn('ml-2 h-4 w-4 text-slate-500 transition-transform', open && 'rotate-180')} />
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  const { displayValue } = useContext(SelectContext);
  return <span className={cn(!displayValue && 'opacity-60')}>{displayValue || placeholder}</span>;
}

interface SelectContentProps {
  children: ReactNode;
}

export function SelectContent({ children }: SelectContentProps) {
  const { open } = useContext(SelectContext);
  if (!open) return null;

  return (
    <div className="absolute z-50 mt-1 w-full min-w-[160px] max-h-60 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
      {children}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen, setDisplayValue } = useContext(SelectContext);
  const isSelected = selectedValue === value;

  useEffect(() => {
    if (isSelected && typeof children === 'string') {
      setDisplayValue(children);
    }
  }, [isSelected, children, setDisplayValue]);

  const handleSelect = () => {
    onValueChange?.(value);
    if (typeof children === 'string') {
      setDisplayValue(children);
    }
    setOpen(false);
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={cn(
        'w-full px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50',
        isSelected && 'bg-slate-50 font-medium text-[#0047B3]'
      )}
    >
      {children}
    </button>
  );
}
