import React from 'react';
import type { AssumptionWithCalculations } from '../types';
import { CATEGORY_COLORS } from '../types';
import { getRiskScoreColor, getRiskScoreLabel } from '../utils/calculations';
import { useStore } from '../store/useStore';

interface AssumptionCardProps {
  assumption: AssumptionWithCalculations;
  isDragging?: boolean;
  /** Compact post-it style for grid view; click opens assumption */
  variant?: 'default' | 'grid';
  /** Called when grid card is clicked (e.g. open assumption modal). Not called after drag. */
  onCardClick?: (assumption: AssumptionWithCalculations) => void;
}

export const AssumptionCard: React.FC<AssumptionCardProps> = ({
  assumption,
  isDragging = false,
  variant = 'default',
  onCardClick,
}) => {
  const { openScoreModal, openAssumptionModal, deleteAssumption } = useStore();

  const categoryColor = CATEGORY_COLORS[assumption.category];
  const riskScoreColor = getRiskScoreColor(assumption.riskScore);
  const riskScoreLabel = getRiskScoreLabel(assumption.riskScore);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openAssumptionModal(assumption);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this assumption?')) {
      deleteAssumption(assumption.id);
    }
  };

  if (variant === 'grid') {
    return (
      <div
        className={`relative w-full aspect-square min-w-0 rounded-sm p-2.5 cursor-pointer transition-shadow hover:shadow-md ${
          isDragging ? 'opacity-70' : ''
        }`}
        style={{
          backgroundColor: '#fef9c3',
          boxShadow: '1px 1px 3px rgba(0,0,0,0.15), 2px 2px 6px rgba(0,0,0,0.08)',
        }}
        onClick={() => onCardClick?.(assumption)}
      >
        {/* Score in top-right circle */}
        {assumption.scores.length > 0 && (
          <div
            className={`absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow ${riskScoreColor}`}
            title={riskScoreLabel}
          >
            {assumption.riskScore.toFixed(0)}
          </div>
        )}
        <p className="text-xs text-gds-black line-clamp-5 leading-snug pt-0.5 pr-4">
          {assumption.text}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-white rounded shadow-md p-3 cursor-pointer transition-shadow hover:shadow-lg ${
        isDragging ? 'opacity-50' : ''
      }`}
      onClick={() => openScoreModal(assumption)}
    >
      {/* Category color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Header with risk score */}
      <div className="flex justify-between items-start mb-2 ml-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gds-black line-clamp-3">
            {assumption.text}
          </p>
        </div>
        {assumption.scores.length > 0 && (
          <div
            className={`ml-2 px-2 py-1 rounded text-xs font-bold ${riskScoreColor}`}
            title={riskScoreLabel}
          >
            {assumption.riskScore.toFixed(0)}
          </div>
        )}
      </div>

      {/* Score badges */}
      {assumption.scores.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2 ml-2">
          {assumption.scores.map((score) => (
            <span
              key={score.timestamp}
              className="inline-block px-2 py-0.5 bg-gds-light-grey text-xs rounded"
              title={`${score.person}: Importance ${score.importance}, Confidence ${score.confidence}`}
            >
              {score.person.split(' ')[0]}: I:{score.importance} C:{score.confidence}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-2 ml-2">
        <button
          onClick={handleEdit}
          className="text-xs text-gds-blue hover:underline"
          title="Edit assumption"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="text-xs text-red-600 hover:underline"
          title="Delete assumption"
        >
          Delete
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            openScoreModal(assumption);
          }}
          className="text-xs text-gds-blue hover:underline"
          title="Add or update score"
        >
          {assumption.scores.length > 0 ? 'Update Score' : 'Add Score'}
        </button>
      </div>

      {/* Average scores indicator */}
      {assumption.scores.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gds-light-grey ml-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Avg Importance: {assumption.averageImportance.toFixed(1)}</span>
            <span>Avg Confidence: {assumption.averageConfidence.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="mt-1 ml-2 text-xs text-gray-400">
        {assumption.createdBy && (
          <span>by {assumption.createdBy}</span>
        )}
        {assumption.updatedBy && assumption.updatedBy !== assumption.createdBy && (
          <span className="ml-1">· edited by {assumption.updatedBy}</span>
        )}
      </div>
    </div>
  );
};
