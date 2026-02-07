import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTimetableEntry } from '../../hooks/useQueries';
import { TimetableEntry } from '../../backend';
import { toast } from 'sonner';

const ACTIVITY_TYPES = [
  { value: 'class', label: 'Class', color: '#3b82f6' },
  { value: 'revision', label: 'Revision', color: '#10b981' },
  { value: 'break', label: 'Break', color: '#f59e0b' },
  { value: 'study', label: 'Study Session', color: '#8b5cf6' },
];

interface EditTimetableEntryDialogProps {
  entry: TimetableEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTimetableEntryDialog({ entry, open, onOpenChange }: EditTimetableEntryDialogProps) {
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('class');
  const updateMutation = useUpdateTimetableEntry();

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setActivityType(entry.activityType);
    }
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const colorCode = ACTIVITY_TYPES.find((t) => t.value === activityType)?.color || '#3b82f6';

    try {
      await updateMutation.mutateAsync({
        id: entry.id,
        newTitle: title,
        newActivityType: activityType,
        newColorCode: colorCode,
      });
      toast.success('Entry updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update entry');
    }
  };

  const formatTime = (nanoTime: bigint) => {
    const ms = Number(nanoTime / BigInt(1000000));
    const date = new Date(ms);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (nanoTime: bigint) => {
    const ms = Number(nanoTime / BigInt(1000000));
    const date = new Date(ms);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Timetable Entry</DialogTitle>
          <DialogDescription>
            Update the title and activity type. Schedule times cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mathematics Lecture"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-activity-type">Activity Type</Label>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger id="edit-activity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Schedule (read-only)</Label>
            <div className="text-sm space-y-1 p-3 bg-muted rounded-md">
              <p><strong>Date:</strong> {formatDate(entry.startTime)}</p>
              <p><strong>Time:</strong> {formatTime(entry.startTime)} - {formatTime(entry.endTime)}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
