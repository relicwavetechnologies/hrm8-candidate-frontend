/**
 * Candidate Dashboard Home
 * Main dashboard content for candidates
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { applicationService } from '@/shared/services/applicationService';
import type { Application } from '@/shared/services/applicationService';
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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog';

export default function CandidateDashboardHome() {
  const { candidate } = useCandidateAuth();
  const navigate = useNavigate();
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    loadRecentApplications();
    loadNotifications();
    loadRecommendedJobs();
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
      const { apiClient } = await import('@/shared/services/api');
      const response = await apiClient.get<{ notifications: any[]; total: number; unreadCount: number }>('/api/candidate/notifications?limit=5');
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    }
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
                            <Badge variant="secondary" className="h-5 px-2 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border-none shrink-0">
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
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
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
                    navigate(selectedNotification.link || selectedNotification.actionUrl);
                    setSelectedNotification(null);
                  }}
                >
                  {selectedNotification?.link ? 'View Item' : 'Go to Action'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 border rounded-lg cursor-pointer"
                    onClick={() => navigate(`/candidate/applications/${app.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold">Application #{app.id.slice(0, 8)}</h4>
                        {getStatusBadge(app.status)}
                        {app.isNew && (
                          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-primary/10 text-primary border-primary/20">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Applied {new Date(app.appliedDate).toLocaleDateString()}
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
