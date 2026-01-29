import type { Notification, NotificationStats, NotificationCategory, NotificationType, NotificationPriority } from "@/shared/types/notification";
import { initializeMockNotifications } from '@/data/mockNotifications';

let notifications: Notification[] = [];

// Initialize with mock data on first load
const STORAGE_KEY = 'platform_notifications_initialized';
if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
  const mockNotifications = initializeMockNotifications();
  mockNotifications.forEach((notif: any, index: number) => {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(createdAt.getHours() - hoursAgo);
    createdAt.setMinutes(createdAt.getMinutes() - minutesAgo);
    
    const notification: Notification = {
      ...notif,
      id: `notif-${Date.now()}-${index}`,
      createdAt: createdAt.toISOString(),
      readAt: notif.read ? new Date(createdAt.getTime() + Math.random() * 3600000).toISOString() : undefined,
    };
    notifications.push(notification);
  });
  localStorage.setItem(STORAGE_KEY, 'true');
}

export interface NotificationFilters {
  category?: NotificationCategory;
  type?: NotificationType;
  priority?: NotificationPriority;
  read?: boolean;
  archived?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export function getNotifications(userId: string): Notification[] {
  return notifications.filter(n => n.userId === userId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getUnreadNotifications(userId: string): Notification[] {
  return notifications.filter(n => n.userId === userId && !n.read);
}

export function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Notification {
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  
  notifications.push(newNotification);
  return newNotification;
}

export function markAsRead(notificationId: string): boolean {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    notification.readAt = new Date().toISOString();
    return true;
  }
  return false;
}

export function markAllAsRead(userId: string): number {
  let count = 0;
  const now = new Date().toISOString();
  notifications.forEach(n => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      n.readAt = now;
      count++;
    }
  });
  return count;
}

export function deleteNotification(notificationId: string): boolean {
  const initialLength = notifications.length;
  notifications = notifications.filter(n => n.id !== notificationId);
  return notifications.length < initialLength;
}

export function getNotificationStats(userId: string): NotificationStats {
  const userNotifications = getNotifications(userId);
  
  return {
    total: userNotifications.length,
    unread: userNotifications.filter(n => !n.read).length,
    byCategory: {
      approval: userNotifications.filter(n => n.category === 'approval').length,
      expiry: userNotifications.filter(n => n.category === 'expiry').length,
      payroll: userNotifications.filter(n => n.category === 'payroll').length,
      attendance: userNotifications.filter(n => n.category === 'attendance').length,
      document: userNotifications.filter(n => n.category === 'document').length,
      system: userNotifications.filter(n => n.category === 'system').length,
    },
  };
}

// Search and filter functions
export function searchNotifications(userId: string, query: string): Notification[] {
  const userNotifications = getNotifications(userId);
  const lowerQuery = query.toLowerCase();
  
  return userNotifications.filter(n => 
    n.title.toLowerCase().includes(lowerQuery) ||
    n.message.toLowerCase().includes(lowerQuery)
  );
}

export function filterNotifications(
  notifications: Notification[],
  filters: NotificationFilters
): Notification[] {
  return notifications.filter(n => {
    if (filters.category && n.category !== filters.category) return false;
    if (filters.type && n.type !== filters.type) return false;
    if (filters.priority && n.priority !== filters.priority) return false;
    if (filters.read !== undefined && n.read !== filters.read) return false;
    if (filters.archived !== undefined && n.archived !== filters.archived) return false;
    if (filters.dateFrom && new Date(n.createdAt) < filters.dateFrom) return false;
    if (filters.dateTo && new Date(n.createdAt) > filters.dateTo) return false;
    return true;
  });
}

// Pagination
export function getPaginatedNotifications(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): { notifications: Notification[]; total: number; pages: number } {
  const all = getNotifications(userId);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    notifications: all.slice(start, end),
    total: all.length,
    pages: Math.ceil(all.length / pageSize),
  };
}

// Archive functions
export function archiveNotification(notificationId: string): boolean {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.archived = true;
    return true;
  }
  return false;
}

export function unarchiveNotification(notificationId: string): boolean {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.archived = false;
    return true;
  }
  return false;
}

// Snooze functions
export function snoozeNotification(notificationId: string, until: Date): boolean {
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.snoozedUntil = until.toISOString();
    notification.read = true;
    return true;
  }
  return false;
}

// Bulk operations
export function bulkMarkAsRead(notificationIds: string[]): number {
  let count = 0;
  const now = new Date().toISOString();
  notificationIds.forEach(id => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = now;
      count++;
    }
  });
  return count;
}

export function bulkDelete(notificationIds: string[]): number {
  const initialLength = notifications.length;
  notifications = notifications.filter(n => !notificationIds.includes(n.id));
  return initialLength - notifications.length;
}

export function bulkArchive(notificationIds: string[]): number {
  let count = 0;
  notificationIds.forEach(id => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.archived) {
      notification.archived = true;
      count++;
    }
  });
  return count;
}
