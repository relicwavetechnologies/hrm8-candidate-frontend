/**
 * Job Application Page
 * Candidates can apply to a specific job here.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { jobService } from '@/shared/services/jobService';
import type { PublicJob } from '@/shared/services/jobService';
import { applicationService } from '@/shared/services/applicationService';
import { documentService } from '@/shared/services/documentService';
import { DocumentSelector } from '@/shared/components/documents/DocumentSelector';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Building2, MapPin, ArrowLeft } from 'lucide-react';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { apiClient } from '@/shared/services/api';

export default function JobApplicationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, candidate } = useCandidateAuth();

    const [job, setJob] = useState<PublicJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Document selection state
    const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<string | null>(null);
    const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
    const [portfolioFile, setPortfolioFile] = useState<File | null>(null);
    const [portfolioUrl, setPortfolioUrl] = useState<string>('');

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        linkedInUrl: '',
        websiteUrl: '',
    });

    useEffect(() => {
        if (id) {
            loadJob(id);
        }
    }, [id]);

    useEffect(() => {
        // Pre-fill form if authenticated
        if (isAuthenticated && candidate) {
            setFormData(prev => ({
                ...prev,
                firstName: candidate.firstName || '',
                lastName: candidate.lastName || '',
                email: candidate.email || '',
                phone: candidate.phone || '',
                linkedInUrl: candidate.linkedInUrl || '',
                websiteUrl: (candidate as any).websiteUrl || '',
            }));
        }
    }, [isAuthenticated, candidate]);

    const loadJob = async (jobId: string) => {
        setLoading(true);
        try {
            const response = await jobService.getPublicJobById(jobId);
            if (response.success && response.data) {
                setJob(response.data);
            } else {
                toast.error("Job not found");
                navigate('/jobs');
            }
        } catch (error) {
            console.error("Failed to load job:", error);
            toast.error("Failed to load job details");
            navigate('/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const uploadFile = async (file: File, type: 'resume' | 'cover_letter') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await apiClient.upload<{ url: string }>('/api/upload', formData);

        if (response.success && response.data?.url) {
            return response.data.url;
        }
        throw new Error('Upload failed');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job || !id) return;

        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!selectedResumeId && !resumeFile) {
            toast.error("Please select or upload a resume");
            return;
        }

        setSubmitting(true);

        // Guest Application Flow
        if (!isAuthenticated) {
            try {
                const response = await applicationService.submitGuestApplication({
                    jobId: id,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    resume: resumeFile!,
                    cover_letter: coverLetterFile || undefined,
                    portfolio: portfolioFile || undefined
                });

                if (response.success) {
                    toast.success("Application submitted successfully!");
                    toast.info("A candidate account has been created for you. Check your email for temporary login credentials.");
                    navigate('/login');
                } else {
                    throw new Error(response.error || "Submission failed");
                }
            } catch (error: any) {
                console.error("Guest application failed:", error);
                toast.error(error.message || "Failed to submit application");
            } finally {
                setSubmitting(false);
            }
            return;
        }

        // Authenticated Application Flow
        try {
            let resumeUrl: string | undefined;
            let coverLetterUrl: string | undefined;
            let portfolioUrlFinal: string | undefined;

            // Handle Resume
            if (resumeFile) {
                try {
                    resumeUrl = await uploadFile(resumeFile, 'resume');
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to upload resume. Please try again.");
                    setSubmitting(false);
                    return;
                }
            } else if (selectedResumeId) {
                const resumes = await documentService.getResumes();
                if (resumes.success && resumes.data) {
                    const selected = resumes.data.find(r => r.id === selectedResumeId);
                    if (selected) resumeUrl = selected.fileUrl;
                }
            }

            // Handle Cover Letter
            if (coverLetterFile) {
                try {
                    coverLetterUrl = await uploadFile(coverLetterFile, 'cover_letter');
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to upload cover letter. Proceeding without it.");
                }
            } else if (selectedCoverLetterId) {
                const coverLetters = await documentService.getCoverLetters();
                if (coverLetters.success && coverLetters.data) {
                    const selected = coverLetters.data.find(cl => cl.id === selectedCoverLetterId);
                    if (selected && selected.fileUrl) coverLetterUrl = selected.fileUrl;
                }
            }

            // Handle Portfolio
            if (portfolioFile) {
                try {
                    const formData = new FormData();
                    formData.append('file', portfolioFile);
                    formData.append('type', 'portfolio');
                    const response = await apiClient.upload<{ url: string }>('/api/upload', formData);
                    if (response.success && response.data?.url) {
                        portfolioUrlFinal = response.data.url;
                    }
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to upload portfolio. Proceeding without it.");
                }
            } else if (portfolioUrl) {
                portfolioUrlFinal = portfolioUrl;
            } else if (selectedPortfolioId) {
                const portfolios = await documentService.getPortfolios();
                if (portfolios.success && portfolios.data) {
                    const selected = portfolios.data.find(p => p.id === selectedPortfolioId);
                    if (selected) {
                        portfolioUrlFinal = selected.fileUrl || selected.externalUrl || undefined;
                    }
                }
            }

            const applicationData = {
                jobId: id,
                resumeUrl,
                coverLetterUrl,
                portfolioUrl: portfolioUrlFinal,
                linkedInUrl: formData.linkedInUrl,
                websiteUrl: formData.websiteUrl,
            };

            const response = await applicationService.submitApplication(applicationData);

            if (response.success) {
                toast.success("Application submitted successfully!");
                navigate('/candidate/applications');
            } else {
                throw new Error(response.error || "Submission failed");
            }
        } catch (error: any) {
            console.error("Application failed:", error);
            toast.error(error.message || "Failed to submit application");
        } finally {
            setSubmitting(false);
        }
    };

    const Layout = isAuthenticated ? CandidatePageLayout : PublicCandidatePageLayout;

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!job) return null;

    return (
        <Layout showSidebarTrigger={false}>
            <div className="container max-w-3xl py-10">
                <Button variant="ghost" className="mb-6" onClick={() => navigate(`/jobs/${id}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Details
                </Button>

                <div className="grid gap-6">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold">Apply for {job.title}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company?.name ?? 'Unknown Company'}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Enter your contact details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name *</Label>
                                    <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required disabled={isAuthenticated} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resume & Documents</CardTitle>
                            <CardDescription>Upload your resume and any supporting documents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isAuthenticated ? (
                                <>
                                    <DocumentSelector
                                        type="resume"
                                        required
                                        selectedId={selectedResumeId}
                                        onSelect={(id, file) => {
                                            setSelectedResumeId(id);
                                            if (file) setResumeFile(file);
                                        }}
                                    />

                                    <DocumentSelector
                                        type="cover-letter"
                                        selectedId={selectedCoverLetterId}
                                        onSelect={(id, file) => {
                                            setSelectedCoverLetterId(id);
                                            if (file) setCoverLetterFile(file);
                                        }}
                                        description="Optional, but recommended"
                                    />

                                    <DocumentSelector
                                        type="portfolio"
                                        selectedId={selectedPortfolioId}
                                        onSelect={(id, file, url) => {
                                            setSelectedPortfolioId(id);
                                            if (file) setPortfolioFile(file);
                                            if (url) setPortfolioUrl(url);
                                        }}
                                        description="Share your work samples or project links"
                                    />
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="resume-upload">Resume *</Label>
                                        <Input
                                            id="resume-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">PDF or Word document up to 5MB</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cl-upload">Cover Letter (Optional)</Label>
                                        <Input
                                            id="cl-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="portfolio-upload">Portfolio (Optional)</Label>
                                        <Input
                                            id="portfolio-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-sm">
                                        <p className="font-medium mb-1">Applying as a Guest</p>
                                        <p className="text-muted-foreground">An account will be created automatically for you using your email address so you can track your application status. Temporary login credentials will be sent to your email.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Links</CardTitle>
                            <CardDescription>Share your online presence (Optional).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="linkedInUrl">LinkedIn Profile URL</Label>
                                <Input id="linkedInUrl" name="linkedInUrl" value={formData.linkedInUrl} onChange={handleInputChange} placeholder="https://linkedin.com/in/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="websiteUrl">Personal Website</Label>
                                <Input id="websiteUrl" name="websiteUrl" value={formData.websiteUrl} onChange={handleInputChange} placeholder="https://..." />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button variant="outline" onClick={() => navigate(`/jobs/${id}`)} type="button">Cancel</Button>
                        <Button onClick={handleSubmit} disabled={submitting} className="min-w-[150px]">
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                                </>
                            ) : (
                                <>
                                    Submit Application <CheckCircle2 className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
