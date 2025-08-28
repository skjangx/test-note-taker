'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { useNotesStore } from '@/lib/store/notes';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotePage() {
  const params = useParams();
  const router = useRouter();
  const { notes, setCurrentNote } = useNotesStore();
  
  const noteId = params.id as string;
  const note = notes.find(n => n.id === noteId);
  
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');

  useEffect(() => {
    if (note) {
      setCurrentNote(note);
      setLocalTitle(note.title);
      setLocalContent(note.content);
    }
  }, [note, setCurrentNote]);

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div>
          <h3 className="text-lg font-medium mb-2">Note not found</h3>
          <p className="text-muted-foreground mb-4">
            The note you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Back Navigation */}
      <div className="p-4 border-b border-border bg-muted/30">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Notes
        </Button>
      </div>
      
      <div className="flex-1">
        <RichTextEditor
          noteId={note.id}
          title={localTitle}
          content={localContent}
          onTitleChange={setLocalTitle}
          onContentChange={setLocalContent}
        />
      </div>
    </div>
  );
}