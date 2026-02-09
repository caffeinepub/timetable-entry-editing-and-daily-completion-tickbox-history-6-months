import { toast } from 'sonner';

export type NotificationType = 'timer' | 'reminder';

export interface NotificationOptions {
  title: string;
  description?: string;
  type: NotificationType;
  duration?: number;
}

export class NotificationManager {
  static show(options: NotificationOptions) {
    const { title, description, type, duration = 10000 } = options;

    if (type === 'timer') {
      toast.success(title, {
        description: description || 'Timer completed',
        duration,
      });
    } else if (type === 'reminder') {
      toast.info(title, {
        description: description || 'Reminder notification',
        duration,
      });
    }
  }

  static showTimerComplete(message: string) {
    this.show({
      title: message,
      type: 'timer',
      duration: 10000,
    });
  }

  static showReminder(title: string, description?: string) {
    this.show({
      title,
      description,
      type: 'reminder',
      duration: 10000,
    });
  }

  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied' as NotificationPermission);
  }

  static isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  static getNotificationPermission(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  static showBrowserNotification(title: string, body?: string) {
    if (!this.isNotificationSupported()) {
      // Fallback to toast
      this.showReminder(title, body);
      return;
    }

    const permission = this.getNotificationPermission();
    
    if (permission === 'granted') {
      try {
        new Notification(title, {
          body: body || '',
          icon: '/assets/generated/scholar-gold-app-icon-v2.dim_192x192.png',
        });
      } catch (error) {
        // Fallback to toast if browser notification fails
        this.showReminder(title, body);
      }
    } else {
      // Fallback to toast if permission not granted
      this.showReminder(title, body);
    }
  }
}
