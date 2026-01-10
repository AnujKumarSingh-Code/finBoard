'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  Settings,
  Trash2,
  Copy,
  MoreVertical,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { WidgetConfig } from '@/types';
import { useWidgetStore } from '@/store/widgetStore';
import { useWidgetData } from '@/hooks';
import { formatRelativeTime, cn } from '@/utils';
import { Button } from '@/components/ui';
import { ChartWidget } from './ChartWidget';
import { TableWidget } from './TableWidget';
import { CardWidget } from './CardWidget';
import { EditWidgetModal } from '@/components/modals/EditWidgetModal';

interface WidgetCardProps {
  widget: WidgetConfig;
}

export function WidgetCard({ widget }: WidgetCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const { deleteWidget, duplicateWidget } = useWidgetStore();
  const { data, isLoading, error, refetch } = useWidgetData(widget);

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center p-4">
          <AlertCircle className="w-8 h-8 text-danger-500 mb-2" />
          <p className="text-sm text-danger-600 dark:text-danger-400 font-medium">
            Failed to load data
          </p>
          <p className="text-xs text-surface-500 mt-1 max-w-[200px]">
            {error}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            className="mt-3"
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Retry
          </Button>
        </div>
      );
    }

    if (isLoading && !data) {
      return (
        <div className="flex items-center justify-center h-full min-h-[150px]">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
            <span className="text-sm text-surface-500">Loading...</span>
          </div>
        </div>
      );
    }

    switch (widget.type) {
      case 'chart':
        return <ChartWidget widget={widget} data={data} />;
      case 'table':
        return <TableWidget widget={widget} data={data} />;
      case 'card':
      default:
        return <CardWidget widget={widget} data={data} />;
    }
  };

  return (
    <>
      <motion.div
        layout
        className="widget-card h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pt-6 border-b border-surface-100 dark:border-surface-700">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-surface-900 dark:text-white truncate">
              {widget.title || widget.name}
            </h3>
            {widget.lastUpdated && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-surface-400" />
                <span className="text-xs text-surface-400">
                  {formatRelativeTime(widget.lastUpdated)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Refresh Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={refetch}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw
                className={cn(
                  'w-4 h-4',
                  isLoading && 'animate-spin'
                )}
              />
            </Button>

            {/* Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
                className="h-8 w-8"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 py-2 z-50 overflow-visible"
                  >
                    <button
                      onClick={() => {
                        setShowEditModal(true);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4" />
                      Configure
                    </button>
                    <button
                      onClick={() => {
                        duplicateWidget(widget.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-3"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <div className="h-px bg-surface-200 dark:bg-surface-700 my-1.5 mx-2" />
                    <button
                      onClick={() => {
                        if (confirm('Delete this widget?')) {
                          deleteWidget(widget.id);
                        }
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-hidden">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-surface-100 dark:border-surface-700 text-xs text-surface-400 flex items-center justify-between">
          <span>Refreshes every {widget.refreshInterval}s</span>
          {widget.preset && (
            <span className="badge-primary text-xs">
              {widget.preset.split('_').slice(1).join(' ')}
            </span>
          )}
        </div>
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditWidgetModal
          widget={widget}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}