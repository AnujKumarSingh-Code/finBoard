// Widget Types
export type WidgetType = 'card' | 'table' | 'chart' | 'watchlist' | 'news';
export type ChartType = 'line' | 'area' | 'candlestick' | 'bar';
export type TimeInterval = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface ApiConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  apiKey?: string;
  params?: Record<string, string>;
}

export interface FieldMapping {
  path: string;
  label: string;
  format?: 'currency' | 'percentage' | 'number' | 'date' | 'text';
  decimals?: number;
}

export interface ChartConfig {
  type: ChartType;
  field?: string;
  timeInterval?: TimeInterval;
  showGrid?: boolean;
  showTooltip?: boolean;
  color?: string;
}

export interface WidgetConfig {
  id: string;
  title: string;
  name?: string; // Alias for title (backwards compat)
  type: WidgetType;
  apiConfig: ApiConfig;
  refreshInterval: number; // in seconds
  size: WidgetSize;
  position?: { x: number; y: number };
  chartConfig?: ChartConfig;
  fieldMappings?: Array<{ sourceField: string; displayName: string; format?: string }>;
  selectedFields?: FieldMapping[];
  symbols?: string[];
  preset?: string;
  createdAt: string;
  lastData?: unknown;
  lastUpdated?: number;
  isLoading?: boolean;
  error?: string | null;
}

export interface NewWidgetConfig extends Omit<WidgetConfig, 'id' | 'position' | 'lastData' | 'lastUpdated' | 'isLoading' | 'error'> {
  position?: { x: number; y: number };
}

// API Response Types
export interface StockQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume?: number;
  marketCap?: number;
  timestamp?: number;
}

export interface TimeSeriesData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  image?: string;
}

// Dashboard Types
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  widgets: NewWidgetConfig[];
}

export interface DashboardConfig {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  createdAt: number;
  updatedAt: number;
}

// Store Types
export interface WidgetStore {
  widgets: WidgetConfig[];
  activeTheme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  addWidget: (widget: NewWidgetConfig) => void;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  deleteWidget: (id: string) => void;
  reorderWidgets: (widgets: WidgetConfig[]) => void;
  updateWidgetData: (id: string, data: unknown) => void;
  setWidgetLoading: (id: string, isLoading: boolean) => void;
  setWidgetError: (id: string, error: string | null) => void;
  clearAllWidgets: () => void;
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ApiCache {
  [key: string]: CacheEntry<unknown>;
}

// Preset Types
export interface ApiPreset {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: 'stocks' | 'crypto' | 'forex' | 'indices' | 'news';
  apiConfig: Partial<ApiConfig>;
  defaultType: WidgetType;
  defaultChartType?: ChartType;
  fields?: FieldMapping[];
  requiresSymbol?: boolean;
  requiresApiKey?: boolean;
}

// UI Types
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
