import React from 'react';
import type { AssumptionWithCalculations } from '../types';
import { CATEGORY_COLORS } from '../types';
import { getRiskScoreColor, getRiskScoreLabel } from '../utils/calculations';

interface GridCardProps {
  assumption: AssumptionWithCalculations;
  isDragging?: boolean;
  onClick?: () => void;
  dynamicScore?: number;
}

export const GridCard: React.FC<GridCardProps> = ({
  assumption,
  isDragging = false,
  onClick,
  dynamicScore,
}) => {
  const categoryColor = CATEGORY_COLORS[assumption.category];
  const displayScore = dynamicScore !== undefined ? dynamicScore : assumption.riskScore;
  const riskScoreColor = getRiskScoreColor(displayScore);
  const riskScoreLabel = getRiskScoreLabel(displayScore);

  return (
    <div
      className={`bg-white rounded shadow-md p-2 cursor-pointer transition-all hover:shadow-lg relative ${
        isDragging ? 'opacity-50 scale-105' : ''
      }`}
      onClick={onClick}
      style={{
        width: '120px',
        height: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Category color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Assumption text */}
      <div className="flex-1 flex items-center justify-center px-2 ml-1">
        <p className="text-xs font-medium text-gds-black text-center line-clamp-4">
          {assumption.text}
        </p>
      </div>

      {/* Risk score badge */}
      {assumption.scores.length > 0 && (
        <div className="flex justify-center">
          <div
            className={`px-2 py-0.5 rounded text-xs font-bold ${riskScoreColor}`}
            title={`${riskScoreLabel}: ${displayScore.toFixed(0)}`}
          >
            {displayScore.toFixed(0)}
          </div>
        </div>
      )}
    </div>
  );
};
