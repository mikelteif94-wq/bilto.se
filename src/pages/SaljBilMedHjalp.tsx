import CompareCarsPage from './CompareCarsPage';

interface SaljBilMedHjalpProps {
  onBackHome: () => void;
}

export default function SaljBilMedHjalp({ onBackHome }: SaljBilMedHjalpProps) {
  return <CompareCarsPage onBackHome={onBackHome} pageSlug="salj-bil-hjalp" />;
}
