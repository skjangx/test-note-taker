'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { Pin, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNotesStore } from '@/lib/store/notes';
import { useUIStore } from '@/lib/store/ui';
import { useTagsStore } from '@/lib/store/tags';
import { useToast } from '@/hooks/use-toast';
import { Note } from '@/types';
import { cn } from '@/lib/utils';
import Fuse from 'fuse.js';

interface NotesListProps {
  navigateOnSelect?: boolean;
}

export function NotesList({ navigateOnSelect = false }: NotesListProps) {
  const { notes, currentNote, setCurrentNote, togglePin, updateNote, deleteNote } = useNotesStore();
  const { searchQuery, selectedFolder, selectedTags } = useUIStore();
  const { tags } = useTagsStore();
  const { success } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const filteredNotes = useMemo(() => {
    let filtered = [...notes];

    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter(note => note.folderId === selectedFolder);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.some(tagId => note.tagIds.includes(tagId))
      );
    }

    // Search functionality
    if (searchQuery.trim()) {
      const fuse = new Fuse(filtered, {
        keys: ['title', 'content'],
        threshold: 0.3,
      });
      const results = fuse.search(searchQuery);
      filtered = results.map(result => result.item);
    }

    // Sort by pinned first, then by updated date
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, searchQuery, selectedFolder, selectedTags]);

  const handleNoteSelect = (note: Note) => {
    setCurrentNote(note);
    // Navigate based on prop
    if (navigateOnSelect || (pathname.startsWith('/notes/') && pathname !== '/notes')) {
      router.push(`/notes/${note.id}`);
    }
    // Otherwise just select the note (no navigation needed)
  };

  if (filteredNotes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-4">
        <div className="max-w-sm">
          {searchQuery ? (
            // Search empty state
            <>
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium mb-2">No notes found</h3>
              <p className="text-muted-foreground mb-4">
                No notes match &quot;{searchQuery}&quot;. Try different keywords or check your spelling.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => useUIStore.getState().setSearchQuery('')}
              >
                Clear search
              </Button>
            </>
          ) : selectedFolder || selectedTags.length > 0 ? (
            // Filter empty state
            <>
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-lg font-medium mb-2">No notes here yet</h3>
              <p className="text-muted-foreground mb-4">
                This {selectedFolder ? 'folder' : 'tag'} doesn&apos;t have any notes yet. Create a note and assign it here.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  try {
                    const { createNote, setCurrentNote } = useNotesStore.getState();
                    const newNote = await createNote({
                      title: 'Untitled',
                      content: '',
                      tagIds: selectedTags,
                      folderId: selectedFolder || undefined,
                      isPinned: false,
                    });
                    setCurrentNote(newNote);
                  } catch (error) {
                    console.error('Failed to create note:', error);
                  }
                }}
              >
                Create first note
              </Button>
            </>
          ) : (
            // No notes at all empty state
            <>
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium mb-2">Start your note-taking journey</h3>
              <p className="text-muted-foreground mb-4">
                Create your first note to capture thoughts, ideas, and important information.
              </p>
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  onClick={async () => {
                    try {
                      const { createNote, setCurrentNote } = useNotesStore.getState();
                      const newNote = await createNote({
                        title: 'My First Note',
                        content: '',
                        tagIds: selectedTags,
                        folderId: selectedFolder || undefined,
                        isPinned: false,
                      });
                      setCurrentNote(newNote);
                    } catch (error) {
                      console.error('Failed to create note:', error);
                    }
                  }}
                >
                  Create your first note
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full overflow-y-auto scrollbar-hide">
      <div className="p-2 space-y-2 max-w-full">
        {filteredNotes.map((note) => (
          <Card
            key={note.id}
            className={cn(
              "group cursor-pointer hover:shadow-sm transition-all duration-200 w-full overflow-hidden h-[152px]",
              currentNote?.id === note.id && "border-primary/60 border-[1px] shadow-sm"
            )}
            onClick={() => handleNoteSelect(note)}
          >
            <CardContent className="p-0 w-full h-full flex flex-col">
              <div className="px-4 py-2 pb-3 flex-1 flex flex-col">
                {/* Title row with actions */}
                <div className="flex items-center justify-between gap-3 mb-2 overflow-hidden flex-shrink-0">
                  <h3 className="font-medium truncate text-sm min-w-0 flex-1">
                    {note.title || 'Untitled'}
                  </h3>
                  <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 hover:bg-muted/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(note.id);
                      }}
                      title={note.isPinned ? 'Unpin note' : 'Pin note'}
                    >
                      <Pin className={cn("h-3 w-3", note.isPinned ? "text-yellow-600" : "text-gray-400")} />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 hover:bg-muted/50"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <MoreVertical className="h-3 w-3 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              Delete Note
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Note</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{note.title || 'Untitled'}&quot;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  deleteNote(note.id);
                                  setTimeout(() => success('Note deleted successfully'), 100);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {/* Content preview - fixed height for exactly 2 lines */}
                <p className="text-xs text-muted-foreground mb-2 overflow-hidden line-clamp-2 break-all max-w-full leading-relaxed h-10">
                  {note.content ? 
                    note.content.replace(/<[^>]*>/g, '').substring(0, 120) || 'No content' 
                    : 'No content'
                  }
                </p>
                
                {/* Meta information row - always at bottom */}
                <div className="flex items-center justify-between gap-3 flex-shrink-0 min-h-[20px]">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                  </span>
                  
                  <div className="flex gap-1.5 items-center overflow-hidden flex-shrink-0 min-h-[20px]">
                    {note.tagIds.length > 0 ? (
                      <>
                        {note.tagIds.slice(0, 2).map((tagId) => {
                          const tag = tags.find(t => t.id === tagId);
                          if (!tag) return null;
                          return (
                            <Badge 
                              key={tagId} 
                              variant="secondary" 
                              className="text-xs h-5 max-w-20 overflow-hidden"
                              style={{ 
                                backgroundColor: `${tag.color}20`, 
                                borderColor: tag.color,
                                color: tag.color 
                              }}
                            >
                              <span className="truncate block">
                                {tag.name}
                              </span>
                            </Badge>
                          );
                        })}
                        {note.tagIds.length > 2 && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            +{note.tagIds.length - 2}
                          </span>
                        )}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Bottom spacing and note count */}
        <div className="flex justify-center py-4 text-xs text-muted-foreground border-t border-muted-foreground/20 mt-4">
          {filteredNotes.length === 1 ? '1 note' : `${filteredNotes.length} notes`}
        </div>
      </div>
    </div>
  );
}