import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Save, X, Image as ImageIcon, Trash2, Mic, Square, ZoomIn } from 'lucide-react';
import { useGetAllNotes, useAddNote, useUpdateNote, useDeleteNote } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Note, ExternalBlob } from '../backend';
import { ExternalBlob as ExternalBlobClass } from '../backend';

export function NotesSection() {
  const { data: notes = [], isLoading } = useGetAllNotes();
  const addNoteMutation = useAddNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [uploadingImages, setUploadingImages] = useState<ExternalBlob[]>([]);
  const [uploadingVoiceNotes, setUploadingVoiceNotes] = useState<ExternalBlob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<bigint | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileSelect = async (files: FileList | null, isEditing: boolean = false) => {
    if (!files || files.length === 0) return;

    const newImages: ExternalBlob[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const blob = ExternalBlobClass.fromBytes(uint8Array);
        newImages.push(blob);
      } catch (error) {
        toast.error(`Failed to process ${file.name}`);
      }
    }

    if (isEditing && editingNote) {
      setEditingNote({
        ...editingNote,
        imageUrls: [...editingNote.imageUrls, ...newImages],
      });
    } else {
      setUploadingImages((prev) => [...prev, ...newImages]);
    }

    // Clear file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const removeImage = (index: number, isEditing: boolean = false) => {
    if (isEditing && editingNote) {
      const updatedImages = editingNote.imageUrls.filter((_, i) => i !== index);
      setEditingNote({ ...editingNote, imageUrls: updatedImages });
    } else {
      setUploadingImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const removeVoiceNote = (index: number, isEditing: boolean = false) => {
    if (isEditing && editingNote) {
      const updatedVoiceNotes = editingNote.voiceNoteUrls.filter((_, i) => i !== index);
      setEditingNote({ ...editingNote, voiceNoteUrls: updatedVoiceNotes });
    } else {
      setUploadingVoiceNotes((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const externalBlob = ExternalBlobClass.fromBytes(uint8Array);
        
        if (editingNote) {
          setEditingNote({
            ...editingNote,
            voiceNoteUrls: [...editingNote.voiceNoteUrls, externalBlob],
          });
        } else {
          setUploadingVoiceNotes((prev) => [...prev, externalBlob]);
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        toast.success('Voice note recorded successfully!');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Failed to access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddNote = async () => {
    if (!title.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    try {
      const noteId = await addNoteMutation.mutateAsync({
        title,
        content,
        subject: subject || 'General',
      });

      // If there are images or voice notes, update the note
      if (uploadingImages.length > 0 || uploadingVoiceNotes.length > 0) {
        await updateNoteMutation.mutateAsync({
          noteId,
          title,
          content,
          imageUrls: uploadingImages,
          voiceNoteUrls: uploadingVoiceNotes,
        });
      }

      setTitle('');
      setContent('');
      setSubject('');
      setUploadingImages([]);
      setUploadingVoiceNotes([]);
      toast.success('Note added successfully!');
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    try {
      await updateNoteMutation.mutateAsync({
        noteId: editingNote.id,
        title: editingNote.title,
        content: editingNote.content,
        imageUrls: editingNote.imageUrls,
        voiceNoteUrls: editingNote.voiceNoteUrls,
      });
      setEditingNote(null);
      toast.success('Note updated successfully!');
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNoteMutation.mutateAsync(noteToDelete);
      setNoteToDelete(null);
      toast.success('Note deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const formatDate = (nanoTime: bigint) => {
    const ms = Number(nanoTime / BigInt(1000000));
    const date = new Date(ms);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Note</CardTitle>
            <CardDescription>Add study notes with images and voice recordings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title *</Label>
              <Input
                id="note-title"
                placeholder="e.g., Calculus Formulas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-subject">Subject</Label>
              <Input
                id="note-subject"
                placeholder="e.g., Mathematics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                placeholder="Write your notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files, false)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
              
              {uploadingImages.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {uploadingImages.map((blob, index) => (
                    <div key={index} className="relative rounded-lg border p-2">
                      <img
                        src={blob.getDirectURL()}
                        alt={`Upload ${index + 1}`}
                        className="h-24 w-full rounded object-cover"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute right-1 top-1 h-6 w-6"
                        onClick={() => removeImage(index, false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Voice Notes</Label>
              {!isRecording ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={startRecording}
                  className="w-full"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Record Voice Note
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 rounded-lg border bg-destructive/10 p-4">
                    <div className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
                    <span className="font-mono text-sm font-medium">
                      Recording: {formatRecordingTime(recordingTime)}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={stopRecording}
                    className="w-full"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                </div>
              )}
              
              {uploadingVoiceNotes.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadingVoiceNotes.map((blob, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-lg border p-2">
                      <audio controls className="flex-1" src={blob.getDirectURL()} />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeVoiceNote(index, false)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleAddNote}
              disabled={addNoteMutation.isPending || updateNoteMutation.isPending}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {addNoteMutation.isPending || updateNoteMutation.isPending ? 'Adding...' : 'Add Note'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Notes</CardTitle>
            <CardDescription>View and edit your study notes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading notes...</p>
            ) : notes.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No notes yet. Create your first note!
              </p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div key={note.id.toString()} className="rounded-lg border p-4">
                    {editingNote?.id === note.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editingNote.title}
                          onChange={(e) =>
                            setEditingNote({ ...editingNote, title: e.target.value })
                          }
                          placeholder="Title"
                        />
                        <Textarea
                          value={editingNote.content}
                          onChange={(e) =>
                            setEditingNote({ ...editingNote, content: e.target.value })
                          }
                          placeholder="Content"
                          rows={4}
                        />
                        
                        <div className="space-y-2">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files, true)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => editFileInputRef.current?.click()}
                            className="w-full"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Add Images
                          </Button>
                          
                          {editingNote.imageUrls.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {editingNote.imageUrls.map((blob, index) => (
                                <div key={index} className="relative rounded-lg border p-1">
                                  <img
                                    src={blob.getDirectURL()}
                                    alt={`Note image ${index + 1}`}
                                    className="h-20 w-full rounded object-cover"
                                  />
                                  <Button
                                    size="icon"
                                    variant="destructive"
                                    className="absolute right-0 top-0 h-5 w-5"
                                    onClick={() => removeImage(index, true)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          {!isRecording ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={startRecording}
                              className="w-full"
                            >
                              <Mic className="mr-2 h-4 w-4" />
                              Record Voice Note
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-2 rounded-lg border bg-destructive/10 p-2">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                                <span className="text-xs font-medium">
                                  {formatRecordingTime(recordingTime)}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={stopRecording}
                                className="w-full"
                              >
                                <Square className="mr-2 h-4 w-4" />
                                Stop
                              </Button>
                            </div>
                          )}

                          {editingNote.voiceNoteUrls.length > 0 && (
                            <div className="space-y-2">
                              {editingNote.voiceNoteUrls.map((blob, index) => (
                                <div key={index} className="flex items-center gap-2 rounded-lg border p-2">
                                  <audio controls className="flex-1" src={blob.getDirectURL()} />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeVoiceNote(index, true)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleUpdateNote}
                            disabled={updateNoteMutation.isPending}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {updateNoteMutation.isPending ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingNote(null)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-2 flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{note.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {note.subject} • {formatDate(note.createdAt)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNote(note)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setNoteToDelete(note.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                          {note.content}
                        </p>
                        
                        {note.imageUrls.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {note.imageUrls.map((blob, index) => (
                              <div
                                key={index}
                                className="group relative cursor-pointer overflow-hidden rounded-lg border"
                                onClick={() => setSelectedImage(blob.getDirectURL())}
                              >
                                <img
                                  src={blob.getDirectURL()}
                                  alt={`Note image ${index + 1}`}
                                  className="h-32 w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                  <ZoomIn className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {note.voiceNoteUrls.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {note.voiceNoteUrls.map((blob, index) => (
                              <div key={index} className="rounded-lg border bg-muted/30 p-2">
                                <audio controls className="w-full" src={blob.getDirectURL()} />
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Enlarged view"
                className="max-h-[70vh] w-auto rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
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
              {deleteNoteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
