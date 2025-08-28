'use client';

import { Search, Plus, Sun, Moon, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/lib/store/ui';
import { useNotesStore } from '@/lib/store/notes';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    theme, 
    toggleTheme, 
    searchQuery, 
    setSearchQuery,
    selectedFolder,
    selectedTags,
    sidebarOpen
  } = useUIStore();
  
  const createNote = useNotesStore((state) => state.createNote);
  const { success } = useToast();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      success('Signed out successfully');
      router.push('/auth/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        title: 'Untitled',
        content: '',
        tagIds: selectedTags,
        folderId: selectedFolder || undefined,
        isPinned: false,
      });
      
      // Set as current note and navigate appropriately
      useNotesStore.getState().setCurrentNote(newNote);
      
      // Show success toast
      success('New note created!');
      
      // Navigate based on current context
      if (pathname === '/notes' || pathname.startsWith('/notes/')) {
        // If we're on notes pages, navigate to the new note
        router.push(`/notes/${newNote.id}`);
      } else if (pathname !== '/') {
        // If we're not on dashboard, go to dashboard to see the editor
        router.push('/');
      }
      // If we're on dashboard, just select the note (no navigation needed)
    } catch (error) {
      console.error('Error creating note:', error);
      success('Error creating note. Please try again.');
    }
  };

  // Hide header on settings page
  if (pathname === '/settings') {
    return null;
  }

  return (
    <header className={cn(
      "hidden md:block h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 right-0 z-30 transition-all duration-300",
      sidebarOpen ? "left-64" : "left-12"
    )}>
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              aria-label="Search through all notes"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleCreateNote}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Note</span>
            <span className="sm:hidden">New</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}