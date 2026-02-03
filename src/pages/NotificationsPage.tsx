import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Loader2, Calendar, Briefcase, Mail, Clock, FileText, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { apiClient } from '@/shared/services/api';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import { useToast } from '@/shared/hooks/use-toast';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data?: {
        applicationId?: string;
        jobId?: string;
        jobTitle?: string;
        companyName?: string;
        location?: string;
        interviewDate?: string;
        interviewType?: string;
        meetingLink?: string;
        formattedDate?: string;
        oldStatus?: string;
        newStatus?: string;
        oldStage?: string;
        newStage?: string;
    };
    read: boolean;
    createdAt: string;
    actionUrl?: string; // Standard property from backend
    link?: string; // Legacy property
}

interface UpcomingInterview {
    applicationId: string;
    jobTitle: string;
    companyName: string;
    interviewDate: string;
    interviewType: string;
    location?: string;
    meetingLink?: string;
    formattedDate: string;
}

interface NotificationPreferences {
    id: string;
    candidateId: string;
    applicationStatusChanges: boolean;
    interviewReminders: boolean;
    jobMatchAlerts: boolean;
    messages: boolean;
    systemUpdates: boolean;
    emailEnabled: boolean;
    inAppEnabled: boolean;
    reminderHoursBefore: number;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [savingPreferences, setSavingPreferences] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeTab, setActiveTab] = useState('all');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalNotifications, setTotalNotifications] = useState(0);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
            fetchNotifications(0, true),
            fetchUpcomingInterviews(),
            fetchPreferences(),
        ]);
        setLoading(false);
    };

    const fetchNotifications = async (offset = 0, initial = false) => {
        try {
            if (!initial) setLoadingMore(true);
            const limit = 20;
            const response = await apiClient.get(`/api/candidate/notifications?limit=${limit}&offset=${offset}`);

            if (response.success && response.data) {
                const data = response.data as { notifications: Notification[]; unreadCount: number; total: number };
                const newNotifications = data.notifications || [];

                if (initial) {
                    setNotifications(newNotifications);
                } else {
                    setNotifications(prev => [...prev, ...newNotifications]);
                }

                setUnreadCount(data.unreadCount || 0);
                setTotalNotifications(data.total || 0);
                setHasMore(newNotifications.length === limit);
                setPage(offset / limit);
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to fetch notifications',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Failed to fetch notifications:', error);
            toast({
                title: 'Error',
                description: 'A connection error occurred',
                variant: 'destructive',
            });
        } finally {
            if (!initial) setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        const nextOffset = (page + 1) * 20;
        fetchNotifications(nextOffset);
    };

    const fetchUpcomingInterviews = async () => {
        try {
            const response = await apiClient.get('/api/candidate/notifications/upcoming-interviews?daysAhead=7');
            if (response.success && response.data) {
                setUpcomingInterviews(response.data as UpcomingInterview[]);
            }
        } catch (error) {
            console.error('Failed to fetch upcoming interviews:', error);
        }
    };

    const fetchPreferences = async () => {
        try {
            const response = await apiClient.get('/api/candidate/notifications/preferences');
            if (response.success && response.data) {
                setPreferences(response.data as NotificationPreferences);
            }
        } catch (error) {
            console.error('Failed to fetch preferences:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const response = await apiClient.put(`/api/candidate/notifications/${id}/read`);
            if (response.success) {
                setNotifications(prev =>
                    prev.map(n => (n.id === id ? { ...n, read: true } : n))
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to mark as read',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            toast({
                title: 'Error',
                description: 'Failed to update notification status',
                variant: 'destructive',
            });
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await apiClient.put('/api/candidate/notifications/mark-all-read');
            if (response.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
                toast({
                    title: 'Success',
                    description: 'All notifications marked as read',
                });
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to mark all as read',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast({
                title: 'Error',
                description: 'Failed to update notifications',
                variant: 'destructive',
            });
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const response = await apiClient.delete(`/api/candidate/notifications/${id}`);
            if (response.success) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                const notification = notifications.find(n => n.id === id);
                if (notification && !notification.read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                toast({
                    title: 'Deleted',
                    description: 'Notification removed',
                });
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to delete notification',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete notification',
                variant: 'destructive',
            });
        }
    };

    const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
        if (!preferences) return;

        setSavingPreferences(true);
        try {
            const response = await apiClient.put('/api/candidate/notifications/preferences', {
                ...preferences,
                ...updates,
            });
            if (response.success && response.data) {
                setPreferences(response.data as NotificationPreferences);
                toast({
                    title: 'Success',
                    description: 'Notification preferences updated',
                });
            } else {
                toast({
                    title: 'Error',
                    description: response.error || 'Failed to update preferences',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to update preferences:', error);
            toast({
                title: 'Error',
                description: 'Failed to save settings',
                variant: 'destructive',
            });
        } finally {
            setSavingPreferences(false);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Open Dialog instead of direct navigation
        setSelectedNotification(notification);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'JOB_ALERT':
            case 'JOB_MATCH':
                return <Briefcase className="h-5 w-5 text-blue-500" />;
            case 'APPLICATION_RECEIVED':
            case 'APPLICATION_UPDATE':
            case 'APPLICATION_STATUS_UPDATED':
                return <Bell className="h-5 w-5 text-purple-500" />;
            case 'INTERVIEW_SCHEDULED':
            case 'INTERVIEW_RESCHEDULED':
            case 'INTERVIEW_REMINDER':
                return <Calendar className="h-5 w-5 text-green-500" />;
            case 'INTERVIEW_CANCELLED':
                return <Calendar className="h-5 w-5 text-red-500" />;
            case 'OFFER_SENT':
            case 'OFFER_ACCEPTED':
            case 'OFFER_DECLINED':
                return <FileText className="h-5 w-5 text-blue-600" />;
            case 'MESSAGE':
            case 'MESSAGE_RECEIVED':
                return <Mail className="h-5 w-5 text-orange-500" />;
            case 'SYSTEM':
                return <Info className="h-5 w-5 text-gray-500" />;
            default:
                return <Bell className="h-5 w-5" />;
        }
    };

    const filteredNotifications = () => {
        switch (activeTab) {
            case 'applications':
                return notifications.filter(n =>
                    ['APPLICATION_RECEIVED', 'APPLICATION_UPDATE', 'APPLICATION_STATUS_UPDATED', 'OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(n.type)
                );
            case 'interviews':
                return notifications.filter(n =>
                    ['INTERVIEW_SCHEDULED', 'INTERVIEW_RESCHEDULED', 'INTERVIEW_CANCELLED', 'INTERVIEW_REMINDER'].includes(n.type)
                );
            case 'job-alerts':
                return notifications.filter(n => ['JOB_ALERT', 'JOB_MATCH'].includes(n.type));
            default:
                return notifications;
        }
    };

    return (
        <CandidatePageLayout>
            <div className="p-6 space-y-6">
                <AtsPageHeader
                    title="Notifications & Alerts"
                    subtitle={unreadCount > 0
                        ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'} out of ${totalNotifications} total.`
                        : `Manage your notifications. You have ${totalNotifications} total notifications.`}
                >
                    {unreadCount > 0 && (
                        <Button onClick={markAllAsRead} variant="outline" size="sm">
                            <Check className="h-4 w-4 mr-2" />
                            Mark all as read
                        </Button>
                    )}
                </AtsPageHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="applications">Applications</TabsTrigger>
                        <TabsTrigger value="interviews">Interviews</TabsTrigger>
                        <TabsTrigger value="job-alerts">Job Alerts</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-4">
                        {loading ? (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </CardContent>
                            </Card>
                        ) : filteredNotifications().length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                                        When you receive updates, they'll appear here
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-4">
                                    {filteredNotifications().map((notification) => (
                                        <NotificationCard
                                            key={notification.id}
                                            notification={notification}
                                            onDelete={deleteNotification}
                                            onClick={handleNotificationClick}
                                            getIcon={getNotificationIcon}
                                        />
                                    ))}
                                </div>
                                {hasMore && activeTab === 'all' && (
                                    <div className="flex justify-center py-4">
                                        <Button
                                            variant="ghost"
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                        >
                                            {loadingMore ? (
                                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            ) : null}
                                            Load More
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="applications" className="space-y-4">
                        {loading ? (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </CardContent>
                            </Card>
                        ) : filteredNotifications().length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No application updates</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                                        Application status changes will appear here
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredNotifications().map((notification) => (
                                    <NotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        onDelete={deleteNotification}
                                        onClick={handleNotificationClick}
                                        getIcon={getNotificationIcon}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="interviews" className="space-y-4">
                        <div className="space-y-4">
                            {upcomingInterviews.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="h-5 w-5" />
                                            Upcoming Interviews
                                        </CardTitle>
                                        <CardDescription>
                                            Interviews scheduled in the next 7 days
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {upcomingInterviews.map((interview, index) => (
                                            <div key={index} className="border rounded-lg p-4 space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{interview.jobTitle}</h4>
                                                        <p className="text-sm text-muted-foreground">{interview.companyName}</p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/candidate/applications/${interview.applicationId}`)}
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>{interview.formattedDate}</span>
                                                </div>
                                                {interview.location && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Location: {interview.location}
                                                    </div>
                                                )}
                                                {interview.meetingLink && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(interview.meetingLink, '_blank')}
                                                    >
                                                        Join Meeting
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {filteredNotifications().length === 0 && upcomingInterviews.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No interview reminders</h3>
                                        <p className="text-sm text-muted-foreground text-center max-w-sm">
                                            Interview reminders and scheduled interviews will appear here
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {filteredNotifications().map((notification) => (
                                        <NotificationCard
                                            key={notification.id}
                                            notification={notification}
                                            onDelete={deleteNotification}
                                            onClick={handleNotificationClick}
                                            getIcon={getNotificationIcon}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="job-alerts" className="space-y-4">
                        {loading ? (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </CardContent>
                            </Card>
                        ) : filteredNotifications().length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No job alerts</h3>
                                    <p className="text-sm text-muted-foreground text-center max-w-sm">
                                        Job match alerts will appear here when new jobs match your criteria
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {filteredNotifications().map((notification) => (
                                    <NotificationCard
                                        key={notification.id}
                                        notification={notification}
                                        onDelete={deleteNotification}
                                        onClick={handleNotificationClick}
                                        getIcon={getNotificationIcon}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="preferences" className="space-y-4">
                        {preferences ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Preferences</CardTitle>
                                    <CardDescription>
                                        Control how and when you receive notifications
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="email-enabled">Email Notifications</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Receive notifications via email
                                                </p>
                                            </div>
                                            <Switch
                                                id="email-enabled"
                                                checked={preferences.emailEnabled}
                                                onCheckedChange={(checked) => updatePreferences({ emailEnabled: checked })}
                                                disabled={savingPreferences}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="in-app-enabled">In-App Notifications</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Show notifications in the app
                                                </p>
                                            </div>
                                            <Switch
                                                id="in-app-enabled"
                                                checked={preferences.inAppEnabled}
                                                onCheckedChange={(checked) => updatePreferences({ inAppEnabled: checked })}
                                                disabled={savingPreferences}
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Notification Types</h3>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="application-status">Application Status Changes</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Get notified when your application status changes
                                                </p>
                                            </div>
                                            <Switch
                                                id="application-status"
                                                checked={preferences.applicationStatusChanges}
                                                onCheckedChange={(checked) => updatePreferences({ applicationStatusChanges: checked })}
                                                disabled={savingPreferences}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="interview-reminders">Interview Reminders</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Get reminders before scheduled interviews
                                                </p>
                                            </div>
                                            <Switch
                                                id="interview-reminders"
                                                checked={preferences.interviewReminders}
                                                onCheckedChange={(checked) => updatePreferences({ interviewReminders: checked })}
                                                disabled={savingPreferences}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="job-alerts">Job Match Alerts</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Get notified when new jobs match your criteria
                                                </p>
                                            </div>
                                            <Switch
                                                id="job-alerts"
                                                checked={preferences.jobMatchAlerts}
                                                onCheckedChange={(checked) => updatePreferences({ jobMatchAlerts: checked })}
                                                disabled={savingPreferences}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="messages">Messages</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Get notified about new messages
                                                </p>
                                            </div>
                                            <Switch
                                                id="messages"
                                                checked={preferences.messages}
                                                onCheckedChange={(checked) => updatePreferences({ messages: checked })}
                                                disabled={savingPreferences}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="system-updates">System Updates</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Get notified about system updates and announcements
                                                </p>
                                            </div>
                                            <Switch
                                                id="system-updates"
                                                checked={preferences.systemUpdates}
                                                onCheckedChange={(checked) => updatePreferences({ systemUpdates: checked })}
                                                disabled={savingPreferences}
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label htmlFor="reminder-hours">Interview Reminder Time</Label>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            How many hours before an interview should you be reminded?
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <Input
                                                id="reminder-hours"
                                                type="number"
                                                min="1"
                                                max="168"
                                                value={preferences.reminderHoursBefore}
                                                onChange={(e) => updatePreferences({ reminderHoursBefore: parseInt(e.target.value) || 24 })}
                                                disabled={savingPreferences}
                                                className="w-24"
                                            />
                                            <span className="text-sm text-muted-foreground">hours before</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

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
        </CandidatePageLayout>
    );
}

interface NotificationCardProps {
    notification: Notification;
    onDelete: (id: string) => void;
    onClick: (notification: Notification) => void;
    getIcon: (type: string) => React.ReactNode;
}

function NotificationCard({ notification, onDelete, onClick, getIcon }: NotificationCardProps) {
    return (
        <Card
            className={`cursor-pointer ${!notification.read ? 'bg-accent/30' : ''}`}
            onClick={() => onClick(notification)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getIcon(notification.type)}</div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-base font-semibold">{notification.title}</CardTitle>
                                {!notification.read && (
                                    <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-primary/10 text-primary border-primary/20">
                                        New
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="text-sm">
                                {notification.message}
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            {notification.data?.jobTitle && (
                <>
                    <Separator />
                    <CardContent className="pt-3 pb-3">
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="font-medium">{notification.data.jobTitle}</div>
                            <div className="text-muted-foreground flex flex-wrap gap-2">
                                {notification.data.companyName && <span>{notification.data.companyName}</span>}
                                {notification.data.location && (
                                    <>
                                        <span>•</span>
                                        <span>{notification.data.location}</span>
                                    </>
                                )}
                            </div>
                            {notification.data.formattedDate && (
                                <div className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{notification.data.formattedDate}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </>
            )}
            <Separator />
            <CardContent className="pt-2 pb-2">
                <p className="text-xs text-muted-foreground">
                    {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                        ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                        : 'Recently'}
                </p>
            </CardContent>
        </Card>
    );
}
