import { useEffect } from 'react';
import { useNotesStore } from '@/lib/store/notes';
import { useFoldersStore } from '@/lib/store/folders';
import { useTagsStore } from '@/lib/store/tags';
import { cache } from '@/lib/cache';

export function useInitialData() {
  const { notes, createNote } = useNotesStore();
  const { folders, createFolder } = useFoldersStore();
  const { tags, createTag } = useTagsStore();

  useEffect(() => {
    // Only create sample data if no notes exist
    if (notes.length === 0 && folders.length === 0 && tags.length === 0) {
      const cachedData = cache.get();
      
      // If no cached data exists, create sample folders, tags, and notes
      if (cachedData.notes.length === 0) {
        // Create sample folders
        const workFolder = createFolder({ name: 'Work' });
        const personalFolder = createFolder({ name: 'Personal' });
        const projectsFolder = createFolder({ name: 'Projects' });
        
        // Create sample tags
        const importantTag = createTag({ name: 'Important' });
        const ideasTag = createTag({ name: 'Ideas' });
        const todoTag = createTag({ name: 'To-Do' });
        const meetingTag = createTag({ name: 'Meeting' });
        // Create sample notes with folders and tags
        createNote({
          title: 'Welcome to Notes App! 👋',
          content: '<h1>Welcome to your new notes app!</h1><p>This is your first note. Here\'s what you can do:</p><h2>✨ Key Features</h2><ul><li><strong>Create</strong> notes using the "New Note" button </li><li><strong>Auto-save</strong> - your changes are saved automatically</li><li><strong>Search</strong> through all your notes instantly</li><li><strong>Organize</strong> with folders and colorful tags</li><li><strong>Pin</strong> important notes to keep them at the top</li></ul><h2>💡 Pro Tips</h2><ul><li>Titles are generated automatically from your content</li><li>Use <strong>bold</strong>, <em>italic</em>, and headers to format text</li><li>Create folders and tags from the sidebar</li><li>Toggle dark/light mode anytime</li></ul><p>Start writing below or create a new note. Happy note-taking! 🚀</p>',
          tagIds: [importantTag.id],
          isPinned: true,
        });

        createNote({
          title: 'Meeting Notes - Q1 Planning',
          content: '<h2>Q1 Planning Meeting</h2><p><strong>Date:</strong> Today</p><p><strong>Attendees:</strong> Team leads</p><h3>Key Points:</h3><ul><li>Budget allocation for new projects</li><li>Timeline for product launch</li><li>Resource planning</li></ul><h3>Action Items:</h3><ol><li>Review budget proposal</li><li>Schedule follow-up meetings</li><li>Prepare presentation</li></ol>',
          tagIds: [meetingTag.id, importantTag.id],
          folderId: workFolder.id,
          isPinned: false,
        });

        createNote({
          title: 'Project Ideas Brainstorm',
          content: '<h2>New Project Ideas</h2><p>Brainstorming session for upcoming projects:</p><ul><li><strong>Mobile App:</strong> Notes sync across devices</li><li><strong>AI Integration:</strong> Smart categorization</li><li><strong>Collaboration:</strong> Shared notebooks</li><li><strong>Templates:</strong> Pre-made note formats</li></ul><p>Need to prioritize and estimate effort for each idea.</p>',
          tagIds: [ideasTag.id, todoTag.id],
          folderId: projectsFolder.id,
          isPinned: false,
        });

        createNote({
          title: 'Daily Journal',
          content: '<h2>Today\'s Reflections</h2><p>This is a space for daily thoughts and reflections:</p><ul><li>What went well today?</li><li>What could be improved?</li><li>Goals for tomorrow</li></ul><p>Writing helps organize thoughts and track progress over time.</p>',
          tagIds: [],
          folderId: personalFolder.id,
          isPinned: false,
        });
      }
    }
  }, [notes.length, createNote, folders.length, tags.length, createFolder, createTag]);
}