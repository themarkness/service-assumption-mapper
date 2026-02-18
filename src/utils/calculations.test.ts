import { describe, it, expect } from 'vitest';
import {
  calculateAverageImportance,
  calculateAverageConfidence,
  calculateRiskScore,
  addCalculations,
  getRiskScoreColor,
  getRiskScoreLabel,
} from './calculations';
import type { Assumption, Score } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeScore(overrides: Partial<Score> = {}): Score {
  return {
    person: 'Alice',
    importance: 5,
    confidence: 5,
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeAssumption(overrides: Partial<Assumption> = {}): Assumption {
  return {
    id: 'a1',
    projectId: 'p1',
    text: 'Users will adopt the service',
    category: 'users',
    scores: [],
    createdBy: 'Alice',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// calculateAverageImportance
// ---------------------------------------------------------------------------

describe('calculateAverageImportance', () => {
  it('returns 0 when scores array is empty', () => {
    expect(calculateAverageImportance([])).toBe(0);
  });

  it('returns the score value for a single score', () => {
    const scores = [makeScore({ importance: 7 })];
    expect(calculateAverageImportance(scores)).toBe(7);
  });

  it('averages multiple scores correctly', () => {
    const scores = [
      makeScore({ importance: 4 }),
      makeScore({ importance: 6 }),
      makeScore({ importance: 8 }),
    ];
    expect(calculateAverageImportance(scores)).toBeCloseTo(6);
  });

  it('handles all minimum scores (1)', () => {
    const scores = [makeScore({ importance: 1 }), makeScore({ importance: 1 })];
    expect(calculateAverageImportance(scores)).toBe(1);
  });

  it('handles all maximum scores (10)', () => {
    const scores = [makeScore({ importance: 10 }), makeScore({ importance: 10 })];
    expect(calculateAverageImportance(scores)).toBe(10);
  });

  it('handles fractional averages', () => {
    const scores = [makeScore({ importance: 1 }), makeScore({ importance: 2 })];
    expect(calculateAverageImportance(scores)).toBeCloseTo(1.5);
  });
});

// ---------------------------------------------------------------------------
// calculateAverageConfidence
// ---------------------------------------------------------------------------

describe('calculateAverageConfidence', () => {
  it('returns 0 when scores array is empty', () => {
    expect(calculateAverageConfidence([])).toBe(0);
  });

  it('returns the score value for a single score', () => {
    const scores = [makeScore({ confidence: 3 })];
    expect(calculateAverageConfidence(scores)).toBe(3);
  });

  it('averages multiple scores correctly', () => {
    const scores = [
      makeScore({ confidence: 2 }),
      makeScore({ confidence: 4 }),
      makeScore({ confidence: 9 }),
    ];
    expect(calculateAverageConfidence(scores)).toBeCloseTo(5);
  });

  it('handles fractional averages', () => {
    const scores = [makeScore({ confidence: 3 }), makeScore({ confidence: 4 })];
    expect(calculateAverageConfidence(scores)).toBeCloseTo(3.5);
  });
});

// ---------------------------------------------------------------------------
// calculateRiskScore
// ---------------------------------------------------------------------------

describe('calculateRiskScore', () => {
  it('applies the formula: importance × (10 - confidence)', () => {
    expect(calculateRiskScore(5, 5)).toBe(25); // 5 × (10-5)
    expect(calculateRiskScore(10, 0)).toBe(100); // 10 × (10-0) — maximum risk
    expect(calculateRiskScore(10, 10)).toBe(0); // 10 × (10-10) — fully confident
    expect(calculateRiskScore(0, 5)).toBe(0); // 0 × anything
  });

  it('returns 0 for zero importance regardless of confidence', () => {
    expect(calculateRiskScore(0, 0)).toBe(0);
    expect(calculateRiskScore(0, 10)).toBe(0);
  });

  it('returns 0 when confidence is at maximum (10)', () => {
    expect(calculateRiskScore(10, 10)).toBe(0);
    expect(calculateRiskScore(5, 10)).toBe(0);
  });

  it('returns maximum score (100) for highest importance and lowest confidence', () => {
    expect(calculateRiskScore(10, 0)).toBe(100);
  });

  it('handles fractional inputs', () => {
    // importance=5, confidence=5 → 5 × 5 = 25
    expect(calculateRiskScore(5.5, 5.5)).toBeCloseTo(24.75);
  });
});

// ---------------------------------------------------------------------------
// addCalculations
// ---------------------------------------------------------------------------

describe('addCalculations', () => {
  it('attaches correct averages and risk score to an assumption with no scores', () => {
    const assumption = makeAssumption({ scores: [] });
    const result = addCalculations(assumption);

    expect(result.averageImportance).toBe(0);
    expect(result.averageConfidence).toBe(0);
    expect(result.riskScore).toBe(0);
  });

  it('preserves all original assumption fields', () => {
    const assumption = makeAssumption({ text: 'Custom text', category: 'technology' });
    const result = addCalculations(assumption);

    expect(result.text).toBe('Custom text');
    expect(result.category).toBe('technology');
    expect(result.id).toBe(assumption.id);
  });

  it('computes correct calculations for a single score', () => {
    const assumption = makeAssumption({
      scores: [makeScore({ importance: 8, confidence: 3 })],
    });
    const result = addCalculations(assumption);

    expect(result.averageImportance).toBe(8);
    expect(result.averageConfidence).toBe(3);
    expect(result.riskScore).toBeCloseTo(8 * (10 - 3)); // 56
  });

  it('computes correct calculations for multiple scores', () => {
    const assumption = makeAssumption({
      scores: [
        makeScore({ importance: 6, confidence: 4 }),
        makeScore({ importance: 8, confidence: 6 }),
      ],
    });
    const result = addCalculations(assumption);

    expect(result.averageImportance).toBeCloseTo(7);
    expect(result.averageConfidence).toBeCloseTo(5);
    expect(result.riskScore).toBeCloseTo(7 * (10 - 5)); // 35
  });
});

// ---------------------------------------------------------------------------
// getRiskScoreColor
// ---------------------------------------------------------------------------

describe('getRiskScoreColor', () => {
  it('returns low risk color for scores 0–30', () => {
    expect(getRiskScoreColor(0)).toBe('bg-risk-low');
    expect(getRiskScoreColor(15)).toBe('bg-risk-low');
    expect(getRiskScoreColor(30)).toBe('bg-risk-low');
  });

  it('returns medium risk color for scores 31–60', () => {
    expect(getRiskScoreColor(31)).toBe('bg-risk-medium');
    expect(getRiskScoreColor(45)).toBe('bg-risk-medium');
    expect(getRiskScoreColor(60)).toBe('bg-risk-medium');
  });

  it('returns high risk color for scores above 60', () => {
    expect(getRiskScoreColor(61)).toBe('bg-risk-high');
    expect(getRiskScoreColor(80)).toBe('bg-risk-high');
    expect(getRiskScoreColor(100)).toBe('bg-risk-high');
  });
});

// ---------------------------------------------------------------------------
// getRiskScoreLabel
// ---------------------------------------------------------------------------

describe('getRiskScoreLabel', () => {
  it('returns "Low Risk" for scores 0–30', () => {
    expect(getRiskScoreLabel(0)).toBe('Low Risk');
    expect(getRiskScoreLabel(30)).toBe('Low Risk');
  });

  it('returns "Medium Risk" for scores 31–60', () => {
    expect(getRiskScoreLabel(31)).toBe('Medium Risk');
    expect(getRiskScoreLabel(60)).toBe('Medium Risk');
  });

  it('returns "High Risk" for scores above 60', () => {
    expect(getRiskScoreLabel(61)).toBe('High Risk');
    expect(getRiskScoreLabel(100)).toBe('High Risk');
  });

  it('has consistent boundary behaviour with getRiskScoreColor', () => {
    // Boundaries should match between color and label functions
    [0, 15, 30, 31, 45, 60, 61, 80, 100].forEach((score) => {
      const label = getRiskScoreLabel(score);
      const color = getRiskScoreColor(score);
      if (label === 'Low Risk') expect(color).toBe('bg-risk-low');
      if (label === 'Medium Risk') expect(color).toBe('bg-risk-medium');
      if (label === 'High Risk') expect(color).toBe('bg-risk-high');
    });
  });
});
