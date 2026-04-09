import { Task } from '../types';
import { parseISO, isBefore, addMinutes, subMinutes, isAfter, format } from 'date-fns';

class NotificationService {
  private permission: NotificationPermission = 'default';
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        this.permission = Notification.permission;
      }
      this.registerServiceWorker();
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.swRegistration = registration;
        console.log('Service Worker registered for notifications');
      } catch (e) {
        console.error('Service Worker registration failed:', e);
      }
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

  private async playChime() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // A4
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error('Audio chime failed:', e);
    }
  }

  async notify(title: string, options?: NotificationOptions) {
    // Always play sound and vibrate if possible (good for WebViews)
    this.playChime();
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    // Try Service Worker notification (best for standard browsers)
    if (this.swRegistration && this.permission === 'granted') {
      try {
        await this.swRegistration.showNotification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          ...options
        } as any);
        return;
      } catch (e) {
        console.error('SW notification failed:', e);
      }
    }

    // Standard Notification API
    if (this.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/favicon.ico',
          ...options
        });
        return;
      } catch (e) {
        console.error('Notification API failed:', e);
      }
    }

    // FINAL FALLBACK: window.alert
    // This is the most reliable way to get a native-looking popup in Android WebViews (Kodular)
    // We use setTimeout to ensure it doesn't block the main thread immediately
    setTimeout(() => {
      alert(`🔔 ${title}\n\n${options?.body || ''}`);
    }, 100);
  }

  // Helper to show a visual alert if browser notifications are not supported or blocked
  showVisualAlert(title: string, message: string) {
    // This can be expanded to a custom UI toast/modal if needed
    alert(`${title}\n\n${message}`);
  }

  checkAndNotify(tasks: Task[]) {
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
