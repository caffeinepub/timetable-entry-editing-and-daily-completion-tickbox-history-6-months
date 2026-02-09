import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Bell, Edit2, Trash2 } from 'lucide-react';
import { useGetUpcomingReminders, useAddReminder, useUpdateReminder, useDeleteReminder } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Reminder } from '../backend';
import { mapBackendError } from '../utils/backendErrorMessage';

export function RemindersSection() {
  const { data: reminders = [], isLoading } = useGetUpcomingReminders();
  const addReminderMutation = useAddReminder();
  const updateReminderMutation = useUpdateReminder();
  const deleteReminderMutation = useDeleteReminder();

  const [title, setTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(null);

  const handleAddReminder = async () => {
    if (!title.trim()) {
      toast.error('Please enter a reminder title');
      return;
    }

    if (!reminderDate || !reminderTime) {
      toast.error('Please select date and time');
      return;
    }

    const [year, month, day] = reminderDate.split('-').map(Number);
    const [hour, minute] = reminderTime.split(':').map(Number);

    const reminderDateTime = new Date(year, month - 1, day, hour, minute);

    if (reminderDateTime <= new Date()) {
      toast.error('Reminder time must be in the future');
      return;
    }

    try {
      await addReminderMutation.mutateAsync({
        title,
        reminderTime: BigInt(reminderDateTime.getTime() * 1000000),
      });
      setTitle('');
      setReminderDate('');
      setReminderTime('');
      toast.success('Reminder set successfully!');
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    const ms = Number(reminder.reminderTime / BigInt(1000000));
    const date = new Date(ms);
    
    setEditingReminder(reminder);
    setEditTitle(reminder.title);
    setEditDate(date.toISOString().split('T')[0]);
    setEditTime(date.toTimeString().slice(0, 5));
  };

  const handleSaveEdit = async () => {
    if (!editingReminder) return;

    if (!editTitle.trim()) {
      toast.error('Please enter a reminder title');
      return;
    }

    if (!editDate || !editTime) {
      toast.error('Please select date and time');
      return;
    }

    const [year, month, day] = editDate.split('-').map(Number);
    const [hour, minute] = editTime.split(':').map(Number);

    const reminderDateTime = new Date(year, month - 1, day, hour, minute);

    if (reminderDateTime <= new Date()) {
      toast.error('Reminder time must be in the future');
      return;
    }

    try {
      await updateReminderMutation.mutateAsync({
        reminderId: editingReminder.id,
        title: editTitle,
        reminderTime: BigInt(reminderDateTime.getTime() * 1000000),
      });
      setEditingReminder(null);
      toast.success('Reminder updated successfully!');
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const handleDeleteReminder = async () => {
    if (!deletingReminder) return;

    try {
      await deleteReminderMutation.mutateAsync(deletingReminder.id);
      setDeletingReminder(null);
      toast.success('Reminder deleted successfully!');
    } catch (error) {
      const errorMessage = mapBackendError(error);
      toast.error(errorMessage);
    }
  };

  const formatDateTime = (nanoTime: bigint) => {
    const ms = Number(nanoTime / BigInt(1000000));
    const date = new Date(ms);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeUntil = (nanoTime: bigint) => {
    const ms = Number(nanoTime / BigInt(1000000));
    const now = Date.now();
    const diff = ms - now;

    if (diff < 0) return 'Past due';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'soon';
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Set Reminder</CardTitle>
            <CardDescription>Get notified about upcoming tasks and events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-title">Title *</Label>
              <Input
                id="reminder-title"
                placeholder="e.g., Study for exam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reminder-date">Date</Label>
                <Input
                  id="reminder-date"
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder-time">Time</Label>
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleAddReminder}
              disabled={addReminderMutation.isPending}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {addReminderMutation.isPending ? 'Setting...' : 'Set Reminder'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
            <CardDescription>Your scheduled reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground">Loading reminders...</p>
            ) : reminders.length === 0 ? (
              <p className="text-center text-muted-foreground">
                No upcoming reminders. Set your first reminder!
              </p>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id.toString()}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <Bell className="mt-0.5 h-5 w-5 text-primary" />
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium">{reminder.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(reminder.reminderTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTimeUntil(reminder.reminderTime)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditReminder(reminder)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingReminder(reminder)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Reminder Dialog */}
      <Dialog open={!!editingReminder} onOpenChange={(open) => !open && setEditingReminder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reminder</DialogTitle>
            <DialogDescription>Update your reminder details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g., Study for exam"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReminder(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateReminderMutation.isPending}
            >
              {updateReminderMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingReminder} onOpenChange={(open) => !open && setDeletingReminder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reminder? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReminder}
              disabled={deleteReminderMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteReminderMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
