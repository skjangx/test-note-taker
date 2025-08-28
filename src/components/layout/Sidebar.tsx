'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Folder, Tag, Settings, ChevronDown, ChevronRight, Plus, Pin, X, Edit2, MoreVertical, Check, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/lib/store/ui';
import { useNotesStore } from '@/lib/store/notes';
import { useFoldersStore } from '@/lib/store/folders';
import { useTagsStore } from '@/lib/store/tags';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { sidebarOpen, setSidebarOpen, selectedFolder, setSelectedFolder, selectedTags, toggleTag } = useUIStore();
  const { notes, updateNote } = useNotesStore();
  const { folders, loadFolders, createFolder, deleteFolder, updateFolder } = useFoldersStore();
  const { tags, loadTags, createTag, deleteTag, updateTag } = useTagsStore();
  const pathname = usePathname();
  const router = useRouter();
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showNewTag, setShowNewTag] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{id: string, name: string} | null>(null);
  const [editingTag, setEditingTag] = useState<{id: string, name: string} | null>(null);

  const totalNotes = notes.length;
  const pinnedNotes = notes.filter(note => note.isPinned).length;

  // Helper function to auto-close sidebar on tablet breakpoint
  const autoCloseSidebarOnTablet = () => {
    if (window.innerWidth < 1024) { // lg breakpoint
      setSidebarOpen(false);
    }
  };

  const handleDeleteFolder = (folderId: string, removeNotesFromFolder: boolean) => {
    // Handle notes in the folder
    if (removeNotesFromFolder) {
      notes.forEach(note => {
        if (note.folderId === folderId) {
          updateNote(note.id, { folderId: undefined });
        }
      });
    }
    
    // Clear selection if this folder was selected
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
    
    deleteFolder(folderId);
  };

  const handleDeleteTag = (tagId: string, removeFromNotes: boolean) => {
    // Handle notes with this tag
    if (removeFromNotes) {
      notes.forEach(note => {
        if (note.tagIds.includes(tagId)) {
          updateNote(note.id, { 
            tagIds: note.tagIds.filter(id => id !== tagId)
          });
        }
      });
    }
    
    // Clear selection if this tag was selected
    if (selectedTags.includes(tagId)) {
      toggleTag(tagId);
    }
    
    deleteTag(tagId);
  };

  return (
    <aside className={cn(
      "hidden md:block fixed left-0 top-0 z-40 h-full border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
      sidebarOpen ? "w-64" : "w-12"
    )}>
      {sidebarOpen ? (
        // Full Sidebar Content
        <div className="flex h-full flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                className="text-xl font-bold p-0 h-auto hover:bg-muted/50 transition-colors duration-200 rounded-md px-2 py-1"
                onClick={() => {
                  setSelectedFolder(null);
                  useUIStore.getState().clearFilters();
                  useNotesStore.getState().setCurrentNote(null);
                  router.push('/');
                  // Auto-close sidebar on tablet
                  autoCloseSidebarOnTablet();
                }}
              >
                Notes
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setSidebarOpen(false)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

        <ScrollArea className="flex-1 h-0 p-4">
          <div className="space-y-2">
            {/* All Notes - Main Navigation */}
            <div className="mb-6">
              <Button
                variant={!selectedFolder && selectedTags.length === 0 ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3 h-9"
                onClick={() => {
                  setSelectedFolder(null);
                  useUIStore.getState().clearFilters();
                  // Clear current note selection when switching to "All Notes"
                  useNotesStore.getState().setCurrentNote(null);
                  // Auto-close sidebar on tablet
                  autoCloseSidebarOnTablet();
                }}
              >
                <FileText className="h-4 w-4" />
                All Notes
                <span className="ml-auto text-xs text-muted-foreground">
                  {totalNotes}
                </span>
              </Button>
            </div>

            {/* Folders Section */}
            <div>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start gap-2 h-8 px-2"
                  onClick={() => setFoldersExpanded(!foldersExpanded)}
                >
                  {foldersExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Folder className="h-4 w-4" />
                  <span className="text-sm font-medium">Folders</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowNewFolder(!showNewFolder)}
                  aria-label="Create new folder"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              {foldersExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {showNewFolder && (
                    <div className="flex gap-2 px-2">
                      <Input
                        placeholder="Folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newFolderName.trim()) {
                            createFolder({ name: newFolderName.trim() });
                            setNewFolderName('');
                            setShowNewFolder(false);
                          } else if (e.key === 'Escape') {
                            setNewFolderName('');
                            setShowNewFolder(false);
                          }
                        }}
                        className="h-6 text-xs"
                        autoFocus
                      />
                    </div>
                  )}
                  
                  {folders.map((folder) => (
                    <div key={folder.id} className="group flex items-center">
                      <Button
                        variant={selectedFolder === folder.id ? 'secondary' : 'ghost'}
                        className="flex-1 justify-start gap-2 h-7 px-2 text-xs"
                        onClick={() => {
                          setSelectedFolder(folder.id);
                          // Clear current note when changing filters
                          useNotesStore.getState().setCurrentNote(null);
                          // Auto-close sidebar on tablet
                          autoCloseSidebarOnTablet();
                        }}
                      >
                        <Folder className="h-3 w-3" />
                        {folder.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {notes.filter(note => note.folderId === folder.id).length}
                        </span>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setEditingFolder({id: folder.id, name: folder.name});
                            }}
                          >
                            <Edit2 className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                                <AlertDialogDescription>
                                  What would you like to do with the {notes.filter(note => note.folderId === folder.id).length} note(s) in this folder?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFolder(folder.id, true)}
                                >
                                  Remove from Folder
                                </AlertDialogAction>
                                <AlertDialogAction
                                  onClick={() => handleDeleteFolder(folder.id, false)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete All
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  
                  {folders.length === 0 && !showNewFolder && (
                    <div className="px-2 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        No folders yet
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        Create folders to organize your notes
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start gap-2 h-8 px-2"
                  onClick={() => setTagsExpanded(!tagsExpanded)}
                >
                  {tagsExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                  <Tag className="h-4 w-4" />
                  <span className="text-sm font-medium">Tags</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowNewTag(!showNewTag)}
                  aria-label="Create new tag"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              
              {tagsExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {showNewTag && (
                    <div className="flex gap-2 px-2">
                      <Input
                        placeholder="Tag name"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTagName.trim()) {
                            createTag({ 
                              name: newTagName.trim()
                            });
                            setNewTagName('');
                            setShowNewTag(false);
                          } else if (e.key === 'Escape') {
                            setNewTagName('');
                            setShowNewTag(false);
                          }
                        }}
                        className="h-6 text-xs"
                        autoFocus
                      />
                    </div>
                  )}
                  
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <div key={tag.id} className="group flex items-center">
                        <Button
                          variant={isSelected ? 'secondary' : 'ghost'}
                          className="flex-1 justify-start gap-2 h-7 px-2 text-xs"
                          onClick={() => {
                            toggleTag(tag.id);
                            // Clear current note when changing filters
                            useNotesStore.getState().setCurrentNote(null);
                            // Auto-close sidebar on tablet
                            autoCloseSidebarOnTablet();
                          }}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                          <div 
                            className="h-2 w-2 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                          <span className="ml-auto text-xs text-muted-foreground">
                            {notes.filter(note => note.tagIds.includes(tag.id)).length}
                          </span>
                        </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setEditingTag({id: tag.id, name: tag.name});
                            }}
                          >
                            <Edit2 className="h-3 w-3 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                <X className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                                <AlertDialogDescription>
                                  What would you like to do with the {notes.filter(note => note.tagIds.includes(tag.id)).length} note(s) that have this tag?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTag(tag.id, true)}
                                >
                                  Remove Tag Only
                                </AlertDialogAction>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTag(tag.id, false)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete All Notes
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                  })}
                  
                  {tags.length === 0 && !showNewTag && (
                    <div className="px-2 py-3 text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        No tags yet
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        Add tags for flexible categorization
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Settings */}
        <div className="p-4 border-t border-border">
          <Link href="/settings">
            <Button
              variant={pathname === '/settings' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3 h-9"
              onClick={() => {
                // Clear current note selection when navigating to settings
                useNotesStore.getState().setCurrentNote(null);
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
        </div>
      ) : (
        // Collapsed Sidebar - Just Hamburger Menu
        <div className="flex flex-col items-center py-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Edit Folder Dialog */}
      <Dialog open={editingFolder !== null} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Change the name of this folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={editingFolder?.name || ''}
              onChange={(e) => setEditingFolder(prev => prev ? {...prev, name: e.target.value} : null)}
              placeholder="Folder name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editingFolder?.name.trim()) {
                  updateFolder(editingFolder.id, { name: editingFolder.name.trim() });
                  setEditingFolder(null);
                } else if (e.key === 'Escape') {
                  setEditingFolder(null);
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingFolder(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingFolder?.name.trim()) {
                  updateFolder(editingFolder.id, { name: editingFolder.name.trim() });
                  setEditingFolder(null);
                }
              }}
              disabled={!editingFolder?.name.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={editingTag !== null} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Change the name of this tag.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={editingTag?.name || ''}
              onChange={(e) => setEditingTag(prev => prev ? {...prev, name: e.target.value} : null)}
              placeholder="Tag name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editingTag?.name.trim()) {
                  updateTag(editingTag.id, { name: editingTag.name.trim() });
                  setEditingTag(null);
                } else if (e.key === 'Escape') {
                  setEditingTag(null);
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTag(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingTag?.name.trim()) {
                  updateTag(editingTag.id, { name: editingTag.name.trim() });
                  setEditingTag(null);
                }
              }}
              disabled={!editingTag?.name.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}