import type { QuizAnswers } from './QuizTypes';

export type Persona = 'first_time_buyer' | 'family' | 'researcher' | 'enthusiast' | 'pragmatist';

export interface PersonaProfile {
  type: Persona;
  label: string;
  confidence: number; // 0–100
}

export function inferPersona(answers: QuizAnswers): PersonaProfile {
  const scores: Record<Persona, number> = {
    first_time_buyer: 0,
    family: 0,
    researcher: 0,
    enthusiast: 0,
    pragmatist: 0,
  };

  // Safety priority → first_time_buyer or family
  if (answers.priorities?.includes('safety')) {
    scores.first_time_buyer += 20;
    scores.family += 15;
  }

  // Family daily use → family
  if (answers.daily_use === 'family') {
    scores.family += 35;
  }

  // Large cargo → family
  if (answers.daily_use === 'cargo') {
    scores.family += 15;
    scores.pragmatist += 10;
  }

  // Economy priority → pragmatist
  if (answers.priorities?.includes('economy')) {
    scores.pragmatist += 20;
  }

  // Value brand → pragmatist
  if (answers.brand_preference === 'value') {
    scores.pragmatist += 20;
  }

  // Performance priority → enthusiast
  if (answers.priorities?.includes('performance')) {
    scores.enthusiast += 30;
  }

  // Premium brand → enthusiast
  if (answers.brand_preference === 'premium') {
    scores.enthusiast += 20;
  }

  // Tech priority → researcher or enthusiast
  if (answers.priorities?.includes('tech')) {
    scores.researcher += 15;
    scores.enthusiast += 10;
  }

  // Resale priority → researcher
  if (answers.priorities?.includes('resale')) {
    scores.researcher += 25;
  }

  // Reliability → pragmatist or researcher
  if (answers.priorities?.includes('reliability')) {
    scores.pragmatist += 15;
    scores.researcher += 10;
  }

  // High annual mileage → pragmatist or researcher
  if (answers.annual_mileage === 'high') {
    scores.pragmatist += 10;
    scores.researcher += 10;
  }

  // Sporadic use → first_time_buyer
  if (answers.daily_use === 'sporadic') {
    scores.first_time_buyer += 20;
  }

  // Low mileage + solo → first_time_buyer
  if (answers.daily_use === 'solo' && answers.annual_mileage === 'low') {
    scores.first_time_buyer += 15;
  }

  // Ownership long → researcher
  if (answers.ownership === 'long') {
    scores.researcher += 15;
    scores.pragmatist += 10;
  }

  const top = (Object.entries(scores) as [Persona, number][])
    .sort((a, b) => b[1] - a[1]);

  const [topPersona, topScore] = top[0];
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const confidence = Math.round((topScore / total) * 100);

  const labels: Record<Persona, string> = {
    first_time_buyer: 'Förstagångsköpare',
    family: 'Familjeköpare',
    researcher: 'Research-person',
    enthusiast: 'Bilentusiast',
    pragmatist: 'Pragmatiker',
  };

  return { type: topPersona, confidence, label: labels[topPersona] };
}
