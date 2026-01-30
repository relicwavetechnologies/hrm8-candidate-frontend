/**
 * RBAC Service for Candidate Portal
 * Handles role-based access control and development mode checks
 */

// Check if running in development mode
export function isDevelopmentMode(): boolean {
    return import.meta.env.DEV;
}
