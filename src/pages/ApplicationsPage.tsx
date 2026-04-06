/**
 * Applications Page
 * Enhanced application history with wide drawer detail view, ATS-style rich data display
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
  Briefcase,
  Phone,
  Users,
  ClipboardList,
  Award,
  TrendingUp,
  Play,
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

/* ── pipeline stages ── */

const PIPELINE_STAGES = [
  { key: 'NEW', label: 'Applied', icon: FileText },
  { key: 'SCREENING', label: 'Screening', icon: Search },
  { key: 'SHORTLISTED', label: 'Shortlisted', icon: Star },
  { key: 'INTERVIEW', label: 'Interview', icon: Video },
  { key: 'OFFER', label: 'Offer', icon: Award },
  { key: 'HIRED', label: 'Hired', icon: CheckCircle2 },
];

function getStageIndex(status: string): number {
  const map: Record<string, number> = {
    'NEW': 0, 'SCREENING': 1, 'UNDER_REVIEW': 1, 'SHORTLISTED': 2,
    'INTERVIEW': 3, 'INTERVIEW_SCHEDULED': 3, 'INTERVIEWED': 3,
    'OFFER': 4, 'OFFERED': 4, 'HIRED': 5,
  };
  return map[status] ?? -1;
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

interface InterviewData {
  id: string;
  scheduledDate?: string;
  scheduled_date?: string;
  scheduledTime?: string;
  scheduled_time?: string;
  duration?: number;
  meetingLink?: string;
  meeting_link?: string;
  status: string;
  type?: string;
  location?: string;
  notes?: string;
  agenda?: string;
  interviewers?: Array<{ name?: string; email?: string; role?: string }>;
  feedback?: Array<{
    interviewerName?: string;
    overallRating?: number;
    recommendation?: string;
    strengths?: string;
    concerns?: string;
  }>;
}

interface AssessmentData {
  id: string;
  assessmentType?: string;
  assessment_type?: string;
  provider?: string;
  status: string;
  invitedDate?: string;
  invited_date?: string;
  completedDate?: string;
  completed_date?: string;
  expiryDate?: string;
  expiry_date?: string;
  overallScore?: number;
  overall_score?: number;
  passed?: boolean;
  passThreshold?: number;
  pass_threshold?: number;
  result?: {
    score?: number;
    percentile?: number;
    status?: string;
    timeSpent?: number;
    details?: {
      categoryScores?: Record<string, number>;
      strengths?: string[];
      weaknesses?: string[];
    };
  };
}

interface ApplicationWithDetails extends Application {
  jobDetails?: JobDetails;
  interviews?: InterviewData[];
  assessments?: AssessmentData[];
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
      toast({ title: 'Failed to load applications', description: 'Please try again later', variant: 'destructive' });
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
        // Fetch application detail and form questions (authenticated)
        // Interviews & assessments are fetched with raw fetch to avoid 401 triggering logout
        const apiBase = import.meta.env.VITE_API_URL || '';
        const safeFetch = async (url: string) => {
          try {
            const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
            const res = await fetch(`${apiBase}${url}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              credentials: 'include',
            });
            if (!res.ok) return { success: false, data: null };
            const data = await res.json();
            return { success: true, data };
          } catch { return { success: false, data: null }; }
        };

        const [response, formResponse, interviewsRes, assessmentsRes] = await Promise.allSettled([
          applicationService.getApplication(app.id),
          jobService.getApplicationForm(app.jobId),
          safeFetch(`/api/applications/${app.id}/interviews`),
          safeFetch(`/api/assessments/application/${app.id}`),
        ]);

        // Build question label map from form
        let questionMap: Record<string, string> = {};
        if (formResponse.status === 'fulfilled' && formResponse.value.success && formResponse.value.data) {
          const formData = formResponse.value.data as any;
          const questions = formData?.form?.questions || formData?.questions || [];
          for (const q of questions) {
            if (q.id && q.label) questionMap[q.id] = q.label;
          }
        }

        // Extract interviews (safe - won't trigger logout on 401)
        let interviews: InterviewData[] = [];
        if (interviewsRes.status === 'fulfilled' && interviewsRes.value.success && interviewsRes.value.data) {
          const data = interviewsRes.value.data as any;
          interviews = data.interviews || data.data?.interviews || [];
          if (!Array.isArray(interviews)) interviews = [];
        }

        // Extract assessments (safe - won't trigger logout on 401)
        let assessments: AssessmentData[] = [];
        if (assessmentsRes.status === 'fulfilled' && assessmentsRes.value.success && assessmentsRes.value.data) {
          const data = assessmentsRes.value.data as any;
          assessments = data.assessments || data.data?.assessments || [];
          if (!Array.isArray(assessments)) assessments = [];
        }

        if (response.status === 'fulfilled' && response.value.data?.application) {
          const fullApp = response.value.data.application;
          // Also check if fullApp has interviews/assessments nested
          if ((fullApp as any).interviews && Array.isArray((fullApp as any).interviews)) {
            interviews = (fullApp as any).interviews;
          }

          // Enrich customAnswers with question labels
          const enrichedAnswers = (fullApp.customAnswers || app.customAnswers || []).map((ans: any) => ({
            ...ans,
            question: questionMap[ans.questionId] || ans.question || null,
          }));
          const updated: ApplicationWithDetails = {
            ...app,
            ...fullApp,
            customAnswers: enrichedAnswers,
            interviews: interviews.length > 0 ? interviews : app.interviews,
            assessments: assessments.length > 0 ? assessments : app.assessments,
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

  /* ── badge helpers ── */

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

  const getInterviewStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-primary/20 bg-primary/10 text-primary">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">Completed</Badge>;
      case 'CANCELLED':
      case 'CANCELED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-rose-200 bg-rose-50 text-rose-700">Cancelled</Badge>;
      case 'NO-SHOW':
      case 'NO_SHOW':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-amber-200 bg-amber-50 text-amber-700">No Show</Badge>;
      case 'IN_PROGRESS':
      case 'IN-PROGRESS':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-sky-200 bg-sky-50 text-sky-700">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full">{status}</Badge>;
    }
  };

  const getAssessmentStatusBadge = (status: string) => {
    const s = status?.toUpperCase();
    switch (s) {
      case 'INVITED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-primary/20 bg-primary/10 text-primary">Invited</Badge>;
      case 'IN-PROGRESS':
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-sky-200 bg-sky-50 text-sky-700">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-emerald-200 bg-emerald-50 text-emerald-700">Completed</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-amber-200 bg-amber-50 text-amber-700">Expired</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full border-rose-200 bg-rose-50 text-rose-700">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="h-5 px-1.5 text-[10px] rounded-full">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-rose-600';
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

  /* ── Pipeline Progress Component ── */
  const PipelineProgress = ({ status }: { status: string }) => {
    const isTerminal = ['REJECTED', 'WITHDRAWN'].includes(status);
    const currentIdx = getStageIndex(status);

    return (
      <div className="flex items-center gap-1 w-full">
        {PIPELINE_STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === currentIdx;
          const isCompleted = !isTerminal && idx < currentIdx;
          const isFuture = isTerminal || idx > currentIdx;

          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                  isActive && "bg-primary text-primary-foreground shadow-sm",
                  isCompleted && "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
                  isFuture && "bg-muted text-muted-foreground/40",
                )}>
                  {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={cn(
                  "text-[9px] font-medium uppercase tracking-wider text-center leading-tight",
                  isActive && "text-primary font-semibold",
                  isCompleted && "text-emerald-600 dark:text-emerald-400",
                  isFuture && "text-muted-foreground/40",
                )}>
                  {stage.label}
                </span>
              </div>
              {idx < PIPELINE_STAGES.length - 1 && (
                <div className={cn(
                  "h-[2px] w-4 flex-shrink-0 rounded-full mt-[-14px]",
                  isCompleted ? "bg-emerald-300 dark:bg-emerald-700" : "bg-border",
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <CandidatePageLayout>
      <div className="p-6 space-y-6">
        <AtsPageHeader
          title="My Applications"
          subtitle="Track your job applications, interviews, and assessments"
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
                <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
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

        {/* Stats summary */}
        {!isLoading && applications.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: 'Total', count: applications.length, color: 'text-foreground' },
              { label: 'Active', count: applications.filter(a => !['REJECTED', 'WITHDRAWN', 'HIRED'].includes(a.status)).length, color: 'text-primary' },
              { label: 'Screening', count: applications.filter(a => ['SCREENING', 'UNDER_REVIEW'].includes(a.status)).length, color: 'text-sky-600' },
              { label: 'Interview', count: applications.filter(a => ['INTERVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEWED'].includes(a.status)).length, color: 'text-amber-600' },
              { label: 'Offered', count: applications.filter(a => ['OFFER', 'OFFERED'].includes(a.status)).length, color: 'text-emerald-600' },
              { label: 'Hired', count: applications.filter(a => a.status === 'HIRED').length, color: 'text-emerald-600' },
              { label: 'Rejected', count: applications.filter(a => a.status === 'REJECTED').length, color: 'text-rose-600' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
                <p className={cn("text-xl font-bold mt-0.5", stat.color)}>{stat.count}</p>
              </div>
            ))}
          </div>
        )}

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
                              {app.shortlisted && (
                                <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0.5 border-violet-200 bg-violet-50 text-violet-700">
                                  <Star className="h-3 w-3 mr-1" />Shortlisted
                                </Badge>
                              )}
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
                              {app.score !== undefined && app.score !== null && (
                                <span className={cn("inline-flex items-center gap-1.5 font-medium", getScoreColor(app.score))}>
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  {app.score}% Match
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
                              {app.stage && app.stage !== app.status && (
                                <Badge variant="secondary" className="rounded-full text-[10px] px-2.5 py-0.5">
                                  {String(app.stage).replace(/_/g, ' ')}
                                </Badge>
                              )}
                              {app.tags && app.tags.length > 0 && app.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="rounded-full border border-dashed border-border/70 px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                              ))}
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

      {/* ── Application Detail Drawer (wide) ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
          {selectedApp && (
            <div className="flex flex-col h-full">
              {/* Drawer header */}
              <SheetHeader className="p-6 pb-4 border-b sticky top-0 bg-background z-10">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(selectedApp.status)}
                        <SheetTitle className="text-xl font-bold tracking-tight">
                          {selectedApp.jobDetails?.title || 'Application Details'}
                        </SheetTitle>
                      </div>
                      <SheetDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        {selectedApp.jobDetails?.company && (
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {selectedApp.jobDetails.company.name}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Applied {format(new Date(selectedApp.appliedDate), 'PPP')}
                        </span>
                        {selectedApp.jobDetails?.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {selectedApp.jobDetails.location}
                          </span>
                        )}
                      </SheetDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(selectedApp.status, 'md')}
                    </div>
                  </div>

                  {/* Pipeline progress bar */}
                  {!['REJECTED', 'WITHDRAWN'].includes(selectedApp.status) && (
                    <div className="pt-1">
                      <PipelineProgress status={selectedApp.status} />
                    </div>
                  )}
                  {selectedApp.status === 'REJECTED' && (
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <p className="text-sm text-rose-700 dark:text-rose-300">This application has been rejected.</p>
                    </div>
                  )}
                  {selectedApp.status === 'WITHDRAWN' && (
                    <div className="rounded-xl bg-muted/50 border border-border p-3 flex items-center gap-2">
                      <X className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm text-muted-foreground">You withdrew this application.</p>
                    </div>
                  )}
                </div>
              </SheetHeader>

              {loadingDetail ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-20 w-full rounded-2xl" />
                  <Skeleton className="h-32 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <Skeleton className="h-24 w-full rounded-2xl" />
                </div>
              ) : (
                <div className="p-6 space-y-6 flex-1">

                  {/* ── Scoring & Status metrics ── */}
                  {(selectedApp.score !== undefined && selectedApp.score !== null) || selectedApp.rank || selectedApp.shortlisted ? (
                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                      {selectedApp.score !== undefined && selectedApp.score !== null && (
                        <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Fit Score</p>
                          <p className={cn("text-2xl font-bold mt-1", getScoreColor(selectedApp.score))}>{selectedApp.score}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                        </div>
                      )}
                      {selectedApp.rank && (
                        <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Rank</p>
                          <p className="text-2xl font-bold mt-1 text-primary">#{selectedApp.rank}</p>
                        </div>
                      )}
                      {selectedApp.shortlisted && (
                        <div className="rounded-2xl border border-violet-200 dark:border-violet-900 bg-violet-50 dark:bg-violet-950/20 px-4 py-3 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">Shortlisted</p>
                          <Star className="h-6 w-6 text-violet-600 dark:text-violet-400 mx-auto mt-1 fill-violet-200 dark:fill-violet-900" />
                        </div>
                      )}
                      {selectedApp.stage && (
                        <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Stage</p>
                          <p className="text-sm font-semibold mt-1.5">{String(selectedApp.stage).replace(/_/g, ' ')}</p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Tags */}
                  {selectedApp.tags && selectedApp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.tags.map((tag, i) => (
                        <span key={i} className="rounded-full border border-dashed border-border/70 px-2.5 py-0.5 text-[10px] text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* ── Job Details ── */}
                  {selectedApp.jobDetails && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Job Details</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selectedApp.jobDetails.location && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Location</p>
                                <p className="text-sm font-semibold mt-0.5">{selectedApp.jobDetails.location}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedApp.jobDetails.employmentType && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Employment</p>
                                <p className="text-sm font-semibold mt-0.5">{formatEmploymentType(selectedApp.jobDetails.employmentType)}</p>
                                {selectedApp.jobDetails.workArrangement && (
                                  <p className="text-xs text-muted-foreground">{formatWorkArrangement(selectedApp.jobDetails.workArrangement)}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {(selectedApp.jobDetails.salaryMin || selectedApp.jobDetails.salaryMax) && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Salary</p>
                                <p className="text-sm font-semibold mt-0.5">
                                  {formatSalary(selectedApp.jobDetails.salaryMin, selectedApp.jobDetails.salaryMax, selectedApp.jobDetails.salaryCurrency)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedApp.jobDetails.department && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Department</p>
                                <p className="text-sm font-semibold mt-0.5">{selectedApp.jobDetails.department}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {(selectedApp.jobDetails.experienceLevel || selectedApp.jobDetails.experience_level) && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Experience</p>
                                <p className="text-sm font-semibold mt-0.5">{(selectedApp.jobDetails.experienceLevel || selectedApp.jobDetails.experience_level || '').replace(/_/g, ' ')}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {(selectedApp.jobDetails.numberOfVacancies || selectedApp.jobDetails.number_of_vacancies) && (selectedApp.jobDetails.numberOfVacancies || selectedApp.jobDetails.number_of_vacancies || 0) > 1 && (
                          <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Vacancies</p>
                                <p className="text-sm font-semibold mt-0.5">{selectedApp.jobDetails.numberOfVacancies || selectedApp.jobDetails.number_of_vacancies}</p>
                              </div>
                            </div>
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
                        View Full Job Posting
                      </Button>
                    </div>
                  )}

                  <Separator />

                  {/* ── Documents & Links ── */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Documents & Links</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selectedApp.resumeUrl ? (
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 hover:bg-muted/[0.1] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="text-sm font-medium">Resume</span>
                              <p className="text-[10px] text-muted-foreground">PDF Document</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                              const parts = selectedApp.resumeUrl!.split('/');
                              const fn = parts[parts.length - 1].split('?')[0] || 'resume.pdf';
                              setPreviewDocument({ url: selectedApp.resumeUrl!, name: fn, type: 'resume' });
                            }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                              const parts = selectedApp.resumeUrl!.split('/');
                              const fn = parts[parts.length - 1].split('?')[0] || 'resume.pdf';
                              handleDownloadFile(selectedApp.resumeUrl!, fn);
                            }}>
                              <Download className="h-3.5 w-3.5" />
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
                            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/30 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-teal-600" />
                            </div>
                            <div>
                              <span className="text-sm font-medium">Cover Letter</span>
                              <p className="text-[10px] text-muted-foreground">Document</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                              const parts = selectedApp.coverLetterUrl!.split('/');
                              const fn = parts[parts.length - 1].split('?')[0] || 'cover-letter.pdf';
                              setPreviewDocument({ url: selectedApp.coverLetterUrl!, name: fn, type: 'coverLetter' });
                            }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                              const parts = selectedApp.coverLetterUrl!.split('/');
                              const fn = parts[parts.length - 1].split('?')[0] || 'cover-letter.pdf';
                              handleDownloadFile(selectedApp.coverLetterUrl!, fn);
                            }}>
                              <Download className="h-3.5 w-3.5" />
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
                            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                              <LinkIcon className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium">Portfolio</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => safeOpenExternal(selectedApp.portfolioUrl)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {selectedApp.linkedInUrl && (
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 hover:bg-muted/[0.1] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/30 flex items-center justify-center">
                              <LinkIcon className="h-4 w-4 text-sky-600" />
                            </div>
                            <span className="text-sm font-medium">LinkedIn</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => safeOpenExternal(selectedApp.linkedInUrl)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {selectedApp.websiteUrl && (
                        <div className="flex items-center justify-between p-3 rounded-2xl border border-border/70 hover:bg-muted/[0.1] transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                              <Globe className="h-4 w-4 text-foreground/60" />
                            </div>
                            <span className="text-sm font-medium">Website</span>
                          </div>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => safeOpenExternal(selectedApp.websiteUrl)}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Interviews ── */}
                  {selectedApp.interviews && selectedApp.interviews.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Interviews ({selectedApp.interviews.length})
                          </p>
                        </div>
                        <div className="space-y-3">
                          {selectedApp.interviews.map((interview) => {
                            const scheduledDate = interview.scheduledDate || interview.scheduled_date;
                            const meetingLink = interview.meetingLink || interview.meeting_link;
                            const interviewType = interview.type || 'interview';

                            return (
                              <div key={interview.id} className="rounded-2xl border border-border/70 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {interviewType.toLowerCase().includes('video') || interviewType.toLowerCase().includes('virtual') ? (
                                      <Video className="h-4 w-4 text-primary" />
                                    ) : interviewType.toLowerCase().includes('phone') ? (
                                      <Phone className="h-4 w-4 text-primary" />
                                    ) : interviewType.toLowerCase().includes('panel') ? (
                                      <Users className="h-4 w-4 text-primary" />
                                    ) : (
                                      <Briefcase className="h-4 w-4 text-primary" />
                                    )}
                                    <span className="text-sm font-semibold capitalize">{interviewType.replace(/_/g, ' ').replace(/-/g, ' ')}</span>
                                    {getInterviewStatusBadge(interview.status)}
                                  </div>
                                  {interview.duration && (
                                    <span className="text-xs text-muted-foreground">{interview.duration} min</span>
                                  )}
                                </div>

                                {scheduledDate && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{format(new Date(scheduledDate), 'EEEE, MMMM d, yyyy')}</span>
                                    {interview.scheduledTime || interview.scheduled_time ? (
                                      <>
                                        <span className="text-muted-foreground">·</span>
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{interview.scheduledTime || interview.scheduled_time}</span>
                                      </>
                                    ) : null}
                                  </div>
                                )}

                                {interview.location && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    <span>{interview.location}</span>
                                  </div>
                                )}

                                {interview.interviewers && interview.interviewers.length > 0 && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{interview.interviewers.map(i => i.name || i.email).filter(Boolean).join(', ')}</span>
                                  </div>
                                )}

                                {interview.agenda && (
                                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-2.5">{interview.agenda}</p>
                                )}

                                {interview.notes && (
                                  <p className="text-xs text-muted-foreground">{interview.notes}</p>
                                )}

                                {meetingLink && interview.status?.toUpperCase() === 'SCHEDULED' && (
                                  <Button variant="default" size="sm" className="rounded-xl" onClick={() => safeOpenExternal(meetingLink)}>
                                    <Play className="h-3.5 w-3.5 mr-2" />Join Meeting
                                  </Button>
                                )}

                                {/* Interview feedback summary (if visible to candidate) */}
                                {interview.feedback && interview.feedback.length > 0 && (
                                  <div className="border-t border-border/50 pt-2 mt-2 space-y-1">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Feedback</p>
                                    {interview.feedback.map((fb, idx) => (
                                      <div key={idx} className="text-xs text-muted-foreground">
                                        {fb.interviewerName && <span className="font-medium text-foreground">{fb.interviewerName}: </span>}
                                        {fb.recommendation && (
                                          <Badge variant="outline" className={cn(
                                            "h-4 px-1 text-[9px] rounded-full mr-1",
                                            fb.recommendation.includes('yes') && "border-emerald-200 bg-emerald-50 text-emerald-700",
                                            fb.recommendation.includes('no') && "border-rose-200 bg-rose-50 text-rose-700",
                                            fb.recommendation === 'maybe' && "border-amber-200 bg-amber-50 text-amber-700",
                                          )}>{fb.recommendation.replace(/-/g, ' ')}</Badge>
                                        )}
                                        {fb.overallRating && <span>({fb.overallRating}/5)</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Assessments ── */}
                  {selectedApp.assessments && selectedApp.assessments.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">
                          Assessments ({selectedApp.assessments.length})
                        </p>
                        <div className="space-y-3">
                          {selectedApp.assessments.map((assessment) => {
                            const aType = assessment.assessmentType || assessment.assessment_type || 'Assessment';
                            const score = assessment.overallScore ?? assessment.overall_score ?? assessment.result?.score;
                            const completedDate = assessment.completedDate || assessment.completed_date;
                            const expiryDate = assessment.expiryDate || assessment.expiry_date;
                            const threshold = assessment.passThreshold ?? assessment.pass_threshold;

                            return (
                              <div key={assessment.id} className="rounded-2xl border border-border/70 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                      <ClipboardList className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold capitalize">{aType.replace(/_/g, ' ').replace(/-/g, ' ')}</p>
                                      {assessment.provider && (
                                        <p className="text-[10px] text-muted-foreground capitalize">{assessment.provider}</p>
                                      )}
                                    </div>
                                  </div>
                                  {getAssessmentStatusBadge(assessment.status)}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                  {score !== undefined && score !== null && (
                                    <div className="rounded-xl bg-muted/50 p-2 text-center">
                                      <p className="text-[10px] text-muted-foreground uppercase">Score</p>
                                      <p className={cn("text-lg font-bold", getScoreColor(score))}>{score}<span className="text-xs font-normal text-muted-foreground">/100</span></p>
                                      {assessment.passed !== undefined && (
                                        <Badge variant="outline" className={cn(
                                          "h-4 px-1 text-[9px] rounded-full mt-0.5",
                                          assessment.passed ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"
                                        )}>
                                          {assessment.passed ? 'Passed' : 'Failed'}
                                          {threshold ? ` (${threshold}%)` : ''}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  {completedDate && (
                                    <div className="rounded-xl bg-muted/50 p-2 text-center">
                                      <p className="text-[10px] text-muted-foreground uppercase">Completed</p>
                                      <p className="text-sm font-medium mt-0.5">{format(new Date(completedDate), 'MMM d, yyyy')}</p>
                                    </div>
                                  )}
                                  {expiryDate && assessment.status?.toUpperCase() === 'INVITED' && (
                                    <div className="rounded-xl bg-muted/50 p-2 text-center">
                                      <p className="text-[10px] text-muted-foreground uppercase">Expires</p>
                                      <p className="text-sm font-medium mt-0.5">{format(new Date(expiryDate), 'MMM d, yyyy')}</p>
                                    </div>
                                  )}
                                  {assessment.result?.timeSpent && (
                                    <div className="rounded-xl bg-muted/50 p-2 text-center">
                                      <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                                      <p className="text-sm font-medium mt-0.5">{assessment.result.timeSpent} min</p>
                                    </div>
                                  )}
                                </div>

                                {/* Category scores breakdown */}
                                {assessment.result?.details?.categoryScores && Object.keys(assessment.result.details.categoryScores).length > 0 && (
                                  <div className="border-t border-border/50 pt-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-2">Category Scores</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {Object.entries(assessment.result.details.categoryScores).map(([cat, catScore]) => (
                                        <div key={cat} className="flex items-center justify-between text-xs rounded-lg bg-muted/30 px-2 py-1.5">
                                          <span className="capitalize text-muted-foreground">{cat.replace(/_/g, ' ')}</span>
                                          <span className={cn("font-semibold", getScoreColor(catScore as number))}>{String(catScore)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Strengths/Weaknesses */}
                                {assessment.result?.details?.strengths && assessment.result.details.strengths.length > 0 && (
                                  <div className="text-xs space-y-1">
                                    <p className="font-medium text-emerald-600">Strengths:</p>
                                    <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                                      {assessment.result.details.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Screening Answers ── */}
                  {selectedApp.customAnswers && selectedApp.customAnswers.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Screening Answers</p>
                        <div className="space-y-2">
                          {selectedApp.customAnswers.map((ans: any, i: number) => (
                            <div key={ans.questionId || i} className="rounded-2xl border border-border/70 p-3 flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-xs font-medium text-foreground">{ans.question || `Question ${i + 1}`}</p>
                                <p className="text-sm text-muted-foreground">
                                  {Array.isArray(ans.answer) ? ans.answer.join(', ') : String(ans.answer)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Questionnaire Responses ── */}
                  {selectedApp.questionnaireData?.responses && selectedApp.questionnaireData.responses.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Questionnaire Responses</p>
                        <div className="space-y-2">
                          {selectedApp.questionnaireData.responses.map((resp: any, i: number) => (
                            <div key={resp.questionId || i} className="rounded-2xl border border-border/70 p-3 flex gap-3">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-xs font-medium text-foreground">{resp.question}</p>
                                <p className="text-sm text-muted-foreground">{resp.answer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Recruiter Notes ── */}
                  {selectedApp.recruiterNotes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Recruiter Notes</p>
                        <div className="rounded-2xl border border-border/70 bg-muted/[0.24] p-4">
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedApp.recruiterNotes}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Application Timeline ── */}
                  <Separator />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground mb-3">Timeline</p>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-[9px] before:top-1 before:bottom-1 before:w-[2px] before:bg-border">
                      {/* Applied */}
                      <div className="relative">
                        <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Application Submitted</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(selectedApp.appliedDate), 'PPP')} · {formatDistanceToNow(new Date(selectedApp.appliedDate), { addSuffix: true })}</p>
                        </div>
                      </div>
                      {/* Shortlisted */}
                      {selectedApp.shortlistedAt && (
                        <div className="relative">
                          <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-violet-100 dark:bg-violet-950/30 border-2 border-violet-500 flex items-center justify-center">
                            <Star className="h-2.5 w-2.5 text-violet-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Shortlisted</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(selectedApp.shortlistedAt), 'PPP')}</p>
                          </div>
                        </div>
                      )}
                      {/* Interviews */}
                      {selectedApp.interviews?.map((interview) => {
                        const d = interview.scheduledDate || interview.scheduled_date;
                        return (
                          <div key={interview.id} className="relative">
                            <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-amber-100 dark:bg-amber-950/30 border-2 border-amber-500 flex items-center justify-center">
                              <Video className="h-2.5 w-2.5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium capitalize">{(interview.type || 'Interview').replace(/_/g, ' ')} — {getInterviewStatusBadge(interview.status)}</p>
                              {d && <p className="text-xs text-muted-foreground">{format(new Date(d), 'PPP')}</p>}
                            </div>
                          </div>
                        );
                      })}
                      {/* Assessments */}
                      {selectedApp.assessments?.map((a) => {
                        const d = a.completedDate || a.completed_date || a.invitedDate || a.invited_date;
                        return (
                          <div key={a.id} className="relative">
                            <div className="absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full bg-sky-100 dark:bg-sky-950/30 border-2 border-sky-500 flex items-center justify-center">
                              <ClipboardList className="h-2.5 w-2.5 text-sky-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium capitalize">{(a.assessmentType || a.assessment_type || 'Assessment').replace(/_/g, ' ').replace(/-/g, ' ')} — {getAssessmentStatusBadge(a.status)}</p>
                              {d && <p className="text-xs text-muted-foreground">{format(new Date(d), 'PPP')}</p>}
                            </div>
                          </div>
                        );
                      })}
                      {/* Current status */}
                      {selectedApp.status !== 'NEW' && (
                        <div className="relative">
                          <div className={cn(
                            "absolute -left-6 top-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center",
                            selectedApp.status === 'HIRED' && "bg-emerald-100 dark:bg-emerald-950/30 border-emerald-500",
                            selectedApp.status === 'REJECTED' && "bg-rose-100 dark:bg-rose-950/30 border-rose-500",
                            selectedApp.status === 'WITHDRAWN' && "bg-muted border-muted-foreground",
                            !['HIRED', 'REJECTED', 'WITHDRAWN'].includes(selectedApp.status) && "bg-primary/10 border-primary",
                          )}>
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              selectedApp.status === 'HIRED' && "bg-emerald-500",
                              selectedApp.status === 'REJECTED' && "bg-rose-500",
                              selectedApp.status === 'WITHDRAWN' && "bg-muted-foreground",
                              !['HIRED', 'REJECTED', 'WITHDRAWN'].includes(selectedApp.status) && "bg-primary",
                            )} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Status: {selectedApp.status.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(selectedApp.updatedAt), 'PPP')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Actions ── */}
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
