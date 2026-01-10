'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/dashboard/Header';

import { WidgetGrid } from '@/components/dashboard/WidgetGrid';

import AddWidgetModal from '@/components/modals/AddWidgetModal';
import TemplatesModal from '@/components/modals/TemplatesModal';
import { useWidgetStore } from '@/store/widgetStore';

export default function DashboardPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const { isHydrated } = useWidgetStore();



  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowAddModal(true);
      }
 
      if (e.key === 'Escape') {
        setShowAddModal(false);
        setShowTemplatesModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);





  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >

          <div className="w-16 h-16 rounded-2xl  bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center animate-pulse">
            <svg
              className="w-8 h-8 text-white"
              fill ="none"
              viewBox="0 0 24 24"
              stroke ="currentColor"
            >



              <path
                strokeLinecap="round"
                strokeLinejoin ="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>


          <p className="text-surface-500   dark:text-surface-400  font-medium">
            Loading FinBoard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50  dark:bg-surface-950 bg-grid">

      {/* Header */}
      <Header
        onAddWidget={() => setShowAddModal(true)}
        onOpenTemplates={() => setShowTemplatesModal(true)}
      />

      {/* Main Content */}

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">

          <motion.div
            key="widget-grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WidgetGrid onAddWidget={() => setShowAddModal(true)} />
          </motion.div>

        </AnimatePresence>
      </main>


      <div className="fixed bottom-4 left-4 hidden md:flex   items-center gap-2 text-xs  text-surface-400 dark:text-surface-500">
        <kbd className="px-2 py-1 bg-surface-100 dark:bg-surface-800  rounded border border-surface-200 dark:border-surface-700 font-mono">
          ⌘K
        </kbd>
        <span>Add widget</span>
      </div>

      {/* Modals */}
      <AddWidgetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />


      
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
      />
    </div>
  );
}
