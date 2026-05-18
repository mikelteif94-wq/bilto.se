import { QuizAnswers } from './QuizTypes';
import QuizFlow from './QuizFlow';

interface QuizExperienceProps {
  onComplete: (answers: QuizAnswers) => void;
  onSkip: () => void;
  isAnalyzing?: boolean;
  analysisReady?: boolean;
}

export function QuizExperience({ onComplete, onSkip }: QuizExperienceProps) {
  return <QuizFlow onComplete={onComplete} onBack={onSkip} />;
}
