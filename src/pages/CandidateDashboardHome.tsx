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

export default function CandidateDashboardHome() {
  const { candidate } = useCandidateAuth();
  const navigate = useNavigate();
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
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
      const response = await apiClient.get<any[]>('/api/candidate/recommended-jobs');
      if (response.success && response.data) {
        setRecommendedJobs(response.data.slice(0, 3)); // Show top 3
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommended Jobs */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Recommended Jobs</CardTitle>
                    <CardDescription className="text-sm">Jobs matching your profile</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/jobs')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loadingJobs ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading recommendations...
                    </div>
                  ) : recommendedJobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No specific recommendations yet.</p>
                      <p className="text-xs mt-1">Complete your profile to get better matches.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => navigate('/jobs')}
                      >
                        Browse All Jobs
                      </Button>
                    </div>
                  ) : (
                    recommendedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                          {job.company?.logo ? (
                            <img src={job.company.logo} alt={job.company.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <Briefcase className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{job.title}</p>
                              <p className="text-xs text-muted-foreground">{job.company?.name || 'Company'}</p>
                            </div>
                            {job.matchScore && (
                              <Badge variant="outline" className="h-6 px-2 text-xs rounded-full shrink-0 bg-primary/5 text-primary border-primary/20">
                                {Math.round(job.matchScore)}% match
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-sm font-normal">
                              {job.employment_type?.replace('_', ' ')}
                            </Badge>
                            {job.work_arrangement && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-sm font-normal">
                                {job.work_arrangement?.replace('_', ' ')}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {job.location}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications Preview */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Notifications</CardTitle>
                    <CardDescription className="text-sm">Recent updates</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => navigate('/candidate/notifications')}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No new notifications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0 cursor-pointer p-2 rounded-md"
                        onClick={() => navigate('/candidate/notifications')}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${notification.type === 'JOB_ALERT' ? 'bg-blue-500/10' : 'bg-orange-500/10'
                          }`}>
                          {notification.type === 'JOB_ALERT' ? (
                            <Briefcase className={`h-4 w-4 ${!notification.read ? 'text-blue-500' : 'text-blue-500/50'}`} />
                          ) : (
                            <Bell className={`h-4 w-4 ${!notification.read ? 'text-orange-500' : 'text-orange-500/50'}`} />
                          )}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} truncate`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {notification.createdAt && !isNaN(new Date(notification.createdAt).getTime())
                              ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
                              : 'Recently'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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
