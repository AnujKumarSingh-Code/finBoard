'use client';

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,

  DragEndEvent,
} from '@dnd-kit/core';


import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import { motion } from 'framer-motion';
import { Plus, LayoutGrid } from 'lucide-react';

import { useWidgetStore } from '@/store/widgetStore';
import { WidgetCard } from '@/components/widgets/WidgetCard';

import { SortableWidget } from '@/components/widgets/SortableWidget';
import { cn } from '@/utils';

interface WidgetGridProps {
  onAddWidget: () => void;
}

export function WidgetGrid({ onAddWidget }: WidgetGridProps) {
  const { widgets, reorderWidgets } = useWidgetStore();

  const sensors = useSensors(

    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active , over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = widgets.findIndex((w) => w.id === active.id);
        const newIndex = widgets.findIndex((w) => w.id === over.id);
        reorderWidgets(arrayMove(widgets , oldIndex, newIndex ));
      }
    },
    [widgets , reorderWidgets]
  );

  if (widgets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}

        className="flex flex-col items-center  justify-center min-h-[60vh]  text-center px-4"
      >

        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center mb-6">
          <LayoutGrid className="w-10 h-10 text-primary-500" />

        </div>


        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          Build Your Finance Dashboard
        </h2>


        <p className="text-surface-500  dark:text-surface-400 max-w-md mb-8">
          Create custom widgets by connecting  to any finance API. Track stocks,
          crypto, forex, and more – all in real-time.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAddWidget}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-shadow"
        >
          <Plus className="w-5 h-5" />
          Add Your First Widget
        </motion.button>
      </motion.div>
    );
  }




  const WIDGET_HEIGHT = 400;


  const getSizeClasses = (size: string) => {

    switch (size) {
      case 'small':
        return '';
      case 'medium':
        return 'md:col-span-2';
      case 'large':
        return 'md:col-span-2 lg:col-span-3';
      case 'full':
        return 'md:col-span-2 lg:col-span-3 xl:col-span-4';
      default:
        return '';
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={widgets.map((w) => w.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1   md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
          {widgets.map((widget, index) => {
            return (
              <div 
                key={widget.id} 
                className={cn(getSizeClasses(widget.size))}
                style={{ height: WIDGET_HEIGHT }}
              >


                <SortableWidget id={widget.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="h-full"
                  >
                    <WidgetCard widget={widget} />
                  </motion.div>
                </SortableWidget>
              </div>
            );
          })}



          {/* Add Widget Card */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddWidget}
            style={{ height: WIDGET_HEIGHT }}
            className="group border-2 border-dashed   border-surface-300 dark:border-surface-600  rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-all cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl  bg-surface-100 dark:bg-surface-700  group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 flex items-center justify-center transition-colors">
              <Plus className="w-6 h-6 text-surface-400  group-hover:text-primary-500 transition-colors" />
            </div>

            
            <span className="text-sm font-medium text-surface-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              Add Widget
            </span>
          </motion.button>
        </div>
      </SortableContext>
    </DndContext>
  );
}