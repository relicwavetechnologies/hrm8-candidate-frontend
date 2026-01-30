/**
 * Candidate Application Detail Page
 * View a single submitted application
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { applicationService } from '@/shared/services/applicationService';
import type { Application } from '@/shared/services/applicationService';
import { CandidateAuthGuard } from '@/shared/components/auth/CandidateAuthGuard';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function ApplicationDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [application, setApplication] = useState<Application | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            try {
                const res = await applicationService.getApplication(id);
                setApplication(res.data?.application || null);
            } catch (e: any) {
                setError(e?.response?.data?.error || 'Unable to load application.');
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [id]);

    const renderStatus = (status: string) => {
        switch (status) {
            case 'NEW':
                return <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-primary/10 text-primary border-primary/20">New</Badge>;
            case 'SCREENING':
                return <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">Screening</Badge>;
            case 'INTERVIEW':
                return <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-warning/10 text-warning border-warning/20">Interview</Badge>;
            case 'OFFER':
                return <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-success/10 text-success border-success/20">Offer</Badge>;
            case 'HIRED':
                return <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-success/10 text-success border-success/20">Hired</Badge>;
            case 'REJECTED':
                return <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
            case 'WITHDRAWN':
                return <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">Withdrawn</Badge>;
            default:
                return <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">{status}</Badge>;
        }
    };

    const content = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            );
        }

        if (error || !application) {
            return (
                <div className="py-16 text-center space-y-4">
                    <p className="text-muted-foreground">
                        {error || 'Application not found or you do not have access.'}
                    </p>
                    <Button variant="outline" onClick={() => navigate('/candidate/applications')}>
                        Back to My Applications
                    </Button>
                </div>
            );
        }

        const createdAt = application.appliedDate || application.createdAt;
        const q = application.questionnaireData || {};

        return (
            <div className="space-y-6">
                <AtsPageHeader
                    title={`Application #${application.id.slice(0, 8)}`}
                    subtitle={`Applied ${createdAt ? format(new Date(createdAt), 'PPP p') : 'Unknown date'}`}
                >
                    <div className="flex items-center gap-2">
                        {renderStatus(application.status)}
                        {application.stage && (
                            <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">
                                {application.stage.replace(/_/g, ' ')}
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/candidate/applications')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </AtsPageHeader>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Job</CardTitle>
                        <CardDescription className="text-sm">
                            Job ID: <span className="font-mono">{application.jobId}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                        {q.jobMeta?.title && (
                            <p>
                                <span className="font-medium">Title:</span> {q.jobMeta.title}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Documents & Links</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                        <p>
                            <span className="font-medium">Resume:</span>{' '}
                            {application.resumeUrl ? 'Uploaded' : 'Not provided'}
                        </p>
                        <p>
                            <span className="font-medium">Cover Letter:</span>{' '}
                            {q.coverLetterMarkdown ? 'Provided' : 'Not provided'}
                        </p>
                        {application.portfolioUrl && (
                            <p>
                                <span className="font-medium">Portfolio:</span> Uploaded
                            </p>
                        )}
                        {application.linkedInUrl && (
                            <p>
                                <span className="font-medium">LinkedIn:</span>{' '}
                                <a
                                    href={application.linkedInUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline"
                                >
                                    {application.linkedInUrl}
                                </a>
                            </p>
                        )}
                        {application.websiteUrl && (
                            <p>
                                <span className="font-medium">Website:</span>{' '}
                                <a
                                    href={application.websiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary underline"
                                >
                                    {application.websiteUrl}
                                </a>
                            </p>
                        )}
                    </CardContent>
                </Card>

                {q.coverLetterMarkdown && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">Cover Letter</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-3 rounded-md">
                                {q.coverLetterMarkdown}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    return (
        <CandidateAuthGuard>
            <CandidatePageLayout>
                <div className="p-6 space-y-6">
                    {content()}
                </div>
            </CandidatePageLayout>
        </CandidateAuthGuard>
    );
}
