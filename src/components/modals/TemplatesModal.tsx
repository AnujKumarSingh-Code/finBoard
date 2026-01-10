'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';


import { 
  Layout, TrendingUp, Bitcoin, Globe2, Briefcase, Sparkles, 
  Check, AlertTriangle, ArrowRight, LayoutGrid
} from 'lucide-react';


import { Modal, Button } from '@/components/ui';
import { DASHBOARD_TEMPLATES } from '@/config/presets';

import { useWidgetStore } from '@/store/widgetStore';
import { DashboardTemplate, WidgetConfig } from '@/types';

import { cn } from '@/utils';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose }) => {


  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  
  // API Keys from localStorage
  const [alphaVantageKey, setAlphaVantageKey] = useState('');

  const [finnhubKey, setFinnhubKey] = useState('');

  const [indianApiKey, setIndianApiKey] = useState('');
  
  const { widgets, clearWidgets, addWidget, addToast } = useWidgetStore();



  // Load API keys from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      setAlphaVantageKey(localStorage.getItem('finboard_alpha_vantage_key') || '');
      setFinnhubKey(localStorage.getItem('finboard_finnhub_key') || '');
      setIndianApiKey(localStorage.getItem('finboard_indianapi_key') || '');
    }
  }, [isOpen]);



  // Replace  API keys in URL  with users   saved keys
  const replaceApiKeysInUrl = (url: string): string => {
    let newUrl = url;
    

    if (alphaVantageKey && url.includes('alphavantage.co')) {
      newUrl = newUrl.replace(/apikey=demo/gi, `apikey=${alphaVantageKey}`);
      newUrl = newUrl.replace(/apikey=[^&]+/gi, `apikey=${alphaVantageKey}`);
    }
    
    // Replace Finnhub   demo key
    if (finnhubKey && url.includes('finnhub.io')) {
      newUrl = newUrl.replace(/token=demo/gi, `token=${finnhubKey}`);
      newUrl = newUrl.replace(/token=[^&]+/gi, `token=${finnhubKey}`);
    }
    
    return newUrl;
  };

  // Process widget to inject users   API keys
  const processWidget = (widget: WidgetConfig): WidgetConfig => {
    const newWidget = { ...widget };
    
    // Replace API keys in  URL
    if (newWidget.apiConfig?.url) {
      newWidget.apiConfig = {
        ...newWidget.apiConfig,
        url: replaceApiKeysInUrl(newWidget.apiConfig.url),
      };
    }
    
    // Add IndianAPI header if needed
    if (indianApiKey && newWidget.apiConfig?.url?.includes('indianapi.in')) {
      newWidget.apiConfig = {
        ...newWidget.apiConfig,
        headers: {
          ...newWidget.apiConfig.headers,
          'X-Api-Key': indianApiKey,
        },
      };
    }
    
    return newWidget;
  };

  // Template icons mapping
  const templateIcons: Record<string, React.ReactNode> = {
    stockTrader: <TrendingUp className="w-6 h-6" />,
    cryptoDashboard: <Bitcoin className="w-6 h-6" />,
    forexMonitor: <Globe2 className="w-6 h-6" />,
  };

  // Template colors mapping
  const templateColors: Record<string, string> = {
    stockTrader: 'from-blue-500 to-indigo-600',
    cryptoDashboard: 'from-amber-500 to-orange-600',
    forexMonitor: 'from-emerald-500 to-teal-600',
  };

  // Check if API keys are configured
  const hasApiKeys = alphaVantageKey || finnhubKey;

  // Apply template
  const applyTemplate = (templateKey: string, clearExisting: boolean) => {
    const template = DASHBOARD_TEMPLATES[templateKey];
    if (!template) return;

    // Warn if no API keys configured
    if (!hasApiKeys) {
      addToast('Warning: No API keys configured. Add your keys in the Add Widget modal.', 'warning');
    }

    if (clearExisting) {
      clearWidgets();
    }

    // Add all widgets from template with user's API keys
    template.widgets.forEach((widget, index) => {
      setTimeout(() => {
        const processedWidget = processWidget(widget as WidgetConfig);
        addWidget({
          ...processedWidget,
          id: `${widget.id}-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
      }, index * 100); // Stagger widget additions
    });

    addToast(`Template "${template.name}" applied successfully!`, 'success');
    setSelectedTemplate(null);
    setConfirmClear(false);
    onClose();
  };

  // Handle template selection
  const handleSelectTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    
    // If there are existing widgets, show confirmation
    if (widgets.length > 0) {
      setConfirmClear(true);
    } else {
      applyTemplate(templateKey, false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Dashboard Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Layout className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Quick Start Templates
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Get started quickly with pre-configured dashboard layouts
            </p>
          </div>
        </div>

        {/* API Keys Status */}
        {!hasApiKeys && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>API keys not configured.</strong> Templates will use demo keys which have rate limits. 
                Add your keys via <strong>Add Widget → API Keys Configuration</strong> first.
              </span>
            </div>
          </div>
        )}

        {hasApiKeys && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                <strong>API keys configured!</strong> Templates will use your saved keys.
              </span>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {confirmClear && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  You have {widgets.length} existing widget{widgets.length !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Would you like to replace them or add the template widgets alongside?
                </p>
                <div className="flex gap-3 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => applyTemplate(selectedTemplate, false)}
                  >
                    Add to Existing
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => applyTemplate(selectedTemplate, true)}
                  >
                    Replace All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setSelectedTemplate(null); setConfirmClear(false); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Template Cards */}
        <div className="grid gap-4">
          {Object.entries(DASHBOARD_TEMPLATES).map(([key, template]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelectTemplate(key)}
              className={cn(
                "w-full text-left p-4 rounded-xl border-2 transition-all",
                selectedTemplate === key
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "p-3 rounded-xl bg-gradient-to-br text-white shrink-0",
                  templateColors[key] || 'from-slate-500 to-slate-600'
                )}>
                  {templateIcons[key] || <LayoutGrid className="w-6 h-6" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {template.name}
                    </h4>
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="text-sm">Apply</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {template.description}
                  </p>

                  {/* Widget Preview */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.widgets.slice(0, 4).map((widget, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
                      >
                        {widget.type === 'card' && <LayoutGrid className="w-3 h-3" />}
                        {widget.type === 'table' && <TrendingUp className="w-3 h-3" />}
                        {widget.type === 'chart' && <TrendingUp className="w-3 h-3" />}
                        {widget.title}
                      </span>
                    ))}
                    {template.widgets.length > 4 && (
                      <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs rounded-full">
                        +{template.widgets.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Selection indicator */}
                {selectedTemplate === key && (
                  <div className="p-1 bg-emerald-500 rounded-full">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Create Custom */}
        <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center">
          <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Want something different? Close this modal and add widgets individually to create your own custom dashboard.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TemplatesModal;