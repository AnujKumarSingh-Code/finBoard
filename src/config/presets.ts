import { WidgetType, ChartType, WidgetSize } from '@/types';

// ============================================
// DEFAULT API KEYS (Demo/Fallback)
// Users should enter their own keys via the UI
// Keys are saved in localStorage
// ============================================
export const ALPHA_VANTAGE_API_KEY = 'demo'; // Get free key: https://www.alphavantage.co/support/#api-key
export const FINNHUB_API_KEY = 'demo'; // Get free key: https://finnhub.io/register  
export const INDIANAPI_KEY = 'demo'; // Get key: https://indianapi.in

// ============================================
// API PROVIDERS
// ============================================
export type ApiProvider = 'alphavantage' | 'finnhub' | 'indianapi' | 'custom';

export interface ApiProviderInfo {
  id: ApiProvider;
  name: string;
  description: string;
  rateLimit: string;
  website: string;
}

export const API_PROVIDERS: ApiProviderInfo[] = [
  {
    id: 'finnhub',
    name: 'Finnhub',
    description: 'Real-time stock, forex & crypto data',
    rateLimit: '60 calls/minute (Free)',
    website: 'https://finnhub.io',
  },
  {
    id: 'indianapi',
    name: 'IndianAPI',
    description: 'BSE & NSE Indian stock market data',
    rateLimit: '500 calls/month (Free)',
    website: 'https://indianapi.in',
  },
  {
    id: 'alphavantage',
    name: 'Alpha Vantage',
    description: 'Stock, forex, crypto & technical indicators',
    rateLimit: '5 calls/minute, 25/day (Free)',
    website: 'https://alphavantage.co',
  },
  {
    id: 'custom',
    name: 'Custom API',
    description: 'Use your own API endpoint',
    rateLimit: 'Depends on your API',
    website: '',
  },
];

// ============================================
// PRESET CONFIGURATION
// ============================================
export interface ApiPresetConfig {
  name: string;
  url: string;
  description?: string;
  defaultType?: WidgetType;
  defaultChartType?: ChartType;
  provider: ApiProvider;
  category: 'stocks' | 'crypto' | 'forex' | 'market' | 'indian' | 'charts';
  symbolParam?: string; // Parameter name for symbol replacement
  defaultSymbol?: string;
  headers?: Record<string, string>; // Custom headers (e.g., API keys)
}

// ============================================
// ALL API PRESETS
// ============================================
export const API_PRESETS: Record<string, ApiPresetConfig> = {
  // ==========================================
  // FINNHUB PRESETS (Better rate limits!)
  // ==========================================
  
  // Finnhub Stock
  finnhubQuote: {
    name: 'Finnhub · Quote',
    url: `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${FINNHUB_API_KEY}`,
    description: 'Real-time US stock quote (60 calls/min)',
    defaultType: 'card',
    provider: 'finnhub',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'AAPL',
  },
  finnhubProfile: {
    name: 'Finnhub · Company Profile',
    url: `https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=${FINNHUB_API_KEY}`,
    description: 'Company info, market cap, industry',
    defaultType: 'card',
    provider: 'finnhub',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'AAPL',
  },
  finnhubPeers: {
    name: 'Finnhub · Company Peers',
    url: `https://finnhub.io/api/v1/stock/peers?symbol=AAPL&token=${FINNHUB_API_KEY}`,
    description: 'Similar companies',
    defaultType: 'card',
    provider: 'finnhub',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'AAPL',
  },
  finnhubRecommendation: {
    name: 'Finnhub · Recommendations',
    url: `https://finnhub.io/api/v1/stock/recommendation?symbol=AAPL&token=${FINNHUB_API_KEY}`,
    description: 'Analyst recommendations',
    defaultType: 'card',
    provider: 'finnhub',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'AAPL',
  },
  finnhubNews: {
    name: 'Finnhub · Market News',
    url: `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`,
    description: 'Latest market news',
    defaultType: 'table',
    provider: 'finnhub',
    category: 'market',
  },
  finnhubEarnings: {
    name: 'Finnhub · Earnings Calendar',
    url: `https://finnhub.io/api/v1/calendar/earnings?from=2024-01-01&to=2024-12-31&token=${FINNHUB_API_KEY}`,
    description: 'Upcoming earnings',
    defaultType: 'table',
    provider: 'finnhub',
    category: 'market',
  },

  // ==========================================
  // CHART PRESETS (Alpha Vantage - Free Tier)
  // Note: Finnhub candles require paid subscription
  // ==========================================
  
  // Stock Charts
  chartStockDaily: {
    name: 'Chart · Stock Daily',
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Daily stock prices (100 days)',
    defaultType: 'chart',
    defaultChartType: 'line',
    provider: 'alphavantage',
    category: 'charts',
    symbolParam: 'symbol',
    defaultSymbol: 'AAPL',
  },
  chartStockWeekly: {
    name: 'Chart · Stock Weekly',
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=AAPL&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Weekly stock prices (long-term)',
    defaultType: 'chart',
    defaultChartType: 'area',
    provider: 'alphavantage',
    category: 'charts',
    symbolParam: 'symbol',
    defaultSymbol: 'AAPL',
  },
  chartStockMonthly: {
    name: 'Chart · Stock Monthly',
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=AAPL&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Monthly stock prices (full history)',
    defaultType: 'chart',
    defaultChartType: 'area',
    provider: 'alphavantage',
    category: 'charts',
    symbolParam: 'symbol',
    defaultSymbol: 'AAPL',
  },
  chartStockIntraday: {
    name: 'Chart · Stock Intraday',
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=AAPL&interval=60min&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Hourly stock prices',
    defaultType: 'chart',
    defaultChartType: 'line',
    provider: 'alphavantage',
    category: 'charts',
    symbolParam: 'symbol',
    defaultSymbol: 'AAPL',
  },
  
  // Crypto Charts
  chartCryptoDaily: {
    name: 'Chart · Crypto Daily',
    url: `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=BTC&market=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Daily Bitcoin prices in USD',
    defaultType: 'chart',
    defaultChartType: 'candlestick',
    provider: 'alphavantage',
    category: 'charts',
    symbolParam: 'symbol',
    defaultSymbol: 'BTC',
  },
  chartCryptoWeekly: {
    name: 'Chart · Crypto Weekly',
    url: `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_WEEKLY&symbol=BTC&market=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Weekly Bitcoin prices',
    defaultType: 'chart',
    defaultChartType: 'area',
    provider: 'alphavantage',
    category: 'charts',
    symbolParam: 'symbol',
    defaultSymbol: 'BTC',
  },
  
  // Forex Charts
  chartForexDaily: {
    name: 'Chart · Forex Daily',
    url: `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Daily EUR/USD exchange rate',
    defaultType: 'chart',
    defaultChartType: 'line',
    provider: 'alphavantage',
    category: 'charts',
    symbolParam: 'from_symbol',
    defaultSymbol: 'EUR',
  },
  chartForexWeekly: {
    name: 'Chart · Forex Weekly',
    url: `https://www.alphavantage.co/query?function=FX_WEEKLY&from_symbol=EUR&to_symbol=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Weekly EUR/USD exchange rate',
    defaultType: 'chart',
    defaultChartType: 'area',
    provider: 'alphavantage',
    category: 'charts',
    symbolParam: 'from_symbol',
    defaultSymbol: 'EUR',
  },

  // ==========================================
  // ALPHA VANTAGE PRESETS
  // ==========================================
  
  // Stock presets
  stockQuote: {
    name: 'Alpha Vantage · Stock Quote',
    url: `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Real-time stock quote (5 calls/min limit)',
    defaultType: 'card',
    provider: 'alphavantage',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'IBM',
  },
  stockIntraday: {
    name: 'Alpha Vantage · Intraday',
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Intraday stock prices (5 min)',
    defaultType: 'chart',
    defaultChartType: 'line',
    provider: 'alphavantage',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'IBM',
  },
  stockDaily: {
    name: 'Alpha Vantage · Daily',
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Daily stock prices',
    defaultType: 'chart',
    defaultChartType: 'line',
    provider: 'alphavantage',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'IBM',
  },
  stockWeekly: {
    name: 'Alpha Vantage · Weekly',
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=IBM&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Weekly stock prices',
    defaultType: 'chart',
    defaultChartType: 'area',
    provider: 'alphavantage',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'IBM',
  },
  stockMonthly: {
    name: 'Alpha Vantage · Monthly',
    url: `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=IBM&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Monthly stock prices',
    defaultType: 'chart',
    defaultChartType: 'area',
    provider: 'alphavantage',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'IBM',
  },
  companyOverview: {
    name: 'Alpha Vantage · Company Overview',
    url: `https://www.alphavantage.co/query?function=OVERVIEW&symbol=IBM&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Company fundamentals',
    defaultType: 'card',
    provider: 'alphavantage',
    category: 'stocks',
    symbolParam: 'symbol',
    defaultSymbol: 'IBM',
  },
  
  // Crypto presets
  cryptoExchangeRate: {
    name: 'Alpha Vantage · Crypto Rate',
    url: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Real-time crypto rate',
    defaultType: 'card',
    provider: 'alphavantage',
    category: 'crypto',
    symbolParam: 'from_currency',
    defaultSymbol: 'BTC',
  },
  cryptoDaily: {
    name: 'Alpha Vantage · Crypto Daily',
    url: `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=BTC&market=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Daily crypto prices',
    defaultType: 'chart',
    defaultChartType: 'line',
    provider: 'alphavantage',
    category: 'crypto',
    symbolParam: 'symbol',
    defaultSymbol: 'BTC',
  },
  cryptoWeekly: {
    name: 'Alpha Vantage · Crypto Weekly',
    url: `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_WEEKLY&symbol=BTC&market=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Weekly crypto prices',
    defaultType: 'chart',
    defaultChartType: 'area',
    provider: 'alphavantage',
    category: 'crypto',
    symbolParam: 'symbol',
    defaultSymbol: 'BTC',
  },

  // Forex presets
  forexExchangeRate: {
    name: 'Alpha Vantage · Forex Rate',
    url: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=EUR&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Real-time forex rate',
    defaultType: 'card',
    provider: 'alphavantage',
    category: 'forex',
    symbolParam: 'from_currency',
    defaultSymbol: 'EUR',
  },
  forexIntraday: {
    name: 'Alpha Vantage · FX Intraday',
    url: `https://www.alphavantage.co/query?function=FX_INTRADAY&from_symbol=EUR&to_symbol=USD&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Intraday forex prices',
    defaultType: 'chart',
    defaultChartType: 'line',
    provider: 'alphavantage',
    category: 'forex',
    symbolParam: 'from_symbol',
    defaultSymbol: 'EUR',
  },
  forexDaily: {
    name: 'Alpha Vantage · FX Daily',
    url: `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Daily forex prices',
    defaultType: 'chart',
    defaultChartType: 'line',
    provider: 'alphavantage',
    category: 'forex',
    symbolParam: 'from_symbol',
    defaultSymbol: 'EUR',
  },

  // Market presets
  topGainersLosers: {
    name: 'Alpha Vantage · Top Movers',
    url: `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Market gainers & losers',
    defaultType: 'table',
    provider: 'alphavantage',
    category: 'market',
  },
  marketNews: {
    name: 'Alpha Vantage · News',
    url: `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Latest market news',
    defaultType: 'card',
    provider: 'alphavantage',
    category: 'market',
  },
  sectorPerformance: {
    name: 'Alpha Vantage · Sectors',
    url: `https://www.alphavantage.co/query?function=SECTOR&apikey=${ALPHA_VANTAGE_API_KEY}`,
    description: 'Sector performance',
    defaultType: 'table',
    provider: 'alphavantage',
    category: 'market',
  },

  // ==========================================
  // INDIANAPI PRESETS (BSE/NSE Indian Markets)
  // ==========================================
  
  indianStockData: {
    name: 'IndianAPI · Stock Data',
    url: `https://stock.indianapi.in/stock?name=Reliance`,
    description: 'Detailed Indian stock data (BSE & NSE)',
    defaultType: 'card',
    provider: 'indianapi',
    category: 'indian',
    symbolParam: 'name',
    defaultSymbol: 'Reliance',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
  indianTrending: {
    name: 'IndianAPI · Trending Stocks',
    url: `https://stock.indianapi.in/trending`,
    description: 'Top gainers and losers in Indian market',
    defaultType: 'card',
    provider: 'indianapi',
    category: 'indian',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
  indian52WeekHighLow: {
    name: 'IndianAPI · 52 Week High/Low',
    url: `https://stock.indianapi.in/fetch_52_week_high_low_data`,
    description: '52 week highs & lows on BSE/NSE',
    defaultType: 'table',
    provider: 'indianapi',
    category: 'indian',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
  indianNSEMostActive: {
    name: 'IndianAPI · NSE Most Active',
    url: `https://stock.indianapi.in/NSE_most_active`,
    description: 'Most active stocks on NSE',
    defaultType: 'table',
    provider: 'indianapi',
    category: 'indian',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
  indianBSEMostActive: {
    name: 'IndianAPI · BSE Most Active',
    url: `https://stock.indianapi.in/BSE_most_active`,
    description: 'Most active stocks on BSE',
    defaultType: 'table',
    provider: 'indianapi',
    category: 'indian',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
  indianPriceShockers: {
    name: 'IndianAPI · Price Shockers',
    url: `https://stock.indianapi.in/price_shockers`,
    description: 'Stocks with significant price changes',
    defaultType: 'table',
    provider: 'indianapi',
    category: 'indian',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
  indianMutualFunds: {
    name: 'IndianAPI · Mutual Funds',
    url: `https://stock.indianapi.in/mutual_funds`,
    description: 'Top mutual funds in India',
    defaultType: 'card',
    provider: 'indianapi',
    category: 'indian',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
  indianCommodities: {
    name: 'IndianAPI · Commodities',
    url: `https://stock.indianapi.in/commodities`,
    description: 'Commodity futures data',
    defaultType: 'table',
    provider: 'indianapi',
    category: 'indian',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
  indianHistoricalData: {
    name: 'IndianAPI · Historical Data',
    url: `https://stock.indianapi.in/historical_data?stock_name=TCS&period=1yr&filter=price`,
    description: 'Historical price data for Indian stocks',
    defaultType: 'chart',
    defaultChartType: 'line' as ChartType,
    provider: 'indianapi',
    category: 'indian',
    symbolParam: 'stock_name',
    defaultSymbol: 'TCS',
    headers: { 'X-Api-Key': INDIANAPI_KEY },
  },
};

// ============================================
// PRESET CATEGORIES FOR UI
// ============================================
export const PRESET_CATEGORIES = [
  { 
    key: 'charts', 
    label: '📊 Charts (Alpha Vantage)', 
    description: 'Historical price charts - 5 calls/min',
    presets: ['chartStockDaily', 'chartStockWeekly', 'chartStockMonthly', 'chartStockIntraday', 'chartCryptoDaily', 'chartCryptoWeekly', 'chartForexDaily', 'chartForexWeekly'] 
  },
  { 
    key: 'finnhub', 
    label: '⚡ Finnhub Data', 
    description: '60 calls/min - Quotes, News, Recommendations',
    presets: ['finnhubQuote', 'finnhubProfile', 'finnhubPeers', 'finnhubRecommendation', 'finnhubNews'] 
  },
  { 
    key: 'indian', 
    label: '🇮🇳 IndianAPI (BSE/NSE)', 
    description: 'Indian stock market data',
    presets: ['indianStockData', 'indianTrending', 'indian52WeekHighLow', 'indianNSEMostActive', 'indianBSEMostActive', 'indianPriceShockers', 'indianMutualFunds', 'indianCommodities', 'indianHistoricalData'] 
  },
  { 
    key: 'stocks', 
    label: '📈 Stocks (Alpha Vantage)', 
    description: '5 calls/min - Quotes & Data',
    presets: ['stockQuote', 'stockDaily', 'stockWeekly', 'stockIntraday', 'companyOverview'] 
  },
  { 
    key: 'crypto', 
    label: '🪙 Crypto (Alpha Vantage)', 
    description: 'Cryptocurrency data',
    presets: ['cryptoExchangeRate', 'cryptoDaily', 'cryptoWeekly'] 
  },
  { 
    key: 'forex', 
    label: '💱 Forex (Alpha Vantage)', 
    description: 'Foreign exchange rates',
    presets: ['forexExchangeRate', 'forexDaily'] 
  },
  { 
    key: 'market', 
    label: '🌍 Market Overview', 
    description: 'Market news and movers',
    presets: ['finnhubNews', 'topGainersLosers', 'sectorPerformance'] 
  },
];

// ============================================
// DASHBOARD TEMPLATES
// ============================================
export interface DashboardTemplateConfig {
  name: string;
  description: string;
  widgets: Array<{
    id?: string;
    title: string;
    type: WidgetType;
    apiConfig: {
      url: string;
      method: 'GET' | 'POST';
    };
    refreshInterval: number;
    size: WidgetSize;
    chartConfig?: {
      type: ChartType;
    };
    preset?: string;
    createdAt?: string;
  }>;
}

export const DASHBOARD_TEMPLATES: Record<string, DashboardTemplateConfig> = {
  stockTrader: {
    name: 'Stock Trader',
    description: 'Essential widgets for active stock trading - uses Finnhub for better rate limits',
    widgets: [
      {
        title: 'AAPL Quote',
        type: 'card',
        apiConfig: {
          url: `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${FINNHUB_API_KEY}`,
          method: 'GET',
        },
        refreshInterval: 30,
        size: 'small',
        preset: 'finnhubQuote',
      },
      {
        title: 'MSFT Quote',
        type: 'card',
        apiConfig: {
          url: `https://finnhub.io/api/v1/quote?symbol=MSFT&token=${FINNHUB_API_KEY}`,
          method: 'GET',
        },
        refreshInterval: 30,
        size: 'small',
        preset: 'finnhubQuote',
      },
      {
        title: 'GOOGL Quote',
        type: 'card',
        apiConfig: {
          url: `https://finnhub.io/api/v1/quote?symbol=GOOGL&token=${FINNHUB_API_KEY}`,
          method: 'GET',
        },
        refreshInterval: 30,
        size: 'small',
        preset: 'finnhubQuote',
      },
      {
        title: 'AAPL Company Info',
        type: 'card',
        apiConfig: {
          url: `https://finnhub.io/api/v1/stock/profile2?symbol=AAPL&token=${FINNHUB_API_KEY}`,
          method: 'GET',
        },
        refreshInterval: 300,
        size: 'small',
        preset: 'finnhubProfile',
      },
    ],
  },
  cryptoDashboard: {
    name: 'Crypto Dashboard',
    description: 'Track cryptocurrency prices in real-time',
    widgets: [
      {
        title: 'Bitcoin Price',
        type: 'card',
        apiConfig: {
          url: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=BTC&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
          method: 'GET',
        },
        refreshInterval: 60,
        size: 'small',
        preset: 'cryptoExchangeRate',
      },
      {
        title: 'Ethereum Price',
        type: 'card',
        apiConfig: {
          url: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=ETH&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
          method: 'GET',
        },
        refreshInterval: 60,
        size: 'small',
        preset: 'cryptoExchangeRate',
      },
    ],
  },
  forexMonitor: {
    name: 'Forex Monitor',
    description: 'Monitor major currency pairs',
    widgets: [
      {
        title: 'EUR/USD Rate',
        type: 'card',
        apiConfig: {
          url: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=EUR&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
          method: 'GET',
        },
        refreshInterval: 60,
        size: 'small',
        preset: 'forexExchangeRate',
      },
      {
        title: 'GBP/USD Rate',
        type: 'card',
        apiConfig: {
          url: `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=GBP&to_currency=USD&apikey=${ALPHA_VANTAGE_API_KEY}`,
          method: 'GET',
        },
        refreshInterval: 60,
        size: 'small',
        preset: 'forexExchangeRate',
      },
    ],
  },
};

// ============================================
// HELPER DATA
// ============================================
export const POPULAR_SYMBOLS = {
  stocks: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM', 'V', 'WMT'],
  crypto: ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'DOT', 'MATIC', 'LINK', 'UNI'],
  forex: [
    { from: 'EUR', to: 'USD' },
    { from: 'GBP', to: 'USD' },
    { from: 'USD', to: 'JPY' },
    { from: 'USD', to: 'CAD' },
    { from: 'AUD', to: 'USD' },
  ],
};

export const REFRESH_INTERVALS = [
  { value: 30, label: '30 seconds' },
  { value: 60, label: '1 minute' },
  { value: 300, label: '5 minutes' },
  { value: 600, label: '10 minutes' },
  { value: 900, label: '15 minutes' },
  { value: 1800, label: '30 minutes' },
  { value: 3600, label: '1 hour' },
];

export const WIDGET_SIZES = [
  { value: 'small' as WidgetSize, label: 'Small', description: '1 column' },
  { value: 'medium' as WidgetSize, label: 'Medium', description: '2 columns' },
  { value: 'large' as WidgetSize, label: 'Large', description: '3 columns' },
  { value: 'full' as WidgetSize, label: 'Full Width', description: '4 columns' },
];

// Helper function to replace symbol in URL
export function replaceSymbolInUrl(url: string, newSymbol: string, paramName: string = 'symbol'): string {
  const urlObj = new URL(url);
  urlObj.searchParams.set(paramName, newSymbol);
  return urlObj.toString();
}