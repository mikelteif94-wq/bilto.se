import { useState } from 'react';
import ConsultationDrawer from './ConsultationDrawer';
import type { Forhandlare } from '../../data/forhandlare';

interface ForhandlaShellProps {
  children: (props: {
    onNavigate: (path: string) => void;
    onOpenConsultation: (forhandlare?: Forhandlare) => void;
    activePath: string;
  }) => React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
}

// Wraps Förhandla pages and owns the consultation drawer state.
export default function ForhandlaShell({
  children,
  activePath,
  onNavigate,
}: ForhandlaShellProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Forhandlare | null>(null);

  const openConsultation = (forhandlare?: Forhandlare) => {
    setSelected(forhandlare ?? null);
    setOpen(true);
  };

  return (
    <>
      {children({
        onNavigate,
        onOpenConsultation: openConsultation,
        activePath,
      })}
      <ConsultationDrawer open={open} onClose={() => setOpen(false)} defaultForhandlare={selected} />
    </>
  );
}
