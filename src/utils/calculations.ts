import type { Assumption, AssumptionWithCalculations } from '../types';

export function calculateAverageImportance(scores: Assumption['scores']): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score.importance, 0);
  return sum / scores.length;
}

export function calculateAverageConfidence(scores: Assumption['scores']): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score.confidence, 0);
  return sum / scores.length;
}

export function calculateRiskScore(
  averageImportance: number,
  averageConfidence: number
): number {
  return averageImportance * (10 - averageConfidence);
}

export function addCalculations(assumption: Assumption): AssumptionWithCalculations {
  const averageImportance = calculateAverageImportance(assumption.scores);
  const averageConfidence = calculateAverageConfidence(assumption.scores);
  const riskScore = calculateRiskScore(averageImportance, averageConfidence);

  return {
    ...assumption,
    averageImportance,
    averageConfidence,
    riskScore,
  };
}

export function getRiskScoreColor(riskScore: number): string {
  if (riskScore <= 30) return 'bg-risk-low';
  if (riskScore <= 60) return 'bg-risk-medium';
  return 'bg-risk-high';
}

export function getRiskScoreLabel(riskScore: number): string {
  if (riskScore <= 30) return 'Low Risk';
  if (riskScore <= 60) return 'Medium Risk';
  return 'High Risk';
}
