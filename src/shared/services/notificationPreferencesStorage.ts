import type { NotificationPreferences, AlertRule, NotificationEventType } from '@/shared/types/notificationPreferences';

const PREFERENCES_KEY = 'platform_notification_preferences';
const ALERT_RULES_KEY = 'platform_alert_rules';

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'userId'> = {
  eventPreferences: {
    support_ticket_created: { enabled: true, channels: ['email', 'in-app'] },
    support_ticket_urgent: { enabled: true, channels: ['email', 'in-app', 'sms'] },
    recruitment_service_pending: { enabled: true, channels: ['email', 'in-app'] },
    user_signup: { enabled: true, channels: ['in-app'] },
    payment_failed: { enabled: true, channels: ['email', 'in-app'] },
    integration_down: { enabled: true, channels: ['email', 'in-app', 'sms'] },
    system_error: { enabled: true, channels: ['email', 'in-app'] },
    security_alert: { enabled: true, channels: ['email', 'in-app', 'sms'] },
    trial_expiring: { enabled: true, channels: ['email'] },
    subscription_cancelled: { enabled: true, channels: ['email', 'in-app'] },
    refund_update: { enabled: true, channels: ['email', 'in-app'] },
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
  updatedAt: new Date().toISOString(),
};

export function getNotificationPreferences(userId: string): NotificationPreferences {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  const all: NotificationPreferences[] = stored ? JSON.parse(stored) : [];
  
  const existing = all.find(p => p.userId === userId);
  if (existing) return existing;
  
  const newPrefs: NotificationPreferences = {
    ...DEFAULT_PREFERENCES,
    userId,
  };
  
  all.push(newPrefs);
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(all));
  
  return newPrefs;
}

export function updateNotificationPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): NotificationPreferences {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  const all: NotificationPreferences[] = stored ? JSON.parse(stored) : [];
  
  const index = all.findIndex(p => p.userId === userId);
  
  if (index === -1) {
    const newPrefs: NotificationPreferences = {
      ...DEFAULT_PREFERENCES,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };
    all.push(newPrefs);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(all));
    return newPrefs;
  }
  
  all[index] = {
    ...all[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(all));
  return all[index];
}

export function getAlertRules(): AlertRule[] {
  const stored = localStorage.getItem(ALERT_RULES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getAlertRule(id: string): AlertRule | null {
  const rules = getAlertRules();
  return rules.find(r => r.id === id) || null;
}

export function createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): AlertRule {
  const rules = getAlertRules();
  
  const newRule: AlertRule = {
    ...rule,
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  rules.push(newRule);
  localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(rules));
  
  return newRule;
}

export function updateAlertRule(id: string, updates: Partial<AlertRule>): AlertRule | null {
  const rules = getAlertRules();
  const index = rules.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  rules[index] = {
    ...rules[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(rules));
  return rules[index];
}

export function deleteAlertRule(id: string): boolean {
  const rules = getAlertRules();
  const filtered = rules.filter(r => r.id !== id);
  
  if (filtered.length === rules.length) return false;
  
  localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(filtered));
  return true;
}

export function shouldSendNotification(
  userId: string,
  eventType: NotificationEventType,
  channel: string
): boolean {
  const prefs = getNotificationPreferences(userId);
  const eventPref = prefs.eventPreferences[eventType];
  
  if (!eventPref?.enabled) return false;
  if (!eventPref.channels.includes(channel as any)) return false;
  
  // Check quiet hours
  if (prefs.quietHours?.enabled && (channel === 'email' || channel === 'sms')) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = prefs.quietHours;
    
    if (start < end) {
      if (currentTime >= start && currentTime <= end) return false;
    } else {
      if (currentTime >= start || currentTime <= end) return false;
    }
  }
  
  return true;
}
