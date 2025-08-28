import { create } from 'zustand';
import { Tag } from '@/types';
import { cache, generateId, autoSave } from '@/lib/cache';

// Color palette for auto-assigning tag colors
const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
];

interface TagsStore {
  tags: Tag[];
  loading: boolean;
  
  // Actions
  loadTags: () => void;
  createTag: (tag: Omit<Tag, 'id' | 'createdAt' | 'color'> & { color?: string }) => Tag;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => void;
  deleteTag: (id: string) => void;
}

export const useTagsStore = create<TagsStore>((set, get) => ({
  tags: [],
  loading: false,

  loadTags: () => {
    set({ loading: true });
    const cachedData = cache.get();
    set({ 
      tags: cachedData.tags,
      loading: false 
    });
  },

  createTag: (tagData) => {
    const existingTags = get().tags;
    const colorIndex = existingTags.length % TAG_COLORS.length;
    const autoColor = TAG_COLORS[colorIndex];
    
    const newTag: Tag = {
      ...tagData,
      color: tagData.color || autoColor,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    const updatedTags = [...get().tags, newTag];
    set({ tags: updatedTags });
    
    // Save to cache
    const cachedData = cache.get();
    autoSave({ ...cachedData, tags: updatedTags });
    
    return newTag;
  },

  updateTag: (id, updates) => {
    const updatedTags = get().tags.map(tag =>
      tag.id === id ? { ...tag, ...updates } : tag
    );

    set({ tags: updatedTags });

    // Save to cache
    const cachedData = cache.get();
    autoSave({ ...cachedData, tags: updatedTags });
  },

  deleteTag: (id) => {
    const updatedTags = get().tags.filter(tag => tag.id !== id);
    set({ tags: updatedTags });

    // Save to cache
    const cachedData = cache.get();
    cache.set({ ...cachedData, tags: updatedTags });
  },
}));