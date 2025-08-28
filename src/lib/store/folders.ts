import { create } from 'zustand';
import { Folder } from '@/types';
import { cache, generateId, autoSave } from '@/lib/cache';

interface FoldersStore {
  folders: Folder[];
  loading: boolean;
  
  // Actions
  loadFolders: () => void;
  createFolder: (folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt'>) => Folder;
  updateFolder: (id: string, updates: Partial<Omit<Folder, 'id' | 'createdAt'>>) => void;
  deleteFolder: (id: string) => void;
}

export const useFoldersStore = create<FoldersStore>((set, get) => ({
  folders: [],
  loading: false,

  loadFolders: () => {
    set({ loading: true });
    const cachedData = cache.get();
    set({ 
      folders: cachedData.folders,
      loading: false 
    });
  },

  createFolder: (folderData) => {
    const now = new Date().toISOString();
    const newFolder: Folder = {
      ...folderData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const updatedFolders = [...get().folders, newFolder];
    set({ folders: updatedFolders });
    
    // Save to cache
    const cachedData = cache.get();
    autoSave({ ...cachedData, folders: updatedFolders });
    
    return newFolder;
  },

  updateFolder: (id, updates) => {
    const updatedFolders = get().folders.map(folder =>
      folder.id === id
        ? { ...folder, ...updates, updatedAt: new Date().toISOString() }
        : folder
    );

    set({ folders: updatedFolders });

    // Save to cache
    const cachedData = cache.get();
    autoSave({ ...cachedData, folders: updatedFolders });
  },

  deleteFolder: (id) => {
    const updatedFolders = get().folders.filter(folder => folder.id !== id);
    set({ folders: updatedFolders });

    // Save to cache
    const cachedData = cache.get();
    cache.set({ ...cachedData, folders: updatedFolders });
  },
}));