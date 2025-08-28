import { create } from 'zustand';
import { Folder } from '@/types';
import { supabaseService } from '@/lib/supabase-service';

interface FoldersStore {
  folders: Folder[];
  loading: boolean;
  
  // Actions
  loadFolders: () => Promise<void>;
  createFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Folder>;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

export const useFoldersStore = create<FoldersStore>((set, get) => ({
  folders: [],
  loading: false,

  loadFolders: async () => {
    set({ loading: true });
    try {
      const folders = await supabaseService.getFolders();
      set({ folders, loading: false });
    } catch (error) {
      console.error('Error loading folders:', error);
      set({ loading: false });
    }
  },

  createFolder: async (folderData) => {
    try {
      const newFolder = await supabaseService.createFolder(folderData);
      const updatedFolders = [...get().folders, newFolder];
      set({ folders: updatedFolders });
      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  },

  updateFolder: async (id, updates) => {
    try {
      const updatedFolder = await supabaseService.updateFolder(id, updates);
      const updatedFolders = get().folders.map(folder =>
        folder.id === id ? updatedFolder : folder
      );
      set({ folders: updatedFolders });
    } catch (error) {
      console.error('Error updating folder:', error);
      throw error;
    }
  },

  deleteFolder: async (id) => {
    try {
      await supabaseService.deleteFolder(id);
      const updatedFolders = get().folders.filter(folder => folder.id !== id);
      set({ folders: updatedFolders });
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  },
}));