/**
 * Applications Page
 * Enhanced application history with drawer detail view, rich data display
 */

import { useState, useEffect } from 'react';
import { safeOpenExternal } from '@/shared/lib/safeExternalLink';
import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applicationService } from '@/shared/services/applicationService';
import type { Application } from '@/shared/services/applicationService';
import { apiClient } from '@/shared/services/api';
import { jobService } from '@/shared/services/jobService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';

import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  FileText,
  Search,
  Eye,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  Trash2,
  X,
  Video,
  Download,
  Link as LinkIcon,
  Building2,
  Globe,
  Monitor,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Star,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/utils';

/* ── helpers ── */

function formatEmploymentType(type?: string) {
  if (!type) return '';
  const map: Record<string, string> = {
    'FULL_TIME': 'Full-time', 'full-time': 'Full-time', 'full_time': 'Full-time',
    'PART_TIME': 'Part-time', 'part-time': 'Part-time', 'part_time': 'Part-time',
    'CONTRACT': 'Contract', 'contract': 'Contract',
    'CASUAL': 'Casual', 'casual': 'Casual',
  };
  return map[type] || type.replace(/_/g, ' ');
}

function getEmploymentTypeVariant(type?: string) {
  if (!type) return 'neutral' as const;
  const normalized = type.toLowerCase().replace(/_/g, '-');
  const map: Record<string, 'default' | 'purple' | 'orange' | 'teal'> = {
    'full-time': 'default', 'full_time': 'default',
    'part-time': 'purple', 'part_time': 'purple',
    'contract': 'orange', 'casual': 'teal',
  };
  return map[normalized] || ('neutral' as const);
}

function formatWorkArrangement(type?: string) {
  if (!type) return '';
  const map: Record<string, string> = {
    'ON_SITE': 'On-site', 'on-site': 'On-site', 'on_site': 'On-site',
    'REMOTE': 'Remote', 'remote': 'Remote',
    'HYBRID': 'Hybrid', 'hybrid': 'Hybrid',
  };
  return map[type] || type.replace(/_/g, ' ');
}

function formatSalary(min?: number, max?: number, currency?: string) {
  if (!min && !max) return null;
  const cur = currency || 'USD';
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (min && max) return `${fmt.format(min)} – ${fmt.format(max)}`;
  if (min) return `From ${fmt.format(min)}`;
  return `Up to ${fmt.format(max!)}`;
}

/* ── types ── */

interface JobDetails {
  id: string;
  title: string;
  location?: string;
  employmentType?: string;
  workArrangement?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  department?: string;
  experienceLevel?: string;
  experience_level?: string;
  numberOfVacancies?: number;
  number_of_vacancies?: number;
  company?: {
    id: string;
    name: string;
  };
}

interface VideoInterview {
  id: string;
  scheduledDate: string;
  duration: number;
  meetingLink?: string;
  status: string;
  type: string;
  notes?: string;
}

interface ApplicationWithDetails extends Application {
  jobDetails?: JobDetails;
  interviews?: VideoInterview[];
  detailsLoaded?: boolean;
  screeningStatus?: string;
  screening_status?: string;
}

/* ── component ── */

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<ApplicationWithDetails | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; name: string; type: 'resume' | 'coverLetter' } | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const APPLICATIONS_PER_PAGE = 10;
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const expandId = searchParams.get('expand');

  useEffect(() => {
    loadApplications();
  }, []);

  // Handle auto-expansion from query param
  useEffect(() => {
    if (expandId && applications.length > 0) {
      const app = applications.find(a => a.id === expandId);
      if (app) {
        openDrawer(app);
      }
    }
  }, [expandId, applications.length]);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const response = await applicationService.getCandidateApplications();
      const apps = response.data?.applications || [];

      const appsWithSummary = apps.map((app: any) => ({
        ...app,
        appliedDate: app.appliedDate || app.createdAt || new Date().toISOString(),
        detailsLoaded: false,
        jobDetails: app.job ? {
          id: app.job.id,
          title: app.job.title,
          location: app.job.location,
          employmentType: app.job.employmentType || app.job.employment_type,
          workArrangement: app.job.workArrangement || app.job.work_arrangement,
          salaryMin: app.job.salaryMin || app.job.salary_min,
          salaryMax: app.job.salaryMax || app.job.salary_max,
          salaryCurrency: app.job.salaryCurrency || app.job.salary_currency,
          department: app.job.department,
          experienceLevel: app.job.experienceLevel || app.job.experience_level,
          numberOfVacancies: app.job.numberOfVacancies || app.job.number_of_vacancies,
          company: app.job.company ? {
            id: app.job.company.id,
            name: app.job.company.name,
          } : undefined,
        } : undefined
      }));

      setApplications(appsWithSummary);
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast({
        title: 'Failed to load applications',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDrawer = async (app: ApplicationWithDetails) => {
    setSelectedApp(app);
    setDrawerOpen(true);

    if (!app.detailsLoaded) {
      setLoadingDetail(true);
      try {
        const [response, formResponse] = await Promise.all([
          applicationService.getApplication(app.id),
          jobService.getApplicationForm(app.jobId),
        ]);

        let questionMap: Record<string, string> = {};
        if (formResponse.success && formResponse.data) {
          const formData = formResponse.data as any;
          const questions = formData?.form?.questions || formData?.questions || [];
          for (const q of questions) {
            if (q.id && q.label) questionMap[q.id] = q.label;
          }
        }

        if (response.data?.application) {
          const fullApp = response.data.application;
          // Enrich customAnswers with question labels
          const enrichedAnswers = (fullApp.customAnswers || app.customAnswers || []).map((ans: any) => ({
            ...ans,
            question: questionMap[ans.questionId] || ans.question || null,
          }));
          const updated: ApplicationWithDetails = {
            ...app,
            ...fullApp,
            customAnswers: enrichedAnswers,
            detailsLoaded: true,
            jobDetails: (fullApp as any).job ? {
              ...app.jobDetails!,
              ...((fullApp as any).job)
            } : app.jobDetails,
          };
          setSelectedApp(updated);
          setApplications(prev => prev.map(a => a.id === app.id ? updated : a));
        }
      } catch (error) {
        console.error('Failed to load application details', error);
        toast({ title: 'Failed to load details', variant: 'destructive' });
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    try {
      const response = await applicationService.withdrawApplication(applicationId);
      if (response.success) {
        toast({ title: 'Application withdrawn', description: 'Your application has been withdrawn successfully' });
        setWithdrawDialogOpen(null);
        setDrawerOpen(false);
        loadApplications();
      } else {
        toast({ title: 'Failed to withdraw application', description: response.error || 'Please try again', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      toast({ title: 'Failed to withdraw application', description: 'Please try again later', variant: 'destructive' });
    }
  };

  const handleDelete = async (applicationId: string) => {
    try {
      const app = applications.find(a => a.id === applicationId);
      if (app && app.status !== 'WITHDRAWN' && app.status !== 'REJECTED') {
        try { await applicationService.withdrawApplication(applicationId); } catch { /* continue */ }
      }
      const response = await apiClient.delete(`/api/applications/${applicationId}`);
      if (response.success) {
        toast({ title: 'Application deleted', description: 'Your application has been withdrawn and deleted successfully' });
        setDeleteDialogOpen(null);
        setDrawerOpen(false);
        loadApplications();
      } else {
        toast({ title: 'Failed to delete application', description: response.error || 'Please try again', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Failed to delete application:', error);
      toast({ title: 'Failed to delete application', description: 'Please try again later', variant: 'destructive' });
    }
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast({ title: 'Download started', description: 'Your file is being downloaded' });
    } catch (error) {
      console.error('Failed to download file:', error);
      toast({ title: 'Download failed', description: 'Failed to download the file. Please try again.', variant: 'destructive' });
      safeOpenExternal(url);
    }
  };

  const getStatusBadge = (status: string, size: 'sm' | 'md' = 'sm') => {
    const cls = size === 'md' ? 'h-7 px-3 text-xs' : 'h-6 px-2 text-[10px]';
    switch (status) {
      case 'NEW':
        return <Badge variant="outline" className={cn(cls, "rounded-full border-primary/20 bg-primary/10 text-primary")}>New</Badge>;
      case 'SCREENING':
      case 'UNDER_REVIEW':
        return <Badge variant="outline" className={cn(cls, "rounded-full border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200")}>Screening</Badge>;
      case 'SHORTLISTED':
        return <Badge variant="outline" className={cn(cls, "rounded-full border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200")}>Shortlisted</Badge>;
      case 'INTERVIEW':
      case 'INTERVIEW_SCHEDULED':
      case 'INTERVIEWED':
        return <Badge variant="outline" className={cn(cls, "rounded-full border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200")}>Interview</Badge>;
      case 'OFFER':
      case 'OFFERED':
        return <Badge variant="outline" className={cn(cls, "rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200")}>Offer</Badge>;
      case 'HIRED':
        return <Badge variant="outline" className={cn(cls, "rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200")}>Hired</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className={cn(cls, "rounded-full border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200")}>Rejected</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="outline" className={cn(cls, "rounded-full")}>Withdrawn</Badge>;
      default:
        return <Badge variant="outline" className={cn(cls, "rounded-full")}>{status}</Badge>;
    }
  };

  const getStageBadge = (stage?: string) => {
    if (!stage) return null;
    return (
      <Badge variant="secondary" className="rounded-full text-[10px] px-2 py-0.5">
        {stage.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getInterviewStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-primary/20 bg-primary/10 text-primary">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-rose-200 bg-rose-50 text-rose-700">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEW': return <AlertCircle className="h-4 w-4 text-primary" />;
      case 'SCREENING': case 'UNDER_REVIEW': return <Search className="h-4 w-4 text-sky-600" />;
      case 'SHORTLISTED': return <Star className="h-4 w-4 text-violet-600" />;
      case 'INTERVIEW': case 'INTERVIEW_SCHEDULED': case 'INTERVIEWED': return <Video className="h-4 w-4 text-amber-600" />;
      case 'OFFER': case 'OFFERED': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'HIRED': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-rose-600" />;
      case 'WITHDRAWN': return <X className="h-4 w-4 text-muted-foreground" />;
      default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const canWithdraw = (status: string) => !['WITHDRAWN', 'REJECTED', 'HIRED'].includes(status);
  const canDelete = (status: string) => status !== 'HIRED';

  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.id.toLowerCase().includes(query) ||
      app.jobId.toLowerCase().includes(query) ||
      app.jobDetails?.title?.toLowerCase().includes(query) ||
      app.jobDetails?.company?.name?.toLowerCase().includes(query)
    );
  });

  const paginatedApplications = filteredApplications.slice(0, visibleCount);
  const hasMoreApplications = filteredApplications.length > visibleCount;

  const handleLoadMore = () => { setVisibleCount(prev => prev + APPLICATIONS_PER_PAGE); };

  React.useEffect(() => { setVisibleCount(APPLICATIONS_PER_PAGE); }, [searchQuery, statusFilter]);

  return (
    <CandidatePageLayout>
      <div className="p-6 space-y-6">
        <AtsPageHeader
          title="My Applications"
          subtitle="Track your job applications, interviews, and documents"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="SCREENING">Screening</SelectItem>
                <SelectItem value="INTERVIEW">Interview</SelectItem>
                <SelectItem value="OFFER">Offer</SelectItem>
                <SelectItem value="HIRED">Hired</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => navigate('/jobs')}>
              Browse Jobs
            </Button>
          </div>
        </AtsPageHeader>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Applications</CardTitle>
                <CardDescription className="text-sm">
                  {paginatedApplications.length} of {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''} (Total: {applications.length})
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-28 w-full rounded-3xl" />
                ))}
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2 text-sm">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No applications match your filters'
                    : 'No applications yet'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/jobs')}>
                    Browse Jobs
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedApplications.map((app) => {
                  const salary = formatSalary(app.jobDetails?.salaryMin, app.jobDetails?.salaryMax, app.jobDetails?.salaryCurrency);
                  const empType = app.jobDetails?.employmentType;
                  const workArr = app.jobDetails?.workArrangement;

                  return (
                    <Card
                      key={app.id}
                      id={`app-${app.id}`}
                      className="overflow-hidden rounded-3xl border-border/70 shadow-none transition-all hover:border-primary/30 hover:bg-muted/[0.02] cursor-pointer"
                      onClick={() => openDrawer(app)}
                    >
                      <CardContent className="p-4 md:p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2.5">
                            {/* Title row */}
                            <div className="flex flex-wrap items-center gap-2">
                              {getStatusIcon(app.status)}
                              <h3 className="text-base font-semibold tracking-tight truncate">
                                {app.jobDetails?.title || 'Loading job details...'}
                              </h3>
                              {getStatusBadge(app.status)}
                              {app.isNew && (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">New</span>
                              )}
                            </div>

                            {/* Subtitle */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              {app.jobDetails?.company && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span className="font-medium text-foreground/80">{app.jobDetails.company.name}</span>
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Applied {formatDistanceToNow(new Date(app.appliedDate), { addSuffix: true })}
                              </span>
                              {app.jobDetails?.location && (
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {app.jobDetails.location}
                                </span>
                              )}
                            </div>

                            {/* Badges row */}
                            <div className="flex flex-wrap gap-1.5">
                              {empType && (
                                <Badge variant={getEmploymentTypeVariant(empType) as any} className="rounded-full text-[10px] px-2.5 py-0.5">
                                  {formatEmploymentType(empType)}
                                </Badge>
                              )}
                              {workArr && (
                                <Badge variant="outline" className={cn(
                                  "rounded-full text-[10px] px-2.5 py-0.5",
                                  workArr.toUpperCase() === 'REMOTE' && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
                                  workArr.toUpperCase() === 'HYBRID' && "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200"
                                )}>
                                  {workArr.toUpperCase() === 'REMOTE' ? <Globe className="h-3 w-3 mr-1" /> :
                                   workArr.toUpperCase() === 'HYBRID' ? <Monitor className="h-3 w-3 mr-1" /> :
                                   <MapPin className="h-3 w-3 mr-1" />}
                                  {formatWorkArrangement(workArr)}
                                </Badge>
                              )}
                              {salary && (
                                <Badge variant="outline" className="rounded-full text-[10px] px-2.5 py-0.5">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {salary}
                                </Badge>
                              )}
                              {app.stage && (
                                <Badge variant="secondary" className="rounded-full text-[10px] px-2.5 py-0.5">
                                  {String(app.stage).replace(/_/g, ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 rounded-xl h-9 px-4 text-sm"
                            onClick={(e) => { e.stopPropagation(); openDrawer(app); }}
                          >
                            View Details
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {hasMoreApplications && (
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={handleLoadMore} className="w-full md:w-auto min-w-[200px]">
                      Load More Applications
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Application Detail Drawer ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {selectedApp && (
            <div className="flex flex-col h-full">
              {/* Drawer header */}
              <SheetHeader className="p-5 pb-4 border-b sticky top-0 bg-background z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusIcon(selectedApp.status)}
                    <SheetTitle className="text-lg font-semibold tracking-tight">
                      {selectedApp.jobDetails?.title || 'Application Details'}
                    </SheetTitle>
                    {getStatusBadge(selectedApp.status, 'md')}
                  </div>
                  <SheetDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {selectedApp.jobDetails?.company && (
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {selectedApp.jobDetails.company.name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Applied {format(new Date(selectedApp.appliedDate), 'PPP')}
                    </span>
                    <span className="text-muted-foreground/60">
                      ID: {selectedApp.id.slice(0, 8)}
                    </span>
                  </SheetDescription>
                </div>
              </SheetHeader>

              {loadingDetail ? (
                <div className="p-5 space-y-4">
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              ) : (
                <div className="p-5 space-y-5 flex-1">
                  {/* Status & Stage */}
                  <div className="rounded-2xl border border-border/70 bg-muted/[0.24] p-4 space-y-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Application Status</p>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(selectedApp.status, 'md')}
                      {selectedApp.stage && getStageBadge(String(selectedApp.stage))}
                      {selectedApp.shortlisted && (
                        <Badge variant="outline" className="rounded-full text-[10px] px-2.5 py-0.5 border-violet-200 bg-violet-50 text-violet-700">
                          <Star className="h-3 w-3 mr-1" />
                          Shortlisted
                        </Badge>
                      )}
                    </div>
                    {selectedApp.score !== undefined && selectedApp.score !== null && (
                      <div className="flex items-center gap-4 mt-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Fit Score</p>
                          <p className="text-lg font-semibold">{selectedApp.score}/100</p>
                        </div>
                        {selectedApp.rank && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rank</p>
                            <p className="text-lg font-semibold">#{selectedApp.rank}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedApp.tags && selectedApp.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedApp.tags.map((tag, i) => (
                          <span key={i} className="rounded-full border border-dashed border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Job Details metrics */}
                  {selectedApp.jobDetails && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Job Details</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedApp.jobDetails.location && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Location</p>
                            <p className="mt-1 text-sm font-semibold">{selectedApp.jobDetails.location}</p>
                          </div>
                        )}
                        {selectedApp.jobDetails.employmentType && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Employment</p>
                            <p className="mt-1 text-sm font-semibold">{formatEmploymentType(selectedApp.jobDetails.employmentType)}</p>
                            {selectedApp.jobDetails.workArrangement && (
                              <p className="text-xs text-muted-foreground">{formatWorkArrangement(selectedApp.jobDetails.workArrangement)}</p>
                            )}
                          </div>
                        )}
                        {(selectedApp.jobDetails.salaryMin || selectedApp.jobDetails.salaryMax) && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Salary</p>
                            <p className="mt-1 text-sm font-semibold">
                              {formatSalary(selectedApp.jobDetails.salaryMin, selectedApp.jobDetails.salaryMax, selectedApp.jobDetails.salaryCurrency)}
                            </p>
                          </div>
                        )}
                        {selectedApp.jobDetails.department && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Department</p>
                            <p className="mt-1 text-sm font-semibold">{selectedApp.jobDetails.department}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 rounded-xl"
                        onClick={() => navigate(`/jobs/${selectedApp.jobId}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-2" />
                        View Job Posting
                      </Button>
                    </div>
                  )}

                  {/* Documents */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Documents & Links</p>
                    <div className="space-y-2">
                      {selectedApp.resumeUrl ? (
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 hover:bg-muted/[0.1] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-medium">Resume</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                              const parts = selectedApp.resumeUrl!.split('/');
                              const fn = parts[parts.length - 1].split('?')[0] || 'resume.pdf';
                              setPreviewDocument({ url: selectedApp.resumeUrl!, name: fn, type: 'resume' });
                            }}>
                              <Eye className="h-3.5 w-3.5 mr-1" />Preview
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                              const parts = selectedApp.resumeUrl!.split('/');
                              const fn = parts[parts.length - 1].split('?')[0] || 'resume.pdf';
                              handleDownloadFile(selectedApp.resumeUrl!, fn);
                            }}>
                              <Download className="h-3.5 w-3.5 mr-1" />Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-dashed border-border/70 text-muted-foreground">
                          <FileText className="h-4 w-4" /><span className="text-sm">No resume attached</span>
                        </div>
                      )}

                      {selectedApp.coverLetterUrl ? (
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 hover:bg-muted/[0.1] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <FileText className="h-4 w-4 text-teal shrink-0" />
                            <span className="text-sm font-medium">Cover Letter</span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                              const parts = selectedApp.coverLetterUrl!.split('/');
                              const fn = parts[parts.length - 1].split('?')[0] || 'cover-letter.pdf';
                              setPreviewDocument({ url: selectedApp.coverLetterUrl!, name: fn, type: 'coverLetter' });
                            }}>
                              <Eye className="h-3.5 w-3.5 mr-1" />Preview
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                              const parts = selectedApp.coverLetterUrl!.split('/');
                              const fn = parts[parts.length - 1].split('?')[0] || 'cover-letter.pdf';
                              handleDownloadFile(selectedApp.coverLetterUrl!, fn);
                            }}>
                              <Download className="h-3.5 w-3.5 mr-1" />Download
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-dashed border-border/70 text-muted-foreground">
                          <FileText className="h-4 w-4" /><span className="text-sm">No cover letter</span>
                        </div>
                      )}

                      {selectedApp.portfolioUrl && (
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 hover:bg-muted/[0.1] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <LinkIcon className="h-4 w-4 text-orange shrink-0" />
                            <span className="text-sm font-medium">Portfolio</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => safeOpenExternal(selectedApp.portfolioUrl)}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />Open
                          </Button>
                        </div>
                      )}

                      {selectedApp.linkedInUrl && (
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 hover:bg-muted/[0.1] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <LinkIcon className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-medium">LinkedIn</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => safeOpenExternal(selectedApp.linkedInUrl)}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />Open
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Screening Answers */}
                  {selectedApp.customAnswers && selectedApp.customAnswers.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Screening Answers</p>
                      <div className="space-y-3">
                        {selectedApp.customAnswers.map((ans: any, i: number) => (
                          <div key={ans.questionId || i} className="rounded-2xl border border-border/70 p-3 space-y-1">
                            <p className="text-xs font-medium text-foreground">{ans.question || `Question ${i + 1}`}</p>
                            <p className="text-sm text-muted-foreground">
                              {Array.isArray(ans.answer) ? ans.answer.join(', ') : String(ans.answer)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Questionnaire Responses */}
                  {selectedApp.questionnaireData?.responses && selectedApp.questionnaireData.responses.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Questionnaire Responses</p>
                      <div className="space-y-3">
                        {selectedApp.questionnaireData.responses.map((resp: any, i: number) => (
                          <div key={resp.questionId || i} className="rounded-2xl border border-border/70 p-3 space-y-1">
                            <p className="text-xs font-medium text-foreground">{resp.question}</p>
                            <p className="text-sm text-muted-foreground">{resp.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interviews */}
                  {selectedApp.interviews && selectedApp.interviews.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Interviews</p>
                      <div className="space-y-2">
                        {selectedApp.interviews.map((interview) => (
                          <div key={interview.id} className="rounded-2xl border border-border/70 p-3 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              {getInterviewStatusBadge(interview.status)}
                              <span className="text-[10px] text-muted-foreground uppercase">{interview.type}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{format(new Date(interview.scheduledDate), 'PPP p')}</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground">{interview.duration} min</span>
                            </div>
                            {interview.meetingLink && (
                              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => safeOpenExternal(interview.meetingLink)}>
                                <Video className="h-3.5 w-3.5 mr-2" />Join Meeting
                              </Button>
                            )}
                            {interview.notes && (
                              <p className="text-xs text-muted-foreground">{interview.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recruiter Notes (if any) */}
                  {selectedApp.recruiterNotes && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Recruiter Notes</p>
                      <div className="rounded-2xl border border-border/70 p-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedApp.recruiterNotes}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <Separator />
                  <div className="flex items-center gap-2 pb-4">
                    {canWithdraw(selectedApp.status) && (
                      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setWithdrawDialogOpen(selectedApp.id)}>
                        <X className="h-3.5 w-3.5 mr-2" />Withdraw
                      </Button>
                    )}
                    {canDelete(selectedApp.status) && (
                      <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive" onClick={() => setDeleteDialogOpen(selectedApp.id)}>
                        <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen !== null} onOpenChange={(open) => !open && setWithdrawDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Application</DialogTitle>
            <DialogDescription>Are you sure you want to withdraw this application? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => withdrawDialogOpen && handleWithdraw(withdrawDialogOpen)}>Withdraw Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>Are you sure you want to delete this application? This will automatically withdraw the application (if not already withdrawn) and then delete it. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}>Delete Application</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewDocument?.name || 'Document Preview'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted rounded-lg">
            {previewDocument && (
              <>
                {previewDocument.url.toLowerCase().endsWith('.pdf') || previewDocument.url.includes('pdf') ? (
                  <iframe src={previewDocument.url} className="w-full h-full min-h-[600px]" title={previewDocument.name} />
                ) : /\.(jpg|jpeg|png|gif|webp)$/i.test(previewDocument.url) ? (
                  <img src={previewDocument.url} alt={previewDocument.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex items-center justify-center h-full text-center p-8">
                    <div>
                      <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                      <Button onClick={() => {
                        const parts = previewDocument.url.split('/');
                        const fn = parts[parts.length - 1].split('?')[0] || 'document';
                        handleDownloadFile(previewDocument.url, fn);
                      }}>
                        <Download className="h-4 w-4 mr-2" />Download to View
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            {previewDocument && (
              <div className="flex gap-2 w-full">
                <Button variant="outline" onClick={() => {
                  const parts = previewDocument.url.split('/');
                  const fn = parts[parts.length - 1].split('?')[0] || 'document';
                  handleDownloadFile(previewDocument.url, fn);
                }}>
                  <Download className="h-4 w-4 mr-2" />Download
                </Button>
                <Button onClick={() => setPreviewDocument(null)}>Close</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CandidatePageLayout>
  );
}
