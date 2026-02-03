/**
 * NotificationBell Component
 * Displays a bell icon with unread count badge and dropdown
 */

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/shared/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog";
import type { Notification } from '@/shared/services/notificationService';
import { NotificationDropdown } from './NotificationDropdown';
import { useUniversalNotifications } from '@/shared/hooks/useUniversalNotifications';
import { cn } from '@/shared/lib/utils';

interface NotificationBellProps {
    className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { unreadCount, notifications, isLoading, markAsRead, markAllAsRead, refetch } =
        useUniversalNotifications({ limit: 5, showToasts: true });

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) {
            // Refetch when opening dropdown
            refetch();
        }
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                className="relative"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            {isOpen && (
                <NotificationDropdown
                    notifications={notifications}
                    isLoading={isLoading}
                    onMarkAsRead={async (id) => {
                        await markAsRead(id);
                    }}
                    onMarkAllAsRead={async () => {
                        await markAllAsRead();
                    }}
                    onClose={() => setIsOpen(false)}
                    onSelect={(notification) => {
                        setIsOpen(false);
                        setSelectedNotification(notification);
                    }}
                />
            )}

            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedNotification?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedNotification?.createdAt && !isNaN(new Date(selectedNotification.createdAt).getTime())
                                ? formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })
                                : 'Just now'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                            {selectedNotification?.message}
                        </p>
                    </div>
                    <DialogFooter className="sm:justify-between gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSelectedNotification(null)}
                        >
                            Close
                        </Button>
                        {(selectedNotification?.link || selectedNotification?.actionUrl) && (
                            <Button
                                type="button"
                                onClick={() => {
                                    navigate(selectedNotification.link || selectedNotification.actionUrl || '');
                                    setSelectedNotification(null);
                                }}
                            >
                                {selectedNotification?.link ? 'View Item' : 'Go to Action'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
