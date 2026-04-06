/**
 * Candidate Job Detail Page
 * Compact ATS-style job detail with rich data display
 */

import { useState, useEffect, useRef } from 'react';
import { safeOpenExternal } from '@/shared/lib/safeExternalLink';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { jobService } from '@/shared/services/jobService';
import type { PublicJob } from '@/shared/services/jobService';
import { apiClient } from '@/shared/services/api';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import {
  MapPin,
  Briefcase,
  Clock,
  Building2,
  ArrowLeft,
  Loader2,
  Heart,
  Globe,
  Monitor,
  GraduationCap,
  Users,
  Calendar,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/utils';
import { trackJobAnalytics } from '@/shared/services/analytics';

/* ── helpers ── */

function getEmploymentTypeVariant(type: string) {
  const normalized = type?.toLowerCase().replace(/_/g, '-');
  const map: Record<string, 'default' | 'purple' | 'orange' | 'teal'> = {
    'full-time': 'default', 'full_time': 'default',
    'part-time': 'purple', 'part_time': 'purple',
    'contract': 'orange',
    'casual': 'teal',
  };
  return map[normalized] || map[type] || 'neutral' as const;
}

function formatEmploymentType(type: string) {
  const map: Record<string, string> = {
    'FULL_TIME': 'Full-time', 'full-time': 'Full-time', 'full_time': 'Full-time',
    'PART_TIME': 'Part-time', 'part-time': 'Part-time', 'part_time': 'Part-time',
    'CONTRACT': 'Contract', 'contract': 'Contract',
    'CASUAL': 'Casual', 'casual': 'Casual',
  };
  return map[type] || type?.replace(/_/g, ' ') || 'N/A';
}

function formatWorkArrangement(type: string) {
  const map: Record<string, string> = {
    'ON_SITE': 'On-site', 'on-site': 'On-site', 'on_site': 'On-site',
    'REMOTE': 'Remote', 'remote': 'Remote',
    'HYBRID': 'Hybrid', 'hybrid': 'Hybrid',
  };
  return map[type] || type?.replace(/_/g, ' ') || 'N/A';
}

function formatExperienceLevel(level?: string) {
  if (!level) return null;
  const map: Record<string, string> = {
    'entry': 'Entry Level', 'mid': 'Mid Level', 'senior': 'Senior', 'executive': 'Executive',
  };
  return map[level.toLowerCase()] || level;
}

function formatSalary(job: PublicJob) {
  const min = job.salaryMin ?? job.salary_min;
  const max = job.salaryMax ?? job.salary_max;
  const currency = job.salaryCurrency || job.salary_currency || 'USD';
  const description = job.salaryDescription || job.salary_description;
  const period = job.salaryPeriod || job.salary_period;
  const hidden = job.hideSalary ?? job.hide_salary;

  if (hidden) return 'Competitive';
  if (!min && !max) return description || 'Salary not disclosed';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

  let range = '';
  if (min && max) range = `${formatter.format(min)} – ${formatter.format(max)}`;
  else if (min) range = `From ${formatter.format(min)}`;
  else if (max) range = `Up to ${formatter.format(max)}`;

  if (period) {
    const periodMap: Record<string, string> = {
      'hourly': 'per hour', 'daily': 'per day', 'weekly': 'per week', 'monthly': 'per month', 'annual': 'per year',
    };
    range += ` ${periodMap[period] || ''}`;
  }
  return range;
}

/* ── component ── */

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const invitationToken = new URLSearchParams(location.search).get('invitation') ?? undefined;
  const [job, setJob] = useState<PublicJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState<PublicJob[]>([]);
  const { isAuthenticated, candidate } = useCandidateAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const hasTrackedView = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      loadJob();
      loadRelatedJobs();
      if (isAuthenticated && candidate) {
        checkIfSaved();
      }
    }
  }, [id, isAuthenticated, candidate, invitationToken]);

  const loadJob = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await jobService.getPublicJobById(id, { invitation: invitationToken });
      const payload = response.data;
      const normalizedJob =
        payload && typeof payload === 'object' && 'job' in payload
          ? (payload as { job: PublicJob }).job
          : (payload as PublicJob | undefined);
      setJob(normalizedJob || null);

      if (normalizedJob && hasTrackedView.current !== id) {
        hasTrackedView.current = id;
        trackJobAnalytics(id, 'DETAIL_VIEW', isAuthenticated ? 'CANDIDATE_PORTAL' : 'HRM8_BOARD');
      }
    } catch (error) {
      console.error('Failed to load job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelatedJobs = async () => {
    if (!id) return;
    try {
      const response = await jobService.getRelatedJobs(id, 5);
      if (response.success && response.data?.jobs) {
        const filtered = response.data.jobs.filter(j => j.id !== id);
        setRelatedJobs(filtered);
      }
    } catch (error) {
      console.error('Failed to load related jobs:', error);
    }
  };

  const checkIfSaved = async () => {
    if (!id || !isAuthenticated) return;
    setIsCheckingSaved(true);
    try {
      const response = await apiClient.get('/api/candidate/saved-jobs');
      if (response.success && response.data) {
        const savedJobs = Array.isArray(response.data) ? response.data : [];
        const savedJobIds = savedJobs.map((item: { job?: { id: string }; jobId?: string }) => item.job?.id || item.jobId).filter(Boolean);
        setIsSaved(savedJobIds.includes(id));
      }
    } catch (error) {
      console.error('Failed to check if job is saved:', error);
    } finally {
      setIsCheckingSaved(false);
    }
  };

  const toggleSaveJob = async () => {
    if (!id || !isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save jobs",
        variant: "default",
      });
      navigate('/login', { state: { from: `/jobs/${id}` } });
      return;
    }

    try {
      if (isSaved) {
        await apiClient.delete(`/api/candidate/saved-jobs/${id}`);
        setIsSaved(false);
        toast({ title: "Job Removed", description: "Job removed from your saved jobs." });
      } else {
        await apiClient.post(`/api/candidate/saved-jobs/${id}`);
        setIsSaved(true);
        toast({ title: "Job Saved", description: "Job added to your saved jobs." });
      }
    } catch (error: any) {
      console.error('Failed to toggle save job:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.error || "Failed to update saved job status.",
        variant: "destructive",
      });
    }
  };

  const handleApply = () => {
    if (id) {
      trackJobAnalytics(id, 'APPLY_CLICK', isAuthenticated ? 'CANDIDATE_PORTAL' : 'HRM8_BOARD');
    }
    navigate(`/jobs/${id}/apply${location.search}`);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
          <p className="text-muted-foreground mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/jobs')}>Browse Jobs</Button>
        </div>
      </div>
    );
  }

  const Layout = isAuthenticated ? CandidatePageLayout : PublicCandidatePageLayout;

  const empType = job.employmentType || job.employment_type || '';
  const workArr = job.workArrangement || job.work_arrangement || '';
  const jobCode = job.jobCode || job.job_code;
  const expLevel = job.experienceLevel || job.experience_level;
  const vacancies = job.numberOfVacancies || job.number_of_vacancies || 1;
  const postedAt = job.postingDate || job.posting_date || job.createdAt || job.created_at;
  const expiresAt = job.expiryDate || job.expires_at;
  const closeDate = job.closeDate || job.close_date;
  const tags = job.promotionalTags || job.promotional_tags || [];
  const salaryPeriod = job.salaryPeriod || job.salary_period;
  const locationCity = job.jobLocation?.city;
  const locationState = job.jobLocation?.state;
  const locationCountry = job.jobLocation?.country;

  return (
    <Layout showSidebarTrigger={false}>
      <div className="p-4 md:p-6 space-y-5">
        {/* Back nav + actions */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/jobs')}
            size="sm"
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSaveJob}
                disabled={isCheckingSaved}
                title={isSaved ? "Remove from saved jobs" : "Save job"}
              >
                <Heart className={cn("h-4 w-4 mr-1.5", isSaved ? "fill-current text-red-500" : "")} />
                {isSaved ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        {/* Hero card - title, badges, key info */}
        <Card className="overflow-hidden rounded-3xl border-border/70">
          <CardContent className="p-5 md:p-6">
            <div className="space-y-4">
              {/* Title + code */}
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {job.title}
                    </h1>
                    {jobCode && (
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {jobCode}
                      </span>
                    )}
                    {job.featured && (
                      <Badge variant="default" className="shrink-0 text-[10px] px-2 py-0.5">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Subtitle row */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground/80">{job.company?.name ?? 'Unknown Company'}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                      {locationCity && locationState && (
                        <span className="text-muted-foreground/60">
                          ({locationCity}, {locationState}{locationCountry ? `, ${locationCountry}` : ''})
                        </span>
                      )}
                    </span>
                    {job.department && (
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.department}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Posted {postedAt
                        ? formatDistanceToNow(new Date(postedAt), { addSuffix: true })
                        : 'recently'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={getEmploymentTypeVariant(empType) as any}
                  className="rounded-full text-[10px] px-2.5 py-0.5"
                >
                  {formatEmploymentType(empType)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-[10px] px-2.5 py-0.5",
                    workArr.toUpperCase() === 'REMOTE' && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
                    workArr.toUpperCase() === 'HYBRID' && "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200"
                  )}
                >
                  {workArr.toUpperCase() === 'REMOTE' ? <Globe className="h-3 w-3 mr-1" /> :
                   workArr.toUpperCase() === 'HYBRID' ? <Monitor className="h-3 w-3 mr-1" /> :
                   <MapPin className="h-3 w-3 mr-1" />}
                  {formatWorkArrangement(workArr)}
                </Badge>
                {expLevel && (
                  <Badge variant="outline" className="rounded-full text-[10px] px-2.5 py-0.5 border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {formatExperienceLevel(expLevel)}
                  </Badge>
                )}
                {job.category && (
                  <Badge variant="secondary" className="rounded-full text-[10px] px-2.5 py-0.5">
                    {job.category}
                  </Badge>
                )}
                {vacancies > 1 && (
                  <Badge variant="outline" className="rounded-full text-[10px] px-2.5 py-0.5">
                    <Users className="h-3 w-3 mr-1" />
                    {vacancies} openings
                  </Badge>
                )}
                {tags.map((tag, idx) => (
                  <span key={idx} className="rounded-full border border-dashed border-border/70 px-2.5 py-0.5 text-[10px] text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Key metrics row */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Salary</p>
                  <p className="mt-1.5 text-base font-semibold tracking-tight text-foreground">{formatSalary(job)}</p>
                  {salaryPeriod && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{salaryPeriod} rate</p>
                  )}
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Employment</p>
                  <p className="mt-1.5 text-base font-semibold tracking-tight text-foreground">{formatEmploymentType(empType)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatWorkArrangement(workArr)}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Experience</p>
                  <p className="mt-1.5 text-base font-semibold tracking-tight text-foreground">
                    {formatExperienceLevel(expLevel) || 'All levels'}
                  </p>
                  {vacancies > 1 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{vacancies} positions available</p>
                  )}
                </div>
                <div className="rounded-2xl border border-border/70 bg-muted/[0.24] px-3 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Deadline</p>
                  <p className="mt-1.5 text-base font-semibold tracking-tight text-foreground">
                    {closeDate
                      ? format(new Date(closeDate), 'MMM d, yyyy')
                      : expiresAt
                        ? format(new Date(expiresAt), 'MMM d, yyyy')
                        : 'Open'}
                  </p>
                  {(closeDate || expiresAt) && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(closeDate || expiresAt!), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Job Summary */}
            {(job.jobSummary || job.job_summary) && (
              <Card className="rounded-3xl border-border/70">
                <CardContent className="p-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {job.jobSummary || job.job_summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Job Description */}
            <Card className="rounded-3xl border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none text-sm">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0 && (
              <Card className="rounded-3xl border-border/70">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Responsibilities */}
            {job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
              <Card className="rounded-3xl border-border/70">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Apply Card */}
            <Card className="rounded-3xl border-border/70 sticky top-4">
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Apply for this role
                  </p>
                  <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                    {formatSalary(job)}
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{formatEmploymentType(empType)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    {workArr.toUpperCase() === 'REMOTE' ? <Globe className="h-4 w-4 text-muted-foreground shrink-0" /> :
                     workArr.toUpperCase() === 'HYBRID' ? <Monitor className="h-4 w-4 text-muted-foreground shrink-0" /> :
                     <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span>{formatWorkArrangement(workArr)}</span>
                  </div>
                  {expLevel && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{formatExperienceLevel(expLevel)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{job.location}</span>
                  </div>
                  {job.department && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{job.department}</span>
                    </div>
                  )}
                  {vacancies > 1 && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{vacancies} positions available</span>
                    </div>
                  )}
                  {(closeDate || expiresAt) && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Closes {format(new Date(closeDate || expiresAt!), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <Button
                    onClick={handleApply}
                    className="w-full h-11 rounded-xl text-sm font-semibold"
                    size="lg"
                  >
                    Apply Now
                  </Button>
                  {isAuthenticated && (
                    <Button
                      variant={isSaved ? "outline" : "secondary"}
                      onClick={toggleSaveJob}
                      className="w-full h-10 rounded-xl text-sm"
                      disabled={isCheckingSaved}
                    >
                      <Heart className={cn("h-4 w-4 mr-2", isSaved ? "fill-current text-red-500" : "")} />
                      {isSaved ? "Saved" : "Save Job"}
                    </Button>
                  )}
                </div>
                {!isAuthenticated && (
                  <p className="text-xs text-center text-muted-foreground">
                    You can apply without an account - we'll create one for you during the application process
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card className="rounded-3xl border-border/70">
              <CardContent className="p-5 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  About the company
                </p>
                <div className="flex items-center gap-3">
                  {job.company?.logoUrl ? (
                    <img
                      src={job.company.logoUrl}
                      alt={job.company.name}
                      className="h-10 w-10 rounded-xl object-contain border border-border/50"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{job.company?.name ?? 'Unknown Company'}</p>
                    {job.company?.domain && (
                      <p className="text-xs text-muted-foreground">{job.company.domain}</p>
                    )}
                  </div>
                </div>
                {job.company?.aboutCompany && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                    {job.company.aboutCompany}
                  </p>
                )}
                {job.company?.website && (
                  <Button
                    variant="outline"
                    className="w-full h-9 rounded-xl text-xs"
                    onClick={() => safeOpenExternal(job.company?.website)}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Visit Website
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <Card className="rounded-3xl border-border/70">
                <CardContent className="p-5 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    More jobs at {job.company?.name ?? 'this company'}
                  </p>
                  <div className="space-y-2">
                    {relatedJobs.map((relatedJob) => {
                      const relEmpType = relatedJob.employmentType || relatedJob.employment_type || '';
                      return (
                        <Link
                          key={relatedJob.id}
                          to={`/jobs/${relatedJob.id}`}
                          className="block p-3 rounded-2xl border border-border/70 hover:border-primary/30 hover:bg-muted/[0.02] transition-all"
                        >
                          <p className="font-medium text-sm truncate">{relatedJob.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {relatedJob.location}
                            </span>
                            <Badge
                              variant={getEmploymentTypeVariant(relEmpType) as any}
                              className="rounded-full text-[9px] px-2 py-0"
                            >
                              {formatEmploymentType(relEmpType)}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
