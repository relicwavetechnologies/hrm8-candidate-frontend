/**
 * Analytics Utility
 * Handles job analytics tracking
 */

import { apiClient } from '@/shared/services/api';

let sessionId: string | null = null;

export const getSessionId = (): string => {
    if (!sessionId) {
        sessionId = localStorage.getItem('hrm8_session_id');
        if (!sessionId) {
            sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('hrm8_session_id', sessionId);
        }
    }
    return sessionId;
};

export const trackJobAnalytics = async (
    jobId: string,
    eventType: 'VIEW' | 'DETAIL_VIEW' | 'APPLY_CLICK' | 'SHARE',
    source: string = 'HRM8_BOARD'
) => {
    try {
        await apiClient.post(`/api/public/jobs/${jobId}/track`, {
            event_type: eventType,
            source,
            session_id: getSessionId(),
            referrer: document.referrer || undefined
        });
    } catch (error) {
        // Silently fail - don't block user experience
        console.error('Failed to track analytics:', error);
    }
};
