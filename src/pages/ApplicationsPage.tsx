/**
 * Applications Page
 * Enhanced application history with job details, documents, interviews, and actions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationService } from '@/shared/services/applicationService';
import type { Application } from '@/shared/services/applicationService';
import { apiClient } from '@/shared/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';

import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import {
  FileText,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  ExternalLink,
  Trash2,
  X,
  FileCheck,
  Video,
  Download,
  Link as LinkIcon,
  Building2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { Separator } from '@/shared/components/ui/separator';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface JobDetails {
  id: string;
  title: string;
  location?: string;
  employmentType?: string;
  workArrangement?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
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
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedApplications, setExpandedApplications] = useState<Set<string>>(new Set());
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<string | null>(null);
  const [loadingInterviews, setLoadingInterviews] = useState<Set<string>>(new Set());
  const [previewDocument, setPreviewDocument] = useState<{ url: string; name: string; type: 'resume' | 'coverLetter' } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const response = await applicationService.getCandidateApplications();
      const apps = response.data?.applications || [];

      console.log('Loaded applications:', apps);

      // Load job details for each application
      const appsWithDetails = await Promise.all(
        apps.map(async (app: any) => {
          const details: ApplicationWithDetails = {
            ...app,
            // Ensure date strings are properly formatted
            appliedDate: app.appliedDate || app.createdAt || new Date().toISOString(),
          };

          // Log document URLs for debugging
          console.log(`Application ${app.id} documents:`, {
            resumeUrl: app.resumeUrl,
            coverLetterUrl: app.coverLetterUrl,
            portfolioUrl: app.portfolioUrl,
            linkedInUrl: app.linkedInUrl,
            websiteUrl: app.websiteUrl,
          });

          // Map job details directly from application data (no need for separate API call)
          if (app.job) {
            details.jobDetails = {
              id: app.job.id,
              title: app.job.title,
              location: app.job.location,
              employmentType: app.job.employmentType || app.job.employment_type,
              workArrangement: app.job.workArrangement || app.job.work_arrangement,
              salaryMin: app.job.salaryMin || app.job.salary_min,
              salaryMax: app.job.salaryMax || app.job.salary_max,
              salaryCurrency: app.job.salaryCurrency || app.job.salary_currency,
              company: app.job.company ? {
                id: app.job.company.id,
                name: app.job.company.name,
              } : undefined,
            };
          }

          return details;
        })
      );

      setApplications(appsWithDetails);
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

  const loadInterviews = async (applicationId: string) => {
    if (loadingInterviews.has(applicationId)) return;

    setLoadingInterviews(prev => new Set(prev).add(applicationId));

    try {
      // Fetch interviews for this application
      const response = await apiClient.get<{ interviews: VideoInterview[] }>(
        `/api/video-interviews/application/${applicationId}`
      );

      if (response.success && response.data?.interviews) {
        setApplications(prev => prev.map(app =>
          app.id === applicationId
            ? { ...app, interviews: response.data!.interviews }
            : app
        ));
      }
    } catch (error) {
      console.error(`Failed to load interviews for ${applicationId}:`, error);
      // If endpoint doesn't exist, try alternative approach
      // We can fetch from video interviews by application ID if available
    } finally {
      setLoadingInterviews(prev => {
        const next = new Set(prev);
        next.delete(applicationId);
        return next;
      });
    }
  };

  const toggleApplication = (applicationId: string) => {
    setExpandedApplications(prev => {
      const next = new Set(prev);
      if (next.has(applicationId)) {
        next.delete(applicationId);
      } else {
        next.add(applicationId);
        // Load interviews when expanding
        const app = applications.find(a => a.id === applicationId);
        if (app && !app.interviews) {
          loadInterviews(applicationId);
        }
      }
      return next;
    });
  };

  const handleWithdraw = async (applicationId: string) => {
    try {
      const response = await applicationService.withdrawApplication(applicationId);
      if (response.success) {
        toast({
          title: 'Application withdrawn',
          description: 'Your application has been withdrawn successfully',
        });
        setWithdrawDialogOpen(null);
        loadApplications();
      } else {
        toast({
          title: 'Failed to withdraw application',
          description: response.error || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to withdraw application:', error);
      toast({
        title: 'Failed to withdraw application',
        description: 'Please try again later',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (applicationId: string) => {
    try {
      // First, withdraw the application if it's not already withdrawn
      const app = applications.find(a => a.id === applicationId);
      if (app && app.status !== 'WITHDRAWN' && app.status !== 'REJECTED') {
        try {
          await applicationService.withdrawApplication(applicationId);
        } catch (withdrawError) {
          console.error('Failed to withdraw before delete:', withdrawError);
          // Continue with delete even if withdraw fails
        }
      }

      // Then delete the application
      const response = await apiClient.delete(`/api/applications/${applicationId}`);
      if (response.success) {
        toast({
          title: 'Application deleted',
          description: 'Your application has been withdrawn and deleted successfully',
        });
        setDeleteDialogOpen(null);
        loadApplications();
      } else {
        toast({
          title: 'Failed to delete application',
          description: response.error || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete application:', error);
      toast({
        title: 'Failed to delete application',
        description: 'Please try again later',
        variant: 'destructive',
      });
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
      case 'WITHDRAWN':
        return (
          <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">
            Withdrawn
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

  const getInterviewStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline" className="h-5 px-1.5 text-xs rounded-full bg-primary/10 text-primary border-primary/20">Scheduled</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="h-5 px-1.5 text-xs rounded-full bg-success/10 text-success border-success/20">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline" className="h-5 px-1.5 text-xs rounded-full bg-destructive/10 text-destructive border-destructive/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="h-5 px-1.5 text-xs rounded-full">{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter((app) => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.id.toLowerCase().includes(query) ||
      app.jobId.toLowerCase().includes(query) ||
      app.jobDetails?.title.toLowerCase().includes(query) ||
      app.jobDetails?.company?.name.toLowerCase().includes(query)
    );
  });

  const canWithdraw = (status: string) => {
    return !['WITHDRAWN', 'REJECTED', 'HIRED'].includes(status);
  };

  const canDelete = (status: string) => {
    // Allow deletion for all statuses except HIRED
    return status !== 'HIRED';
  };

  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      // Fetch the file as a blob to handle cross-origin URLs
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      const blob = await response.blob();

      // Create a blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast({
        title: 'Download started',
        description: 'Your file is being downloaded',
      });
    } catch (error) {
      console.error('Failed to download file:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download the file. Please try again.',
        variant: 'destructive',
      });
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

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
                  {filteredApplications.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate('/jobs')}
                  >
                    Browse Jobs
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((app) => {
                  const isExpanded = expandedApplications.has(app.id);
                  const hasInterviews = app.interviews && app.interviews.length > 0;

                  return (
                    <Card key={app.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold">
                                {app.jobDetails?.title || 'Loading job details...'}
                              </h3>
                              {getStatusBadge(app.status)}
                              {app.isNew && (
                                <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-primary/10 text-primary border-primary/20">
                                  New
                                </Badge>
                              )}
                            </div>

                            {app.jobDetails?.company && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                                {app.jobDetails.company.name}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Applied {formatDistanceToNow(new Date(app.appliedDate), { addSuffix: true })}
                              </span>
                              {app.jobDetails?.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {app.jobDetails.location}
                                </span>
                              )}
                              {app.jobDetails?.employmentType && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3.5 w-3.5" />
                                  {app.jobDetails.employmentType}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleApplication(app.id)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-2" />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                  View Details
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <>
                          <Separator />
                          <div className="p-4 space-y-6">
                            {/* Job Details */}
                            {app.jobDetails && (
                              <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  Job Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                  {app.jobDetails.location && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <MapPin className="h-4 w-4" />
                                      <span>{app.jobDetails.location}</span>
                                    </div>
                                  )}
                                  {app.jobDetails.employmentType && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Briefcase className="h-4 w-4" />
                                      <span>{app.jobDetails.employmentType}</span>
                                    </div>
                                  )}
                                  {app.jobDetails.workArrangement && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Clock className="h-4 w-4" />
                                      <span>{app.jobDetails.workArrangement}</span>
                                    </div>
                                  )}
                                  {(app.jobDetails.salaryMin || app.jobDetails.salaryMax) && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <DollarSign className="h-4 w-4" />
                                      <span>
                                        {app.jobDetails.salaryMin && app.jobDetails.salaryMax
                                          ? `${app.jobDetails.salaryCurrency || ''} ${app.jobDetails.salaryMin} - ${app.jobDetails.salaryMax}`
                                          : app.jobDetails.salaryMin
                                            ? `${app.jobDetails.salaryCurrency || ''} ${app.jobDetails.salaryMin}+`
                                            : `${app.jobDetails.salaryCurrency || ''} Up to ${app.jobDetails.salaryMax}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3"
                                  onClick={() => navigate(`/jobs/${app.jobId}`)}
                                >
                                  <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                  View Job Posting
                                </Button>
                              </div>
                            )}

                            {/* Documents Used */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <FileCheck className="h-4 w-4" />
                                Documents Used
                              </h4>
                              <div className="space-y-2">
                                {app.resumeUrl ? (
                                  <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm truncate">Resume</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const urlParts = app.resumeUrl!.split('/');
                                          const filename = urlParts[urlParts.length - 1].split('?')[0] || 'resume.pdf';
                                          setPreviewDocument({ url: app.resumeUrl!, name: filename, type: 'resume' });
                                        }}
                                      >
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        Preview
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const urlParts = app.resumeUrl!.split('/');
                                          const filename = urlParts[urlParts.length - 1].split('?')[0] || 'resume.pdf';
                                          handleDownloadFile(app.resumeUrl!, filename);
                                        }}
                                      >
                                        <Download className="h-3.5 w-3.5 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No resume attached</p>
                                )}

                                {app.coverLetterUrl ? (
                                  <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm truncate">Cover Letter</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const urlParts = app.coverLetterUrl!.split('/');
                                          const filename = urlParts[urlParts.length - 1].split('?')[0] || 'cover-letter.pdf';
                                          setPreviewDocument({ url: app.coverLetterUrl!, name: filename, type: 'coverLetter' });
                                        }}
                                      >
                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                        Preview
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const urlParts = app.coverLetterUrl!.split('/');
                                          const filename = urlParts[urlParts.length - 1].split('?')[0] || 'cover-letter.pdf';
                                          handleDownloadFile(app.coverLetterUrl!, filename);
                                        }}
                                      >
                                        <Download className="h-3.5 w-3.5 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No cover letter attached</p>
                                )}

                                {app.portfolioUrl ? (
                                  <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <a
                                        href={app.portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline truncate"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!app.portfolioUrl?.startsWith('http')) {
                                            e.preventDefault();
                                            toast({
                                              title: 'Invalid URL',
                                              description: 'This portfolio link is not valid',
                                              variant: 'destructive',
                                            });
                                          }
                                        }}
                                      >
                                        Portfolio Link
                                      </a>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (app.portfolioUrl?.startsWith('http')) {
                                          window.open(app.portfolioUrl, '_blank', 'noopener,noreferrer');
                                        } else {
                                          toast({
                                            title: 'Invalid URL',
                                            description: 'This portfolio link is not valid',
                                            variant: 'destructive',
                                          });
                                        }
                                      }}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                      Open
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No portfolio attached</p>
                                )}

                                {app.linkedInUrl && (
                                  <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <a
                                        href={app.linkedInUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline truncate"
                                      >
                                        LinkedIn Profile
                                      </a>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(app.linkedInUrl, '_blank', 'noopener,noreferrer');
                                      }}
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                      Open
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Interviews */}
                            <div>
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                Interviews
                              </h4>
                              {loadingInterviews.has(app.id) ? (
                                <div className="space-y-2">
                                  <Skeleton className="h-16 w-full" />
                                  <Skeleton className="h-16 w-full" />
                                </div>
                              ) : hasInterviews ? (
                                <div className="space-y-2">
                                  {app.interviews!.map((interview) => (
                                    <Card key={interview.id} className="p-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-1">
                                          <div className="flex items-center gap-2">
                                            {getInterviewStatusBadge(interview.status)}
                                            <span className="text-xs text-muted-foreground">
                                              {interview.type}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>
                                              {format(new Date(interview.scheduledDate), 'PPP p')}
                                            </span>
                                            <span className="text-muted-foreground">•</span>
                                            <span className="text-muted-foreground">
                                              {interview.duration} minutes
                                            </span>
                                          </div>
                                          {interview.meetingLink && (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="mt-2"
                                              onClick={() => window.open(interview.meetingLink, '_blank')}
                                            >
                                              <Video className="h-3.5 w-3.5 mr-2" />
                                              Join Meeting
                                            </Button>
                                          )}
                                          {interview.notes && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                              {interview.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  No interviews scheduled yet
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t">
                              {canWithdraw(app.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setWithdrawDialogOpen(app.id)}
                                >
                                  <X className="h-3.5 w-3.5 mr-2" />
                                  Withdraw Application
                                </Button>
                              )}
                              {canDelete(app.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => setDeleteDialogOpen(app.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Delete Application
                                </Button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen !== null} onOpenChange={(open) => !open && setWithdrawDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to withdraw this application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawDialogOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => withdrawDialogOpen && handleWithdraw(withdrawDialogOpen)}
            >
              Withdraw Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen !== null} onOpenChange={(open) => !open && setDeleteDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application? This will automatically withdraw the application (if not already withdrawn) and then delete it. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialogOpen && handleDelete(deleteDialogOpen)}
            >
              Delete Application
            </Button>
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
                  <iframe
                    src={previewDocument.url}
                    className="w-full h-full min-h-[600px]"
                    title={previewDocument.name}
                  />
                ) : /\.(jpg|jpeg|png|gif|webp)$/i.test(previewDocument.url) ? (
                  <img
                    src={previewDocument.url}
                    alt={previewDocument.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-center p-8">
                    <div>
                      <p className="text-muted-foreground mb-4">
                        Preview not available for this file type
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => {
                            const urlParts = previewDocument.url.split('/');
                            const filename = urlParts[urlParts.length - 1].split('?')[0] || 'document';
                            handleDownloadFile(previewDocument.url, filename);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download to View
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            {previewDocument && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => {
                    const urlParts = previewDocument.url.split('/');
                    const filename = urlParts[urlParts.length - 1].split('?')[0] || 'document';
                    handleDownloadFile(previewDocument.url, filename);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setPreviewDocument(null)}>
                  Close
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CandidatePageLayout>
  );
}
