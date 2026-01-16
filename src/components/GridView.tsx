import React, { useState, useRef } from 'react';
import { DndContext, DragOverlay, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { addCalculations, calculateRiskScore } from '../utils/calculations';
import { GridCard } from './GridCard';
import type { AssumptionWithCalculations } from '../types';

interface DraggableCardProps {
  assumption: AssumptionWithCalculations;
  position: { x: number; y: number };
  dynamicScore?: number;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ assumption, position, dynamicScore }) => {
  const { openAssumptionModal } = useStore();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: assumption.id,
    data: { assumption },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="absolute"
      style={{
        left: `${Math.max(5, Math.min(position.x, 85))}%`,
        top: `${Math.max(5, Math.min(position.y, 85))}%`,
        transform: 'translate(-50%, -50%)',
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <GridCard
        assumption={assumption}
        isDragging={isDragging}
        onClick={() => !isDragging && openAssumptionModal(assumption)}
        dynamicScore={dynamicScore}
      />
    </div>
  );
};

export const GridView: React.FC = () => {
  const { assumptions, currentProjectId, addScore } = useStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const projectAssumptions = assumptions
    .filter((a) => a.projectId === currentProjectId)
    .map(addCalculations)
    .filter((a) => a.scores.length > 0); // Only show scored assumptions

  // Calculate position for each assumption
  const getPosition = (assumption: AssumptionWithCalculations) => {
    if (assumption.manualPosition) {
      return assumption.manualPosition;
    }

    // X-axis: Confidence (1-10 scale)
    // Higher confidence = further right
    const x = (assumption.averageConfidence / 10) * 100;

    // Y-axis: Importance (1-10 scale)
    // Higher importance = higher up (so we invert it)
    const y = ((10 - assumption.averageImportance) / 10) * 100;

    return { x, y };
  };

  // Convert pixel position to grid percentage
  const pixelToGridPercent = (pixelX: number, pixelY: number) => {
    if (!gridRef.current) return { x: 50, y: 50 };

    const rect = gridRef.current.getBoundingClientRect();
    const x = ((pixelX - rect.left) / rect.width) * 100;
    const y = ((pixelY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(0, Math.min(x, 100)),
      y: Math.max(0, Math.min(y, 100)),
    };
  };

  // Convert grid position to importance and confidence scores
  const positionToScores = (x: number, y: number) => {
    // X-axis: Confidence (0-100% -> 1-10 scale)
    const confidence = Math.round((x / 100) * 9 + 1);

    // Y-axis: Importance (0-100% -> 10-1 scale, inverted)
    const importance = Math.round(((100 - y) / 100) * 9 + 1);

    return {
      importance: Math.max(1, Math.min(10, importance)),
      confidence: Math.max(1, Math.min(10, confidence)),
    };
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragMove = (event: any) => {
    if (!event.delta) return;

    const activeAssumption = projectAssumptions.find((a) => a.id === activeId);
    if (!activeAssumption) return;

    const gridPercent = pixelToGridPercent(
      event.activatorEvent.clientX + event.delta.x,
      event.activatorEvent.clientY + event.delta.y
    );

    setDragPosition(gridPercent);
  };

  const handleDragEnd = () => {
    const activeAssumption = projectAssumptions.find((a) => a.id === activeId);

    if (activeAssumption && dragPosition) {
      const scores = positionToScores(dragPosition.x, dragPosition.y);

      // Update the user's score with the new position-based values
      addScore(activeAssumption.id, {
        importance: scores.importance,
        confidence: scores.confidence,
        notes: `Updated via drag to: Importance ${scores.importance}, Confidence ${scores.confidence}`,
      });
    }

    setActiveId(null);
    setDragPosition(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDragPosition(null);
  };

  // Get dynamic score for the currently dragged card
  const getDynamicScore = (assumptionId: string) => {
    if (assumptionId !== activeId || !dragPosition) return undefined;

    const scores = positionToScores(dragPosition.x, dragPosition.y);
    return calculateRiskScore(scores.importance, scores.confidence);
  };

  const activeAssumption = projectAssumptions.find((a) => a.id === activeId);

  return (
    <div className="p-6 h-full">
      <div className="bg-white rounded shadow-md p-6 h-[calc(100vh-200px)]">
        <div className="relative w-full h-full" style={{ paddingLeft: '50px', paddingBottom: '30px' }}>
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {/* Grid container */}
            <div className="absolute grid grid-cols-2 grid-rows-2 gap-1" style={{ left: '50px', right: '0', top: '0', bottom: '30px' }}>
              {/* Top-left: Validate (Low confidence + Important) */}
              <div className="bg-quadrant-validate border-2 border-blue-300 rounded-tl p-4">
                <h3 className="font-bold text-sm mb-2">Validate</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  These assumptions have promise of a big return but pose risk. Focus our testing and learning here.
                </p>
              </div>

              {/* Top-right: Build it (High confidence + Important) */}
              <div className="bg-quadrant-priority border-2 border-orange-300 rounded-tr p-4">
                <h3 className="font-bold text-sm mb-2">Build it</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We have high confidence that these will deliver customer value. Don't spend discovery cycles here.
                </p>
              </div>

              {/* Bottom-left: Discard (Low confidence + Unimportant) */}
              <div className="bg-quadrant-defer border-2 border-gray-300 rounded-bl p-4">
                <h3 className="font-bold text-sm mb-2">Discard</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We don't have much confidence around this, but at the same time it's not important. Don't waste time here.
                </p>
              </div>

              {/* Bottom-right: Don't test. Usually don't build (High confidence + Unimportant) */}
              <div className="bg-quadrant-document border-2 border-gray-400 rounded-br p-4">
                <h3 className="font-bold text-sm mb-2">Don't test. Usually don't build</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Not impactful to users, but sometimes table stakes business functionality ends up here.
                </p>
              </div>
            </div>

            {/* Axis labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs font-medium text-gray-600 pb-1 px-12">
              <span>Low confidence</span>
              <span>← Confidence →</span>
              <span>High confidence</span>
            </div>

            <div className="absolute top-0 bottom-0 left-0 flex items-center" style={{ width: '40px' }}>
              <div className="flex flex-col justify-between h-full py-12 w-full">
                <span className="text-xs font-medium text-gray-600 transform -rotate-90 whitespace-nowrap" style={{ transformOrigin: 'center', margin: 'auto' }}>
                  Important
                </span>
                <span className="text-xs font-medium text-gray-600 transform -rotate-90 whitespace-nowrap" style={{ transformOrigin: 'center', margin: 'auto' }}>
                  ↑ Importance ↓
                </span>
                <span className="text-xs font-medium text-gray-600 transform -rotate-90 whitespace-nowrap" style={{ transformOrigin: 'center', margin: 'auto' }}>
                  Unimportant
                </span>
              </div>
            </div>

            {/* Assumption cards positioned on grid */}
            <div ref={gridRef} className="absolute pointer-events-none" style={{ left: '50px', right: '0', top: '0', bottom: '30px' }}>
              <div className="relative w-full h-full pointer-events-auto">
                {projectAssumptions.map((assumption) => {
                  const pos = getPosition(assumption);
                  return (
                    <DraggableCard
                      key={assumption.id}
                      assumption={assumption}
                      position={pos}
                      dynamicScore={getDynamicScore(assumption.id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeAssumption && dragPosition && (
                <GridCard
                  assumption={activeAssumption}
                  isDragging={true}
                  dynamicScore={getDynamicScore(activeAssumption.id)}
                />
              )}
            </DragOverlay>

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
          </DndContext>
        </div>
      </div>
    </div>
  );
};
