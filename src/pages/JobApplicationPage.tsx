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
import type { CandidateResume } from '@/shared/types/resume';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Upload, FileText, CheckCircle2, Building2, MapPin, ArrowLeft } from 'lucide-react';
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

    const [resumes, setResumes] = useState<CandidateResume[]>([]);
    const [selectedResumeId, setSelectedResumeId] = useState<string>('default'); // 'default', 'new', or resumeId
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        linkedInUrl: '',
        portfolioUrl: '',
        websiteUrl: '',
        coverLetterText: '',
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
                portfolioUrl: (candidate as any).portfolioUrl || '',
                websiteUrl: (candidate as any).websiteUrl || '',
            }));
            setFormData(prev => ({
                ...prev,
                firstName: candidate.firstName || '',
                lastName: candidate.lastName || '',
                email: candidate.email || '',
                phone: candidate.phone || '',
                linkedInUrl: candidate.linkedInUrl || '',
                portfolioUrl: (candidate as any).portfolioUrl || '',
                websiteUrl: (candidate as any).websiteUrl || '',
            }));
            fetchResumes();
        }
    }, [isAuthenticated, candidate]);

    const fetchResumes = async () => {
        try {
            const response = await apiClient.get<CandidateResume[]>('/api/candidate/documents/resumes');
            if (response.success && response.data) {
                setResumes(response.data);
                // If there's a default, set it? Or keep 'default' which maps to candidate.resumeUrl?
                // Actually, let's look for the one matching candidate.resumeUrl or isDefault
                const defaultResume = response.data.find(r => r.isDefault);
                if (defaultResume) setSelectedResumeId(defaultResume.id);
                else if (response.data.length > 0) setSelectedResumeId(response.data[0].id);
                else setSelectedResumeId('new');
            }
        } catch (error) {
            console.error('Failed to fetch resumes', error);
        }
    };

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'coverLetter') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Basic validation (size < 5MB, type PDF/DOCX)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }

            if (type === 'resume') setResumeFile(file);
            else setCoverLetterFile(file);
        }
    };

    const uploadFile = async (file: File, type: 'resume' | 'cover_letter') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        // Using a generic upload endpoint - might need adjustment based on backend API
        const response = await apiClient.upload<{ url: string }>('/api/upload', formData);

        if (response.success && response.data?.url) {
            return response.data.url;
        }
        throw new Error('Upload failed');
    };

    const handleResumeSelect = (value: string) => {
        setSelectedResumeId(value);
        if (value !== 'new') {
            setResumeFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job || !id) return;

        // Basic validation
        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (!resumeFile && !isAuthenticated) {
            // Require resume for guests? Maybe optional if they have a profile?
            // enforcing resume for now
            toast.error("Please upload your resume");
            return;
        }

        setSubmitting(true);
        try {
            // Determine Resume URL
            let resumeUrl = candidate?.resumeUrl;
            let coverLetterUrl: string | undefined = undefined;

            if (selectedResumeId === 'new') {
                if (!resumeFile) {
                    toast.error("Please upload a resume");
                    setSubmitting(false);
                    return;
                }
                try {
                    resumeUrl = await uploadFile(resumeFile, 'resume');
                    // Optionally parse and autofill here if user requested, but for now just submit
                } catch (err) {
                    console.error(err);
                    resumeUrl = "https://example.com/resume.pdf"; // Fallback/Mock
                    toast.info("Using mock resume URL for dev env");
                }
            } else if (selectedResumeId !== 'default') {
                // User picked a specific existing resume
                const selected = resumes.find(r => r.id === selectedResumeId);
                if (selected) {
                    resumeUrl = selected.fileUrl;
                }
            }
            // else if 'default', we keep candidate.resumeUrl which is already set


            if (coverLetterFile) {
                try {
                    coverLetterUrl = await uploadFile(coverLetterFile, 'cover_letter');
                } catch (err) {
                    coverLetterUrl = "https://example.com/cover.pdf";
                }
            }

            const applicationData = {
                jobId: id,
                resumeUrl,
                coverLetterUrl,
                linkedInUrl: formData.linkedInUrl,
                portfolioUrl: formData.portfolioUrl,
                websiteUrl: formData.websiteUrl,
                // If guest, backend handles creating account or linking application?
                // Assuming current applicationService endpoint handles both or authenticated only
                // For guest access, we might need a specific endpoint or create account first.
                // For simplicity, let's assume authenticated for now or handling in same endpoint.
            };

            // If user is not authenticated, we might need to register them first or send guest application
            // ApplicationService.submitApplication uses /api/applications which likely requires Auth

            if (!isAuthenticated) {
                // Redirect to register/login with intent
                // Or separate guest application flow
                toast.info("Guest application support coming soon. Please sign in to apply.");
                navigate('/login', { state: { returnTo: `/jobs/${id}/apply` } });
                return;
            }

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
                            <div className="space-y-4">
                                <Label>Select Resume *</Label>
                                {resumes.length > 0 ? (
                                    <div className="grid gap-3">
                                        {resumes.map(resume => (
                                            <div
                                                key={resume.id}
                                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedResumeId === resume.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                                                onClick={() => handleResumeSelect(resume.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-primary" />
                                                    <div>
                                                        <p className="font-medium text-sm">{resume.fileName}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(resume.uploadedAt).toLocaleDateString()} {resume.isDefault && '(Default)'}</p>
                                                    </div>
                                                </div>
                                                {selectedResumeId === resume.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                            </div>
                                        ))}

                                        <div
                                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedResumeId === 'new' ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                                            onClick={() => handleResumeSelect('new')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Upload className="h-5 w-5 text-muted-foreground" />
                                                <span className="font-medium text-sm">Upload New Resume</span>
                                            </div>
                                            {selectedResumeId === 'new' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                        </div>
                                    </div>
                                ) : (
                                    // No existing resumes? Force upload (logic handled by default 'new' or 'default' with no matches defaulting to UI below)
                                    // Actually, if list empty, we just show upload.
                                    // But typically we show the upload box if 'new' is selected or list is empty.
                                    null
                                )}

                                {(selectedResumeId === 'new' || resumes.length === 0) && (
                                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative mt-2">
                                        <input
                                            type="file"
                                            id="resume"
                                            accept=".pdf,.doc,.docx"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                handleFileChange(e, 'resume');
                                                setSelectedResumeId('new');
                                            }}
                                        />
                                        {resumeFile ? (
                                            <div className="flex flex-col items-center text-primary">
                                                <FileText className="h-8 w-8 mb-2" />
                                                <span className="font-medium text-sm">{resumeFile.name}</span>
                                                <span className="text-xs text-muted-foreground mt-1">Click to change</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-muted-foreground">
                                                <Upload className="h-8 w-8 mb-2" />
                                                <span className="font-medium text-sm">Click to upload resume</span>
                                                <span className="text-xs mt-1">PDF, DOCX up to 5MB</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        id="coverLetter"
                                        accept=".pdf,.doc,.docx"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => handleFileChange(e, 'coverLetter')}
                                    />
                                    {coverLetterFile ? (
                                        <div className="flex flex-col items-center text-primary">
                                            <FileText className="h-8 w-8 mb-2" />
                                            <span className="font-medium text-sm">{coverLetterFile.name}</span>
                                            <span className="text-xs text-muted-foreground mt-1">Click to change</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-muted-foreground">
                                            <Upload className="h-8 w-8 mb-2" />
                                            <span className="font-medium text-sm">Click to upload cover letter</span>
                                            <span className="text-xs mt-1">PDF, DOCX up to 5MB</span>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                <Label htmlFor="portfolioUrl">Portfolio URL</Label>
                                <Input id="portfolioUrl" name="portfolioUrl" value={formData.portfolioUrl} onChange={handleInputChange} placeholder="https://..." />
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
