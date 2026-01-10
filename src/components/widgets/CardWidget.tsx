'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Minus, DollarSign, Percent, Hash, 
  Calendar, Globe, Building2, ArrowUpRight, ArrowDownRight,
  Activity, BarChart3, Users, Clock, Tag, Briefcase, AlertCircle,
  Image as ImageIcon, ExternalLink, Link as LinkIcon, Newspaper,
  Phone, Mail, MapPin
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber, cn } from '@/utils';
import { WidgetConfig } from '@/types';

interface CardWidgetProps {
  widget: WidgetConfig;
  data: unknown;
  fields?: Array<{
    key: string;
    label: string;
    format?: 'currency' | 'percentage' | 'number' | 'text';
  }>;
}

// ============================================
// DATA EXTRACTION - Handles all API formats
// ============================================
function extractData(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  
  const obj = data as Record<string, unknown>;
  
  // ============================================
  // CHECK FOR API ERRORS/RATE LIMITS FIRST
  // ============================================
  
  // Alpha Vantage rate limit message
  if (obj['Information'] && typeof obj['Information'] === 'string') {
    const info = obj['Information'] as string;
    if (info.toLowerCase().includes('thank you') || info.toLowerCase().includes('rate limit') || info.toLowerCase().includes('api call frequency')) {
      return {
        error: 'Rate Limit',
        message: 'API rate limit reached. Please wait a minute and try again.',
        details: info.substring(0, 100) + '...',
        isRateLimited: true,
      };
    }
    return {
      info: 'API Message',
      message: info,
    };
  }
  
  // Alpha Vantage Note (rate limit warning)
  if (obj['Note'] && typeof obj['Note'] === 'string') {
    const note = obj['Note'] as string;
    if (note.toLowerCase().includes('api call frequency') || note.toLowerCase().includes('rate limit')) {
      return {
        error: 'Rate Limit',
        message: 'API rate limit reached. Alpha Vantage allows 5 calls/minute.',
        suggestion: 'Try using Finnhub presets instead (60 calls/min)',
        isRateLimited: true,
      };
    }
  }
  
  // Generic error message
  if (obj['Error Message'] || obj['error']) {
    return {
      error: 'API Error',
      message: (obj['Error Message'] || obj['error']) as string,
    };
  }
  
  // ============================================
  // ALPHA VANTAGE FORMATS
  // ============================================
  
  // 1. Global Quote (Stock Quote)
  if (obj['Global Quote'] && typeof obj['Global Quote'] === 'object') {
    const quote = obj['Global Quote'] as Record<string, string>;
    return {
      symbol: quote['01. symbol'],
      open: quote['02. open'],
      high: quote['03. high'],
      low: quote['04. low'],
      price: quote['05. price'],
      volume: quote['06. volume'],
      latestTradingDay: quote['07. latest trading day'],
      previousClose: quote['08. previous close'],
      change: quote['09. change'],
      changePercent: quote['10. change percent']?.replace('%', ''),
    };
  }
  
  // 2. Realtime Currency Exchange Rate (Crypto/Forex)
  if (obj['Realtime Currency Exchange Rate'] && typeof obj['Realtime Currency Exchange Rate'] === 'object') {
    const rate = obj['Realtime Currency Exchange Rate'] as Record<string, string>;
    return {
      fromCurrency: rate['1. From_Currency Code'],
      fromCurrencyName: rate['2. From_Currency Name'],
      toCurrency: rate['3. To_Currency Code'],
      toCurrencyName: rate['4. To_Currency Name'],
      exchangeRate: rate['5. Exchange Rate'],
      lastRefreshed: rate['6. Last Refreshed'],
      timeZone: rate['7. Time Zone'],
      bidPrice: rate['8. Bid Price'],
      askPrice: rate['9. Ask Price'],
    };
  }
  
  // 3. Time Series data (FX, Crypto, Stocks - Daily/Weekly/Monthly)
  const timeSeriesKeys = Object.keys(obj).filter(key => 
    key.toLowerCase().includes('time series') ||
    key.toLowerCase().includes('digital currency') ||
    key.toLowerCase().includes('fx')
  );
  
  if (timeSeriesKeys.length > 0) {
    const seriesKey = timeSeriesKeys[0];
    const series = obj[seriesKey] as Record<string, Record<string, string>>;
    const dates = Object.keys(series).sort().reverse();
    
    if (dates.length > 0) {
      const latestDate = dates[0];
      const latestData = series[latestDate];
      
      // Clean up keys (remove numbering like "1. ", "1a. ", etc.)
      const cleaned: Record<string, unknown> = { date: latestDate };
      Object.entries(latestData).forEach(([key, value]) => {
        const cleanKey = key
          .replace(/^\d+[a-z]?\.\s*/i, '')
          .replace(/\s*\([^)]*\)\s*/g, '')
          .trim()
          .replace(/\s+/g, '')
          .replace(/^./, c => c.toLowerCase());
        cleaned[cleanKey] = value;
      });
      
      return cleaned;
    }
  }
  
  // 4. Handle Meta Data - skip it and look for actual data
  if (obj['Meta Data']) {
    const dataKeys = Object.keys(obj).filter(key => key !== 'Meta Data');
    if (dataKeys.length > 0) {
      return extractData(obj[dataKeys[0]]);
    }
  }
  
  // ============================================
  // FINNHUB FORMATS
  // ============================================
  
  // 5. Finnhub Quote (simple format with c, o, h, l, etc.)
  if ('c' in obj && 'o' in obj && 'h' in obj && 'l' in obj && !obj['symbol']) {
    return {
      price: obj.c,
      open: obj.o,
      high: obj.h,
      low: obj.l,
      previousClose: obj.pc,
      change: obj.d,
      changePercent: obj.dp,
      timestamp: obj.t,
    };
  }
  
  // 6. Finnhub Company Profile
  if (obj.ticker && obj.name && (obj.finnhubIndustry || obj.marketCapitalization)) {
    return {
      symbol: obj.ticker,
      name: obj.name,
      country: obj.country,
      currency: obj.currency,
      exchange: obj.exchange,
      ipo: obj.ipo,
      marketCap: obj.marketCapitalization,
      industry: obj.finnhubIndustry,
      logo: obj.logo,
      website: obj.weburl,
      phone: obj.phone,
    };
  }
  
  // 7. Finnhub Recommendation Trends (array format)
  if (Array.isArray(obj) && obj.length > 0 && obj[0].buy !== undefined && obj[0].sell !== undefined) {
    const latest = obj[0] as Record<string, unknown>;
    return {
      period: latest.period,
      strongBuy: latest.strongBuy,
      buy: latest.buy,
      hold: latest.hold,
      sell: latest.sell,
      strongSell: latest.strongSell,
    };
  }
  
  // 8. Finnhub Peers (string array)
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'string') {
    const peers = obj as string[];
    return {
      peers: peers.slice(0, 10).join(', '),
      totalPeers: peers.length,
    };
  }
  
  // 9. Finnhub Market News (array of news items)
  if (Array.isArray(obj) && obj.length > 0 && obj[0].headline !== undefined) {
    const news = obj[0] as Record<string, unknown>;
    return {
      headline: news.headline,
      datetime: news.datetime ? new Date((news.datetime as number) * 1000).toLocaleString() : undefined,
      image: news.image,
      source: news.source,
      summary: news.summary,
      url: news.url,
    };
  }
  
  // ============================================
  // INDIANAPI FORMATS
  // ============================================
  
  // 10. IndianAPI Stock Data
  if (obj.tickerId && obj.companyName && obj.currentPrice) {
    const currentPrice = obj.currentPrice as Record<string, unknown>;
    return {
      ticker: obj.tickerId,
      company: obj.companyName,
      industry: obj.industry,
      bsePrice: currentPrice?.BSE,
      nsePrice: currentPrice?.NSE,
      change: obj.percentChange,
      yearHigh: obj.yearHigh,
      yearLow: obj.yearLow,
    };
  }
  
  // 11. IndianAPI 52 Week High/Low
  if (obj.BSE_52WeekHighLow || obj.NSE_52WeekHighLow) {
    const bse = obj.BSE_52WeekHighLow as Record<string, unknown[]>;
    const nse = obj.NSE_52WeekHighLow as Record<string, unknown[]>;
    
    const result: Record<string, unknown> = {};
    if (bse?.high52Week?.[0]) {
      const item = bse.high52Week[0] as Record<string, unknown>;
      result.bseTopGainer = item.company;
      result.bseTopPrice = item.price;
    }
    if (nse?.high52Week?.[0]) {
      const item = nse.high52Week[0] as Record<string, unknown>;
      result.nseTopGainer = item.company;
      result.nseTopPrice = item.price;
    }
    return result;
  }
  
  // 12. IndianAPI Industry Search Results
  if (Array.isArray(obj) && obj.length > 0 && obj[0].commonName && obj[0].mgIndustry) {
    const items = obj.slice(0, 5) as Record<string, unknown>[];
    return {
      topCompanies: items.map(i => i.commonName).join(', '),
      industry: items[0].mgIndustry,
      sector: items[0].mgSector,
      count: obj.length,
    };
  }
  
  // ============================================
  // GENERIC ARRAY HANDLING
  // ============================================
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return null;
    
    // If it's an array of objects, extract first item
    if (typeof obj[0] === 'object' && obj[0] !== null) {
      const firstItem = obj[0] as Record<string, unknown>;
      return {
        ...firstItem,
        _totalItems: obj.length,
      };
    }
    
    // Array of primitives
    return {
      items: obj.slice(0, 5).join(', '),
      totalCount: obj.length,
    };
  }
  
  // ============================================
  // GENERIC OBJECT - FLATTEN IF NESTED
  // ============================================
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Flatten one level of nesting
      const nested = value as Record<string, unknown>;
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        if (nestedValue !== null && nestedValue !== undefined) {
          const newKey = key === 'data' ? nestedKey : `${key}_${nestedKey}`;
          result[newKey] = nestedValue;
        }
      }
    } else {
      result[key] = value;
    }
  }
  
  return Object.keys(result).length > 0 ? result : obj as Record<string, unknown>;
}

// ============================================
// URL & IMAGE DETECTION HELPERS
// ============================================

const isImageUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const str = value.toLowerCase();
  return (
    str.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)(\?.*)?$/i) !== null ||
    str.includes('/logo') ||
    str.includes('/image') ||
    str.includes('static2.finnhub')
  );
};

const isWebUrl = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  return value.startsWith('http://') || value.startsWith('https://');
};

const isPhoneNumber = (key: string, value: unknown): boolean => {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const keyLower = key.toLowerCase();
  return keyLower.includes('phone') || keyLower.includes('tel');
};

const isEmail = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// ============================================
// FORMATTING HELPERS
// ============================================

const getFieldIcon = (key: string) => {
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes('price') || keyLower.includes('cost') || keyLower.includes('bid') || keyLower.includes('ask')) 
    return <DollarSign className="w-4 h-4" />;
  if (keyLower.includes('percent') || keyLower.includes('change') || keyLower.includes('return')) 
    return <Percent className="w-4 h-4" />;
  if (keyLower.includes('volume') || keyLower.includes('chart') || keyLower.includes('bar')) 
    return <BarChart3 className="w-4 h-4" />;
  if (keyLower.includes('date') || keyLower.includes('time') || keyLower.includes('period') || keyLower.includes('refresh')) 
    return <Calendar className="w-4 h-4" />;
  if (keyLower.includes('country') || keyLower.includes('exchange') || keyLower.includes('market') || keyLower.includes('zone')) 
    return <Globe className="w-4 h-4" />;
  if (keyLower.includes('company') || keyLower.includes('name') || keyLower.includes('industry') || keyLower.includes('sector')) 
    return <Building2 className="w-4 h-4" />;
  if (keyLower.includes('symbol') || keyLower.includes('ticker') || keyLower.includes('currency')) 
    return <Tag className="w-4 h-4" />;
  if (keyLower.includes('buy') || keyLower.includes('sell') || keyLower.includes('hold') || keyLower.includes('recommend')) 
    return <Users className="w-4 h-4" />;
  if (keyLower.includes('cap') || keyLower.includes('ipo') || keyLower.includes('share')) 
    return <Briefcase className="w-4 h-4" />;
  if (keyLower.includes('high') || keyLower.includes('low') || keyLower.includes('open') || keyLower.includes('close')) 
    return <Activity className="w-4 h-4" />;
  if (keyLower.includes('image') || keyLower.includes('logo') || keyLower.includes('photo')) 
    return <ImageIcon className="w-4 h-4" />;
  if (keyLower.includes('url') || keyLower.includes('website') || keyLower.includes('link') || keyLower.includes('web')) 
    return <LinkIcon className="w-4 h-4" />;
  if (keyLower.includes('source') || keyLower.includes('headline') || keyLower.includes('news') || keyLower.includes('summary')) 
    return <Newspaper className="w-4 h-4" />;
  if (keyLower.includes('phone') || keyLower.includes('tel')) 
    return <Phone className="w-4 h-4" />;
  if (keyLower.includes('email') || keyLower.includes('mail')) 
    return <Mail className="w-4 h-4" />;
  if (keyLower.includes('address') || keyLower.includes('location')) 
    return <MapPin className="w-4 h-4" />;
    
  return <Hash className="w-4 h-4" />;
};

const formatValue = (
  value: unknown, 
  format?: 'currency' | 'percentage' | 'number' | 'text',
  key?: string
): string => {
  if (value === null || value === undefined) return '-';
  
  // Handle arrays - show count or summary
  if (Array.isArray(value)) {
    if (value.length === 0) return 'No items';
    // If array of primitives, show first few
    if (typeof value[0] !== 'object') {
      const preview = value.slice(0, 3).join(', ');
      return value.length > 3 ? `${preview}... (+${value.length - 3})` : preview;
    }
    // If array of objects, show count
    return `${value.length} items`;
  }
  
  // Handle nested objects - show summary
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 0) return 'Empty';
    
    // Try to find a display-worthy value
    const displayKeys = ['name', 'title', 'label', 'value', 'text', 'description', 'id'];
    for (const dk of displayKeys) {
      if (obj[dk] !== undefined && typeof obj[dk] !== 'object') {
        return String(obj[dk]);
      }
    }
    
    // Show first primitive value found
    for (const k of keys) {
      if (typeof obj[k] !== 'object' && obj[k] !== null) {
        return String(obj[k]);
      }
    }
    
    return `${keys.length} fields`;
  }
  
  const strValue = String(value);
  const numValue = parseFloat(strValue.replace(/[^0-9.-]/g, ''));
  const keyLower = (key || '').toLowerCase();
  
  // Auto-detect format based on key name
  if (!format) {
    if (keyLower.includes('percent') || keyLower.includes('change') || keyLower === 'dp') {
      format = 'percentage';
    } else if (
      keyLower.includes('price') || 
      keyLower.includes('cost') || 
      keyLower.includes('rate') ||
      keyLower.includes('bid') ||
      keyLower.includes('ask') ||
      keyLower.includes('cap') ||
      keyLower === 'c' || keyLower === 'o' || keyLower === 'h' || keyLower === 'l' || keyLower === 'pc'
    ) {
      format = 'currency';
    } else if (keyLower.includes('volume') || keyLower.includes('count') || keyLower.includes('total')) {
      format = 'number';
    }
  }
  
  // Handle market cap formatting
  if (keyLower.includes('marketcap') || keyLower.includes('cap')) {
    if (!isNaN(numValue)) {
      if (numValue >= 1e12) return `$${(numValue / 1e12).toFixed(2)}T`;
      if (numValue >= 1e9) return `$${(numValue / 1e9).toFixed(2)}B`;
      if (numValue >= 1e6) return `$${(numValue / 1e6).toFixed(2)}M`;
    }
  }
  
  // Handle volume formatting
  if (keyLower.includes('volume')) {
    if (!isNaN(numValue)) {
      if (numValue >= 1e9) return `${(numValue / 1e9).toFixed(2)}B`;
      if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(2)}M`;
      if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(1)}K`;
    }
  }
  
  // Apply specified format
  if (format === 'percentage') {
    if (!isNaN(numValue)) {
      const sign = numValue >= 0 ? '+' : '';
      return `${sign}${numValue.toFixed(2)}%`;
    }
    return strValue.includes('%') ? strValue : `${strValue}%`;
  }
  
  if (format === 'currency') {
    if (!isNaN(numValue)) {
      return formatCurrency(numValue);
    }
    return strValue;
  }
  
  if (format === 'number') {
    if (!isNaN(numValue)) {
      return formatNumber(numValue);
    }
    return strValue;
  }
  
  // Generic number formatting
  if (!isNaN(numValue) && strValue.match(/^-?\d+\.?\d*$/)) {
    if (Math.abs(numValue) >= 1000) return formatNumber(numValue);
    if (strValue.includes('.')) return numValue.toFixed(2);
    return strValue;
  }
  
  return strValue;
};

const getTrendIndicator = (value: unknown) => {
  const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  if (isNaN(numValue)) return null;
  
  if (numValue > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  if (numValue < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
};

const shouldShowTrend = (key: string): boolean => {
  const keyLower = key.toLowerCase();
  return keyLower.includes('change') || keyLower.includes('percent') || keyLower.includes('return');
};

const getValueColorClass = (key: string, value: unknown): string => {
  if (!shouldShowTrend(key)) return 'text-slate-900 dark:text-white';
  
  const numValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  if (isNaN(numValue)) return 'text-slate-900 dark:text-white';
  
  if (numValue > 0) return 'text-emerald-600 dark:text-emerald-400';
  if (numValue < 0) return 'text-red-600 dark:text-red-400';
  return 'text-slate-900 dark:text-white';
};

const formatLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// ============================================
// IMAGE COMPONENT WITH LOADING STATE
// ============================================

const ImageField: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  if (error) {
    return (
      <div className="w-full h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg">
        <ImageIcon className="w-6 h-6 text-slate-400" />
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-16 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
        </div>
      )}
      <img 
        src={src} 
        alt={alt}
        className={cn(
          "w-full h-full object-contain transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const CardWidget: React.FC<CardWidgetProps> = ({ widget, data, fields }) => {
  const dataObj = extractData(data);
  
  // Handle no data
  if (!dataObj || Object.keys(dataObj).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
        <p>No data available</p>
      </div>
    );
  }
  
  // Handle rate limit error
  if (dataObj.isRateLimited) {
    const suggestion = dataObj.suggestion as string | undefined;
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
          {dataObj.error as string}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          {dataObj.message as string}
        </p>
        {suggestion && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
            💡 {suggestion}
          </p>
        )}
      </div>
    );
  }
  
  // Handle generic API error
  if (dataObj.error && !dataObj.price && !dataObj.exchangeRate) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
          {dataObj.error as string}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {(dataObj.message as string)?.substring(0, 100)}
        </p>
      </div>
    );
  }

  // Get fields to display
  const displayFields: Array<{
    key: string;
    label: string;
    format?: 'currency' | 'percentage' | 'number' | 'text';
  }> = fields || Object.entries(dataObj)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key]) => ({
      key,
      label: formatLabel(key),
    }));

  // Find primary value (price/rate)
  const primaryField = displayFields.find(f => 
    f.key.toLowerCase() === 'price' ||
    f.key.toLowerCase() === 'exchangerate' ||
    f.key.toLowerCase() === 'close' ||
    f.key.toLowerCase().includes('price')
  );

  // Find change field
  const changeField = displayFields.find(f =>
    f.key.toLowerCase() === 'changepercent' ||
    f.key.toLowerCase() === 'change_percent' ||
    f.key.toLowerCase() === 'percentchange' ||
    (f.key.toLowerCase().includes('change') && f.key.toLowerCase().includes('percent'))
  ) || displayFields.find(f =>
    f.key.toLowerCase() === 'change' && !f.key.toLowerCase().includes('percent')
  );

  // Find logo/image field
  const imageField = displayFields.find(f => {
    const keyLower = f.key.toLowerCase();
    const value = dataObj[f.key];
    return (keyLower === 'logo' || keyLower === 'image') && isImageUrl(value);
  });

  const primaryValue = primaryField ? dataObj[primaryField.key] : null;
  const changeValue = changeField ? dataObj[changeField.key] : null;
  const imageValue = imageField ? dataObj[imageField.key] as string : null;

  // Filter out primary, change, and handled fields from other fields
  const otherFields = displayFields.filter(f => 
    f.key !== primaryField?.key && 
    f.key !== changeField?.key &&
    f.key !== imageField?.key &&
    f.key !== '_totalItems'
  );

  // Render value based on type
  const renderFieldValue = (key: string, value: unknown, format?: string) => {
    // Check if it's an image URL
    if (isImageUrl(value)) {
      return <ImageField src={value as string} alt={formatLabel(key)} />;
    }
    
    // Check if it's a web URL (but not an image)
    if (isWebUrl(value) && !isImageUrl(value)) {
      const url = value as string;
      const displayUrl = url.replace(/^https?:\/\/(www\.)?/, '').substring(0, 25);
      return (
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1 truncate"
        >
          {displayUrl}...
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      );
    }
    
    // Check if it's a phone number
    if (isPhoneNumber(key, value)) {
      const phone = String(value);
      return (
        <a 
          href={`tel:${phone}`}
          className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline truncate"
        >
          {phone}
        </a>
      );
    }
    
    // Check if it's an email
    if (isEmail(value)) {
      const email = value as string;
      return (
        <a 
          href={`mailto:${email}`}
          className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline truncate"
        >
          {email}
        </a>
      );
    }
    
    // Default text rendering
    return (
      <p className={cn(
        "text-sm font-semibold truncate",
        getValueColorClass(key, value)
      )}>
        {formatValue(value, format as 'currency' | 'percentage' | 'number' | 'text' | undefined, key)}
      </p>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Logo/Image at top if available */}
      {imageValue && (
        <div className="mb-3 flex justify-center">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600">
            <img 
              src={imageValue} 
              alt="Logo"
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
      
      {/* Primary Value Section */}
      {primaryValue !== null && primaryValue !== undefined && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                {primaryField?.label || 'Value'}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatValue(primaryValue, primaryField?.format || 'currency', primaryField?.key)}
              </p>
            </div>
            {changeValue !== null && changeValue !== undefined && (
              <div className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium",
                parseFloat(String(changeValue).replace(/[^0-9.-]/g, '')) >= 0 
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              )}>
                {parseFloat(String(changeValue).replace(/[^0-9.-]/g, '')) >= 0 
                  ? <ArrowUpRight className="w-4 h-4" />
                  : <ArrowDownRight className="w-4 h-4" />
                }
                <span>
                  {formatValue(changeValue, 'percentage', changeField?.key)}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Other Fields Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {otherFields.map((field, index) => {
            const value = dataObj[field.key];
            if (value === null || value === undefined || value === '') return null;

            // Check if this is an image field for full-width display
            const isImage = isImageUrl(value);
            
            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                  isImage && "col-span-2"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-slate-400 dark:text-slate-500">
                    {getFieldIcon(field.key)}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {field.label}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {renderFieldValue(field.key, value, field.format)}
                  {shouldShowTrend(field.key) && !isWebUrl(value) && getTrendIndicator(value)}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Show total count if many fields */}
      {otherFields.length > 10 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          Showing all {otherFields.length} fields
        </p>
      )}
    </div>
  );
};

export { CardWidget };