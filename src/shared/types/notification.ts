export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory = 'approval' | 'expiry' | 'payroll' | 'attendance' | 'document' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationActionType = 'approve' | 'review' | 'view' | 'dismiss' | 'snooze' | 'archive';

export interface NotificationMetadata {
  ticketId?: string;
  serviceId?: string;
  userId?: string;
  amount?: number;
  entityType?: string;
  entityId?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  userId: string;
  category: NotificationCategory;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  archived: boolean;
  snoozedUntil?: string;
  actionType?: NotificationActionType;
  metadata?: NotificationMetadata;
  createdAt: string;
  readAt?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: Record<NotificationCategory, number>;
}
