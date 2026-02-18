import React from 'react';
import type {
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store/useStore';
import { AssumptionCard } from './AssumptionCard';
import { addCalculations } from '../utils/calculations';
import type {
  AssumptionCategory,
  AssumptionWithCalculations,
} from '../types';
import {
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
} from '../types';

const categories: AssumptionCategory[] = [
  'service',
  'product',
  'users',
  'business_case',
  'market',
  'technology',
  'delivery',
  'stakeholders',
];

interface SortableCardProps {
  assumption: AssumptionWithCalculations;
}

const SortableCard: React.FC<SortableCardProps> = ({ assumption }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: assumption.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <AssumptionCard assumption={assumption} isDragging={isDragging} />
    </div>
  );
};

interface ColumnProps {
  category: AssumptionCategory;
  assumptions: AssumptionWithCalculations[];
}

const Column: React.FC<ColumnProps> = ({ category, assumptions }) => {
  const { openAssumptionModal } = useStore();

  return (
    <div className="flex-shrink-0 w-80 bg-white rounded shadow-md">
      <div className="p-4 bg-gds-light-grey border-b border-gds-grey">
        <h3 className="font-bold text-gds-black flex items-center gap-2">
          {CATEGORY_LABELS[category]}
          <span className="text-xs font-normal bg-gds-blue text-white px-2 py-0.5 rounded">
            {assumptions.length}
          </span>
        </h3>
        <p className="text-xs text-gray-600 mt-1" title={CATEGORY_DESCRIPTIONS[category]}>
          {CATEGORY_DESCRIPTIONS[category]}
        </p>
      </div>

      <div className="p-3 min-h-[500px]">
        <button
          onClick={() =>
            openAssumptionModal({
              id: '',
              projectId: '',
              text: '',
              category,
              scores: [],
              createdBy: '',
              updatedBy: '',
              createdAt: 0,
              updatedAt: 0,
            })
          }
          className="w-full mb-3 px-3 py-2 border-2 border-dashed border-gds-grey rounded text-sm text-gds-blue hover:border-gds-blue hover:bg-blue-50 transition-colors"
        >
          + Add assumption
        </button>

        <SortableContext items={assumptions} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {assumptions.map((assumption) => (
              <SortableCard key={assumption.id} assumption={assumption} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export const CategoryView: React.FC = () => {
  const { assumptions, currentProjectId, updateAssumption } = useStore();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const projectAssumptions = assumptions
    .filter((a) => a.projectId === currentProjectId)
    .map(addCalculations);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeAssumption = assumptions.find((a) => a.id === active.id);
    if (!activeAssumption) {
      setActiveId(null);
      return;
    }

    // Find which category the card was dropped into
    const overAssumption = assumptions.find((a) => a.id === over.id);
    if (overAssumption && activeAssumption.category !== overAssumption.category) {
      updateAssumption({
        ...activeAssumption,
        category: overAssumption.category,
      });
    }

    setActiveId(null);
  };

  const activeAssumption = activeId
    ? addCalculations(assumptions.find((a) => a.id === activeId)!)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto p-6">
        <div className="flex gap-5 min-w-max">
          {categories.map((category) => {
            const categoryAssumptions = projectAssumptions.filter(
              (a) => a.category === category
            );
            return (
              <Column
                key={category}
                category={category}
                assumptions={categoryAssumptions}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeAssumption ? <AssumptionCard assumption={activeAssumption} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};
