'use client';

import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils';
import { ToastMessage } from '@/types';

import { useWidgetStore } from '@/store/widgetStore';
import { useMounted } from '@/hooks';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800 text-success-800 dark:text-success-200',
  error: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200',
  warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 text-warning-800 dark:text-warning-200',
  info: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200',
};



const iconColors = {
  success: 'text-success-500',
  error: 'text-danger-500',
  warning: 'text-warning-500',
  info: 'text-primary-500',
};



function Toast({ toast }: { toast: ToastMessage }) {
  const removeToast = useWidgetStore((s) => s.removeToast);
  const Icon = icons[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full',
        colors[toast.type]
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColors[toast.type])} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm opacity-80">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );

}



export function ToastContainer() {
  const toasts = useWidgetStore((s) => s.toasts);
  const mounted = useMounted();

  if (!mounted) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}
