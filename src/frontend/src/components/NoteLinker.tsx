import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Link as LinkIcon, Unlink, FileText, AlertCircle } from 'lucide-react';
import { useGetAllNotes, useAddNote } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Note } from '../backend';

interface NoteLinkerProps {
  linkedNoteId: bigint | null;
  onLink: (noteId: bigint) => void;
  onUnlink: () => void;
  onCreateAndLink: (noteId: bigint) => void;
}

export function NoteLinker({ linkedNoteId, onLink, onUnlink, onCreateAndLink }: NoteLinkerProps) {
  const { data: notes = [] } = useGetAllNotes();
  const addNoteMutation = useAddNote();
  
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  
  // Create note form
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('');

  const linkedNote = linkedNoteId ? notes.find(n => n.id === linkedNoteId) : null;

  const handleLinkExisting = () => {
    if (!selectedNoteId) {
      toast.error('Please select a note');
      return;
    }
    onLink(BigInt(selectedNoteId));
    setShowLinkDialog(false);
    setSelectedNoteId('');
    toast.success('Note linked successfully');
  };

  const handleCreateAndLink = async () => {
    if (!newNoteTitle.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    try {
      const noteId = await addNoteMutation.mutateAsync({
        title: newNoteTitle,
        content: newNoteContent,
        subject: newNoteSubject || 'General',
      });
      
      onCreateAndLink(noteId);
      setShowCreateDialog(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteSubject('');
      toast.success('Note created and linked successfully');
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const handleUnlink = () => {
    onUnlink();
    toast.success('Note unlinked');
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Linked Note</Label>
        {linkedNote ? (
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{linkedNote.title}</p>
              <p className="text-xs text-muted-foreground truncate">{linkedNote.subject}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnlink}
            >
              <Unlink className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">No note linked</span>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLinkDialog(true)}
            className="flex-1"
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Link Existing Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="flex-1"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create & Link Note
          </Button>
        </div>
      </div>

      {/* Link Existing Note Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Existing Note</DialogTitle>
            <DialogDescription>Select a note to link to this item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {notes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No notes available. Create a note first.
              </p>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {notes.map((note) => (
                    <div
                      key={note.id.toString()}
                      className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedNoteId === note.id.toString()
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedNoteId(note.id.toString())}
                    >
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{note.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                        <Badge variant="secondary" className="mt-1">
                          {note.subject}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkExisting} disabled={!selectedNoteId}>
              Link Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Note Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create & Link Note</DialogTitle>
            <DialogDescription>Create a new note and link it to this item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-note-title">Title *</Label>
              <Input
                id="new-note-title"
                placeholder="Note title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-note-subject">Subject</Label>
              <Input
                id="new-note-subject"
                placeholder="e.g., Math, Science"
                value={newNoteSubject}
                onChange={(e) => setNewNoteSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-note-content">Content</Label>
              <Textarea
                id="new-note-content"
                placeholder="Note content..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateAndLink}
              disabled={addNoteMutation.isPending}
            >
              {addNoteMutation.isPending ? 'Creating...' : 'Create & Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
