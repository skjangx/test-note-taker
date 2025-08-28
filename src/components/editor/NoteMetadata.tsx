'use client';

import { useState } from 'react';
import { Folder, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from '@/components/ui/select';
import { useNotesStore } from '@/lib/store/notes';
import { useFoldersStore } from '@/lib/store/folders';
import { useTagsStore } from '@/lib/store/tags';

interface NoteMetadataProps {
  noteId: string;
}

export function NoteMetadata({ noteId }: NoteMetadataProps) {
  const { notes, updateNote } = useNotesStore();
  const { folders } = useFoldersStore();
  const { tags } = useTagsStore();
  
  const note = notes.find(n => n.id === noteId);
  
  if (!note) return null;

  const handleFolderChange = (folderId: string) => {
    updateNote(noteId, { 
      folderId: folderId === 'none' ? undefined : folderId 
    });
  };

  const handleAddTag = (tagId: string) => {
    if (!note.tagIds.includes(tagId)) {
      updateNote(noteId, { 
        tagIds: [...note.tagIds, tagId] 
      });
    }
  };

  const handleRemoveTag = (tagId: string) => {
    updateNote(noteId, { 
      tagIds: note.tagIds.filter(id => id !== tagId) 
    });
  };

  const availableTags = tags.filter(tag => !note.tagIds.includes(tag.id));
  const selectedTags = tags.filter(tag => note.tagIds.includes(tag.id));

  return (
    <div className="p-3 border-b border-border bg-muted/30 space-y-3">
      {/* Folder Selection Row */}
      <div className="flex items-center gap-2">
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium w-12">Folder:</span>
        <Select 
          value={note.folderId || 'none'} 
          onValueChange={handleFolderChange}
        >
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue placeholder="No folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No folder</SelectItem>
            {folders.map(folder => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags Row */}
      <div className="flex items-start gap-2">
        <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
        <span className="text-xs text-muted-foreground font-medium w-12 mt-0.5">Tags:</span>
        
        <div className="flex-1 space-y-2">
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {selectedTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="h-6 text-xs flex items-center gap-1 pr-1"
                  style={{ 
                    backgroundColor: `${tag.color}20`, 
                    borderColor: tag.color,
                    color: tag.color
                  }}
                >
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="max-w-20 truncate">{tag.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-3 w-3 p-0 hover:bg-transparent ml-1"
                    onClick={() => handleRemoveTag(tag.id)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add Tag */}
          <div className="flex items-center gap-2">
            {availableTags.length > 0 ? (
              <Select onValueChange={handleAddTag} key={selectedTags.length}>
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue placeholder="+ Add tag" />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 w-2 rounded-full" 
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                All tags assigned
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}