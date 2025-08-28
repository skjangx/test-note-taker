import { create } from 'zustand';
import { Tag } from '@/types';
import { supabaseService } from '@/lib/supabase-service';

// Color palette for auto-assigning tag colors
const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange  
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f59e0b', // amber
];

interface TagsStore {
  tags: Tag[];
  loading: boolean;
  
  // Actions
  loadTags: () => Promise<void>;
  createTag: (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTagsStore = create<TagsStore>((set, get) => ({
  tags: [],
  loading: false,

  loadTags: async () => {
    set({ loading: true });
    try {
      const tags = await supabaseService.getTags();
      set({ tags, loading: false });
    } catch (error) {
      console.error('Error loading tags:', error);
      set({ loading: false });
    }
  },

  createTag: async (tagData) => {
    try {
      // Auto-assign color if not provided
      const finalTagData = {
        ...tagData,
        color: tagData.color || TAG_COLORS[get().tags.length % TAG_COLORS.length]
      };
      
      const newTag = await supabaseService.createTag(finalTagData);
      const updatedTags = [...get().tags, newTag];
      set({ tags: updatedTags });
      return newTag;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  },

  updateTag: async (id, updates) => {
    try {
      const updatedTag = await supabaseService.updateTag(id, updates);
      const updatedTags = get().tags.map(tag =>
        tag.id === id ? updatedTag : tag
      );
      set({ tags: updatedTags });
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      await supabaseService.deleteTag(id);
      const updatedTags = get().tags.filter(tag => tag.id !== id);
      set({ tags: updatedTags });
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  },
}));