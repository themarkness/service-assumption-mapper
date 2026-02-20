import React, { useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Draggable, { type DraggableEvent, type DraggableData } from 'react-draggable';
import { useStore } from '../store/useStore';
import { addCalculations } from '../utils/calculations';
import { AssumptionCard } from './AssumptionCard';
import type { AssumptionWithCalculations } from '../types';

const GRID_CARD_SIZE_PX = 120;

export const GridView: React.FC = () => {
  const { assumptions, currentProjectId, updateAssumption, openAssumptionModal } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());
  const justDraggedRef = useRef(false);

  const projectAssumptions = assumptions
    .filter((a) => a.projectId === currentProjectId)
    .map(addCalculations);

  // Get or create ref for a card
  const getCardRef = (id: string) => {
    if (!cardRefs.current.has(id)) {
      cardRefs.current.set(id, React.createRef<HTMLDivElement>());
    }
    return cardRefs.current.get(id)!;
  };

  // Calculate position for each assumption
  const getPosition = (assumption: AssumptionWithCalculations) => {
    if (assumption.manualPosition) {
      return assumption.manualPosition;
    }

    // Unscored assumptions default to centre — user can drag them into place
    if (assumption.scores.length === 0) {
      return { x: 50, y: 50 };
    }

    // X-axis: Evidence (1-10 scale)
    // Higher evidence = further right
    const x = (assumption.averageConfidence / 10) * 100;

    // Y-axis: Importance (1-10 scale)
    // Higher importance = higher up (so we invert it)
    const y = ((10 - assumption.averageImportance) / 10) * 100;

    return { x, y };
  };

  const handleCardClick = (assumption: AssumptionWithCalculations) => {
    if (justDraggedRef.current) {
      justDraggedRef.current = false;
      return;
    }
    openAssumptionModal(assumption);
  };

  // Handle drag stop (do not open assumption modal after drop)
  const handleDragStop = (assumption: AssumptionWithCalculations, _e: DraggableEvent, data: DraggableData) => {
    justDraggedRef.current = true;
    setDraggingId(null);
    setTimeout(() => {
      justDraggedRef.current = false;
    }, 300);

    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    const cardHeight = data.node.offsetHeight;
    const centerX = data.x + GRID_CARD_SIZE_PX / 2;
    const centerY = data.y + cardHeight / 2;

    const xPercent = (centerX / containerRect.width) * 100;
    const yPercent = (centerY / containerRect.height) * 100;

    const clampedX = Math.max(5, Math.min(95, xPercent));
    const clampedY = Math.max(5, Math.min(95, yPercent));

    updateAssumption({
      ...assumption,
      manualPosition: { x: clampedX, y: clampedY },
    });
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  return (
    <div className="p-6 h-full">
      <div className="flex gap-2 h-[calc(100vh-200px)]">

        {/* Y-axis label column — outside the canvas */}
        <div className="flex flex-col justify-between py-2 text-xs font-medium text-gray-700 pointer-events-none select-none">
          <span className="[writing-mode:vertical-rl] rotate-180">Important</span>
          <span className="[writing-mode:vertical-rl] rotate-180">↑ Importance ↓</span>
          <span className="[writing-mode:vertical-rl] rotate-180">Unimportant</span>
        </div>

        {/* Canvas + X-axis label */}
        <div className="flex flex-col flex-1 gap-2">

          {/* Main canvas */}
          <div className="bg-white rounded shadow-md flex-1 relative overflow-hidden">
            {/* Zoom controls hint */}
            <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white/80 px-3 py-1 rounded shadow z-10">
              Scroll to zoom in • Drag canvas to pan • Drag cards to reposition
            </div>

            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={3}
              centerOnInit={true}
              wheel={{ step: 0.1 }}
              pinch={{ step: 5 }}
              doubleClick={{ disabled: true }}
              panning={{ disabled: draggingId !== null }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  {/* Zoom controls */}
                  <div className="absolute top-12 right-2 flex flex-col gap-1 z-10">
                    <button
                      onClick={() => zoomIn()}
                      className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm shadow"
                      title="Zoom in"
                    >
                      +
                    </button>
                    <button
                      onClick={() => zoomOut()}
                      className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-2 py-1 text-sm shadow"
                      title="Zoom out"
                    >
                      −
                    </button>
                    <button
                      onClick={() => resetTransform()}
                      className="bg-white hover:bg-gray-100 border border-gray-300 rounded px-2 py-1 text-xs shadow"
                      title="Reset zoom"
                    >
                      ⟲
                    </button>
                  </div>

                  <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{ width: '100%', height: '100%' }}
                  >
                    <div className="relative w-full h-full">
                      {/* Grid container - fills entire canvas with NO gaps */}
                      <div
                        ref={containerRef}
                        className="absolute inset-0 grid grid-cols-2 grid-rows-2"
                      >
                        {/* Top-left: Validate (Low evidence + Important) */}
                        <div className="bg-quadrant-validate border border-blue-300 p-4 relative">
                          <h3 className="font-bold text-sm mb-2">Validate</h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            These assumptions have promise of a big return but pose risk. Focus our testing and learning here.
                          </p>
                        </div>

                        {/* Top-right: Build it (High evidence + Important) */}
                        <div className="bg-quadrant-priority border border-orange-300 p-4 relative">
                          <h3 className="font-bold text-sm mb-2">Build it</h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            We have high confidence that these will deliver customer value. Don't spend discovery cycles here.
                          </p>
                        </div>

                        {/* Bottom-left: Discard (Low evidence + Unimportant) */}
                        <div className="bg-quadrant-defer border border-gray-300 p-4 relative">
                          <h3 className="font-bold text-sm mb-2">Discard</h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            We don't have much confidence around this, but at the same time it's not important. Don't waste time here.
                          </p>
                        </div>

                        {/* Bottom-right: Don't test. Usually don't build (High evidence + Unimportant) */}
                        <div className="bg-quadrant-document border border-gray-400 p-4 relative">
                          <h3 className="font-bold text-sm mb-2">Don't test. Usually don't build</h3>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Not impactful to users, but sometimes table stakes business functionality ends up here.
                          </p>
                        </div>
                      </div>

                      {/* Assumption cards positioned on grid */}
                      <div className="absolute inset-0 pointer-events-none">
                        {projectAssumptions.map((assumption) => {
                          const pos = getPosition(assumption);
                          const clampedX = Math.max(5, Math.min(pos.x, 85));
                          const clampedY = Math.max(5, Math.min(pos.y, 85));

                          // Calculate pixel position for draggable
                          // We need to get container dimensions to convert % to pixels
                          const containerWidth = containerRef.current?.offsetWidth || 1000;
                          const containerHeight = containerRef.current?.offsetHeight || 600;

                          const xPixels = (clampedX / 100) * containerWidth - GRID_CARD_SIZE_PX / 2;
                          const yPixels = (clampedY / 100) * containerHeight - GRID_CARD_SIZE_PX / 2;

                          const nodeRef = getCardRef(assumption.id);

                          return (
                            <Draggable
                              key={assumption.id}
                              nodeRef={nodeRef}
                              position={{ x: xPixels, y: yPixels }}
                              onStart={() => handleDragStart(assumption.id)}
                              onStop={(e, data) => handleDragStop(assumption, e, data)}
                              bounds="parent"
                            >
                              <div
                                ref={nodeRef}
                                style={{ width: GRID_CARD_SIZE_PX }}
                                className={`absolute pointer-events-auto cursor-move ${
                                  draggingId === assumption.id ? 'opacity-70 scale-105' : ''
                                } transition-all`}
                              >
                                <AssumptionCard
                                  assumption={assumption}
                                  variant="grid"
                                  onCardClick={handleCardClick}
                                  isDragging={draggingId === assumption.id}
                                />
                              </div>
                            </Draggable>
                          );
                        })}
                      </div>

                      {/* Empty state */}
                      {projectAssumptions.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center text-gray-500">
                            <p className="text-lg font-medium">No assumptions yet</p>
                            <p className="text-sm mt-2">
                              Add assumptions in the category view to see them here
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </TransformComponent>
                </>
              )}
            </TransformWrapper>
          </div>

          {/* X-axis label — outside the canvas, below */}
          <div className="flex justify-between text-xs font-medium text-gray-700 px-6 pointer-events-none select-none">
            <span>Low evidence</span>
            <span>← Evidence →</span>
            <span>High evidence</span>
          </div>

        </div>
      </div>
    </div>
  );
};
