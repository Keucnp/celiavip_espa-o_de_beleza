import { Task } from '../types';
import { parseISO, isBefore, addMinutes, subMinutes, isAfter, format } from 'date-fns';

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  notify(title: string, options?: NotificationOptions) {
    if (this.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          ...options
        });
      } catch (e) {
        console.error('Notification API failed, falling back to alert:', e);
        // Fallback for mobile browsers that might block new Notification()
        alert(`${title}\n\n${options?.body || ''}`);
      }
    } else if (this.permission === 'denied') {
      console.warn('Notifications are denied by the user.');
    }
  }

  // Helper to show a visual alert if browser notifications are not supported or blocked
  showVisualAlert(title: string, message: string) {
    // This can be expanded to a custom UI toast/modal if needed
    alert(`${title}\n\n${message}`);
  }

  checkAndNotify(tasks: Task[]) {
    if (this.permission !== 'granted') return;

    const now = new Date();
    const notifiedKey = 'organizapro_notified_tasks';
    const notifiedIds = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

    tasks.forEach(task => {
      if (task.status === 'completed' || !task.time || !task.reminderMinutes) return;
      if (notifiedIds.includes(task.id)) return;

      try {
        // Combine date and time
        const eventDate = parseISO(`${task.date}T${task.time}`);
        const reminderDate = subMinutes(eventDate, task.reminderMinutes);

        // If current time is after reminder time and before event time
        if (isAfter(now, reminderDate) && isBefore(now, eventDate)) {
          const title = `Lembrete: ${task.title}`;
          const body = `Seu compromisso começa em ${task.reminderMinutes} minutos às ${task.time}.`;
          
          this.notify(title, {
            body: body,
            tag: task.id
          });
          
          // Mark as notified
          notifiedIds.push(task.id);
          localStorage.setItem(notifiedKey, JSON.stringify(notifiedIds));
        }
      } catch (e) {
        console.error('Error parsing date/time for notification:', e);
      }
    });
  }
}

export const notificationService = new NotificationService();
