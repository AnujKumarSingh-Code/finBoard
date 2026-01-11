'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/utils';

interface SortableWidgetProps {
  id: string;
  children: React.ReactNode;
}

export function SortableWidget({ id, children }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    height: '100%',
    width: '100%',
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative h-full w-full',
        isDragging && 'shadow-2xl'
      )}
    >
      {/* Drag Handle ------ positioned at the top of the card */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-0 left-0 right-0 h-8 cursor-grab active:cursor-grabbing z-10 flex items-center justify-center"
      >
        <div className="w-12 h-1 rounded-full bg-surface-300 dark:bg-surface-600 hover:bg-surface-400 dark:hover:bg-surface-500 transition-colors" />
      </div>
      {children}
    </div>
  );
}