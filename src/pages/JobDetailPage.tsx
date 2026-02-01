/**
 * Candidate Job Detail Page
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { jobService } from '@/shared/services/jobService';
import type { PublicJob } from '@/shared/services/jobService';
import { apiClient } from '@/shared/services/api';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { MapPin, Briefcase, Clock, DollarSign, Building2, ArrowLeft, Loader2, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import { useToast } from '@/shared/hooks/use-toast';
import { cn } from '@/shared/lib/utils';
import { trackJobAnalytics } from '@/shared/services/analytics';

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<PublicJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState<PublicJob[]>([]);
  const { isAuthenticated, candidate } = useCandidateAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Track if we've already tracked the view for this job
  const hasTrackedView = useRef<string | null>(null);

  useEffect(() => {
    if (id) {
      loadJob();
      loadRelatedJobs();
      if (isAuthenticated && candidate) {
        checkIfSaved();
      }
    }
  }, [id, isAuthenticated, candidate]);

  const loadJob = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await jobService.getPublicJobById(id);
      // Backend returns { success: true, data: { ...jobFields } }
      setJob(response.data || null);

      // Track detail view only once per job (prevent double tracking from StrictMode/re-renders)
      if (response.data && hasTrackedView.current !== id) {
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
        // Filter out current job from related jobs
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
      navigate('/candidate/login', { state: { from: `/jobs/${id}` } });
      return;
    }

    try {
      if (isSaved) {
        await apiClient.delete(`/api/candidate/saved-jobs/${id}`);
        setIsSaved(false);
        toast({
          title: "Job Removed",
          description: "Job removed from your saved jobs.",
        });
      } else {
        await apiClient.post(`/api/candidate/saved-jobs/${id}`);
        setIsSaved(true);
        toast({
          title: "Job Saved",
          description: "Job added to your saved jobs.",
        });
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
    // Track apply click
    if (id) {
      trackJobAnalytics(id, 'APPLY_CLICK', isAuthenticated ? 'CANDIDATE_PORTAL' : 'HRM8_BOARD');
    }

    // Allow unauthenticated users to apply (they'll create account during application)
    navigate(`/jobs/${id}/apply`);
  };

  const formatSalary = (job: PublicJob) => {
    if (!job.salaryMin && !job.salaryMax) {
      return job.salaryDescription || 'Salary not specified';
    }
    const min = job.salaryMin?.toLocaleString();
    const max = job.salaryMax?.toLocaleString();
    return `${job.salaryCurrency} ${min}${max ? ` - ${max}` : '+'}`;
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

  return (
    <Layout showSidebarTrigger={false}>
      <div className="p-6 space-y-6">
        <AtsPageHeader
          title={job.title}
          subtitle={`${job.company?.name ?? 'Unknown Company'} • ${job.location}`}
        >
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSaveJob}
                disabled={isCheckingSaved}
                title={isSaved ? "Remove from saved jobs" : "Save job"}
              >
                <Heart className={cn("h-4 w-4", isSaved ? "fill-current text-red-500" : "")} />
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => navigate('/jobs')}
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </AtsPageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardDescription className="flex items-center gap-4 flex-wrap mt-2">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {job.company?.name ?? 'Unknown Company'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.employmentType?.replace('_', ' ') ?? 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.postingDate
                          ? formatDistanceToNow(new Date(job.postingDate), { addSuffix: true })
                          : 'Recently'}
                      </span>
                    </CardDescription>
                  </div>
                  {job.featured && (
                    <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-primary/10 text-primary border-primary/20 ml-4">
                      Featured
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{job.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {job.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Responsibilities */}
            {job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2">
                    {job.responsibilities.map((resp, idx) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {job.promotionalTags && Array.isArray(job.promotionalTags) && job.promotionalTags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {job.promotionalTags.map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="h-6 px-2 text-xs rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Apply for this Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatSalary(job)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{job.employmentType?.replace('_', ' ') ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{job.workArrangement?.replace('_', ' ') ?? 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleApply}
                    className="w-full"
                    size="lg"
                  >
                    Apply Now
                  </Button>
                  {isAuthenticated && (
                    <Button
                      variant={isSaved ? "outline" : "secondary"}
                      onClick={toggleSaveJob}
                      className="w-full"
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
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">About {job.company?.name ?? 'Unknown Company'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn more about this company
                </p>
                {job.company?.website && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(job.company?.website, '_blank')}
                  >
                    Visit Website
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Other Jobs at {job.company?.name ?? 'Unknown Company'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedJobs.map((relatedJob) => (
                    <Link
                      key={relatedJob.id}
                      to={`/candidate/jobs/${relatedJob.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <p className="font-medium text-sm">{relatedJob.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3" />
                        {relatedJob.location}
                      </p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}