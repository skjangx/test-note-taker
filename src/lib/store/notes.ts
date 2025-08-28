import { create } from 'zustand';
import { Note } from '@/types';
import { cache, generateId, autoSave } from '@/lib/cache';

interface NotesStore {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;
  
  // Actions
  loadNotes: () => void;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Note;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  setCurrentNote: (note: Note | null) => void;
  togglePin: (id: string) => void;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  currentNote: null,
  loading: false,

  loadNotes: () => {
    set({ loading: true });
    const cachedData = cache.get();
    set({ 
      notes: cachedData.notes,
      loading: false 
    });
  },

  createNote: (noteData) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...noteData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const updatedNotes = [newNote, ...get().notes];
    set({ notes: updatedNotes, currentNote: newNote });
    
    // Save to cache
    const cachedData = cache.get();
    autoSave({ ...cachedData, notes: updatedNotes });
    
    return newNote;
  },

  updateNote: (id, updates) => {
    const updatedNotes = get().notes.map(note =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    );

    const updatedCurrentNote = get().currentNote?.id === id
      ? { ...get().currentNote!, ...updates, updatedAt: new Date().toISOString() }
      : get().currentNote;

    set({ 
      notes: updatedNotes,
      currentNote: updatedCurrentNote
    });

    // Save to cache
    const cachedData = cache.get();
    autoSave({ ...cachedData, notes: updatedNotes });
  },

  deleteNote: (id) => {
    const currentState = get();
    const updatedNotes = currentState.notes.filter(note => note.id !== id);
    const wasCurrentNote = currentState.currentNote?.id === id;
    const updatedCurrentNote = wasCurrentNote ? null : currentState.currentNote;

    // Update state
    set({ 
      notes: updatedNotes,
      currentNote: updatedCurrentNote
    });

    // Save to cache with both notes and currentNote cleared if needed
    const cachedData = cache.get();
    const newCachedData = { 
      ...cachedData, 
      notes: updatedNotes
    };
    
    cache.set(newCachedData);
    autoSave(newCachedData);
    
    // Force update if we deleted the current note
    if (wasCurrentNote) {
      // Trigger a re-render by setting currentNote explicitly
      setTimeout(() => set({ currentNote: null }), 0);
    }
  },

  setCurrentNote: (note) => {
    set({ currentNote: note });
  },

  togglePin: (id) => {
    const note = get().notes.find(n => n.id === id);
    if (note) {
      get().updateNote(id, { isPinned: !note.isPinned });
    }
  },
}));