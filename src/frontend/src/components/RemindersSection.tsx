import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Bell } from 'lucide-react';
import { useGetUpcomingReminders, useAddReminder } from '../hooks/useQueries';
import { toast } from 'sonner';

export function RemindersSection() {
  const { data: reminders = [], isLoading } = useGetUpcomingReminders();
  const addReminderMutation = useAddReminder();

  const [title, setTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

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
      toast.error('Failed to add reminder');
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
