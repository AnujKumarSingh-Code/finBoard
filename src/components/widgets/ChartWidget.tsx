'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Cell,
} from 'recharts';
import { WidgetConfig } from '@/types';
import { formatCurrency, formatNumber, cn } from '@/utils';
import { TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react';

interface ChartWidgetProps {
  widget: WidgetConfig;
  data: unknown;
}

interface ChartDataPoint {
  date: string;
  timestamp?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change?: number;
  changePercent?: number;
}

// ============================================
// COMPREHENSIVE DATA PARSER
// Handles Finnhub, Alpha Vantage, IndianAPI
// ============================================

function parseChartData(data: unknown): ChartDataPoint[] {
  if (!data || typeof data !== 'object') {
    console.log('[ChartWidget] No data or invalid data type:', typeof data);
    return [];
  }

  const obj = data as Record<string, unknown>;
  
  // Log for debugging
  console.log('[ChartWidget] Parsing data with keys:', Object.keys(obj));

  // ============================================
  // CHECK FOR API ERROR RESPONSES FIRST
  // ============================================
  
  // Alpha Vantage rate limit error
  if (obj['Note'] || obj['Information']) {
    console.log('[ChartWidget] API rate limit or info message:', obj['Note'] || obj['Information']);
    return [];
  }
  
  // Alpha Vantage error
  if (obj['Error Message']) {
    console.log('[ChartWidget] API error:', obj['Error Message']);
    return [];
  }

  // ============================================
  // 1. FINNHUB CANDLE FORMAT
  // {c: [close], h: [high], l: [low], o: [open], t: [timestamps], v: [volumes], s: 'ok'}
  // ============================================
  if (obj.s === 'ok' && Array.isArray(obj.c) && Array.isArray(obj.t)) {
    console.log('[ChartWidget] Detected Finnhub candle format');
    const closes = obj.c as number[];
    const highs = (obj.h as number[]) || closes;
    const lows = (obj.l as number[]) || closes;
    const opens = (obj.o as number[]) || closes;
    const timestamps = obj.t as number[];
    const volumes = (obj.v as number[]) || [];

    return timestamps.map((t, i) => ({
      date: new Date(t * 1000).toISOString().split('T')[0],
      timestamp: t,
      open: opens[i] || closes[i],
      high: highs[i] || closes[i],
      low: lows[i] || closes[i],
      close: closes[i],
      volume: volumes[i] || 0,
      change: i > 0 ? closes[i] - closes[i - 1] : 0,
      changePercent: i > 0 ? ((closes[i] - closes[i - 1]) / closes[i - 1]) * 100 : 0,
    }));
  }

  // ============================================
  // 2. FINNHUB NO DATA
  // ============================================
  if (obj.s === 'no_data') {
    console.log('[ChartWidget] Finnhub returned no_data');
    return [];
  }

  // ============================================
  // 3. ALPHA VANTAGE TIME SERIES FORMATS
  // - "Time Series (Daily)", "Time Series (5min)", etc.
  // - "Weekly Time Series", "Monthly Time Series"
  // - "Time Series FX (Daily)"
  // - "Time Series (Digital Currency Daily)"
  // ============================================
  const timeSeriesKeys = Object.keys(obj).filter(key => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('time series') ||
           lowerKey.includes('digital currency') ||
           lowerKey.includes('technical analysis');
  });

  console.log('[ChartWidget] Found time series keys:', timeSeriesKeys);

  if (timeSeriesKeys.length > 0) {
    const seriesKey = timeSeriesKeys[0];
    const series = obj[seriesKey] as Record<string, Record<string, string>>;

    if (!series || typeof series !== 'object') {
      console.log('[ChartWidget] Series data is invalid:', series);
      return [];
    }

    const result: ChartDataPoint[] = [];
    const entries = Object.entries(series);
    
    console.log('[ChartWidget] Processing', entries.length, 'data points from', seriesKey);

    entries.forEach(([date, values], index) => {
      if (!values || typeof values !== 'object') return;
      
      // Handle various Alpha Vantage key formats
      const open = parseFloat(
        values['1. open'] ||
        values['1a. open (USD)'] ||
        values['open'] ||
        '0'
      );
      const high = parseFloat(
        values['2. high'] ||
        values['2a. high (USD)'] ||
        values['high'] ||
        '0'
      );
      const low = parseFloat(
        values['3. low'] ||
        values['3a. low (USD)'] ||
        values['low'] ||
        '0'
      );
      const close = parseFloat(
        values['4. close'] ||
        values['4a. close (USD)'] ||
        values['close'] ||
        '0'
      );
      const volume = parseFloat(
        values['5. volume'] ||
        values['6. volume'] ||
        values['volume'] ||
        '0'
      );

      // Only add if we have valid close price
      if (close > 0) {
        result.push({
          date,
          open: open || close,
          high: high || close,
          low: low || close,
          close,
          volume,
          change: index < entries.length - 1 
            ? close - parseFloat(entries[index + 1]?.[1]?.['4. close'] || String(close))
            : 0,
        });
      }
    });

    // Alpha Vantage returns newest first, we want oldest first for charts
    console.log('[ChartWidget] Parsed', result.length, 'valid data points');
    return result.reverse();
  }

  // ============================================
  // 4. ALPHA VANTAGE TECHNICAL INDICATORS
  // - RSI, MACD, SMA, EMA, etc.
  // ============================================
  const technicalKeys = Object.keys(obj).filter(key =>
    key.toLowerCase().includes('technical analysis')
  );

  if (technicalKeys.length > 0) {
    const seriesKey = technicalKeys[0];
    const series = obj[seriesKey] as Record<string, Record<string, string>>;

    const result: ChartDataPoint[] = [];
    Object.entries(series).forEach(([date, values]) => {
      const valueKey = Object.keys(values)[0];
      const value = parseFloat(values[valueKey] || '0');

      result.push({
        date,
        open: value,
        high: value,
        low: value,
        close: value,
        volume: 0,
      });
    });

    return result.reverse();
  }

  // ============================================
  // 5. INDIANAPI FORMATS
  // - Stock technical data with historical prices
  // ============================================
  if (obj.stockTechnicalData || obj.historicalPrices) {
    const historical = (obj.historicalPrices || obj.stockTechnicalData) as Record<string, unknown>[];

    if (Array.isArray(historical)) {
      return historical.map((item: Record<string, unknown>) => ({
        date: String(item.date || item.timestamp || ''),
        open: Number(item.open || item.openPrice || 0),
        high: Number(item.high || item.highPrice || 0),
        low: Number(item.low || item.lowPrice || 0),
        close: Number(item.close || item.closePrice || item.price || 0),
        volume: Number(item.volume || 0),
      }));
    }
  }

  // ============================================
  // 6. GENERIC ARRAY FORMAT
  // [{date, open, high, low, close, volume}, ...]
  // ============================================
  if (Array.isArray(obj)) {
    const arr = obj as Record<string, unknown>[];
    if (arr.length > 0 && (arr[0].close !== undefined || arr[0].price !== undefined || arr[0].value !== undefined)) {
      return arr.map((item, index) => ({
        date: String(item.date || item.timestamp || item.time || index),
        open: Number(item.open || item.price || item.value || item.close || 0),
        high: Number(item.high || item.price || item.value || item.close || 0),
        low: Number(item.low || item.price || item.value || item.close || 0),
        close: Number(item.close || item.price || item.value || 0),
        volume: Number(item.volume || 0),
      }));
    }
  }

  // ============================================
  // 7. NESTED DATA ARRAY
  // {data: [{...}, ...]} or {results: [...]}
  // ============================================
  const nestedKeys = ['data', 'results', 'items', 'series', 'prices', 'candles'];
  for (const key of nestedKeys) {
    if (Array.isArray(obj[key])) {
      return parseChartData(obj[key]);
    }
  }

  // ============================================
  // 8. COMPANY FINANCIALS (Finnhub)
  // {series: {annual: {revenue: [{v, period}]}}}
  // ============================================
  if (obj.series && typeof obj.series === 'object') {
    const series = obj.series as Record<string, Record<string, unknown[]>>;
    const annual = series.annual || series.quarterly;

    if (annual) {
      // Get first available metric
      const metricKey = Object.keys(annual)[0];
      if (metricKey && Array.isArray(annual[metricKey])) {
        const values = annual[metricKey] as Array<{ v: number; period: string }>;
        return values.map(item => ({
          date: item.period,
          open: item.v,
          high: item.v,
          low: item.v,
          close: item.v,
          volume: 0,
        })).reverse();
      }
    }
  }

  return [];
}

// ============================================
// DATE FORMATTING
// ============================================
function formatChartDate(dateStr: string): string {
  if (!dateStr) return '';

  // Check if it's already a short format
  if (dateStr.length <= 10) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return `${parts[1]}/${parts[2] || '01'}`;
    }
  }

  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  } catch {
    // Fall through
  }

  return dateStr.substring(0, 10);
}

// ============================================
// CHART COLORS
// ============================================
const chartColors = {
  primary: '#10b981', // Emerald
  secondary: '#6366f1', // Indigo
  success: '#22c55e',
  danger: '#ef4444',
  muted: '#94a3b8',
  gridLight: '#e2e8f0',
  gridDark: '#334155',
  candleUp: '#22c55e',
  candleDown: '#ef4444',
  volume: '#94a3b8',
};

// ============================================
// CANDLESTICK COMPONENT
// ============================================
interface CandlestickProps {
  x: number;
  y: number;
  width: number;
  height: number;
  open: number;
  close: number;
  high: number;
  low: number;
  yAxisMin: number;
  yAxisMax: number;
  chartHeight: number;
}

const Candlestick = ({ x, y, width, open, close, high, low, yAxisMin, yAxisMax, chartHeight }: CandlestickProps) => {
  const isUp = close >= open;
  const color = isUp ? chartColors.candleUp : chartColors.candleDown;

  const scale = (value: number) => {
    return chartHeight - ((value - yAxisMin) / (yAxisMax - yAxisMin)) * chartHeight;
  };

  const bodyTop = scale(Math.max(open, close));
  const bodyBottom = scale(Math.min(open, close));
  const bodyHeight = Math.max(1, bodyBottom - bodyTop);
  const wickTop = scale(high);
  const wickBottom = scale(low);

  const candleWidth = Math.max(3, width * 0.7);
  const candleX = x + (width - candleWidth) / 2;

  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={wickTop}
        x2={x + width / 2}
        y2={wickBottom}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={candleX}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={isUp ? 'transparent' : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// ============================================
// CUSTOM TOOLTIP
// ============================================
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint;
    const isPositive = (data.change || 0) >= 0;

    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-3 text-sm min-w-[150px]">
        <p className="font-semibold text-slate-900 dark:text-white mb-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          {formatChartDate(data.date)}
        </p>

        {data.open !== data.close && (
          <>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">Open:</span>
              <span className="text-slate-900 dark:text-white font-medium">{formatCurrency(data.open)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">High:</span>
              <span className="text-emerald-600 font-medium">{formatCurrency(data.high)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-500">Low:</span>
              <span className="text-red-600 font-medium">{formatCurrency(data.low)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between mb-1">
          <span className="text-slate-500">Close:</span>
          <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(data.close)}</span>
        </div>

        {data.change !== undefined && data.change !== 0 && (
          <div className={cn(
            "flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700",
            isPositive ? "text-emerald-600" : "text-red-600"
          )}>
            <span className="flex items-center gap-1">
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              Change:
            </span>
            <span className="font-medium">
              {isPositive ? '+' : ''}{data.changePercent?.toFixed(2)}%
            </span>
          </div>
        )}

        {data.volume > 0 && (
          <div className="flex justify-between mt-1 text-slate-400 text-xs">
            <span>Volume:</span>
            <span>{formatNumber(data.volume)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// ============================================
// MAIN CHART COMPONENT
// ============================================

export function ChartWidget({ widget, data }: ChartWidgetProps) {
  const chartData = useMemo(() => {
    const parsed = parseChartData(data);
    // Take last 100 data points for performance
    return parsed.slice(-100);
  }, [data]);

  // Calculate stats
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const closes = chartData.map(d => d.close);
    const min = Math.min(...chartData.map(d => d.low || d.close));
    const max = Math.max(...chartData.map(d => d.high || d.close));
    const avg = closes.reduce((a, b) => a + b, 0) / closes.length;
    const first = closes[0];
    const last = closes[closes.length - 1];
    const change = last - first;
    const changePercent = (change / first) * 100;

    return { min, max, avg, first, last, change, changePercent };
  }, [chartData]);

  // Check for API errors in the raw data
  const apiError = useMemo(() => {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;
    
    if (obj['Note']) {
      return { type: 'rate_limit', message: String(obj['Note']) };
    }
    if (obj['Information']) {
      return { type: 'info', message: String(obj['Information']) };
    }
    if (obj['Error Message']) {
      return { type: 'error', message: String(obj['Error Message']) };
    }
    return null;
  }, [data]);

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-4">
        <AlertCircle className="w-10 h-10 mb-3 text-amber-500" />
        <p className="font-medium mb-1 text-amber-600 dark:text-amber-400">
          {apiError.type === 'rate_limit' ? 'API Rate Limit Reached' : 'API Error'}
        </p>
        <p className="text-xs text-center text-slate-400 max-w-[250px] mb-2">
          {apiError.type === 'rate_limit' 
            ? 'Alpha Vantage free tier: 5 calls/min, 25/day. Please wait a moment.'
            : apiError.message.substring(0, 100)}
        </p>
        <p className="text-xs text-slate-400">
          Try refreshing in a minute ↻
        </p>
      </div>
    );
  }

  if (!chartData.length || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-4">
        <BarChart3 className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
        <p className="font-medium mb-1">No chart data available</p>
        <p className="text-xs text-center text-slate-400 max-w-[220px]">
          Use presets from "📊 Charts" category for proper time series data. Company Overview and Quote endpoints don't contain chart data.
        </p>
      </div>
    );
  }

  const chartType = widget.chartConfig?.type || 'line';
  const isPositiveTrend = stats.change >= 0;
  const trendColor = isPositiveTrend ? chartColors.success : chartColors.danger;

  // Y-axis domain with padding
  const yMin = stats.min * 0.995;
  const yMax = stats.max * 1.005;

  const renderChart = () => {
    switch (chartType) {
      case 'candlestick':
        return (
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-400"
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-400"
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={stats.avg} stroke={chartColors.muted} strokeDasharray="3 3" />
            <Bar
              dataKey="close"
              shape={(props: any) => {
                const { x, width, payload, index } = props;
                if (!payload) return <g key={index} />;
                return (
                  <Candlestick
                    key={index}
                    x={x}
                    y={0}
                    width={width}
                    height={0}
                    open={payload.open}
                    close={payload.close}
                    high={payload.high}
                    low={payload.low}
                    yAxisMin={yMin}
                    yAxisMax={yMax}
                    chartHeight={200}
                  />
                );
              }}
            />
          </ComposedChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`gradient-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-400"
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-400"
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={stats.avg} stroke={chartColors.muted} strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="close"
              stroke={trendColor}
              strokeWidth={2}
              fill={`url(#gradient-${widget.id})`}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-400"
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-400"
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="close" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => {
                const prevClose = index > 0 ? chartData[index - 1].close : entry.close;
                const isUp = entry.close >= prevClose;
                return (
                  <Cell key={`cell-${index}`} fill={isUp ? chartColors.success : chartColors.danger} />
                );
              })}
            </Bar>
          </BarChart>
        );

      case 'line':
      default:
        return (
          <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-400"
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fontSize: 10 }}
              stroke="currentColor"
              className="text-slate-400"
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={stats.avg} stroke={chartColors.muted} strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="close"
              stroke={trendColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: trendColor }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Stats Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            {formatCurrency(stats.last)}
          </span>
          <span className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full",
            isPositiveTrend
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
          )}>
            {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositiveTrend ? '+' : ''}{stats.changePercent.toFixed(2)}%
          </span>
        </div>
        <div className="text-xs text-slate-400">
          {chartData.length} points
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}