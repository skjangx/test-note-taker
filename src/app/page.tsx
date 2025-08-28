'use client';

import { useState, useEffect } from 'react';
import { NotesList } from '@/components/notes/NotesList';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { useNotesStore } from '@/lib/store/notes';
import { useFoldersStore } from '@/lib/store/folders';
import { useTagsStore } from '@/lib/store/tags';
import { useUIStore } from '@/lib/store/ui';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { currentNote, loadNotes, createNote } = useNotesStore();
  const { loadFolders } = useFoldersStore();
  const { loadTags } = useTagsStore();
  const { selectedFolder, selectedTags, sidebarOpen } = useUIStore();
  const { success } = useToast();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Update local state when current note changes
  useEffect(() => {
    if (currentNote) {
      setLocalTitle(currentNote.title);
      setLocalContent(currentNote.content);
    } else {
      // Clear local state when no note is selected
      setLocalTitle('');
      setLocalContent('');
    }
  }, [currentNote]);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  // Load all data when user is authenticated
  useEffect(() => {
    if (user && !dataLoaded) {
      const loadAllData = async () => {
        try {
          await Promise.all([
            loadNotes(),
            loadFolders(),
            loadTags()
          ]);
          setDataLoaded(true);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      };
      
      loadAllData();
    }
  }, [user, dataLoaded, loadNotes, loadFolders, loadTags]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
          <div className="text-sm text-muted-foreground">Checking authentication</div>
        </div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return null;
  }

  return (
    <>
      {/* Mobile Layout - Desktop Optimization Message */}
      <div className="flex md:hidden h-full flex-col">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="text-6xl mb-6">💻</div>
            <h2 className="text-xl font-semibold mb-4">Desktop Optimized</h2>
            <p className="text-muted-foreground mb-4">
              This application is currently optimized for desktop experience. For the best note-taking experience, please visit us on a desktop or tablet device.
            </p>
            <p className="text-sm text-muted-foreground">
              Mobile support coming soon!
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Split Pane */}
      <div className={cn(
        "hidden md:flex h-full flex-row transition-all duration-300 absolute top-14 bottom-0 right-0 overflow-hidden",
        sidebarOpen ? "left-[256px]" : "left-[48px]"
      )}>
        {/* Notes List Panel */}
        <div className="w-80 border-r border-border bg-muted/50 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-border flex-shrink-0">
            <h2 className="font-semibold">All Notes</h2>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <NotesList navigateOnSelect={false} />
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex-1 h-full overflow-hidden">
          {currentNote ? (
            <RichTextEditor
              noteId={currentNote.id}
              title={localTitle}
              content={localContent}
              onTitleChange={setLocalTitle}
              onContentChange={setLocalContent}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-center p-4 overflow-y-auto">
              <div className="max-w-md">
                <div className="text-5xl mb-4">✍️</div>
                <h3 className="text-xl font-semibold mb-3">Ready to write?</h3>
                <p className="text-muted-foreground mb-6">
                  Select a note from the list on the left, or create a new one to start capturing your thoughts.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={async () => {
                      try {
                        const { setCurrentNote } = useNotesStore.getState();
                        const newNote = await createNote({
                          title: 'Untitled',
                          content: '',
                          tagIds: selectedTags,
                          folderId: selectedFolder || undefined,
                          isPinned: false,
                        });
                        setCurrentNote(newNote);
                        success('New note created!');
                      } catch (error) {
                        console.error('Error creating note:', error);
                        success('Error creating note. Please try again.');
                      }
                    }}
                  >
                    Create New Note
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}