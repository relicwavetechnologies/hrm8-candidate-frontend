/**
 * useUniversalNotifications Hook
 * Provides notification state management with API and WebSocket real-time updates
 * This hook uses the backend API for persistent notifications, unlike useNotifications which uses localStorage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '@/shared/services/notificationService';
import type { Notification } from '@/shared/services/notificationService';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useToast } from '@/shared/hooks/use-toast';

interface UseUniversalNotificationsOptions {
    autoFetch?: boolean;
    limit?: number;
    showToasts?: boolean;
}

interface UseUniversalNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
    fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    refetch: () => Promise<void>;
    hasMore: boolean;
    loadMore: () => Promise<void>;
}

export function useUniversalNotifications(options: UseUniversalNotificationsOptions = {}): UseUniversalNotificationsReturn {
    const { autoFetch = true, limit = 10, showToasts = true } = options;

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);

    const { toast } = useToast();
    const initialFetchDoneRef = useRef(false);

    // Try to get WebSocket context if available
    let wsContext: { onMessage?: (type: string, handler: (payload: unknown) => void) => () => void } | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        wsContext = useWebSocket();
    } catch {
        // WebSocket context not available, that's okay
    }

    /**
     * Fetch notifications from API
     */
    const fetchNotifications = useCallback(async (unreadOnly = false) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await notificationService.getNotifications({
                unreadOnly,
                limit,
                offset: 0, // Reset to first page
            });

            if (response.success && response.data) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.unreadCount);
                setTotal(response.data.total);
                setOffset(0);
                setHasMore(response.data.notifications.length < response.data.total);
            } else {
                setError(response.error || 'Failed to fetch notifications');
            }
        } catch (err) {
            setError('Failed to fetch notifications');
            console.error('Error fetching notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    /**
     * Load more notifications (pagination)
     */
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        const newOffset = offset + limit;

        try {
            const response = await notificationService.getNotifications({
                limit,
                offset: newOffset,
            });

            if (response.success && response.data) {
                setNotifications(prev => [...prev, ...response.data!.notifications]);
                setOffset(newOffset);
                setHasMore(notifications.length + response.data.notifications.length < total);
            }
        } catch (err) {
            console.error('Error loading more notifications:', err);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, offset, limit, notifications.length, total]);

    /**
     * Mark a single notification as read
     */
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            const response = await notificationService.markAsRead(notificationId);

            if (response.success) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    }, []);

    /**
     * Mark all notifications as read
     */
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await notificationService.markAllAsRead();

            if (response.success) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
                );
                setUnreadCount(0);
            }
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    }, []);

    /**
     * Delete a notification
     */
    const deleteNotification = useCallback(async (notificationId: string) => {
        try {
            const response = await notificationService.deleteNotification(notificationId);

            if (response.success) {
                const notification = notifications.find(n => n.id === notificationId);
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
                if (notification && !notification.read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                setTotal(prev => Math.max(0, prev - 1));
            }
        } catch (err) {
            console.error('Error deleting notification:', err);
        }
    }, [notifications]);

    /**
     * Refetch notifications
     */
    const refetch = useCallback(async () => {
        await fetchNotifications();
    }, [fetchNotifications]);

    // Auto-fetch on mount
    useEffect(() => {
        if (autoFetch && !initialFetchDoneRef.current) {
            initialFetchDoneRef.current = true;
            fetchNotifications();
        }
    }, [autoFetch, fetchNotifications]);

    // Listen for WebSocket notifications
    useEffect(() => {
        if (!wsContext?.onMessage) return;

        const unsubscribe = wsContext.onMessage('notification', (payload: unknown) => {
            const notification = payload as Notification;

            // Add to the top of the list
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            setTotal(prev => prev + 1);

            // Show toast notification
            if (showToasts) {
                toast({
                    title: notification.title,
                    description: notification.message,
                });
            }
        });

        return () => {
            unsubscribe();
        };
    }, [wsContext, showToasts, toast]);

    // Listen for unread count updates
    useEffect(() => {
        if (!wsContext?.onMessage) return;

        const unsubscribe = wsContext.onMessage('notifications_count', (payload: unknown) => {
            const { unreadCount: count } = payload as { unreadCount: number };
            setUnreadCount(count);
        });

        return () => {
            unsubscribe();
        };
    }, [wsContext]);

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch,
        hasMore,
        loadMore,
    };
}
