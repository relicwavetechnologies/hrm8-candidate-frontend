import type { Notification, NotificationCategory, NotificationType, NotificationPriority } from '@/shared/types/notification';

const MOCK_USER_ID = "user-1";

export const NOTIFICATION_TEMPLATES = {
  support_ticket_created: {
    category: 'system' as NotificationCategory,
    type: 'info' as NotificationType,
    priority: 'medium' as NotificationPriority,
    title: 'New Support Ticket Created',
    getMessage: (data: any) => `Ticket #${data.ticketId} created by ${data.userName}`,
    getLink: (data: any) => `/support-tickets?id=${data.ticketId}`,
    actionType: 'review' as const,
  },
  support_ticket_urgent: {
    category: 'system' as NotificationCategory,
    type: 'error' as NotificationType,
    priority: 'critical' as NotificationPriority,
    title: 'Urgent Support Ticket',
    getMessage: (data: any) => `Critical ticket #${data.ticketId} requires immediate attention`,
    getLink: (data: any) => `/support-tickets?id=${data.ticketId}`,
    actionType: 'review' as const,
  },
  recruitment_service_pending: {
    category: 'approval' as NotificationCategory,
    type: 'warning' as NotificationType,
    priority: 'high' as NotificationPriority,
    title: 'Recruitment Service Pending',
    getMessage: (data: any) => `${data.companyName} service pending approval`,
    getLink: (data: any) => `/recruitment-services?id=${data.serviceId}`,
    actionType: 'approve' as const,
  },
  user_signup: {
    category: 'system' as NotificationCategory,
    type: 'success' as NotificationType,
    priority: 'low' as NotificationPriority,
    title: 'New User Registered',
    getMessage: (data: any) => `${data.userName} has signed up for ${data.plan} plan`,
    getLink: (data: any) => `/users?id=${data.userId}`,
    actionType: 'view' as const,
  },
  payment_failed: {
    category: 'system' as NotificationCategory,
    type: 'error' as NotificationType,
    priority: 'high' as NotificationPriority,
    title: 'Payment Failed',
    getMessage: (data: any) => `Payment of $${data.amount} failed for ${data.companyName}`,
    getLink: (data: any) => `/billing?id=${data.paymentId}`,
    actionType: 'review' as const,
  },
  integration_down: {
    category: 'system' as NotificationCategory,
    type: 'error' as NotificationType,
    priority: 'critical' as NotificationPriority,
    title: 'Integration Down',
    getMessage: (data: any) => `${data.integrationName} integration is not responding`,
    getLink: (_data: any) => `/settings/integrations`,
    actionType: 'review' as const,
  },
  system_error: {
    category: 'system' as NotificationCategory,
    type: 'error' as NotificationType,
    priority: 'high' as NotificationPriority,
    title: 'System Error Detected',
    getMessage: (data: any) => `Error in ${data.module}: ${data.error}`,
    getLink: (_data: any) => `/system/logs`,
    actionType: 'review' as const,
  },
  security_alert: {
    category: 'system' as NotificationCategory,
    type: 'error' as NotificationType,
    priority: 'critical' as NotificationPriority,
    title: 'Security Alert',
    getMessage: (data: any) => `${data.alertType}: ${data.description}`,
    getLink: (_data: any) => `/security/alerts`,
    actionType: 'review' as const,
  },
  trial_expiring: {
    category: 'expiry' as NotificationCategory,
    type: 'warning' as NotificationType,
    priority: 'medium' as NotificationPriority,
    title: 'Trial Expiring Soon',
    getMessage: (data: any) => `${data.companyName}'s trial expires in ${data.daysRemaining} days`,
    getLink: (data: any) => `/customers?id=${data.customerId}`,
    actionType: 'view' as const,
  },
  subscription_cancelled: {
    category: 'system' as NotificationCategory,
    type: 'warning' as NotificationType,
    priority: 'medium' as NotificationPriority,
    title: 'Subscription Cancelled',
    getMessage: (data: any) => `${data.companyName} cancelled their subscription`,
    getLink: (data: any) => `/customers?id=${data.customerId}`,
    actionType: 'review' as const,
  },
  leave_approval: {
    category: 'approval' as NotificationCategory,
    type: 'info' as NotificationType,
    priority: 'medium' as NotificationPriority,
    title: 'Leave Request Pending',
    getMessage: (data: any) => `${data.employeeName} requested ${data.days} days leave`,
    getLink: (data: any) => `/approvals/leave?id=${data.requestId}`,
    actionType: 'approve' as const,
  },
  document_uploaded: {
    category: 'document' as NotificationCategory,
    type: 'info' as NotificationType,
    priority: 'low' as NotificationPriority,
    title: 'New Document Uploaded',
    getMessage: (data: any) => `${data.userName} uploaded ${data.fileName}`,
    getLink: (data: any) => `/documents?id=${data.documentId}`,
    actionType: 'view' as const,
  },
  payroll_processed: {
    category: 'payroll' as NotificationCategory,
    type: 'success' as NotificationType,
    priority: 'medium' as NotificationPriority,
    title: 'Payroll Processed',
    getMessage: (data: any) => `Payroll for ${data.period} processed successfully`,
    getLink: (data: any) => `/payroll?period=${data.period}`,
    actionType: 'view' as const,
  },
  attendance_anomaly: {
    category: 'attendance' as NotificationCategory,
    type: 'warning' as NotificationType,
    priority: 'medium' as NotificationPriority,
    title: 'Attendance Anomaly Detected',
    getMessage: (data: any) => `${data.employeeName} has ${data.anomalyType}`,
    getLink: (data: any) => `/attendance?employee=${data.employeeId}`,
    actionType: 'review' as const,
  },
};

export function generateMockNotification(
  templateKey: keyof typeof NOTIFICATION_TEMPLATES,
  data: any,
  userId: string = MOCK_USER_ID
): Omit<Notification, 'id' | 'createdAt'> {
  const template = NOTIFICATION_TEMPLATES[templateKey];

  return {
    userId,
    category: template.category,
    type: template.type,
    priority: template.priority,
    title: template.title,
    message: template.getMessage(data),
    link: template.getLink(data),
    read: false,
    archived: false,
    actionType: template.actionType,
    metadata: data,
  };
}

export function generateRandomNotification(userId: string = MOCK_USER_ID): Omit<Notification, 'id' | 'createdAt'> {
  const templates = Object.keys(NOTIFICATION_TEMPLATES) as Array<keyof typeof NOTIFICATION_TEMPLATES>;
  const weights = [15, 5, 20, 10, 8, 3, 5, 2, 5, 5, 15, 8, 4, 5]; // Probability weights

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  let selectedIndex = 0;
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      selectedIndex = i;
      break;
    }
  }

  const templateKey = templates[selectedIndex];
  const mockData = generateMockData(templateKey);

  return generateMockNotification(templateKey, mockData, userId);
}

function generateMockData(templateKey: keyof typeof NOTIFICATION_TEMPLATES): any {
  const companies = ['Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Digital Dynamics'];
  const users = ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'Robert Brown'];
  const integrations = ['Slack', 'Google Workspace', 'Microsoft Teams', 'Zoom', 'Salesforce'];
  const plans = ['Basic', 'Professional', 'Enterprise'];

  switch (templateKey) {
    case 'support_ticket_created':
    case 'support_ticket_urgent':
      return {
        ticketId: `TKT-${Math.floor(Math.random() * 9000) + 1000}`,
        userName: users[Math.floor(Math.random() * users.length)],
      };
    case 'recruitment_service_pending':
      return {
        serviceId: `SRV-${Math.floor(Math.random() * 9000) + 1000}`,
        companyName: companies[Math.floor(Math.random() * companies.length)],
      };
    case 'user_signup':
      return {
        userId: `USR-${Math.floor(Math.random() * 9000) + 1000}`,
        userName: users[Math.floor(Math.random() * users.length)],
        plan: plans[Math.floor(Math.random() * plans.length)],
      };
    case 'payment_failed':
      return {
        paymentId: `PAY-${Math.floor(Math.random() * 9000) + 1000}`,
        companyName: companies[Math.floor(Math.random() * companies.length)],
        amount: Math.floor(Math.random() * 5000) + 100,
      };
    case 'integration_down':
      return {
        integrationName: integrations[Math.floor(Math.random() * integrations.length)],
      };
    case 'system_error':
      return {
        module: ['Database', 'API', 'Authentication', 'Payment Gateway'][Math.floor(Math.random() * 4)],
        error: 'Connection timeout',
      };
    case 'security_alert':
      return {
        alertType: ['Failed Login Attempts', 'Suspicious Activity', 'Unauthorized Access'][Math.floor(Math.random() * 3)],
        description: 'Multiple failed login attempts detected',
      };
    case 'trial_expiring':
      return {
        customerId: `CUST-${Math.floor(Math.random() * 9000) + 1000}`,
        companyName: companies[Math.floor(Math.random() * companies.length)],
        daysRemaining: Math.floor(Math.random() * 7) + 1,
      };
    case 'subscription_cancelled':
      return {
        customerId: `CUST-${Math.floor(Math.random() * 9000) + 1000}`,
        companyName: companies[Math.floor(Math.random() * companies.length)],
      };
    case 'leave_approval':
      return {
        requestId: `LVE-${Math.floor(Math.random() * 9000) + 1000}`,
        employeeName: users[Math.floor(Math.random() * users.length)],
        days: Math.floor(Math.random() * 10) + 1,
      };
    case 'document_uploaded':
      return {
        documentId: `DOC-${Math.floor(Math.random() * 9000) + 1000}`,
        userName: users[Math.floor(Math.random() * users.length)],
        fileName: ['contract.pdf', 'invoice.xlsx', 'report.docx'][Math.floor(Math.random() * 3)],
      };
    case 'payroll_processed':
      return {
        period: ['January 2024', 'February 2024', 'March 2024'][Math.floor(Math.random() * 3)],
      };
    case 'attendance_anomaly':
      return {
        employeeId: `EMP-${Math.floor(Math.random() * 9000) + 1000}`,
        employeeName: users[Math.floor(Math.random() * users.length)],
        anomalyType: ['excessive overtime', 'consecutive absences', 'irregular clock-ins'][Math.floor(Math.random() * 3)],
      };
    default:
      return {};
  }
}

export function initializeMockNotifications() {
  // Generate 100 notifications with varying timestamps
  const notifications: Omit<Notification, 'id' | 'createdAt'>[] = [];
  // const now = new Date();

  for (let i = 0; i < 100; i++) {
    // const daysAgo = Math.floor(Math.random() * 30);
    // const hoursAgo = Math.floor(Math.random() * 24);
    // const minutesAgo = Math.floor(Math.random() * 60);

    notifications.push({
      ...generateRandomNotification(),
      read: Math.random() > 0.4, // 40% unread
    });
  }

  return notifications;
}
