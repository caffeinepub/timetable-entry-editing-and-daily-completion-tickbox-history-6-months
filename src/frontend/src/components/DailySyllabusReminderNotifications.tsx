import { useEffect, useRef } from 'react';
import { NotificationManager } from '../lib/NotificationManager';
import { useDailySyllabusCheckoff } from '../hooks/useDailySyllabusCheckoff';

export function DailySyllabusReminderNotifications() {
  const checkoffCount = useDailySyllabusCheckoff();
  const hasNotifiedTodayRef = useRef(false);
  const lastCheckDateRef = useRef<string>('');

  useEffect(() => {
    const today = new Date().toLocaleDateString('en-CA');
    
    // Reset notification flag if it's a new day
    if (lastCheckDateRef.current !== today) {
      hasNotifiedTodayRef.current = false;
      lastCheckDateRef.current = today;
    }

    const checkAndNotify = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if it's 8:00 PM or later (20:00)
      if (currentHour >= 20 && !hasNotifiedTodayRef.current && checkoffCount === 0) {
        // Request permission if needed
        if (NotificationManager.getNotificationPermission() === 'default') {
          NotificationManager.requestNotificationPermission().then((permission) => {
            if (permission === 'granted') {
              sendNotification();
            }
          });
        } else {
          sendNotification();
        }
      }
    };

    const sendNotification = () => {
      NotificationManager.showBrowserNotification(
        "Don't break the chain! Your Sigma status is at risk! 🗿"
      );
      hasNotifiedTodayRef.current = true;
    };

    // Check immediately
    checkAndNotify();

    // Check every minute
    const interval = setInterval(checkAndNotify, 60000);

    return () => clearInterval(interval);
  }, [checkoffCount]);

  return null;
}
