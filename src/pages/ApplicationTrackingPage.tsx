/**
 * Application Tracking Page
 * Detailed view of a single job application with status timeline
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Application } from '@/shared/services/applicationService';
import { apiClient } from '@/shared/services/api';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Skeleton } from '@/shared/components/ui/skeleton';
import {
    MapPin,
    Building2,
    CheckCircle2,
    Circle,
    Calendar,
    FileText,
    ArrowLeft,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface TimelineStep {
    id: string;
    title: string;
    status: 'completed' | 'current' | 'upcoming' | 'rejected' | 'withdrawn';
    date?: string;
    description?: string;
}

export default function ApplicationTrackingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState<Application | null>(null);
    const [job, setJob] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('timeline');
    const [interviews, setInterviews] = useState<any[]>([]);

    useEffect(() => {
        if (id) {
            loadApplicationDetails();
            const interval = setInterval(loadApplicationDetails, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [id]);

    const loadApplicationDetails = async () => {
        if (!id) return;
        try {
            // 1. Fetch Application
            const appResponse = await apiClient.get<Application>(`/api/applications/${id}`);
            if (!appResponse.success || !appResponse.data) {
                throw new Error('Application not found');
            }
            const appData = appResponse.data;
            setApplication(appData);

            // 2. Fetch Job Details
            if (appData.jobId) {
                const { jobService } = await import('@/shared/services/jobService');
                const jobResponse = await jobService.getPublicJobById(appData.jobId);
                if (jobResponse.success && jobResponse.data) {
                    setJob(jobResponse.data);
                }
            }

            // 3. Fetch Interviews
            try {
                const intResponse = await apiClient.get<{ interviews: any[] }>(`/api/video-interviews/application/${id}`);
                if (intResponse.success && intResponse.data?.interviews) {
                    setInterviews(intResponse.data.interviews);
                }
            } catch (e) {
                console.warn('Failed to fetch interviews', e);
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Failed to load details:', err);
            setError('Failed to load application details. It may not exist or moved.');
            setIsLoading(false);
        }
    };

    const getTimelineSteps = (): TimelineStep[] => {
        if (!application) return [];

        const steps: TimelineStep[] = [
            { id: 'NEW', title: 'Applied', status: 'completed', date: application.appliedDate, description: 'Application submitted' },
            { id: 'SCREENING', title: 'Screening', status: 'upcoming' },
            { id: 'INTERVIEW', title: 'Interview', status: 'upcoming' },
            { id: 'OFFER', title: 'Offer', status: 'upcoming' },
            { id: 'HIRED', title: 'Hired', status: 'upcoming' }
        ];

        const currentStatus = application.status;
        const statusMap = { 'NEW': 0, 'SCREENING': 1, 'INTERVIEW': 2, 'OFFER': 3, 'HIRED': 4 };

        // Handle Rejected/Withdrawn special cases
        if (currentStatus === 'REJECTED') {
            // Find where it stopped? Assuming we don't know exact stage of rejection without history, 
            // we'll just mark the current one as rejected or add a rejected step?
            // Simplification: Mark all steps up to current as completed, and the active as rejected.
            // But "REJECTED" is a status, not a stage in this map usually.
            // Let's iterate.
        }

        let currentIndex = statusMap[currentStatus as keyof typeof statusMap] ?? -1;

        // Adjust for specific statuses not in the main flow
        if (currentStatus === 'REJECTED') {
            // We show rejected at the end or replace current?
            // Let's just default to showing "Rejected" as a final state if applicable.
            // For visual simplicity, we'll mark everything before "Screening" as completed if rejected?
            // Better: Check 'stage'.
        }

        if (currentIndex !== -1) {
            steps.forEach((step, index) => {
                if (index < currentIndex) step.status = 'completed';
                else if (index === currentIndex) step.status = 'current';
                else step.status = 'upcoming';
            });
        } else {
            // Handle REJECTED or WITHDRAWN
            if (currentStatus === 'REJECTED') {
                steps.forEach(s => s.status = 'completed'); // Mark all previous as done? No.
                // Reset
                steps.forEach(s => s.status = 'upcoming');
                steps[0].status = 'completed'; // Applied is always done
                steps.push({ id: 'REJECTED', title: 'Rejected', status: 'rejected', description: 'Application was not selected' });
            } else if (currentStatus === 'WITHDRAWN') {
                steps.forEach(s => s.status = 'upcoming');
                steps[0].status = 'completed';
                steps.push({ id: 'WITHDRAWN', title: 'Withdrawn', status: 'withdrawn', description: 'You withdrew this application' });
            }
        }

        return steps;
    };

    const timelineSteps = getTimelineSteps();

    if (isLoading) {
        return (
            <CandidatePageLayout>
                <div className="p-6 space-y-6">
                    <Skeleton className="h-12 w-1/3" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </CandidatePageLayout>
        );
    }

    if (error || !application) {
        return (
            <CandidatePageLayout>
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
                        <h2 className="text-xl font-semibold">Application Not Found</h2>
                        <p className="text-muted-foreground">{error}</p>
                        <Button onClick={() => navigate('/candidate/dashboard')}>Back to Dashboard</Button>
                    </div>
                </div>
            </CandidatePageLayout>
        );
    }

    return (
        <CandidatePageLayout>
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <Button variant="ghost" size="sm" onClick={() => navigate('/candidate/applications')} className="mb-2 pl-0 hover:bg-transparent">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Applications
                </Button>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{job?.title || 'Job Application'}</h1>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            {job?.company?.name && (
                                <span className="flex items-center gap-1">
                                    <Building2 className="h-4 w-4" />
                                    {job.company.name}
                                </span>
                            )}
                            {job?.location && (
                                <span className="flex items-center gap-1 ml-2">
                                    <MapPin className="h-4 w-4" />
                                    {job.location}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {/* Action Buttons could go here like Withdraw */}
                        {/* <Button variant="outline">Withdraw Application</Button> */}
                    </div>
                </div>

                {/* Tracking Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Application Status</CardTitle>
                        <CardDescription>Targeting {job?.title}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative flex justify-between items-center w-full mt-4 mb-8 px-4">
                            {/* Horizontal Progress Bar Background */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-0 transform -translate-y-1/2 rounded-full" />

                            {/* Steps */}
                            {timelineSteps.map((step) => (
                                <div key={step.id} className="relative z-10 flex flex-col items-center group">
                                    <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                                ${step.status === 'completed' ? 'bg-primary border-primary text-primary-foreground' :
                                            step.status === 'current' ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20' :
                                                step.status === 'rejected' ? 'bg-destructive border-destructive text-destructive-foreground' :
                                                    step.status === 'withdrawn' ? 'bg-muted border-muted-foreground text-muted-foreground' :
                                                        'bg-background border-muted text-muted-foreground'}
                            `}>
                                        {step.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> :
                                            step.status === 'rejected' ? <XCircle className="h-5 w-5" /> :
                                                step.status === 'withdrawn' ? <XCircle className="h-5 w-5" /> :
                                                    <Circle className="h-4 w-4 fill-current" />
                                        }
                                    </div>
                                    <span className={`mt-2 text-xs font-medium ${step.status === 'current' ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {step.title}
                                    </span>
                                    {step.status === 'current' && (
                                        <Badge variant="secondary" className="absolute -bottom-8 text-[10px] whitespace-nowrap">Current Stage</Badge>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg border mt-8">
                            <h3 className="font-medium flex items-center gap-2 text-sm mb-2">
                                Latest Update
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {application.status === 'NEW' && "Your application has been received and is awaiting review."}
                                {application.status === 'SCREENING' && "Your application is currently being reviewed by the hiring team."}
                                {application.status === 'INTERVIEW' && "You have been selected for an interview! Check the Interviews tab for details."}
                                {application.status === 'OFFER' && "Congratulations! We have extended an offer."}
                                {application.status === 'HIRED' && "Welcome aboard! You have been hired."}
                                {application.status === 'REJECTED' && "Thank you for your interest. Unfortunately, we will not be proceeding with your application at this time."}
                                {application.status === 'WITHDRAWN' && "You have withdrawn this application."}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for Details */}
                <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="details">Information</TabsTrigger>
                        <TabsTrigger value="interviews">Interviews {interviews.length > 0 && `(${interviews.length})`}</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 pt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Job Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <h4 className="font-medium text-muted-foreground mb-1">Employment Type</h4>
                                        <p>{job?.employmentType?.replace('_', ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-muted-foreground mb-1">Work Arrangement</h4>
                                        <p>{job?.workArrangement?.replace('_', ' ') || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-muted-foreground mb-1">Salary Range</h4>
                                        <p>
                                            {job?.salaryMin && job?.salaryMax
                                                ? `${job.salaryCurrency} ${job.salaryMin} - ${job.salaryMax}`
                                                : 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-muted-foreground mb-1">Department</h4>
                                        <p>{job?.department || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="interviews" className="space-y-4 pt-4">
                        {interviews.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p>No interviews scheduled yet.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            interviews.map(int => (
                                <Card key={int.id}>
                                    <CardContent className="p-4 flex items-start justify-between">
                                        <div>
                                            <h4 className="font-medium">{int.type || 'Interview'}</h4>
                                            <p className="text-sm text-muted-foreground">{format(new Date(int.scheduledDate), 'PPP p')}</p>
                                            {int.meetingLink && (
                                                <a href={int.meetingLink} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline block mt-1">
                                                    Join Meeting
                                                </a>
                                            )}
                                        </div>
                                        <Badge>{int.status}</Badge>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4 pt-4">
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                {application.resumeUrl && (
                                    <div className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <span className="text-sm">Resume</span>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={application.resumeUrl} target="_blank" rel="noreferrer">View</a>
                                        </Button>
                                    </div>
                                )}
                                {application.coverLetterUrl && (
                                    <div className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-primary" />
                                            <span className="text-sm">Cover Letter</span>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={application.coverLetterUrl} target="_blank" rel="noreferrer">View</a>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </CandidatePageLayout>
    );
}
