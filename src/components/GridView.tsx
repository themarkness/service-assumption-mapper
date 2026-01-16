import React, { useRef, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Draggable, { type DraggableEvent, type DraggableData } from 'react-draggable';
import { useStore } from '../store/useStore';
import { addCalculations } from '../utils/calculations';
import { AssumptionCard } from './AssumptionCard';
import type { AssumptionWithCalculations } from '../types';

export const GridView: React.FC = () => {
  const { assumptions, currentProjectId, updateAssumption } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());

  const projectAssumptions = assumptions
    .filter((a) => a.projectId === currentProjectId)
    .map(addCalculations)
    .filter((a) => a.scores.length > 0); // Only show scored assumptions

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

    // X-axis: Evidence (1-10 scale)
    // Higher evidence = further right
    const x = (assumption.averageConfidence / 10) * 100;

    // Y-axis: Importance (1-10 scale)
    // Higher importance = higher up (so we invert it)
    const y = ((10 - assumption.averageImportance) / 10) * 100;

    return { x, y };
  };

  // Convert canvas position back to scores
  const positionToScores = (x: number, y: number) => {
    // X-axis: Evidence (Confidence)
    // x% position maps to confidence score 1-10
    const confidence = Math.max(1, Math.min(10, (x / 100) * 10));

    // Y-axis: Importance (inverted)
    // y% position maps to importance score 1-10 (inverted)
    const importance = Math.max(1, Math.min(10, 10 - (y / 100) * 10));

    return { confidence, importance };
  };

  // Handle drag stop
  const handleDragStop = (assumption: AssumptionWithCalculations, _e: DraggableEvent, data: DraggableData) => {
    setDraggingId(null);

    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    // Calculate percentage position within the container
    // The card is centered on its position, so we need to add half the card width/height
    const cardWidth = 256; // w-64 = 16rem = 256px
    const cardHeight = data.node.offsetHeight;

    const centerX = data.x + cardWidth / 2;
    const centerY = data.y + cardHeight / 2;

    const xPercent = (centerX / containerRect.width) * 100;
    const yPercent = (centerY / containerRect.height) * 100;

    // Clamp to bounds
    const clampedX = Math.max(5, Math.min(95, xPercent));
    const clampedY = Math.max(5, Math.min(95, yPercent));

    // Update the assumption with the new manual position
    updateAssumption({
      ...assumption,
      manualPosition: { x: clampedX, y: clampedY },
    });

    // Calculate what the scores would be at this position
    const { confidence, importance } = positionToScores(clampedX, clampedY);

    console.log(`Card moved to: ${clampedX.toFixed(1)}%, ${clampedY.toFixed(1)}%`);
    console.log(`Equivalent scores - Evidence: ${confidence.toFixed(1)}, Importance: ${importance.toFixed(1)}`);
  };

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  return (
    <div className="p-6 h-full">
      <div className="bg-white rounded shadow-md p-6 h-[calc(100vh-200px)] relative">
        {/* Zoom controls hint */}
        <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white/80 px-3 py-1 rounded shadow z-10">
          Scroll to zoom • Drag canvas to pan • Drag cards to reposition
        </div>

        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={3}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
          panning={{ disabled: false }}
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
                <div className="relative w-full h-full" style={{ paddingLeft: '50px', paddingBottom: '30px' }}>
                  {/* Grid container */}
                  <div
                    ref={containerRef}
                    className="absolute grid grid-cols-2 grid-rows-2 gap-1"
                    style={{ left: '50px', right: '0', top: '0', bottom: '30px' }}
                  >
                    {/* Top-left: Validate (Low evidence + Important) */}
                    <div className="bg-quadrant-validate border-2 border-blue-300 rounded-tl p-4">
                      <h3 className="font-bold text-sm mb-2">Validate</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        These assumptions have promise of a big return but pose risk. Focus our testing and learning here.
                      </p>
                    </div>

                    {/* Top-right: Build it (High evidence + Important) */}
                    <div className="bg-quadrant-priority border-2 border-orange-300 rounded-tr p-4">
                      <h3 className="font-bold text-sm mb-2">Build it</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        We have high confidence that these will deliver customer value. Don't spend discovery cycles here.
                      </p>
                    </div>

                    {/* Bottom-left: Discard (Low evidence + Unimportant) */}
                    <div className="bg-quadrant-defer border-2 border-gray-300 rounded-bl p-4">
                      <h3 className="font-bold text-sm mb-2">Discard</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        We don't have much confidence around this, but at the same time it's not important. Don't waste time here.
                      </p>
                    </div>

                    {/* Bottom-right: Don't test. Usually don't build (High evidence + Unimportant) */}
                    <div className="bg-quadrant-document border-2 border-gray-400 rounded-br p-4">
                      <h3 className="font-bold text-sm mb-2">Don't test. Usually don't build</h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Not impactful to users, but sometimes table stakes business functionality ends up here.
                      </p>
                    </div>
                  </div>

                  {/* Axis labels */}
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs font-medium text-gray-600 pb-1 px-12">
                    <span>Low evidence</span>
                    <span>← Evidence →</span>
                    <span>High evidence</span>
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
                  <div className="absolute pointer-events-none" style={{ left: '50px', right: '0', top: '0', bottom: '30px' }}>
                    {projectAssumptions.map((assumption) => {
                      const pos = getPosition(assumption);
                      const clampedX = Math.max(5, Math.min(pos.x, 85));
                      const clampedY = Math.max(5, Math.min(pos.y, 85));

                      // Calculate pixel position for draggable
                      // We need to get container dimensions to convert % to pixels
                      const containerWidth = containerRef.current?.offsetWidth || 1000;
                      const containerHeight = containerRef.current?.offsetHeight || 600;

                      const cardWidth = 256; // w-64
                      const xPixels = (clampedX / 100) * containerWidth - cardWidth / 2;
                      const yPixels = (clampedY / 100) * containerHeight - 128; // approximate card height/2

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
                            className={`absolute w-64 pointer-events-auto cursor-move ${
                              draggingId === assumption.id ? 'opacity-70 scale-105' : ''
                            } transition-all`}
                          >
                            <AssumptionCard assumption={assumption} />
                          </div>
                        </Draggable>
                      );
                    })}
                  </div>

                  {/* Empty state */}
                  {projectAssumptions.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center text-gray-500">
                        <p className="text-lg font-medium">No scored assumptions yet</p>
                        <p className="text-sm mt-2">
                          Add scores to assumptions to see them positioned on the grid
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
    </div>
  );
};
