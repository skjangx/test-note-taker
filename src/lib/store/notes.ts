import { create } from 'zustand';
import { Note } from '@/types';
import { supabaseService } from '@/lib/supabase-service';

interface NotesStore {
  notes: Note[];
  currentNote: Note | null;
  loading: boolean;
  
  // Actions
  loadNotes: () => Promise<void>;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setCurrentNote: (note: Note | null) => void;
  togglePin: (id: string) => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: [],
  currentNote: null,
  loading: false,

  loadNotes: async () => {
    set({ loading: true });
    try {
      const notes = await supabaseService.getNotes();
      set({ notes, loading: false });
    } catch (error) {
      console.error('Error loading notes:', error);
      set({ loading: false });
    }
  },

  createNote: async (noteData) => {
    try {
      const newNote = await supabaseService.createNote(noteData);
      const updatedNotes = [newNote, ...get().notes];
      set({ notes: updatedNotes, currentNote: newNote });
      return newNote;
    } catch (error) {
      console.error('Error creating note:', JSON.stringify(error, null, 2));
      console.error('Create note error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: (error as { details?: string })?.details,
        hint: (error as { hint?: string })?.hint,
        code: (error as { code?: string })?.code
      });
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const updatedNote = await supabaseService.updateNote(id, updates);
      
      const updatedNotes = get().notes.map(note =>
        note.id === id ? updatedNote : note
      );

      const updatedCurrentNote = get().currentNote?.id === id
        ? updatedNote
        : get().currentNote;

      set({ 
        notes: updatedNotes,
        currentNote: updatedCurrentNote
      });
    } catch (error) {
      console.error('Error updating note:', JSON.stringify(error, null, 2));
      console.error('Update note error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        details: (error as { details?: string })?.details,
        hint: (error as { hint?: string })?.hint,
        code: (error as { code?: string })?.code
      });
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      await supabaseService.deleteNote(id);
      
      const currentState = get();
      const updatedNotes = currentState.notes.filter(note => note.id !== id);
      const wasCurrentNote = currentState.currentNote?.id === id;
      const updatedCurrentNote = wasCurrentNote ? null : currentState.currentNote;

      set({ 
        notes: updatedNotes,
        currentNote: updatedCurrentNote
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  },

  setCurrentNote: (note) => {
    set({ currentNote: note });
  },

  togglePin: async (id) => {
    const note = get().notes.find(n => n.id === id);
    if (note) {
      await get().updateNote(id, { isPinned: !note.isPinned });
    }
  },
}));