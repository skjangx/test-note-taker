import { create } from 'zustand';
import { Theme, ViewMode } from '@/types';

interface UIStore {
  theme: Theme;
  sidebarOpen: boolean;
  searchQuery: string;
  selectedFolder: string | null;
  selectedTags: string[];
  viewMode: ViewMode;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedFolder: (folderId: string | null) => void;
  setSelectedTags: (tagIds: string[]) => void;
  toggleTag: (tagId: string) => void;
  setViewMode: (mode: ViewMode) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  theme: 'light',
  sidebarOpen: true,
  searchQuery: '',
  selectedFolder: null,
  selectedTags: [],
  viewMode: 'list',

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme);
    }
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedFolder: (folderId) => set({ 
    selectedFolder: folderId,
    selectedTags: [] // Clear tags when selecting folder
  }),

  setSelectedTags: (tagIds) => set({ selectedTags: tagIds }),

  toggleTag: (tagId) => {
    const currentTags = get().selectedTags;
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    set({ 
      selectedTags: newTags,
      selectedFolder: null // Clear folder when selecting tag
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  clearFilters: () => set({
    searchQuery: '',
    selectedFolder: null,
    selectedTags: [],
  }),
}));