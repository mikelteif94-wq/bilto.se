import CompareCarsPage from './CompareCarsPage';

interface SaljBilMedHjalpProps {
  onBackHome: () => void;
}

const EL_CTA_OPTIONS = [
  {
    label: 'Jag har hittat en el bil',
    sub: 'Låt oss förhandla och granska åt dig',
    track: 'found' as const,
  },
  {
    label: 'Jag letar efter en el bil',
    sub: 'Utforska, jämför eller testa bilmatch',
    track: 'searching' as const,
  },
  {
    label: 'Jag vill byta till en el bil',
    sub: 'Vi hittar och förhandlar nästa bil åt dig',
    track: 'trade' as const,
  },
];

export default function SaljBilMedHjalp({ onBackHome }: SaljBilMedHjalpProps) {
  return (
    <CompareCarsPage
      onBackHome={onBackHome}
      pageSlug="salj-bil-hjalp"
      heroTitle="Hitta din drömelbil och förhandla priset"
      heroSubtitle="Jämför elbilar, hitta rätt modell och låt oss förhandla fram bästa priset åt dig. Helt gratis och opartiskt."
      defaultCategory="el"
      ctaOptions={EL_CTA_OPTIONS}
    />
  );
}
