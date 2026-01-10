'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Save, X, RefreshCw, Trash2, LayoutGrid, Table, LineChart, 
  BarChart3, TrendingUp, Check, AlertCircle, Loader2, Settings2,
  Key, ChevronDown, AlertTriangle
} from 'lucide-react';


import { Modal, Button, Input, Select } from '@/components/ui';

import { REFRESH_INTERVALS, API_PRESETS } from '@/config/presets';

import { useWidgetStore } from '@/store/widgetStore';

import { WidgetConfig, WidgetType, WidgetSize, ChartType } from '@/types';
import { cn } from '@/utils';

interface EditWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  widget: WidgetConfig | null;
}



const EditWidgetModal: React.FC<EditWidgetModalProps> = ({ isOpen  , onClose , widget }) => {

  // Form state
  const [title, setTitle] = useState('');
  const [apiUrl, setApiUrl] = useState('');

  const [refreshInterval, setRefreshInterval] = useState(30);

  const [widgetType, setWidgetType] = useState<WidgetType>('card');
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium');

  const [chartType, setChartType] = useState<ChartType>('line');
  
  // Symbol input state
  const [stockSymbol, setStockSymbol] = useState('');
  const [symbolParam, setSymbolParam] = useState<string | null>(null);
  
  // API Keys state
  const [alphaVantageKey, setAlphaVantageKey] = useState('');
  const [finnhubKey, setFinnhubKey] = useState('');
  const [indianApiKey, setIndianApiKey] = useState('');
  const [showApiKeys, setShowApiKeys] = useState(false);


  
  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  
  // Store
  const { updateWidget, deleteWidget, addToast } = useWidgetStore();

  // Load API keys from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      setAlphaVantageKey(localStorage.getItem('finboard_alpha_vantage_key') || '');
      setFinnhubKey(localStorage.getItem('finboard_finnhub_key') || '');
      setIndianApiKey(localStorage.getItem('finboard_indianapi_key') || '');
    }
  }, [isOpen]);

  // Initialize form from widget
  useEffect(() => {
    if (widget) {
      setTitle(widget.title);
      setApiUrl(widget.apiConfig.url);
      setRefreshInterval(widget.refreshInterval);
      setWidgetType(widget.type);
      setWidgetSize(widget.size);
      setChartType(widget.chartConfig?.type || 'line');
      
      // Try to detect symbol parameter from preset
      if (widget.preset) {
        const preset = API_PRESETS[widget.preset];
        if (preset?.symbolParam) {
          setSymbolParam(preset.symbolParam);
          // Extract current symbol from URL
          const url = new URL(widget.apiConfig.url);
          const currentSymbol = url.searchParams.get(preset.symbolParam) || 
                               (preset.symbolParam === 'name' ? url.searchParams.get('name') : '');
          setStockSymbol(currentSymbol || preset.defaultSymbol || '');
        } else {
          setSymbolParam(null);
          setStockSymbol('');
        }
      } else {
        // Try to detect symbol from URL patterns
        const url = widget.apiConfig.url;
        if (url.includes('symbol=')) {
          const match = url.match(/symbol=([^&]+)/);
          if (match) {
            setStockSymbol(match[1]);
            setSymbolParam('symbol');
          }
        } else if (url.includes('name=')) {
          const match = url.match(/name=([^&]+)/);
          if (match) {
            setStockSymbol(match[1]);
            setSymbolParam('name');
          }
        } else {
          setSymbolParam(null);
          setStockSymbol('');
        }
      }
      
      setShowDeleteConfirm(false);
    }
  }, [widget]);

  // Replace API keys in URL
  const replaceApiKeysInUrl = useCallback((url: string): string => {
    let newUrl = url;
    
    if (alphaVantageKey && url.includes('alphavantage.co')) {
      newUrl = newUrl.replace(/apikey=[^&]+/, `apikey=${alphaVantageKey}`);
    }
    
    if (finnhubKey && url.includes('finnhub.io')) {
      newUrl = newUrl.replace(/token=[^&]+/, `token=${finnhubKey}`);
    }
    
    return newUrl;
  }, [alphaVantageKey, finnhubKey]);

  // Update symbol in URL
  const updateSymbolInUrl = useCallback((url: string, symbol: string): string => {
    if (!symbolParam || !symbol) return url;
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set(symbolParam, symbol);
      return urlObj.toString();
    } catch {
      // Handle non-standard URLs
      const regex = new RegExp(`${symbolParam}=[^&]+`);
      if (url.match(regex)) {
        return url.replace(regex, `${symbolParam}=${symbol}`);
      }
      return url;
    }
  }, [symbolParam]);

  // Get final URL with symbol and API keys applied
  const getFinalUrl = useCallback(() => {
    let url = apiUrl;
    if (stockSymbol && symbolParam) {
      url = updateSymbolInUrl(url, stockSymbol);
    }
    url = replaceApiKeysInUrl(url);
    return url;
  }, [apiUrl, stockSymbol, symbolParam, updateSymbolInUrl, replaceApiKeysInUrl]);

  // Test API
  const testApi = async () => {
    const finalUrl = getFinalUrl();
    if (!finalUrl.trim()) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Prepare headers
      const headers: HeadersInit = { 'Accept': 'application/json' };
      
      // Add IndianAPI key if needed
      if (finalUrl.includes('indianapi.in') && indianApiKey) {
        headers['X-Api-Key'] = indianApiKey;
      }
      
      const response = await fetch(finalUrl, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Check for API error messages
      if (data['Error Message'] || data['Note'] || data.error) {
        throw new Error(data['Error Message'] || data['Note'] || data.error);
      }
      
      setTestResult('success');
      addToast('API test successful!', 'success');
    } catch (err) {
      setTestResult('error');
      addToast(`API test failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  // Save API keys
  const saveApiKeys = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finboard_alpha_vantage_key', alphaVantageKey);
      localStorage.setItem('finboard_finnhub_key', finnhubKey);
      localStorage.setItem('finboard_indianapi_key', indianApiKey);
      addToast('API keys saved!', 'success');
    }
  };

  // Save changes
  const handleSave = () => {
    if (!widget) return;
    
    const finalUrl = getFinalUrl();
    
    // Prepare headers
    let headers = widget.apiConfig.headers;
    if (finalUrl.includes('indianapi.in') && indianApiKey) {
      headers = { ...headers, 'X-Api-Key': indianApiKey };
    }
    
    updateWidget(widget.id, {
      title,
      type: widgetType,
      size: widgetSize,
      apiConfig: {
        ...widget.apiConfig,
        url: finalUrl,
        headers,
      },
      refreshInterval,
      chartConfig: widgetType === 'chart' ? {
        type: chartType,
        ...widget.chartConfig,
      } : undefined,
    });
    
    addToast('Widget updated successfully!', 'success');
    onClose();
  };

  // Delete widget with custom confirmation
  const handleDelete = () => {
    if (!widget) return;
    deleteWidget(widget.id);
    addToast('Widget deleted', 'info');
    setShowDeleteConfirm(false);
    onClose();
  };

  // Widget type options
  const widgetTypes: Array<{ value: WidgetType; label: string; icon: React.ReactNode; description: string }> = [
    { value: 'card', label: 'Card', icon: <LayoutGrid className="w-5 h-5" />, description: 'Key-value display' },
    { value: 'table', label: 'Table', icon: <Table className="w-5 h-5" />, description: 'Data grid' },
    { value: 'chart', label: 'Chart', icon: <LineChart className="w-5 h-5" />, description: 'Visualization' },
  ];

  // Chart type options
  const chartTypes: Array<{ value: ChartType; label: string; icon: React.ReactNode }> = [
    { value: 'line', label: 'Line', icon: <LineChart className="w-4 h-4" /> },
    { value: 'area', label: 'Area', icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'bar', label: 'Bar', icon: <BarChart3 className="w-4 h-4" /> },
    { value: 'candlestick', label: 'Candle', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // Size options
  const sizeOptions: Array<{ value: WidgetSize; label: string; description: string }> = [
    { value: 'small', label: 'Small', description: '1 column' },
    { value: 'medium', label: 'Medium', description: '2 columns' },
    { value: 'large', label: 'Large', description: '3 columns' },
    { value: 'full', label: 'Full', description: 'Full width' },
  ];

  if (!widget) return null;

  return (
    <>
      <Modal isOpen={isOpen && !showDeleteConfirm} onClose={onClose} size="lg" title="Configure Widget">
        <div className="space-y-6">
          {/* Widget Info Header */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Settings2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">{widget.title}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Created {new Date(widget.createdAt).toLocaleDateString()}
              </p>
            </div>
            {widget.preset && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                {API_PRESETS[widget.preset]?.provider || 'preset'}
              </span>
            )}
          </div>

          {/* Widget Title */}
          <Input
            label="Widget Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter widget title"
          />

          {/* Stock Symbol Input (if applicable) */}
          {symbolParam && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Stock Symbol / Name
              </label>
              <div className="flex gap-2">
                <Input
                  value={stockSymbol}
                  onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                  placeholder={symbolParam === 'name' ? "e.g., Reliance, TCS, Infosys" : "e.g., AAPL, GOOGL, MSFT"}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-slate-500">
                {symbolParam === 'name' 
                  ? 'Enter company name for Indian stocks'
                  : 'Enter stock ticker symbol'}
              </p>
            </div>
          )}

          {/* API URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              API URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={apiUrl}
                  onChange={(e) => { setApiUrl(e.target.value); setTestResult(null); }}
                  placeholder="https://api.example.com/data"
                />
              </div>
              <Button
                onClick={testApi}
                disabled={isTesting || !apiUrl.trim()}
                variant={testResult === 'success' ? 'success' : testResult === 'error' ? 'danger' : 'secondary'}
                className="shrink-0"
              >
                {isTesting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {testResult === 'success' && <Check className="w-4 h-4 mr-2" />}
                {testResult === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
                Test
              </Button>
            </div>
          </div>

          {/* API Keys Section */}
          <div>
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="flex items-center gap-2 w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Key className="w-4 h-4 text-amber-500" />
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                API Keys
              </span>
              <span className="text-xs text-slate-500 ml-auto">
                {(alphaVantageKey || finnhubKey || indianApiKey) ? '✓ Configured' : 'Click to setup'}
              </span>
              <ChevronDown className={cn(
                "w-4 h-4 text-slate-400 transition-transform",
                showApiKeys && "rotate-180"
              )} />
            </button>
            
            <AnimatePresence>
              {showApiKeys && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 mt-2 space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Alpha Vantage Key
                      </label>
                      <input
                        type="text"
                        value={alphaVantageKey}
                        onChange={(e) => setAlphaVantageKey(e.target.value)}
                        placeholder="Your Alpha Vantage API key"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Finnhub Key
                      </label>
                      <input
                        type="text"
                        value={finnhubKey}
                        onChange={(e) => setFinnhubKey(e.target.value)}
                        placeholder="Your Finnhub API key"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        IndianAPI Key
                      </label>
                      <input
                        type="text"
                        value={indianApiKey}
                        onChange={(e) => setIndianApiKey(e.target.value)}
                        placeholder="Your IndianAPI key"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <Button onClick={saveApiKeys} size="sm" className="w-full">
                      Save API Keys
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Refresh Interval */}
          <Select
            label="Refresh Interval"
            value={String(refreshInterval)}
            onChange={(value) => setRefreshInterval(Number(value))}
            options={REFRESH_INTERVALS.map(opt => ({
              value: String(opt.value),
              label: opt.label,
            }))}
          />

          {/* Widget Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Display Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {widgetTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setWidgetType(type.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                    widgetType === type.value
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  )}
                >
                  {type.icon}
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-xs opacity-70">{type.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chart Type (only for chart widgets) */}
          {widgetType === 'chart' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Chart Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {chartTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setChartType(type.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                      chartType === type.value
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    )}
                  >
                    {type.icon}
                    {type.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Widget Size */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Widget Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {sizeOptions.map(size => (
                <button
                  key={size.value}
                  onClick={() => setWidgetSize(size.value)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                    widgetSize === size.value
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    widgetSize === size.value
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-700 dark:text-slate-300"
                  )}>
                    {size.label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {size.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Delete Widget?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Are you sure you want to delete <strong>&quot;{widget?.title}&quot;</strong>? 
                  All configuration will be permanently removed.
                </p>
                
                <div className="flex gap-3 justify-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Widget
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export { EditWidgetModal };
export default EditWidgetModal;