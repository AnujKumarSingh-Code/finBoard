import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WidgetConfig, ToastMessage, WidgetSize } from '@/types';
import { generateId, deepClone } from '@/utils';

interface WidgetState {
  widgets: WidgetConfig[];
  toasts: ToastMessage[];
  isHydrated: boolean;
  

  addWidget: (widget: Partial<WidgetConfig> & { title: string; apiConfig: { url: string; method?: 'GET' | 'POST' } }) => string;
  updateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  deleteWidget: (id: string) => void;
  reorderWidgets: (widgets: WidgetConfig[]) => void;
  duplicateWidget: (id: string) => void;
  updateWidgetData: (id: string, data: unknown) => void;
  setWidgetLoading: (id: string, isLoading: boolean) => void;
  setWidgetError: (id: string, error: string | null) => void;
  clearWidgets: () => void;
  
  // Import/Export
  exportConfig: () => string;
  importConfig: (config: string) => boolean;
  
  // Toast Actions
  addToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;
  
  // Hydration
  setHydrated: () => void;
}

// Convert size string to grid columns
const getSizeCols = (size: WidgetSize): number => {
  switch (size) {
    case 'small': return 1;
    case 'medium': return 2;
    case 'large': return 3;
    case 'full': return 4;
    default: return 2;
  }
};

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      widgets: [],
      toasts: [],
      isHydrated: false,

      addWidget: (widget) => {
        const id = widget.id || generateId();
        
        const newWidget: WidgetConfig = {
          id,
          title: widget.title,
          type: widget.type || 'card',
          size: widget.size || 'medium',
          apiConfig: {
            url: widget.apiConfig.url,
            method: widget.apiConfig.method || 'GET',
          },
          refreshInterval: widget.refreshInterval || 30,
          createdAt: widget.createdAt || new Date().toISOString(),
          preset: widget.preset,
          fieldMappings: widget.fieldMappings,
          chartConfig: widget.chartConfig,
          isLoading: false,
          error: null,
        };
        
        set((state) => ({
          widgets: [...state.widgets, newWidget],
        }));
        
        return id;
      },

      updateWidget: (id, updates) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        }));
      },

      deleteWidget: (id) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        }));
      },

      reorderWidgets: (widgets) => {
        set({ widgets });
      },

      duplicateWidget: (id) => {
        const widget = get().widgets.find((w) => w.id === id);
        if (widget) {
          get().addWidget({
            ...deepClone(widget),
            id: undefined,
            title: `${widget.title} (Copy)`,
            createdAt: new Date().toISOString(),
          });
          get().addToast('Widget duplicated', 'success');
        }
      },

      updateWidgetData: (id, data) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id
              ? { ...w, lastData: data, lastUpdated: Date.now(), error: null }
              : w
          ),
        }));
      },

      setWidgetLoading: (id, isLoading) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, isLoading } : w
          ),
        }));
      },

      setWidgetError: (id, error) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, error, isLoading: false } : w
          ),
        }));
      },

      clearWidgets: () => {
        set({ widgets: [] });
        get().addToast('Dashboard cleared', 'info');
      },

      exportConfig: () => {
        const { widgets } = get();
        const config = {
          version: '1.0',
          exportedAt: new Date().toISOString(),
          widgets: widgets.map((w) => ({
            ...w,
            lastData: undefined,
            lastUpdated: undefined,
            isLoading: undefined,
            error: undefined,
          })),
        };
        return JSON.stringify(config, null, 2);
      },

      importConfig: (configString) => {
        try {
          const config = JSON.parse(configString);
          
          if (!config.widgets || !Array.isArray(config.widgets)) {
            throw new Error('Invalid configuration format');
          }
          
          const widgets = config.widgets.map((w: WidgetConfig) => ({
            ...w,
            id: generateId(),
            isLoading: false,
            error: null,
          }));
          
          set({ widgets });
          get().addToast(`${widgets.length} widgets imported`, 'success');
          
          return true;
        } catch (error) {
          get().addToast('Import failed: Invalid configuration', 'error');
          return false;
        }
      },

      addToast: (message, type = 'info') => {
        const id = generateId();
        const newToast: ToastMessage = { 
          id, 
          type, 
          title: message,
          duration: type === 'error' ? 5000 : 3000,
        };
        
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));
        
        setTimeout(() => {
          get().removeToast(id);
        }, newToast.duration);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: 'finboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        widgets: state.widgets.map((w) => ({
          ...w,
          lastData: undefined,
          lastUpdated: undefined,
          isLoading: false,
          error: null,
        })),
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// Cache store for API responses
interface CacheState {
  cache: Record<string, { data: unknown; timestamp: number; ttl: number }>;
  get: (key: string) => unknown | null;
  set: (key: string, data: unknown, ttl?: number) => void;
  clear: () => void;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  cache: {},

  get: (key) => {
    const entry = get().cache[key];
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Cache expired
      set((state) => {
        const newCache = { ...state.cache };
        delete newCache[key];
        return { cache: newCache };
      });
      return null;
    }
    
    return entry.data;
  },

  set: (key, data, ttl = 30000) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: { data, timestamp: Date.now(), ttl },
      },
    }));
  },

  clear: () => {
    set({ cache: {} });
  },
}));
