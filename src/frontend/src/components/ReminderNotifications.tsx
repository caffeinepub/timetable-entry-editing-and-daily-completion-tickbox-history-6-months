import { useEffect, useState } from 'react';
import { useGetUpcomingReminders } from '../hooks/useQueries';
import { NotificationManager } from '@/lib/NotificationManager';

export function ReminderNotifications() {
  const { data: reminders = [] } = useGetUpcomingReminders();
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();

      reminders.forEach((reminder) => {
        const reminderMs = Number(reminder.reminderTime / BigInt(1000000));
        const timeDiff = reminderMs - now;
        const reminderId = reminder.id.toString();

        // Show notification if reminder is within 1 minute and hasn't been notified
        if (timeDiff > 0 && timeDiff <= 60000 && !notifiedIds.has(reminderId)) {
          NotificationManager.showReminder(reminder.title, 'Reminder notification');
          setNotifiedIds((prev) => new Set(prev).add(reminderId));
        }
      });
    };

    // Check immediately
    checkReminders();

    // Check every 30 seconds
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [reminders, notifiedIds]);

  return null;
}
