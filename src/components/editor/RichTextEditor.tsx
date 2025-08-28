'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotesStore } from '@/lib/store/notes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { NoteMetadata } from './NoteMetadata';
import { Trash2 } from 'lucide-react';
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

interface RichTextEditorProps {
  noteId: string;
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
}

export function RichTextEditor({ 
  noteId, 
  title, 
  content, 
  onTitleChange, 
  onContentChange 
}: RichTextEditorProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const updateNote = useNotesStore((state) => state.updateNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);
  const setCurrentNote = useNotesStore((state) => state.setCurrentNote);
  const { success } = useToast();
  const isInitializing = useRef(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [, forceUpdate] = useState({});

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your note...',
      }),
    ],
    content,
    immediatelyRender: false,
    onSelectionUpdate: ({ editor }) => {
      // Force re-render when selection changes to update button states
      forceUpdate({});
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      onContentChange(newContent);
      
      // Only auto-save if we're not initializing
      if (!isInitializing.current) {
        // Auto-title generation temporarily disabled for debugging
        // if (!title || title === 'Untitled') {
        //   const textContent = editor.getText();
        //   if (textContent.trim()) {
        //     const firstLine = textContent.split('\n')[0].trim();
        //     const autoTitle = firstLine.length > 50 
        //       ? firstLine.substring(0, 47) + '...' 
        //       : firstLine;
        //     
        //     if (autoTitle && autoTitle !== title) {
        //       onTitleChange(autoTitle);
        //     }
        //   }
        // }
        
        // Show saving indicator
        setSaveStatus('unsaved');
        
        // Clear previous timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        
        // Debounce the database update - only save after user stops typing
        saveTimeoutRef.current = setTimeout(async () => {
          setSaveStatus('saving');
          try {
            await updateNote(noteId, { content: newContent });
            setSaveStatus('saved');
          } catch (error) {
            console.error('Failed to save content:', error);
            setSaveStatus('unsaved');
          }
        }, 2000); // Wait 2 seconds after user stops typing for content
      }
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] px-4 py-3 prose-editor',
        style: 'white-space: pre-wrap;',
      },
    },
    onCreate: ({ editor }) => {
      // Mark initialization as complete when editor is created
      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML() && !editor.isFocused) {
      isInitializing.current = true;
      editor.commands.setContent(content);
      // Set a timeout to mark initialization as complete
      setTimeout(() => {
        isInitializing.current = false;
      }, 100);
    }
  }, [editor, content]);

  const handleTitleChange = (newTitle: string) => {
    onTitleChange(newTitle);
    
    // Show saving indicator
    setSaveStatus('unsaved');
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce the database update - only save after user stops typing
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await updateNote(noteId, { title: newTitle });
        setSaveStatus('saved');
      } catch (error) {
        console.error('Failed to save title:', error);
        setSaveStatus('unsaved');
      }
    }, 1000); // Wait 1 second after user stops typing
  };

  const handleDeleteNote = () => {
    deleteNote(noteId);
    setTimeout(() => success('Note deleted successfully'), 100);
    // Note: currentNote is automatically cleared by the store when deleting the current note
  };

  const toggleFormatWithWordSelection = (formatType: 'bold' | 'italic') => {
    if (!editor) return;
    
    // If cursor is in a word without selection, select the word first
    const { from, to } = editor.state.selection;
    if (from === to) {
      const { state } = editor;
      const { doc, selection } = state;
      const pos = selection.$from;
      const start = pos.start();
      const end = pos.end();
      const textContent = doc.textBetween(start, end);
      
      // Find word boundaries around cursor
      let wordStart = pos.pos - start;
      let wordEnd = wordStart;
      
      // Move back to find word start
      while (wordStart > 0 && /\w/.test(textContent[wordStart - 1])) {
        wordStart--;
      }
      
      // Move forward to find word end
      while (wordEnd < textContent.length && /\w/.test(textContent[wordEnd])) {
        wordEnd++;
      }
      
      // If we're in a word, select it first
      if (wordStart < wordEnd && /\w/.test(textContent.slice(wordStart, wordEnd))) {
        const toggleMethod = formatType === 'bold' ? 'toggleBold' : 'toggleItalic';
        editor.chain().focus()
          .setTextSelection({ from: start + wordStart, to: start + wordEnd })
          [toggleMethod]()
          .run();
        return;
      }
    }
    
    // Default behavior for selections or non-word positions
    if (formatType === 'bold') {
      editor.chain().focus().toggleBold().run();
    } else {
      editor.chain().focus().toggleItalic().run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Title Input */}
      <div className="border-b border-border p-3 sm:p-4">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <input
            ref={titleRef}
            type="text"
            value={title || ''}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled"
            className="flex-1 text-xl sm:text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground"
            aria-label="Note title"
          />
          
          {/* Auto-save Status & Actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
              {saveStatus === 'saving' && (
                <>
                  <Clock className="h-3 w-3 animate-pulse" />
                  <span>Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span>Saved</span>
                </>
              )}
            </div>
            
            <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this note? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteNote}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Note Metadata */}
      <NoteMetadata noteId={noteId} />

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30 overflow-x-auto">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFormatWithWordSelection('bold');
          }}
          className="h-8 w-8 p-0"
          aria-label="Bold text"
          aria-pressed={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFormatWithWordSelection('italic');
          }}
          className="h-8 w-8 p-0"
          aria-label="Italic text"
          aria-pressed={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // If we're in a list, first convert to paragraph then apply heading
            if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
              editor.chain().focus().liftListItem('listItem').setParagraph().toggleHeading({ level: 1 }).run();
            } else {
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            }
          }}
          className="h-8 w-8 p-0"
          aria-label="Heading 1"
          aria-pressed={editor.isActive('heading', { level: 1 })}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // If we're in a list, first convert to paragraph then apply heading
            if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
              editor.chain().focus().liftListItem('listItem').setParagraph().toggleHeading({ level: 2 }).run();
            } else {
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            }
          }}
          className="h-8 w-8 p-0"
          aria-label="Heading 2"
          aria-pressed={editor.isActive('heading', { level: 2 })}
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // If we're in a heading, first convert to paragraph then apply list
            if (editor.isActive('heading')) {
              editor.chain().focus().setParagraph().toggleBulletList().run();
            } else {
              editor.chain().focus().toggleBulletList().run();
            }
          }}
          className="h-8 w-8 p-0"
          aria-label="Bullet list"
          aria-pressed={editor.isActive('bulletList')}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // If we're in a heading, first convert to paragraph then apply list
            if (editor.isActive('heading')) {
              editor.chain().focus().setParagraph().toggleOrderedList().run();
            } else {
              editor.chain().focus().toggleOrderedList().run();
            }
          }}
          className="h-8 w-8 p-0"
          aria-label="Numbered list"
          aria-pressed={editor.isActive('orderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}