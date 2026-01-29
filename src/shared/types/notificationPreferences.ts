export type NotificationChannel = 'email' | 'in-app' | 'sms' | 'slack';
export type NotificationEventType =
  | 'support_ticket_created'
  | 'support_ticket_urgent'
  | 'recruitment_service_pending'
  | 'user_signup'
  | 'payment_failed'
  | 'integration_down'
  | 'system_error'
  | 'security_alert'
  | 'trial_expiring'
  | 'subscription_cancelled'
  | 'refund_update';

export interface NotificationPreferences {
  userId: string;
  eventPreferences: Record<NotificationEventType, {
    enabled: boolean;
    channels: NotificationChannel[];
    threshold?: number; // For rate limiting
  }>;
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
  updatedAt: string;
}

export type AlertConditionOperator = 'equals' | 'greater_than' | 'less_than' | 'contains';

export interface AlertCondition {
  field: string;
  operator: AlertConditionOperator;
  value: string | number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  eventType: NotificationEventType;
  conditions: AlertCondition[];
  actions: {
    channels: NotificationChannel[];
    recipients: string[]; // email addresses or user IDs
    template?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
