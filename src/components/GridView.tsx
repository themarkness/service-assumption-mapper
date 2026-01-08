import React from 'react';
import { useStore } from '../store/useStore';
import { addCalculations } from '../utils/calculations';
import { AssumptionCard } from './AssumptionCard';
import type { AssumptionWithCalculations } from '../types';

export const GridView: React.FC = () => {
  const { assumptions, currentProjectId } = useStore();

  const projectAssumptions = assumptions
    .filter((a) => a.projectId === currentProjectId)
    .map(addCalculations)
    .filter((a) => a.scores.length > 0); // Only show scored assumptions

  // Calculate position for each assumption
  const getPosition = (assumption: AssumptionWithCalculations) => {
    if (assumption.manualPosition) {
      return assumption.manualPosition;
    }

    // X-axis: Risk (0-100 scale based on risk score)
    // Risk score ranges from 0 (low risk) to 100 (high risk)
    // Higher risk score = further right
    const x = (assumption.riskScore / 100) * 100;

    // Y-axis: Perceived Value/Impact (based on importance)
    // Higher importance = higher up (so we invert it)
    const y = ((10 - assumption.averageImportance) / 10) * 100;

    return { x, y };
  };

  return (
    <div className="p-6 h-full">
      <div className="bg-white rounded shadow-md p-6 h-[calc(100vh-200px)]">
        <div className="relative w-full h-full" style={{ paddingLeft: '50px', paddingBottom: '30px' }}>
          {/* Grid container */}
          <div className="absolute grid grid-cols-2 grid-rows-2 gap-1" style={{ left: '50px', right: '0', top: '0', bottom: '30px' }}>
            {/* Top-left: Ship & Measure (High value + Low risk) */}
            <div className="bg-quadrant-validate border-2 border-blue-300 rounded-tl p-4">
              <h3 className="font-bold text-sm mb-2">Ship & Measure</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                High confidence about these hypotheses. Combined with strong belief they will deliver customer and business value, we build, launch and measure them.
              </p>
            </div>

            {/* Top-right: Test (High value + High risk) */}
            <div className="bg-quadrant-priority border-2 border-orange-300 rounded-tr p-4">
              <h3 className="font-bold text-sm mb-2">Test</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Promise of big return but also significant risks. Focus your experimentation, learning and discovery activities here.
              </p>
            </div>

            {/* Bottom-left: Don't test. Usually Don't Build (Low value + Low risk) */}
            <div className="bg-quadrant-defer border-2 border-gray-300 rounded-bl p-4">
              <h3 className="font-bold text-sm mb-2">Don't Test. Usually Don't Build</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Don't add significant value but are low risk. Sometimes table stakes for business operation, but won't differentiate you.
              </p>
            </div>

            {/* Bottom-right: Discard (Low value + High risk) */}
            <div className="bg-quadrant-document border-2 border-red-300 rounded-br p-4">
              <h3 className="font-bold text-sm mb-2">Discard</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Provide little value and pose high risk to your business or product. Don't spend any more time on them.
              </p>
            </div>
          </div>

          {/* Axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs font-medium text-gray-600 pb-1 px-12">
            <span>Low risk</span>
            <span>← Risk →</span>
            <span>High risk</span>
          </div>

          <div className="absolute top-0 bottom-0 left-0 flex items-center" style={{ width: '40px' }}>
            <div className="flex flex-col justify-between h-full py-12 w-full">
              <span className="text-xs font-medium text-gray-600 transform -rotate-90 whitespace-nowrap" style={{ transformOrigin: 'center', margin: 'auto' }}>
                High perceived value
              </span>
              <span className="text-xs font-medium text-gray-600 transform -rotate-90 whitespace-nowrap" style={{ transformOrigin: 'center', margin: 'auto' }}>
                ↑ Perceived value ↓
              </span>
              <span className="text-xs font-medium text-gray-600 transform -rotate-90 whitespace-nowrap" style={{ transformOrigin: 'center', margin: 'auto' }}>
                Low perceived value
              </span>
            </div>
          </div>

          {/* Assumption cards positioned on grid */}
          <div className="absolute pointer-events-none" style={{ left: '50px', right: '0', top: '0', bottom: '30px' }}>
            {projectAssumptions.map((assumption) => {
              const pos = getPosition(assumption);
              return (
                <div
                  key={assumption.id}
                  className="absolute w-64 pointer-events-auto"
                  style={{
                    left: `${Math.max(5, Math.min(pos.x, 85))}%`,
                    top: `${Math.max(5, Math.min(pos.y, 85))}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <AssumptionCard assumption={assumption} />
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {projectAssumptions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">No scored assumptions yet</p>
                <p className="text-sm mt-2">
                  Add scores to assumptions to see them positioned on the grid
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
