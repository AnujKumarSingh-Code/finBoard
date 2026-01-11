import { useEffect, useRef, useState, useCallback } from 'react';

import { useWidgetStore } from '@/store/widgetStore';


import { fetchApiData } from '@/lib/api';
import { WidgetConfig, ApiConfig } from '@/types';

// Hook for fetching widget data with auto-refresh
export function useWidgetData(widget: WidgetConfig) {
  const updateWidgetData = useWidgetStore((s) => s.updateWidgetData);
  const setWidgetLoading = useWidgetStore((s) => s.setWidgetLoading);
  const setWidgetError = useWidgetStore((s) => s.setWidgetError);
  
  const [data, setData] = useState<unknown>(widget.lastData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(widget.error || null);
  
  const fetchData = useCallback(async () => {
    if (!widget.apiConfig.url) return;
    
    setIsLoading(true);
    setWidgetLoading(widget.id, true);
    setError(null);
    
    try {
      const result = await fetchApiData(widget.apiConfig);
      setData(result);
      updateWidgetData(widget.id, result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      setWidgetError(widget.id, errorMessage);
    } finally {
      setIsLoading(false);
      setWidgetLoading(widget.id, false);
    }
  }, [widget.id, widget.apiConfig, updateWidgetData, setWidgetLoading, setWidgetError]);
  
  useEffect(() => {
    fetchData();
    
    const interval = setInterval(fetchData, widget.refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [fetchData, widget.refreshInterval]);
  
  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}



// Hook for API testing

export function useApiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testApi = useCallback(async (config: ApiConfig) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    
    try {
      const result = await fetchApiData(config);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'API test failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);
  
  return {
    isLoading,
    data,
    error,
    testApi,
    reset,
  };
}



// Hook for local storage state
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };
  
  return [storedValue, setValue] as const;
}



// Hook for debounced value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}



// Hook for interval
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<(() => void) | undefined>(undefined);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    
    const tick = () => {
      savedCallback.current?.();
    };
    
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}



// Hook for click outside
export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);
  
  return ref;
}

// Hook for keyboard shortcuts
export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean } = {}
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const { ctrl = false, shift = false, alt = false } = modifiers;
      
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.shiftKey === shift &&
        event.altKey === alt
      ) {
        event.preventDefault();
        callback();
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, modifiers]);
}

// Hook for media query
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return matches;
}

// Hook for responsive breakpoints
export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
}

// Hook for mounted state
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  return mounted;
}
