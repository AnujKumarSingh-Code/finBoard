'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Plus,
  Download,
  Upload,
  Trash2,
  LayoutTemplate,
  Settings,
  TrendingUp,
} from 'lucide-react';


import { Button } from '@/components/ui';
import { useWidgetStore } from '@/store/widgetStore';

import { useMounted } from '@/hooks';
import { cn } from '@/utils';

interface HeaderProps {
  onAddWidget: () => void;
  onOpenTemplates: () => void;
}

export function Header({ onAddWidget, onOpenTemplates }: HeaderProps) {

  const { theme, setTheme } = useTheme();
  const { widgets, exportConfig, importConfig, clearWidgets } = useWidgetStore();

  const mounted = useMounted();
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = () => {
    const config = exportConfig();
    const blob = new Blob([config], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finboard-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };



  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        importConfig(text);
      }
    };
    input.click();
  };



  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const ThemeIcon = themeIcons[(theme as keyof typeof themeIcons) || 'system'];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-900/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">


            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25"
            >
              <TrendingUp className="w-5 h-5" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-surface-900 dark:text-white">
                FinBoard
              </h1>
              <p className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block">
                {widgets.length} active widget{widgets.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Actions */}

          <div className="flex items-center gap-2">
            {/* Add Widget Button */}

            <Button
              onClick={onAddWidget}
              leftIcon={<Plus className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            >
              Add Widget
            </Button>
            <Button
              onClick={onAddWidget}
              variant="primary"
              size="icon"
              className="sm:hidden"
            >
              <Plus className="w-4 h-4" />
            </Button>



            {/* Templates Button */}
            <Button
              variant="secondary"
              onClick={onOpenTemplates}
              leftIcon={<LayoutTemplate className="w-4 h-4" />}
              className="hidden md:inline-flex"
            >
              Templates
            </Button>



            {/* Settings Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMenu(!showMenu)}
              >
                <Settings className="w-4 h-4" />
              </Button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-800  rounded-xl shadow-xl border border-surface-200 dark:border-surface-700 py-2 z-20"
                  >
                    <button
                      onClick={() => {
                        handleExport();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm   text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-3"
                    >
                      <Download className="w-4 h-4" />
                      Export Configuration
                    </button>
                    <button
                      onClick={() => {
                        handleImport();
                        setShowMenu(false);
                      }}
                      className="w-full px-4  py-2 text-left text-sm   text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-3"
                    >
                      <Upload className="w-4 h-4" />
                      Import Configuration
                    </button>
                    <div className="h-px bg-surface-200 dark:bg-surface-700 my-2" />
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want  to clear all widgets?')) {
                          clearWidgets();
                        }
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2   text-left text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Widgets
                    </button>
                  </motion.div>
                </>
              )}
            </div>

            {/* Theme Toggle */}
            {mounted && (
              <div className="flex items-center bg-surface-100   dark:bg-surface-800 rounded-lg p-1">

                {(['light', 'dark', 'system'] as const).map((t) => {

                  const Icon = themeIcons[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        'p-2 rounded-md   transition-all',
                        theme === t
                          ? 'bg-white dark:bg-surface-700   text-primary-500 shadow-sm'
                          : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            )}
            
          </div>
        </div>

      </div>
    </header>
  );
}
