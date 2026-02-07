import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useGetTimetableEntries, useAddTimetableEntry, useDeleteTimetableEntry } from '../hooks/useQueries';
import { TimetableEntry } from '../backend';
import { toast } from 'sonner';
import { DoneTodayCheckbox } from './timetable/DoneTodayCheckbox';
import { EditTimetableEntryDialog } from './timetable/EditTimetableEntryDialog';
import { TimetableCompletionHistoryDialog } from './timetable/TimetableCompletionHistoryDialog';

const ACTIVITY_TYPES = [
  { value: 'class', label: 'Class', color: '#3b82f6' },
  { value: 'revision', label: 'Revision', color: '#10b981' },
  { value: 'break', label: 'Break', color: '#f59e0b' },
  { value: 'study', label: 'Study Session', color: '#8b5cf6' },
];

export function TimetableSection() {
  const { data: entries = [], isLoading } = useGetTimetableEntries();
  const addEntryMutation = useAddTimetableEntry();
  const deleteEntryMutation = useDeleteTimetableEntry();

  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('class');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<bigint | null>(null);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<TimetableEntry | null>(null);

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [entryForHistory, setEntryForHistory] = useState<TimetableEntry | null>(null);

  const handleAddEntry = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startDate = new Date(selectedDate);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(selectedDate);
    endDate.setHours(endHour, endMin, 0, 0);

    if (endDate <= startDate) {
      toast.error('End time must be after start time');
      return;
    }

    const colorCode =
      ACTIVITY_TYPES.find((t) => t.value === activityType)?.color || '#3b82f6';

    try {
      await addEntryMutation.mutateAsync({
        title,
        activityType,
        startTime: BigInt(startDate.getTime() * 1000000),
        endTime: BigInt(endDate.getTime() * 1000000),
        colorCode,
      });
      setTitle('');
      setActivityType('class');
      setStartTime('09:00');
      setEndTime('10:00');
      toast.success('Timetable entry added!');
    } catch (error) {
      toast.error('Failed to add entry');
    }
  };

  const openDeleteDialog = (entryId: bigint) => {
    setEntryToDelete(entryId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;

    try {
      await deleteEntryMutation.mutateAsync(entryToDelete);
      toast.success('Entry deleted');
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const openEditDialog = (entry: TimetableEntry) => {
    setEntryToEdit(entry);
    setEditDialogOpen(true);
  };

  const openHistoryDialog = (entry: TimetableEntry) => {
    setEntryForHistory(entry);
    setHistoryDialogOpen(true);
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

  const sortedEntries = [...entries].sort((a, b) =>
    Number(a.startTime - b.startTime)
  );

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Timetable Entry</CardTitle>
            <CardDescription>Schedule your classes, study sessions, and breaks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-title">Title *</Label>
              <Input
                id="entry-title"
                placeholder="e.g., Mathematics Lecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger id="activity-type">
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
              <Label htmlFor="entry-date">Date</Label>
              <Input
                id="entry-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleAddEntry}
              disabled={addEntryMutation.isPending}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {addEntryMutation.isPending ? 'Adding...' : 'Add to Timetable'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Timetable Entries</CardTitle>
            <CardDescription>Your complete schedule across all days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading schedule...</p>
            ) : sortedEntries.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No entries yet. Add your first activity!
              </p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {sortedEntries.map((entry) => (
                  <div
                    key={entry.id.toString()}
                    className="flex flex-col gap-3 rounded-lg border p-3"
                    style={{ borderLeftWidth: '4px', borderLeftColor: entry.colorCode }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1">
                        <h4 className="font-medium">{entry.title}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {entry.activityType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(entry.startTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(entry)}
                          className="h-8 w-8"
                          title="Edit entry"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openHistoryDialog(entry)}
                          className="h-8 w-8 text-xl"
                          title="View completion history"
                          aria-label="View completion history"
                        >
                          🔥
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(entry.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <DoneTodayCheckbox entryId={entry.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timetable Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone and will also remove all completion history for this entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEntryToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteEntryMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEntryMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTimetableEntryDialog
        entry={entryToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <TimetableCompletionHistoryDialog
        entry={entryForHistory}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />
    </>
  );
}
