/**
 * Candidate Dashboard Home
 * Main dashboard content for candidates
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { applicationService } from '@/shared/services/applicationService';
import type { Application } from '@/shared/services/applicationService';
import { notificationService, type Notification } from '@/shared/services/notificationService';
import { resolveCandidateNotificationTarget } from '@/shared/lib/notification-routing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import {
  Briefcase,
  FileText,
  Bell,
  Video,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  CalendarCheck,
  CalendarClock,
  Clock,
  Send,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/utils';

export default function CandidateDashboardHome() {
  const { candidate } = useCandidateAuth();
  const navigate = useNavigate();
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [schedulingSessions, setSchedulingSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRecentApplications();
    loadNotifications();
    loadRecommendedJobs();
    loadUpcomingInterviews();
    loadSchedulingSessions();
    calculateProfileCompleteness();
  }, [candidate]);

  const loadRecommendedJobs = async () => {
    if (!candidate) return;
    setLoadingJobs(true);
    try {
      const { apiClient } = await import('@/shared/services/api');
      const response = await apiClient.get<any[]>('/api/candidate/recommended-jobs?limit=3');
      if (response.success && response.data) {
        setRecommendedJobs(response.data); // Backend already limited to 3
      }
    } catch (error) {
      console.error('Failed to load recommended jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadUpcomingInterviews = async () => {
    if (!candidate) return;
    setLoadingInterviews(true);
    try {
      const { apiClient } = await import('@/shared/services/api');
      const response = await apiClient.get<any[]>('/api/candidate/notifications/upcoming-interviews?daysAhead=7');
      if (response.success && response.data) {
        setUpcomingInterviews(response.data);
      }
    } catch (error) {
      console.error('Failed to load upcoming interviews:', error);
    } finally {
      setLoadingInterviews(false);
    }
  };

  const loadSchedulingSessions = async () => {
    if (!candidate) return;
    setLoadingSessions(true);
    try {
      const { apiClient } = await import('@/shared/services/api');
      const response = await apiClient.get<any>('/api/candidate/scheduling-sessions');
      if (response.success && response.data) {
        setSchedulingSessions(response.data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load scheduling sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadRecentApplications = async () => {
    try {
      const response = await applicationService.getCandidateApplications();
      const apps = response.data?.applications || [];
      setRecentApplications(apps.slice(0, 5));
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationService.getNotifications({ limit: 5 });
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark dashboard notification as read:', error);
      }
    }

    const target = resolveCandidateNotificationTarget(notification);
    if (target) {
      navigate(target);
      return;
    }

    navigate('/candidate/notifications');
    toast({
      title: 'Notification opened',
      description: 'Unable to resolve a direct destination for this notification.',
    });
  };

  const calculateProfileCompleteness = () => {
    if (!candidate) {
      setProfileCompleteness(0);
      return;
    }

    let completed = 0;
    const total = 6;

    if (candidate.firstName && candidate.lastName) completed++;
    if (candidate.email) completed++;
    if (candidate.phone) completed++;
    if (candidate.city && candidate.country) completed++;
    if (candidate.linkedInUrl) completed++;
    if (candidate.photo) completed++;

    setProfileCompleteness(Math.round((completed / total) * 100));
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'in-person':
      case 'in_person':
      case 'onsite':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getInterviewTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return 'Video Call';
      case 'phone':
        return 'Phone Call';
      case 'in-person':
      case 'in_person':
      case 'onsite':
        return 'In-Person';
      default:
        return type || 'Interview';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-primary/10 text-primary border-primary/20">
            New
          </Badge>
        );
      case 'SCREENING':
        return (
          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-muted">
            Screening
          </Badge>
        );
      case 'INTERVIEW':
        return (
          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-warning/10 text-warning border-warning/20">
            Interview
          </Badge>
        );
      case 'OFFER':
        return (
          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-success/10 text-success border-success/20">
            Offer
          </Badge>
        );
      case 'HIRED':
        return (
          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-success/10 text-success border-success/20">
            Hired
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-destructive/10 text-destructive border-destructive/20">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">
            {status}
          </Badge>
        );
    }
  };

  return (
    <CandidatePageLayout>
      <div className="p-6 space-y-6">
        <AtsPageHeader
          title="Dashboard"
          subtitle={`Welcome back, ${candidate?.firstName}!`}
        />

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile Completeness */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Profile Completeness</CardTitle>
              <CardDescription className="text-sm">
                Complete your profile to improve your job matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{profileCompleteness}% Complete</span>
                  <span className="text-muted-foreground">{100 - profileCompleteness}% remaining</span>
                </div>
                <Progress value={profileCompleteness} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/candidate/profile')}
                  className="mt-4 w-full"
                >
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Browse Jobs */}
          <Card className="cursor-pointer" onClick={() => navigate('/jobs')}>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Browse Jobs
              </CardTitle>
              <CardDescription className="text-sm">
                Search and apply for new opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/jobs');
                }}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Browse Jobs
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Scheduling Actions Required */}
        {!loadingSessions && schedulingSessions.length > 0 && (
          <Card className="overflow-hidden border-2 border-primary/30 shadow-sm">
            <CardHeader className="py-4 px-6 border-b bg-primary/[0.03]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-primary/60 mb-1">Action Required</p>
                  <CardTitle className="text-base font-bold tracking-tight text-foreground/90">Interview Scheduling</CardTitle>
                </div>
                <Badge variant="outline" className="rounded-full text-[10px] px-2.5 border-primary/20 bg-primary/10 text-primary animate-pulse">
                  {schedulingSessions.length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {schedulingSessions.map((session: any) => {
                  const isBooking = session.mode === 'BOOKING_LINK';
                  const expiresAt = session.expiresAt ? new Date(session.expiresAt) : null;
                  const isExpiringSoon = expiresAt && (expiresAt.getTime() - Date.now()) < 48 * 60 * 60 * 1000;

                  return (
                    <div
                      key={session.id}
                      className={cn(
                        "rounded-2xl border p-4 space-y-2.5 transition-colors",
                        isExpiringSoon
                          ? "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10"
                          : "border-border/60 hover:bg-muted/20"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          isBooking ? "bg-primary/10 text-primary" : "bg-violet-100 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400"
                        )}>
                          {isBooking ? <CalendarCheck className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold truncate">{session.jobTitle}</h4>
                          <p className="text-xs text-muted-foreground truncate">{session.companyName}{session.roundName ? ` · ${session.roundName}` : ''}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {isBooking
                          ? `${session.offeredSlotCount} slot${session.offeredSlotCount !== 1 ? 's' : ''} available — pick one`
                          : 'Submit your available times'}
                      </p>
                      <div className="flex items-center gap-2">
                        {session.publicUrl && (
                          <Button size="sm" className="rounded-xl text-xs gap-1.5 flex-1" onClick={() => window.open(session.publicUrl, '_blank')}>
                            {isBooking ? <CalendarCheck className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                            {isBooking ? 'Choose Slot' : 'Submit Availability'}
                          </Button>
                        )}
                        {expiresAt && (
                          <span className={cn(
                            "text-[10px] shrink-0 inline-flex items-center gap-1",
                            isExpiringSoon ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"
                          )}>
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(expiresAt, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Interviews */}
        <Card className="overflow-hidden border-border/40 shadow-sm">
          <CardHeader className="py-4 px-6 border-b bg-muted/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 mb-1">This Week</p>
                <CardTitle className="text-base font-bold tracking-tight text-foreground/90">Upcoming Interviews</CardTitle>
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {loadingInterviews ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground animate-pulse">
                <div className="w-12 h-12 rounded-full bg-muted mb-4" />
                <div className="h-4 w-40 bg-muted rounded" />
              </div>
            ) : upcomingInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="h-6 w-6 opacity-30 mb-2" />
                <p className="text-sm font-semibold">No upcoming interviews</p>
                <p className="text-xs text-muted-foreground/60 mt-1">You're all clear for the next 7 days</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingInterviews.map((interview: any) => (
                  <div
                    key={interview.id}
                    className="group rounded-2xl border border-border/40 p-4 hover:bg-muted/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold truncate text-foreground/90">
                          {interview.jobTitle || interview.job?.title || 'Interview'}
                        </h4>
                        <p className="text-xs text-muted-foreground font-semibold truncate">
                          {interview.companyName || interview.company?.name || 'Company'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="h-5 px-2 text-[10px] font-bold rounded-full bg-primary/10 text-primary border-primary/20 shrink-0 flex items-center gap-1"
                      >
                        {getInterviewTypeIcon(interview.type || interview.interviewType)}
                        <span>{getInterviewTypeLabel(interview.type || interview.interviewType)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-3">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {interview.scheduledAt || interview.dateTime
                          ? format(new Date(interview.scheduledAt || interview.dateTime), 'EEE, MMM d · h:mm a')
                          : 'Time TBD'}
                      </span>
                    </div>
                    {(interview.meetingLink || interview.link) && (
                      <Button
                        size="sm"
                        className="w-full text-xs font-bold"
                        onClick={() => window.open(interview.meetingLink || interview.link, '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Join Meeting
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Jobs & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recommended Jobs */}
          <div className="h-[450px]">
            <Card className="h-full flex flex-col overflow-hidden border-border/40 shadow-sm">
              <CardHeader className="py-4 px-6 border-b bg-muted/5 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold tracking-tight text-foreground/90">Recommended Jobs</CardTitle>
                    <CardDescription className="text-xs font-medium">Matching your profile</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden bg-background">
                <ScrollArea className="h-[340px] w-full">
                  <div className="p-4 space-y-2">
                    {loadingJobs ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-muted mb-4"></div>
                        <div className="h-4 w-32 bg-muted rounded"></div>
                      </div>
                    ) : recommendedJobs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Briefcase className="h-6 w-6 opacity-40 mb-2" />
                        <p className="text-sm font-semibold">No recommendations yet</p>
                      </div>
                    ) : (
                      recommendedJobs.map((job) => (
                        <div
                          key={job.id}
                          className="group flex items-center gap-4 p-4 rounded-xl hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          <div className="w-12 h-12 rounded-xl bg-primary/5 border border-border/10 flex items-center justify-center shrink-0">
                            {job.company?.logo ? (
                              <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <Briefcase className="h-5 w-5 text-primary/60" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold truncate text-foreground/90">{job.title}</h4>
                            <p className="text-xs text-muted-foreground font-semibold">{job.company?.name || 'Company'}</p>
                          </div>
                          {job.matchScore && (
                            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-bold rounded-full bg-success/10 text-success border-none shrink-0">
                              {Math.round(job.matchScore)}% Match
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-3 border-t bg-muted/5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs font-bold text-primary hover:bg-primary/10"
                  onClick={() => navigate('/jobs')}
                >
                  View All Jobs
                </Button>
              </div>
            </Card>
          </div>

          {/* Notifications Preview */}
          <div className="h-[450px]">
            <Card className="h-full flex flex-col overflow-hidden border-border/40 shadow-sm">
              <CardHeader className="py-4 px-6 border-b bg-muted/5 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold tracking-tight text-foreground/90">Notifications</CardTitle>
                    <CardDescription className="text-xs font-medium">Recent updates</CardDescription>
                  </div>
                  <Bell className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden bg-background">
                <ScrollArea className="h-[340px] w-full">
                  <div className="divide-y divide-border/10">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                        <Bell className="h-6 w-6 opacity-30 mb-2" />
                        <p className="text-sm font-semibold">No recent notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="flex flex-col gap-1 p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer"
                          onClick={() => void handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                              <p className={`text-sm ${!notification.read ? 'font-bold' : 'font-semibold text-muted-foreground'} truncate`}>
                                {notification.title}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground/60 shrink-0 font-bold">
                              {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                                ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: false }).replace('about ', '')
                                : 'Recently'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground/80 line-clamp-3">
                            {notification.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <div className="p-3 border-t bg-muted/5 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs font-bold text-primary hover:bg-primary/10"
                  onClick={() => navigate('/candidate/notifications')}
                >
                  View All Notifications
                </Button>
              </div>
            </Card>
          </div>
        </div>

        <div className="pt-4"> {/* Footer Spacer */} </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
                <CardDescription className="text-sm">Your latest job applications</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/candidate/applications')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No applications yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => navigate('/jobs')}
                >
                  Browse Jobs
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentApplications.map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => navigate(`/candidate/applications?expand=${app.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold">{app.job?.title || `Application #${app.id.slice(0, 8)}`}</h4>
                        {getStatusBadge(app.status)}
                        {app.isNew && (
                          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-primary/10 text-primary border-primary/20">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {app.job?.company?.name || 'Company'} • Applied {new Date(app.appliedDate || app.applied_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CandidatePageLayout>
  );
}
