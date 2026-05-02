import { format, parse, isToday } from 'date-fns';
import { Entry } from '../lib/constants';

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: string; // "HH:mm" format
  lastNotifiedDay: string | null; // "YYYY-MM-DD"
}

const STORAGE_KEY = 'timecapsule_notification_settings';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  reminderTime: '20:00',
  lastNotifiedDay: null,
};

const MESSAGES = {
  day1: [
    "How was your day? Capture a moment before it fades.",
    "Take a minute for yourself. What stood out today?",
    "Every day has a story. Want to write yours?",
    "Pause for a second… what made today meaningful?",
    "You lived today — now capture it.",
    "A small memory today becomes a treasure tomorrow.",
    "Your future self will thank you for writing today."
  ],
  day3: [
    "It’s been a few days… ready to capture a moment again?",
    "Your timeline misses you. What's been happening lately?",
    "Life moves fast. Take a moment to freeze it in time."
  ],
  day7: [
    "We miss your stories. Want to start again today?",
    "Remember the feeling of looking back? Write something today.",
    "A week of memories is waiting to be preserved."
  ]
};

export function getNotificationSettings(): NotificationSettings {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function isNotificationsSupported(): boolean {
  return 'Notification' in window;
}

export function isInsideIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

function getRandomMessage(daysInactive: number): string {
  let pool = MESSAGES.day1;
  if (daysInactive >= 7) pool = MESSAGES.day7;
  else if (daysInactive >= 3) pool = MESSAGES.day3;
  
  return pool[Math.floor(Math.random() * pool.length)];
}

export function checkAndSendNotification(entries: Entry[]) {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  // 1. Don't send if already sent today
  if (settings.lastNotifiedDay === todayStr) return;

  // 2. Don't send if user already wrote today
  const wroteToday = entries.some(e => {
    const date = e.manualDate ? new Date(e.manualDate) : new Date(e.createdAt);
    return isToday(date);
  });
  if (wroteToday) return;

  // 3. Check if it's past the reminder time
  const now = new Date();
  const [hours, minutes] = settings.reminderTime.split(':').map(Number);
  const reminderDate = new Date();
  reminderDate.setHours(hours, minutes, 0, 0);

  if (now >= reminderDate) {
    // Determine inactivity
    let daysInactive = 0;
    if (entries.length > 0) {
      const lastEntry = entries.sort((a, b) => {
        const dateA = new Date(a.manualDate || a.createdAt).getTime();
        const dateB = new Date(b.manualDate || b.createdAt).getTime();
        return dateB - dateA;
      })[0];
      const lastEntryDate = new Date(lastEntry.manualDate || lastEntry.createdAt);
      daysInactive = Math.floor((now.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const message = getRandomMessage(daysInactive);
    
    // Send Notification
    if (Notification.permission === 'granted') {
      new Notification('TimeCapsule', {
        body: message,
        icon: '/favicon.ico' // Or any icon path
      });
    } else {
      // Fallback: Custom in-app event or log
      console.log('Notification triggered (Simulated):', message);
      // We could trigger a local custom event for an in-app toast
      window.dispatchEvent(new CustomEvent('app-notification', { detail: message }));
    }

    // Update last notified day
    saveNotificationSettings({ ...settings, lastNotifiedDay: todayStr });
  }
}
