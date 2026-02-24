/**
 * Notification Service
 * Client-side API service for notification endpoints
 */

import { apiClient } from '@/shared/services/api';
import { normalizeNotification } from '@/shared/lib/notification-routing';

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    actionUrl?: string;
    link?: string;
    read: boolean;
    readAt?: string;
    createdAt: string;
    jobId?: string;
    applicationId?: string;
    companyId?: string;
    leadId?: string;
    regionId?: string;
}

interface RawNotification extends Partial<Notification> {
    action_url?: string;
    created_at?: string;
    read_at?: string;
    job_id?: string;
    application_id?: string;
    company_id?: string;
    lead_id?: string;
    region_id?: string;
}

export interface NotificationsResponse {
    notifications: Notification[];
    total: number;
    unreadCount: number;
}

export interface UnreadCountResponse {
    unreadCount: number;
}

interface GetNotificationsParams {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
    types?: string[];
}

/**
 * Notification Service
 */
export const notificationService = {
    /**
     * Get notifications for the current user
     */
    async getNotifications(params: GetNotificationsParams = {}): Promise<{ success: boolean; data?: NotificationsResponse; error?: string }> {
        const queryParams = new URLSearchParams();

        if (params.unreadOnly) {
            queryParams.set('unreadOnly', 'true');
        }
        if (params.limit) {
            queryParams.set('limit', params.limit.toString());
        }
        if (params.offset) {
            queryParams.set('offset', params.offset.toString());
        }
        if (params.types && params.types.length > 0) {
            queryParams.set('types', params.types.join(','));
        }

        const url = `/api/candidate/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await apiClient.get<NotificationsResponse>(url);

        if (!response.success || !response.data) {
            return response;
        }

        const notificationsRaw = Array.isArray(response.data.notifications) ? response.data.notifications : [];
        const normalized = notificationsRaw.map((notification) =>
            normalizeNotification(notification as RawNotification)
        );

        return {
            success: true,
            data: {
                notifications: normalized,
                total: Number(response.data.total || 0),
                unreadCount: Number(response.data.unreadCount || 0),
            },
        };
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<{ success: boolean; data?: UnreadCountResponse; error?: string }> {
        return apiClient.get<UnreadCountResponse>('/api/candidate/notifications/count');
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string): Promise<{ success: boolean; data?: Notification; error?: string }> {
        const response = await apiClient.patch<Notification | { notification?: RawNotification }>(
            `/api/candidate/notifications/${notificationId}/read`
        );

        if (!response.success || !response.data) {
            return { success: response.success, error: response.error };
        }

        const wrapped = response.data as { notification?: RawNotification };
        const rawNotification = wrapped.notification || (response.data as RawNotification);
        return {
            success: true,
            data: normalizeNotification(rawNotification),
        };
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<{ success: boolean; data?: { count: number }; error?: string }> {
        return apiClient.patch<{ count: number }>('/api/candidate/notifications/read-all');
    },

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.delete(`/api/candidate/notifications/${notificationId}`);
    },
};
