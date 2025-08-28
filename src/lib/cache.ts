import { CachedData, Note, Folder, Tag, User } from '@/types';

const STORAGE_KEY = 'note-app-data';

const defaultData: CachedData = {
  user: null,
  notes: [],
  folders: [],
  tags: [],
  lastSync: new Date().toISOString(),
};

export const cache = {
  get: (): CachedData => {
    if (typeof window === 'undefined') return defaultData;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : defaultData;
    } catch (error) {
      console.error('Failed to parse cached data:', error);
      return defaultData;
    }
  },

  set: (data: CachedData) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...data,
        lastSync: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  },

  update: (updates: Partial<CachedData>) => {
    const current = cache.get();
    cache.set({ ...current, ...updates });
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};

// Utility functions for generating IDs
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Auto-save utility
let saveTimeout: NodeJS.Timeout | null = null;

export const autoSave = (data: CachedData, delay = 2000) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    cache.set(data);
  }, delay);
};