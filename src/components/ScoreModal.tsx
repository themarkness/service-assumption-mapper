import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { calculateRiskScore } from '../utils/calculations';

export const ScoreModal: React.FC = () => {
  const { isScoreModalOpen, closeScoreModal, scoringAssumption, addScore, userName } =
    useStore();

  const [formData, setFormData] = useState({
    importance: 5,
    confidence: 5,
    notes: '',
  });

  const userScore = scoringAssumption?.scores.find((s) => s.person === userName);

  useEffect(() => {
    if (userScore) {
      setFormData({
        importance: userScore.importance,
        confidence: userScore.confidence,
        notes: userScore.notes || '',
      });
    } else {
      setFormData({
        importance: 5,
        confidence: 5,
        notes: '',
      });
    }
  }, [userScore, isScoreModalOpen]);

  if (!isScoreModalOpen || !scoringAssumption) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addScore(scoringAssumption.id, formData);
    closeScoreModal();
  };

  const riskScore = calculateRiskScore(formData.importance, 10 - formData.confidence);

  return (
    <div className="modal-overlay" onClick={closeScoreModal}>
      <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gds-black">Score Assumption</h2>

          <div className="bg-gds-light-grey p-4 rounded mb-6">
            <p className="text-sm font-medium text-gds-black">{scoringAssumption.text}</p>
          </div>

          {scoringAssumption.scores.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold mb-2">Current Scores:</h3>
              <div className="space-y-2">
                {scoringAssumption.scores.map((score) => (
                  <div
                    key={score.timestamp}
                    className="flex items-center gap-4 text-sm bg-white p-2 rounded border border-gds-grey"
                  >
                    <span className="font-medium">{score.person}:</span>
                    <span>Importance: {score.importance}</span>
                    <span>Confidence: {score.confidence}</span>
                    <span className="text-xs text-gray-500">
                      Risk: {calculateRiskScore(score.importance, 10 - score.confidence).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gds-black mb-2">
                  Impact if wrong - How much value/harm if this assumption is wrong? ({formData.importance}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.importance}
                  onChange={(e) =>
                    setFormData({ ...formData, importance: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-gds-light-grey rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Low impact (1)</span>
                  <span>High impact (10)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gds-black mb-2">
                  Confidence - How confident are we that this assumption is correct? ({formData.confidence}/10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.confidence}
                  onChange={(e) =>
                    setFormData({ ...formData, confidence: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-gds-light-grey rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Low confidence (1)</span>
                  <span>High confidence (10)</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gds-black mb-1"
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field min-h-[80px]"
                  placeholder="Add any additional notes..."
                />
              </div>

              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm font-medium">
                  Calculated Risk Score:{' '}
                  <span className="text-lg font-bold text-gds-blue">
                    {riskScore.toFixed(1)}
                  </span>
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Risk = Impact × (10 - Confidence)
                </p>
                <p className="text-xs text-gray-500 mt-1 italic">
                  Higher impact + lower confidence = higher risk to validate
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="submit" className="btn-primary flex-1">
                Save Score
              </button>
              <button type="button" onClick={closeScoreModal} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
