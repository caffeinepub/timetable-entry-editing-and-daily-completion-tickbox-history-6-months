import { useEffect, useRef } from 'react';
import { useGetUpcomingReminders } from '../hooks/useQueries';
import { NotificationManager } from '@/lib/NotificationManager';
import { toast } from 'sonner';

export function ReminderNotifications() {
  const { data: reminders = [] } = useGetUpcomingReminders();
  const scheduledTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const notifiedIds = useRef<Set<string>>(new Set());

  // Load notified IDs from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('notifiedReminderIds');
    if (stored) {
      try {
        const ids = JSON.parse(stored);
        notifiedIds.current = new Set(ids);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save notified IDs to sessionStorage
  const saveNotifiedIds = () => {
    sessionStorage.setItem('notifiedReminderIds', JSON.stringify(Array.from(notifiedIds.current)));
  };

  // Request notification permission on mount
  useEffect(() => {
    const requestPermission = async () => {
      if (NotificationManager.isNotificationSupported()) {
        const permission = NotificationManager.getNotificationPermission();
        if (permission === 'default') {
          const result = await NotificationManager.requestNotificationPermission();
          if (result === 'denied') {
            toast.info('Enable browser notifications to receive reminders when the app is open', {
              duration: 5000,
            });
          }
        } else if (permission === 'denied') {
          toast.info('Browser notifications are disabled. You can enable them in your browser settings.', {
            duration: 5000,
          });
        }
      }
    };

    requestPermission();
  }, []);

  useEffect(() => {
    // Clear old timers
    scheduledTimers.current.forEach((timer) => clearTimeout(timer));
    scheduledTimers.current.clear();

    const now = Date.now();

    reminders.forEach((reminder) => {
      const reminderMs = Number(reminder.reminderTime / BigInt(1000000));
      const timeDiff = reminderMs - now;
      const reminderId = reminder.id.toString();

      // Skip if already notified
      if (notifiedIds.current.has(reminderId)) {
        return;
      }

      // Schedule notification if reminder is in the future
      if (timeDiff > 0) {
        const timer = setTimeout(() => {
          NotificationManager.showBrowserNotification(
            reminder.title,
            'Reminder notification'
          );
          notifiedIds.current.add(reminderId);
          saveNotifiedIds();
        }, timeDiff);

        scheduledTimers.current.set(reminderId, timer);
      }
    });

    // Cleanup on unmount
    return () => {
      scheduledTimers.current.forEach((timer) => clearTimeout(timer));
      scheduledTimers.current.clear();
    };
  }, [reminders]);

  return null;
}
