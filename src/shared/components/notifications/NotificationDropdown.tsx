/**
 * NotificationDropdown Component
 * Displays a dropdown list of notifications with actions
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
    Bell,
    Briefcase,
    Users,
    Calendar,
    CheckCheck,
    AlertCircle,
    Loader2,
    ExternalLink,
    Coins,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    UserPlus,
    TrendingUp
} from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import type { Notification } from '@/shared/services/notificationService';
import { cn } from '@/shared/lib/utils';

interface NotificationDropdownProps {
    notifications: Notification[];
    isLoading: boolean;
    onMarkAsRead: (notificationId: string) => void;
    onMarkAllAsRead: () => void;
    onClose: () => void;
    onSelect?: (notification: Notification) => void;
}

const getNotificationIcon = (type: string) => {
    switch (type) {
        case 'NEW_APPLICATION':
        case 'APPLICATION_STATUS_CHANGED':
        case 'APPLICATION_SHORTLISTED':
        case 'APPLICATION_REJECTED':
            return <Users className="h-4 w-4 text-blue-500" />;
        case 'JOB_CREATED':
        case 'JOB_STATUS_CHANGED':
        case 'JOB_ASSIGNED':
        case 'JOB_FILLED':
        case 'JOB_ASSIGNMENT_RECEIVED':
            return <Briefcase className="h-4 w-4 text-green-500" />;
        case 'INTERVIEW_SCHEDULED':
        case 'CANDIDATE_STAGE_CHANGED':
        case 'OFFER_EXTENDED':
            return <Calendar className="h-4 w-4 text-purple-500" />;
        case 'NEW_LEAD':
        case 'LEAD_CONVERSION_REQUESTED':
            return <UserPlus className="h-4 w-4 text-blue-500" />;
        case 'LEAD_CONVERSION_DECLINED':
            return <XCircle className="h-4 w-4 text-red-500" />;
        case 'LEAD_CONVERTED':
            return <TrendingUp className="h-4 w-4 text-indigo-600" />;
        case 'COMMISSION_EARNED':
            return <Coins className="h-4 w-4 text-green-500" />;
        case 'WITHDRAWAL_APPROVED':
            return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        case 'WITHDRAWAL_REJECTED':
            return <XCircle className="h-4 w-4 text-red-500" />;
        case 'SUBSCRIPTION_RENEWAL_FAILED':
        case 'LOW_BALANCE_WARNING':
            return <AlertTriangle className="h-4 w-4 text-red-600" />;
        case 'SUBSCRIPTION_PURCHASED':
        case 'SERVICE_PURCHASED':
            return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        case 'SYSTEM_ANNOUNCEMENT':
        default:
            return <Bell className="h-4 w-4 text-gray-500" />;
    }
};

export function NotificationDropdown({
    notifications,
    isLoading,
    onMarkAsRead,
    onMarkAllAsRead,
    onClose,
    onSelect
}: NotificationDropdownProps) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isCandidatePath = pathname.startsWith('/candidate');
    const isDashPath = pathname.startsWith('/dash');

    const handleNotificationClick = (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }

        onClose();

        // Delegate selection to parent (to open Dialog)
        if (onSelect) {
            onSelect(notification);
        } else {
            // Fallback to navigation if no onSelect provided
            if (isCandidatePath) {
                navigate(`/candidate/notifications/${notification.id}`);
            } else if (isDashPath) {
                navigate(`/dash/notification/${notification.id}`);
            } else {
                navigate(`/notifications/${notification.id}`);
            }
        }
    };

    const handleViewAll = () => {
        onClose();
        if (isCandidatePath) {
            navigate('/candidate/notifications');
        } else if (isDashPath) {
            navigate('/dash/notification');
        } else {
            navigate('/notifications');
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 z-50 rounded-lg border bg-popover shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onMarkAllAsRead}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto">
                {isLoading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Bell className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {notifications.map((notification) => (
                            <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={cn(
                                    'w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-l-2',
                                    !notification.read ? (
                                        ['SUBSCRIPTION_RENEWAL_FAILED', 'WITHDRAWAL_REJECTED', 'LOW_BALANCE_WARNING', 'LEAD_CONVERSION_DECLINED'].includes(notification.type)
                                            ? 'bg-red-50/50 dark:bg-red-950/20 border-red-500'
                                            : ['COMMISSION_EARNED', 'WITHDRAWAL_APPROVED', 'LEAD_CONVERTED'].includes(notification.type)
                                                ? 'bg-green-50/50 dark:bg-green-950/20 border-green-500'
                                                : ['NEW_LEAD', 'LEAD_CONVERSION_REQUESTED'].includes(notification.type)
                                                    ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500'
                                                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500'
                                    ) : 'border-transparent'
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            'text-sm line-clamp-1',
                                            !notification.read && 'font-medium'
                                        )}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {(() => {
                                                try {
                                                    const date = new Date(notification.createdAt);
                                                    if (isNaN(date.getTime())) return 'Just now';
                                                    return formatDistanceToNow(date, { addSuffix: true });
                                                } catch (e) {
                                                    return 'Just now';
                                                }
                                            })()}
                                        </p>
                                    </div>
                                    {notification.actionUrl && (
                                        <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t px-4 py-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewAll}
                    className="w-full text-sm"
                >
                    View all notifications
                </Button>
            </div>
        </div>
    );
}
