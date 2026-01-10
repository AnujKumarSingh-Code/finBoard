import { ApiConfig, TimeSeriesData } from '@/types';
import { useCacheStore } from '@/store/widgetStore';

// Generate cache key from API config
function generateCacheKey(config: ApiConfig): string {
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.url}:${params}`;
}

// Build URL with parameters
function buildUrl(config: ApiConfig): string {
  const url = new URL(config.url);
  
  if (config.params) {
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }
  
  return url.toString();
}

// Get API keys from localStorage
function getApiKeysFromStorage(): { alphaVantage: string; finnhub: string; indianApi: string } {
  if (typeof window === 'undefined') {
    return { alphaVantage: '', finnhub: '', indianApi: '' };
  }
  return {
    alphaVantage: localStorage.getItem('finboard_alpha_vantage_key') || '',
    finnhub: localStorage.getItem('finboard_finnhub_key') || '',
    indianApi: localStorage.getItem('finboard_indianapi_key') || '',
  };
}

// Inject API keys into URL (replaces demo keys with user's real keys)
function injectApiKeysIntoUrl(url: string, apiKeys: { alphaVantage: string; finnhub: string; indianApi: string }): string {
  let newUrl = url;
  
  // Alpha Vantage: Replace apikey=demo or any apikey with user's key
  if (apiKeys.alphaVantage && url.includes('alphavantage.co')) {
    // Replace demo or any existing key
    if (newUrl.includes('apikey=')) {
      newUrl = newUrl.replace(/apikey=[^&]+/gi, `apikey=${apiKeys.alphaVantage}`);
    } else {
      // Add key if not present
      newUrl += (newUrl.includes('?') ? '&' : '?') + `apikey=${apiKeys.alphaVantage}`;
    }
  }
  
  // Finnhub: Replace token=demo or any token with user's key
  if (apiKeys.finnhub && url.includes('finnhub.io')) {
    // Replace demo or any existing key
    if (newUrl.includes('token=')) {
      newUrl = newUrl.replace(/token=[^&]+/gi, `token=${apiKeys.finnhub}`);
    } else {
      // Add key if not present
      newUrl += (newUrl.includes('?') ? '&' : '?') + `token=${apiKeys.finnhub}`;
    }
  }
  
  return newUrl;
}

// Main fetch function
export async function fetchApiData(config: ApiConfig): Promise<unknown> {
  const cacheKey = generateCacheKey(config);
  const cache = useCacheStore.getState();
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let url = buildUrl(config);
  const apiKeys = getApiKeysFromStorage();
  
  // INJECT API KEYS INTO URL - This ensures user's keys are always used
  // Even for old widgets that have "demo" keys baked in
  url = injectApiKeysIntoUrl(url, apiKeys);
  
  // Start with base headers
  const headers: HeadersInit = {
    'Accept': 'application/json',
    ...config.headers,
  };
  
  // ALWAYS inject IndianAPI key from localStorage for indianapi.in requests
  // This ensures the key is always fresh, even for old widgets
  if (url.includes('indianapi.in') && apiKeys.indianApi) {
    headers['X-Api-Key'] = apiKeys.indianApi;
  }
  
  try {
    const response = await fetch(url, {
      method: config.method || 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Don't throw for Alpha Vantage error messages - let components handle them
    // This allows ChartWidget to show user-friendly error messages
    if (data['Error Message']) {
      console.warn('API Error:', data['Error Message']);
      // Still return the data so component can display error
    }
    
    if (data['Note']) {
      // API rate limit warning
      console.warn('API Rate Limit:', data['Note']);
      // Still return the data so component can display error
    }
    
    if (data['Information']) {
      console.warn('API Info:', data['Information']);
    }
    
    // Cache the result (30 seconds default TTL)
    cache.set(cacheKey, data, 30000);
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch data');
  }
}

// Parse Alpha Vantage time series data
export function parseTimeSeriesData(data: unknown): TimeSeriesData[] {
  if (!data || typeof data !== 'object') {
    return [];
  }
  
  const obj = data as Record<string, unknown>;
  
  // Find the time series key
  const timeSeriesKey = Object.keys(obj).find(
    (key) => key.toLowerCase().includes('time series') || 
             key.toLowerCase().includes('technical analysis')
  );
  
  if (!timeSeriesKey) {
    return [];
  }
  
  const timeSeries = obj[timeSeriesKey] as Record<string, Record<string, string>>;
  
  if (!timeSeries || typeof timeSeries !== 'object') {
    return [];
  }
  
  const result: TimeSeriesData[] = [];
  
  Object.entries(timeSeries).forEach(([date, values]) => {
    const open = parseFloat(values['1. open'] || values['1a. open (USD)'] || '0');
    const high = parseFloat(values['2. high'] || values['2a. high (USD)'] || '0');
    const low = parseFloat(values['3. low'] || values['3a. low (USD)'] || '0');
    const close = parseFloat(values['4. close'] || values['4a. close (USD)'] || '0');
    const volume = parseFloat(values['5. volume'] || values['5. volume'] || '0');
    
    result.push({
      date,
      open,
      high,
      low,
      close,
      volume,
    });
  });
  
  // Sort by date descending (most recent first)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return result;
}

// Parse global quote data
export function parseGlobalQuote(data: unknown): {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
} | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  const obj = data as Record<string, unknown>;
  const quote = obj['Global Quote'] as Record<string, string>;
  
  if (!quote) {
    return null;
  }
  
  return {
    symbol: quote['01. symbol'] || '',
    price: parseFloat(quote['05. price'] || '0'),
    change: parseFloat(quote['09. change'] || '0'),
    changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
    open: parseFloat(quote['02. open'] || '0'),
    high: parseFloat(quote['03. high'] || '0'),
    low: parseFloat(quote['04. low'] || '0'),
    previousClose: parseFloat(quote['08. previous close'] || '0'),
    volume: parseFloat(quote['06. volume'] || '0'),
  };
}

// Parse exchange rate data
export function parseExchangeRate(data: unknown): {
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  lastRefreshed: string;
  bidPrice: number;
  askPrice: number;
} | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  const obj = data as Record<string, unknown>;
  const rate = obj['Realtime Currency Exchange Rate'] as Record<string, string>;
  
  if (!rate) {
    return null;
  }
  
  return {
    fromCurrency: rate['1. From_Currency Code'] || '',
    toCurrency: rate['3. To_Currency Code'] || '',
    exchangeRate: parseFloat(rate['5. Exchange Rate'] || '0'),
    lastRefreshed: rate['6. Last Refreshed'] || '',
    bidPrice: parseFloat(rate['8. Bid Price'] || '0'),
    askPrice: parseFloat(rate['9. Ask Price'] || '0'),
  };
}

// Parse top gainers/losers data
export function parseGainersLosers(data: unknown): {
  gainers: Array<Record<string, string>>;
  losers: Array<Record<string, string>>;
  mostActive: Array<Record<string, string>>;
} | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  const obj = data as Record<string, unknown>;
  
  return {
    gainers: (obj['top_gainers'] as Array<Record<string, string>>) || [],
    losers: (obj['top_losers'] as Array<Record<string, string>>) || [],
    mostActive: (obj['most_actively_traded'] as Array<Record<string, string>>) || [],
  };
}

// Parse company overview data
export function parseCompanyOverview(data: unknown): Record<string, string | number> | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  const obj = data as Record<string, string>;
  
  if (obj['Error Message'] || !obj['Symbol']) {
    return null;
  }
  
  return {
    symbol: obj['Symbol'],
    name: obj['Name'],
    description: obj['Description'],
    exchange: obj['Exchange'],
    currency: obj['Currency'],
    country: obj['Country'],
    sector: obj['Sector'],
    industry: obj['Industry'],
    marketCap: parseFloat(obj['MarketCapitalization'] || '0'),
    peRatio: parseFloat(obj['PERatio'] || '0'),
    pegRatio: parseFloat(obj['PEGRatio'] || '0'),
    bookValue: parseFloat(obj['BookValue'] || '0'),
    dividendPerShare: parseFloat(obj['DividendPerShare'] || '0'),
    dividendYield: parseFloat(obj['DividendYield'] || '0'),
    eps: parseFloat(obj['EPS'] || '0'),
    revenuePerShareTTM: parseFloat(obj['RevenuePerShareTTM'] || '0'),
    profitMargin: parseFloat(obj['ProfitMargin'] || '0'),
    operatingMarginTTM: parseFloat(obj['OperatingMarginTTM'] || '0'),
    returnOnAssetsTTM: parseFloat(obj['ReturnOnAssetsTTM'] || '0'),
    returnOnEquityTTM: parseFloat(obj['ReturnOnEquityTTM'] || '0'),
    week52High: parseFloat(obj['52WeekHigh'] || '0'),
    week52Low: parseFloat(obj['52WeekLow'] || '0'),
    day50MovingAverage: parseFloat(obj['50DayMovingAverage'] || '0'),
    day200MovingAverage: parseFloat(obj['200DayMovingAverage'] || '0'),
    sharesOutstanding: parseFloat(obj['SharesOutstanding'] || '0'),
    analystTargetPrice: parseFloat(obj['AnalystTargetPrice'] || '0'),
  };
}

// Generic data normalization for display
export function normalizeDataForDisplay(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  
  // If it's an array, return as is
  if (Array.isArray(data)) {
    return data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return item as Record<string, unknown>;
      }
      return { value: item };
    });
  }
  
  // If it's an object with a nested data structure
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    
    // Check for common nested patterns
    const nestedKeys = ['data', 'results', 'items', 'records'];
    for (const key of nestedKeys) {
      if (Array.isArray(obj[key])) {
        return normalizeDataForDisplay(obj[key]);
      }
    }
    
    // Check for time series data
    const timeSeriesKey = Object.keys(obj).find(
      (key) => key.toLowerCase().includes('time series')
    );
    
    if (timeSeriesKey) {
      const timeSeries = obj[timeSeriesKey] as Record<string, Record<string, string>>;
      return Object.entries(timeSeries).map(([date, values]) => ({
        date,
        ...values,
      }));
    }
    
    // Check for gainers/losers pattern
    if (obj['top_gainers'] || obj['top_losers']) {
      return [];
    }
    
    // Return the object as a single-item array
    return [obj];
  }
  
  return [];
}