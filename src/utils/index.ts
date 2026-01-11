import { clsx, type ClassValue } from 'clsx';

import { twMerge } from 'tailwind-merge';



// Tailwind class merge utility
export function cn(...inputs: ClassValue[]) {

  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,

  }).format(value);
}


// Format percentage
export function formatPercentage(value: number, decimals: number = 2): string {

  const sign  = value >= 0 ? '+' : '';

  return `${sign}${value.toFixed(decimals)}%`;
}





// Format number with commas

export function formatNumber(
  value: number,
  decimals: number = 2,
  locale: string = 'en-US'
): string {

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}



// Format large numbers (K, M, B, T)
export function formatCompactNumber(value: number): string {
  const formatter  = Intl.NumberFormat('en', { notation: 'compact' });


  return formatter.format( value);
}



// Format date
export function formatDate(
  date: Date | string | number,
  format: 'short' | 'long' | 'time' | 'datetime' = 'short'
): string {
  const d =  new Date(date);
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',

      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'datetime':
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',

      });
    default:
      return d.toLocaleDateString();
  }
}


// Format relative time
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now();

  const timestamp = new Date(date).getTime();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  const hours = Math.floor(minutes / 60);

  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  if (hours < 24) return `${hours}h ago`;

  if (days < 7) return `${days}d ago`;
  
  return formatDate(date, 'short');
}



// Generate unique ID
export function generateId(): string {

  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}



// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  


  return function executedFunction(...args: Parameters<T>) 
  {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;

      setTimeout(() => (inThrottle = false), limit);
    }
  };
}



// Get nested object value by path
export function getNestedValue(obj: unknown , path: string): unknown {
  const keys = path.split('.');
  let result: unknown = obj;
  
  for (const key of keys) 
  {
    if (result === null || result === undefined) return undefined;

    if (typeof result === 'object' && key in (result as Record<string, unknown>)) 
    {
      result = (result as Record<string, unknown>)[key];

    } 
    else 
    {
      return undefined;
    }
  }
  
  return result;
}



// Flatten nested object to paths
export function flattenObject(
  obj: Record<string, unknown>,
  prefix: string = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const key in obj) 
  {
    const newKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) 
    {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } 
    else 
    {
      result[newKey] = value;
    }
  }
  
  return result;
}





// Parse API response to extract fields
export function extractFields(data: unknown): string[] {
  const fields: string[] = [];
  
  function traverse(obj: unknown, path: string = '') 
  {
    if (obj === null || obj === undefined) return;
    
    if (Array.isArray(obj) && obj.length > 0) 
    {
      traverse(obj[0], path);
    } 
    else if (typeof obj === 'object') 
    {
      for (const key in obj as Record<string, unknown>) {
        const newPath = path ? `${path}.${key}` : key;

        const value = (obj as Record<string, unknown>)[key];
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) 
        {
          traverse(value, newPath);
        } 
        else 
        {
          fields.push(newPath);
        }
      }
    }
  }
  
  traverse(data);
  return fields;
}



// Format field value based on type
export function formatFieldValue(
  value: unknown,
  format?: 'currency' | 'percentage' | 'number' | 'date' | 'text',
  decimals: number = 2
): string {

  if (value === null || value === undefined) return '-';
  
  switch (format) {
    case 'currency':
      return formatCurrency(Number(value));
    case 'percentage':
      return formatPercentage(Number(value), decimals);
    case 'number':
      return formatNumber(Number(value), decimals);
    case 'date':
      return formatDate(value as string | number | Date);
    default:
      return String(value);
  }
}



// Local storage helpers
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item   = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: <T>(key: string, value: T): void => {

    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error  saving to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from  localStorage:', error);
    }
  },
};




// Color utilities for charts
export const chartColors = {
  primary: '#0ea5e9',
  secondary: '#d946ef',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  muted: '#71717a',
  grid: '#e4e4e7',
  gridDark: '#3f3f46',
};



// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } 
  catch 
  {
    return false;
  }
}



// Sleep utility
export function sleep(ms: number): Promise<void> 
{
  return new Promise((resolve) => setTimeout(resolve, ms));
}
