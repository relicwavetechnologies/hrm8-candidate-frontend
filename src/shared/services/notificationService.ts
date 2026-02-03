/**
 * Notification Service
 * Client-side API service for notification endpoints
 */

import { apiClient } from '@/shared/services/api';

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

        const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return apiClient.get<NotificationsResponse>(url);
    },

    /**
     * Get unread notification count
     */
    async getUnreadCount(): Promise<{ success: boolean; data?: UnreadCountResponse; error?: string }> {
        return apiClient.get<UnreadCountResponse>('/api/notifications/count');
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId: string): Promise<{ success: boolean; data?: Notification; error?: string }> {
        return apiClient.patch<Notification>(`/api/notifications/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<{ success: boolean; data?: { count: number }; error?: string }> {
        return apiClient.patch<{ count: number }>('/api/notifications/read-all');
    },

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
        return apiClient.delete(`/api/notifications/${notificationId}`);
    },
};
