'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  X, Plus, Check, AlertCircle, Loader2, Search, ChevronDown, ChevronRight,
  LayoutGrid, Table, LineChart, Zap , Globe , RefreshCw, Sparkles, Key , Save, Eye, EyeOff
} from 'lucide-react';


import { Modal, Button, Input, Select } from '@/components/ui';
import { API_PRESETS, REFRESH_INTERVALS , POPULAR_SYMBOLS } from '@/config/presets';

import { useWidgetStore } from '@/store/widgetStore';

import { WidgetType, WidgetSize, ChartType } from '@/types';

import { cn, generateId, flattenObject } from '@/utils';

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface FieldNode {
  key: string;
  path: string;
  value: unknown;
  type: string;
  children?: FieldNode[];
  isExpanded?: boolean;
}

const AddWidgetModal: React.FC<AddWidgetModalProps> = ({ isOpen , onClose }) => {


  const [widgetName, setWidgetName] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [widgetType, setWidgetType] = useState<WidgetType>('card');
  const [widgetSize, setWidgetSize] = useState<WidgetSize>('medium');
  const [chartType, setChartType] = useState<ChartType>('line');
  
  // Stock symbol state
  const [stockSymbol, setStockSymbol] = useState('');
  const [symbolParam, setSymbolParam] = useState<string | null>(null);


  
  // API Key state - persisted in localStorage
  const [alphaVantageKey, setAlphaVantageKey] = useState('');
  const [finnhubKey, setFinnhubKey] = useState('');
  const [indianApiKey, setIndianApiKey] = useState('');
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  // API testing state
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState('');
  const [apiResponse, setApiResponse] = useState<Record<string, unknown> | null>(null);
  const [fieldTree, setFieldTree] = useState<FieldNode[]>([]);
  
  // Field selection state
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fieldSearch, setFieldSearch] = useState('');
  const [showArraysOnly, setShowArraysOnly] = useState(false);
  
  // Preset state
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showPresets, setShowPresets] = useState(true);
  


  // Store
  const { addWidget, addToast } = useWidgetStore();
  

  // Load API keys from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAlphaKey = localStorage.getItem('finboard_alpha_vantage_key') || '';
      const savedFinnhubKey = localStorage.getItem('finboard_finnhub_key') || '';
      const savedIndianKey = localStorage.getItem('finboard_indianapi_key') || '';
      setAlphaVantageKey(savedAlphaKey);
      setFinnhubKey(savedFinnhubKey);
      setIndianApiKey(savedIndianKey);
      

      // Show API keys section   if no keys are saved
      if (!savedAlphaKey && !savedFinnhubKey && !savedIndianKey) {
        setShowApiKeys(true);
      }
    }
  }, [isOpen]);
  

  // Save API keys to localStorage
  const saveApiKeys = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finboard_alpha_vantage_key', alphaVantageKey);
      localStorage.setItem('finboard_finnhub_key', finnhubKey);
      localStorage.setItem('finboard_indianapi_key', indianApiKey);
      addToast('API keys saved!', 'success');
    }
  }, [alphaVantageKey, finnhubKey, indianApiKey, addToast]);



  // Reset form
  const resetForm = useCallback(() => {
    setWidgetName('');
    setApiUrl('');
    setRefreshInterval(30);
    setWidgetType('card');
    setWidgetSize('medium');
    setChartType('line');
    setStockSymbol('');
    setSymbolParam(null);
    setTestStatus('idle');
    setTestError('');
    setApiResponse(null);
    setFieldTree([]);
    setSelectedFields([]);
    setFieldSearch('');
    setShowArraysOnly(false);
    setSelectedPreset('');
    setShowPresets(true);
  }, []);


  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };


  // Build field tree from object
  const buildFieldTree = (obj: unknown, path = '', depth = 0): FieldNode[] => {
    if (depth > 5) return [];
    
    if (obj === null || obj === undefined) return [];
    
    if (Array.isArray(obj)) {

      if (obj.length === 0) return [];

      const firstItem = obj[0];

      if (typeof firstItem === 'object' && firstItem !== null) {
        return buildFieldTree(firstItem, path ? `${path}[0]` : '[0]', depth + 1);
      }

      return [{
        key: 'items',
        path: path || 'root',
        value: `Array[${obj.length}]`,
        type: 'array',
      }];
    }
    
    if (typeof obj === 'object') {
      return Object.entries(obj as Record<string, unknown>).map(([key, value]) => {

        const currentPath = path ? `${path}.${key}` : key;
        const type = Array.isArray(value) ? 'array' : typeof value;
        
        const node: FieldNode = {
          key,
          path: currentPath,
          value: type === 'object' || type === 'array' ? null : value,
          type,
          isExpanded: depth < 2,
        };
        
        if (type === 'object' || type === 'array') {
          node.children = buildFieldTree(value, currentPath, depth + 1);
        }
        
        return node;
      });
    }
    
    return [];
  };




  const testApi = async () => {
    if (!apiUrl.trim()) {
      setTestError('Please enter an API URL');
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    setTestError('');
    setApiResponse(null);
    setFieldTree([]);

    try {
      // Prepare headers
      const headers: HeadersInit = { 'Accept': 'application/json' };
      

      if (apiUrl.includes('indianapi.in') && indianApiKey) {
        headers['X-Api-Key'] = indianApiKey;
      }
      
      const response = await fetch(apiUrl, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      


      // Check for API error messages
      if (data['Error Message']  || data['Note'] || data.error) {
        throw new Error(data['Error Message'] ||  data['Note'] || data.error);
      }
      
      setApiResponse(data);
      setFieldTree(buildFieldTree(data));
      setTestStatus('success');
      
      // Count fields
      const flatData =   flattenObject(data);
      const fieldCount  = Object.keys(flatData).length;
      addToast(`API connection successful! ${fieldCount} fields found.`, 'success');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect';
      setTestError(message );
      setTestStatus('error' );
    }
  };




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

  // Apply preset
  const applyPreset = (presetKey: string) => {
    const preset = API_PRESETS[presetKey];

    if (!preset) return;
    
    setSelectedPreset(presetKey);
    setWidgetName(preset.name);
    

    if (preset.symbolParam) {
      setSymbolParam(preset.symbolParam);

      setStockSymbol(preset.defaultSymbol || '');
    } 
    else {

      setSymbolParam(null);
      setStockSymbol('');
    }
    

    const urlWithUserKeys = replaceApiKeysInUrl(preset.url);

    setApiUrl(urlWithUserKeys);
    
    setWidgetType(preset.defaultType || 'card');
    setChartType(preset.defaultChartType || 'line');
    setShowPresets(false);
    

    setTimeout(() => {

      setApiUrl(urlWithUserKeys);
    }, 100);
  };

  const toggleField = (path: string) => {

    setSelectedFields(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };



  // Toggle field expansion
  const toggleExpand = (path: string) => {

    const updateTree = (nodes: FieldNode[]): FieldNode[] => {
      return nodes.map(node => {

        if (node.path === path) {
          return { ...node, isExpanded: !node.isExpanded };
        }

        if (node.children) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    setFieldTree(updateTree(fieldTree));
  };

  // Filter fields
  const filterFields = (nodes: FieldNode[]): FieldNode[] => {

    return nodes.filter(node => {

      const matchesSearch = !fieldSearch || 
        node.key.toLowerCase().includes(fieldSearch.toLowerCase()) ||
        node.path.toLowerCase().includes(fieldSearch.toLowerCase());
      
      const matchesArrayFilter = !showArraysOnly || node.type === 'array' || node.children?.some(c => c.type === 'array');
      
      if (node.children) 
        {
        const filteredChildren = filterFields(node.children);
        if (filteredChildren.length > 0) return true;
      }
      
      return matchesSearch && matchesArrayFilter;
    });



  };



  // Render field tree
  const renderFieldNode = (node: FieldNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedFields.includes(node.path);

    const filteredChildren = hasChildren ? filterFields(node.children!) : [];
    
    return (
      <div key={node.path} style={{ paddingLeft: depth * 16 }}>

        <div 
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
            "hover:bg-slate-100 dark:hover:bg-slate-700",
            isSelected && "bg-emerald-50 dark:bg-emerald-900/20"
          )}
          onClick={() => !hasChildren && toggleField(node.path)}
        >

          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.path); }}
              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
            >
              {node.isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}

            </button>
          ) : (
            <div className="w-5" />
          )}
          

          <span className={cn(
            "text-xs px-1.5 py-0.5 rounded  font-mono",
            node.type ===  'string' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
            node.type === 'number' && "bg-emerald-100 dark:bg-emerald-900/30  text-emerald-700 dark:text-emerald-300",
            node.type ===  'array' && "bg-purple-100  dark:bg-purple-900/30  text-purple-700 dark:text-purple-300",
            node.type === 'object' && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
            node.type === 'boolean' && "bg-pink-100 dark:bg-pink-900/30 text-pink-700  dark:text-pink-300",
          )}>
            {node.type}
          </span>
          


          <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
            {node.key}
          </span>
          

          {!hasChildren && node.value !== null && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
              {String(node.value).substring(0, 30)}
              {String(node.value).length > 30 && '...'}
            </span>
          )}
          
          {!hasChildren && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleField(node.path); }}
              className={cn(
                "p-1 rounded transition-colors",
                isSelected 
                  ? "bg-emerald-500 text-white" 
                  : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-500"
              )}
            >
              {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            </button>
          )}
        </div>


        
        {hasChildren && node.isExpanded && (
          <div>
            {filteredChildren.map(child => renderFieldNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Create widget
  const handleCreateWidget = () => {

    if (!widgetName.trim()) 
      {
      addToast('Please enter a widget name', 'error');
      return;
    }
    


    if (!apiUrl.trim()) {
      addToast('Please enter an API URL', 'error');
      return;
    }

    // Get headers from preset if available
    const preset = selectedPreset ? API_PRESETS[selectedPreset] : null;
    let headers = preset?.headers ? { ...preset.headers } : undefined;
    


    if (indianApiKey && apiUrl.includes('indianapi.in')) 
    {
      headers = { ...headers, 'X-Api-Key': indianApiKey };
    }
    

    // Apply user API keys to URL
    const finalUrl = replaceApiKeysInUrl(apiUrl);

    const widget = {
      id: generateId(),
      title: widgetName,
      type: widgetType,
      size: widgetSize,
      apiConfig: {
        url: finalUrl,
        method: 'GET' as const,
        ...(headers && { headers }),
      },
      refreshInterval,
      fieldMappings: selectedFields.map(path => ({
        sourceField: path,
        displayName: path.split('.').pop() || path,
      })),
      preset: selectedPreset || undefined,
      createdAt: new Date().toISOString(),


      ...(widgetType === 'chart' && {
        chartConfig: {
          type: chartType,
          showGrid: true,
          showTooltip: true,
        },
      }),
    };

    addWidget(widget);
    addToast(`Widget "${widgetName}" created successfully!`, 'success');
    handleClose();
  };


  // Widget type options
  const widgetTypes: Array<{ value: WidgetType; label: string; icon: React.ReactNode; description: string }> = [
    { value: 'card', label: 'Card', icon: <LayoutGrid className="w-5 h-5" />, description: 'Key-value display' },
    { value: 'table', label: 'Table', icon: <Table className="w-5 h-5" />, description: 'Paginated data grid' },
    { value: 'chart', label: 'Chart', icon: <LineChart className="w-5 h-5" />, description: 'Line/bar visualization' },
  ];


  // Widget size options
  const widgetSizes: Array<{ value: WidgetSize; label: string }> = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'full', label: 'Full Width' },
  ];



  // Preset categories - organized by provider
  const presetCategories = [
    { key: 'charts', label: '📊 Charts (Alpha Vantage - 5 calls/min)', presets: ['chartStockDaily', 'chartStockWeekly', 'chartStockMonthly', 'chartStockIntraday', 'chartCryptoDaily', 'chartCryptoWeekly', 'chartForexDaily', 'chartForexWeekly'] },
    { key: 'finnhub', label: '⚡ Finnhub Data (60 calls/min)', presets: ['finnhubQuote', 'finnhubProfile', 'finnhubPeers', 'finnhubRecommendation', 'finnhubNews'] },
    
    { key: 'indian', label: '🇮🇳 IndianAPI (BSE/NSE)', presets: ['indianStockData', 'indian52WeekHighLow', 'indianIndustrySearch', 'indianIPO', 'indianMutualFunds'] },
    { key: 'stocks', label: '📈 Stocks (Alpha Vantage - 5 calls/min)', presets: ['stockQuote', 'stockDaily', 'stockWeekly', 'stockIntraday', 'companyOverview'] },
    
    { key: 'crypto', label: '🪙 Crypto', presets: ['cryptoExchangeRate', 'cryptoDaily', 'cryptoWeekly'] },
    { key: 'forex', label: '💱 Forex', presets: ['forexExchangeRate', 'forexDaily'] },
    { key: 'market', label: '🌍 Market Overview', presets: ['finnhubNews', 'topGainersLosers', 'sectorPerformance'] },
  ];




  const isAlphaVantagePreset = selectedPreset && API_PRESETS[selectedPreset]?.provider === 'alphavantage';

  return (

    <Modal isOpen={isOpen} onClose ={handleClose} size ="xl" title ="Add New Widget">
      <div className="space-y-6">

        {/* Presets Section */}
        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">

                <div className="flex items-center gap-2">

                  <Sparkles className="w-5 h-5 text-amber-500" />

                  <h3 className="font-semibold text-slate-900 dark:text-white">Choose Data Source</h3>
                </div>
                <button
                  onClick={() => setShowPresets(false)}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Skip & Configure Manually
                </button>
              </div>




              {/* Rate Limit Info Box */}
              
              <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>💡 Tip:</strong> Use <strong>Finnhub</strong> for faster data (60 requests/min). 
                  Alpha Vantage has strict limits (5 req/min, 25/day free tier).
                </p>

              </div>


              
              {/* API Keys Configuration */}
              <div className="mb-4">

                <button
                  onClick={() => setShowApiKeys(!showApiKeys)}
                  className="flex items-center gap-2 w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Key className="w-4 h-4 text-amber-500" />
                  
                  
                  <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
                    API Keys Configuration
                  </span>
                  
                  <span className="text-xs text-slate-500 ml-auto">
                    {(alphaVantageKey || finnhubKey || indianApiKey) ? '✓ Keys saved' : 'Click to setup'}
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
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 mt-2 space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                          Enter your API keys to use the presets. Keys are saved locally in your browser.
                        </p>
                        
                        {/* Alpha Vantage */}
                        <div>
                          <label className="block text-xs  font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Alpha Vantage API Key
                            <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener noreferrer" 
                               className="ml-2 text-blue-500 hover:underline">Get free key →</a>
                          </label>


                          <input
                            type="text"
                            value={alphaVantageKey}
                            onChange={(e) => setAlphaVantageKey(e.target.value)}
                            placeholder="e.g., ABCD1234EFGH5678"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Finnhub */}
                        <div>

                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Finnhub API Key
                            <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer"
                               className="ml-2 text-blue-500 hover:underline">Get free key →</a>
                          </label>

                          <input
                            type="text"
                            value={finnhubKey}
                            onChange={(e) => setFinnhubKey(e.target.value)}
                            placeholder="e.g., c1234abcd5678efgh"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        



                        {/* IndianAPI */}
                        <div>

                          <label className="block text-xs  font-medium  text-slate-600 dark:text-slate-400 mb-1">
                            IndianAPI Key (BSE/NSE)
                            <a href="https://indianapi.in" target="_blank" rel="noopener noreferrer"
                               className="ml-2 text-blue-500 hover:underline">Get key →</a>
                          </label>


                          <input
                            type="text"
                            value={indianApiKey}
                            onChange={(e) => setIndianApiKey(e.target.value)}
                            placeholder="e.g., sk-live-..."
                            className="w-full px-3 py-2  text-sm rounded-lg border  border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                        
                        <button
                          onClick={saveApiKeys}
                          className="flex items-center  justify-center gap-2 w-full  py-2 mt-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save API Keys
                        </button>

                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>

              </div>
              



              <div className="space-y-4">
                {presetCategories.map(category => (

                  <div key={category.key} className={cn(
                    "p-3 rounded-lg transition-colors",
                    category.key === 'finnhub' ? "bg-emerald-50  dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800" : ""
                  )}>

                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      {category.label}
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {category.presets.map(presetKey => {
                        const preset = API_PRESETS[presetKey];
                        if (!preset) return null;
                        
                        const isFinnhub = preset.provider === 'finnhub';
                        
                        return (

                          <button
                            key={presetKey}
                            onClick={() => applyPreset(presetKey)}
                            title={preset.description}

                            className={cn(
                              "px-3 py-1.5 text-sm rounded-full border transition-all",
                              selectedPreset === presetKey
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : isFinnhub
                                  ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600"
                            )}
                          >
                            {preset.name.split(' · ')[1] || preset.name}
                          </button>
                        );
                      })}

                    </div>
                  </div>

                ))}
              </div>



              {/* Alpha Vantage Warning */}
              {isAlphaVantagePreset && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                >
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>⚠️ Rate Limit Warning:</strong> Alpha Vantage free tier allows only 5 calls/min and 25 calls/day. 
                    Consider using Finnhub for better performance.
                  </p>
                </motion.div>
              )}


            </motion.div>
          )}
        </AnimatePresence>



        {/* Widget Name */}
        <Input
          label="Widget Name"
          placeholder="e.g., Bitcoin Price Tracker"
          value={widgetName}
          onChange={(e) => setWidgetName(e.target.value)}
          leftIcon={<Zap className="w-4 h-4" />}
        />



        {/* API URL with Test */}
        <div className="space-y-2">

          <label className="block text-sm font-medium  text-slate-700 dark:text-slate-300">
            API URL
          </label>

          <div className="flex gap-2">

            <div className="flex-1">
              <Input
                placeholder="https://api.example.com/data"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                leftIcon={<Globe className="w-4 h-4" />}
                error={testStatus === 'error' ? testError : undefined}
              />
            </div>


            <Button
              onClick={testApi}
              disabled={testStatus === 'testing' || !apiUrl.trim()}
              variant={testStatus === 'success' ? 'success' : 'secondary'}
              className="shrink-0"
            >
              {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {testStatus === 'success' && <Check className="w-4 h-4 mr-2" />}
              {testStatus === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
              <RefreshCw className="w-4 h-4 mr-1" />
              Test
            </Button>

          </div>
          


          {/* Test Status */}
          {testStatus === 'success' && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400"
            >
              <Check className="w-4 h-4" />
              API connection successful! {Object.keys(flattenObject(apiResponse || {})).length} fields found.
            </motion.p>
          )}
        </div>


        {/* Stock Symbol Input */}
        {symbolParam && (
          <div className="space-y-2">


            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              {symbolParam === 'name' ? 'Stock Name' : 'Stock Symbol'}
            </label>



            <Input
              value={stockSymbol}
              onChange={(e) => {
                const value = symbolParam === 'name' ? e.target.value : e.target.value.toUpperCase();
                setStockSymbol(value);
                
                if (apiUrl) 
                {
                  try {
                    const urlObj = new URL(apiUrl);
                    urlObj.searchParams.set(symbolParam, value);

                    setApiUrl(urlObj.toString());
                  } 
                  catch 
                  {
                    const regex = new RegExp(`${symbolParam}=[^&]+`);

                    if (apiUrl.match(regex)) 
                    {
                      setApiUrl(apiUrl.replace(regex, `${symbolParam}=${value}`));
                    }
                  }
                }
              }}

              placeholder={symbolParam === 'name' ? "e.g., Reliance, TCS, Infosys" : "e.g., AAPL, GOOGL, MSFT"}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {symbolParam === 'name' 
                ? '💡 Enter the company name (case-insensitive)'
                : '💡 Enter the stock ticker symbol'}
            </p>
          </div>

        )}



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


        {/* Display Mode Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Display Mode
          </label>


          <div className="grid grid-cols-3 gap-3">
            {widgetTypes.map(type => (

              <button
                key={type.value}
                onClick={() => setWidgetType(type.value)}
                className={cn(
                  "flex flex-col items-center gap-2  p-4 rounded-xl border-2 transition-all",
                  widgetType === type.value
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >

                <div className={cn(
                  "p-2 rounded-lg",
                  widgetType === type.value
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  {type.icon}
                </div>

                <span className={cn(
                  "font-medium text-sm",
                  widgetType === type.value
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-700 dark:text-slate-300"
                )}>
                  {type.label}
                </span>

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {type.description}
                </span>


              </button>
            ))}
          </div>
        </div>


        {/* Chart Type Selection */}
        {widgetType === 'chart' && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Chart Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'line' as ChartType , label: 'Line', icon: '📈' },
                { value: 'area' as ChartType, label: 'Area', icon: '📊' },
                { value: 'bar' as ChartType , label: 'Bar', icon: '📶' },
                { value: 'candlestick' as ChartType , label: 'Candle' , icon: '🕯️' },
              ].map(type => (
                <button
                  key={type.value}
                  onClick={() => setChartType(type.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                    chartType === type.value
                      ? "border-emerald-500  bg-emerald-50 dark:bg-emerald-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <span className="text-xl">{type.icon}</span>

                  <span className={cn(
                    "font-medium text-xs",
                    chartType === type.value
                      ? "text-emerald-600  dark:text-emerald-400"
                      : "text-slate-600 dark:text-slate-400"
                  )}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>


            <p className="text-xs text-amber-600  dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
              💡 <strong>Tip:</strong> For charts, use presets from "📊 Charts (Alpha Vantage)" category - they return historical time series data needed for graphs. Note: 5 calls/min limit.
            </p>
          </div>
        )}
  



        {/* Widget Size */}
        <div className="space-y-2">

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Widget Size
          </label>


          <div className="flex gap-2">
            {widgetSizes.map(size => (
              <button
                key={size.value}
                onClick={() => setWidgetSize(size.value)}
                className={cn(
                  "px-4 py-2 rounded-lg border   text-sm font-medium transition-all",
                  widgetSize === size.value
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>


        {/* Field Selection */}
        {testStatus === 'success' && fieldTree.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Select Fields to Display
              </label>


              <label className="flex items-center gap-2 text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={showArraysOnly}
                  onChange={(e) => setShowArraysOnly(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Show arrays only (for table view)
              </label>
            </div>
            


            <Input
              placeholder="Search fields..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            
            <div className="max-h-64  overflow-y-auto border   border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50 dark:bg-slate-900">
              {filterFields(fieldTree).map(node => renderFieldNode(node))}
            </div>
            


            {/* Selected Fields */}
            {selectedFields.length > 0 && (
              <div className="space-y-2">

                <p className="text-sm font-medium   text-slate-700  dark:text-slate-300">
                  Selected Fields ({selectedFields.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFields.map(field => (
                    <span
                      key={field}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm rounded-full"
                    >
                      {field.split('.').pop()}
                      <button
                        onClick={() => toggleField(field)}
                        className="p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

              </div>
            )}
          </motion.div>
        )}



        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t   border-slate-200  dark:border-slate-700">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>

          <Button 
            onClick={handleCreateWidget}
            disabled={!widgetName.trim() || !apiUrl.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Widget
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddWidgetModal;