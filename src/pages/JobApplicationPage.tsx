/**
 * Job Application Page
 * Candidates can apply to a specific job here.
 * Fetches and renders custom screening questions from the application form config.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { jobService } from '@/shared/services/jobService';
import type { PublicJob } from '@/shared/services/jobService';
import { applicationService } from '@/shared/services/applicationService';
import { documentService } from '@/shared/services/documentService';
import { DocumentSelector } from '@/shared/components/documents/DocumentSelector';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, Building2, MapPin, ArrowLeft } from 'lucide-react';
import { PublicCandidatePageLayout } from '@/shared/components/layouts/PublicCandidatePageLayout';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { apiClient } from '@/shared/services/api';
import type { ApplicationQuestion } from '@/shared/types/applicationForm';

interface ApplicationFormData {
    jobId: string;
    jobTitle: string;
    questions: ApplicationQuestion[];
    requireResume: boolean;
    requireCoverLetter: boolean;
    requirePortfolio: boolean;
}

export default function JobApplicationPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const invitationToken = new URLSearchParams(location.search).get('invitation') ?? undefined;
    const { isAuthenticated, candidate } = useCandidateAuth();

    const [job, setJob] = useState<PublicJob | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Application form config
    const [appFormConfig, setAppFormConfig] = useState<ApplicationFormData | null>(null);
    const [customAnswers, setCustomAnswers] = useState<Record<string, string | string[]>>({});
    const [fileAnswers, setFileAnswers] = useState<Record<string, File>>({});

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

    const jobTargetAttribution = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const rawQuery: Record<string, string> = {};
        params.forEach((value, key) => {
            if (value) rawQuery[key] = value;
        });

        const applicantGuid = rawQuery.applicant_guid || '';
        const source = rawQuery.source || '';
        const medium = rawQuery.utm_medium || '';
        const campaign = rawQuery.utm_campaign || '';

        if (!applicantGuid && !source && !medium && !campaign && Object.keys(rawQuery).length === 0) {
            return undefined;
        }

        return {
            applicantGuid: applicantGuid || undefined,
            source: source || undefined,
            medium: medium || undefined,
            campaign: campaign || undefined,
            rawQuery,
        };
    }, [location.search]);

    useEffect(() => {
        if (id) {
            loadJob(id);
            loadApplicationForm(id);
        }
    }, [id, invitationToken]);

    useEffect(() => {
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
            const response = await jobService.getPublicJobById(jobId, { invitation: invitationToken });
            const payload = response.data;
            const normalizedJob =
                payload && typeof payload === 'object' && 'job' in payload
                    ? (payload as { job: PublicJob }).job
                    : (payload as PublicJob | undefined);
            if (response.success && normalizedJob) {
                setJob(normalizedJob);
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

    const loadApplicationForm = async (jobId: string) => {
        try {
            const response = await jobService.getApplicationForm(jobId);
            if (response.success && response.data) {
                const data = response.data as any;
                // Backend returns { form: { jobId, jobTitle, questions, requireResume, ... } }
                // jobService.getApplicationForm unwraps `form` if present
                const formData: ApplicationFormData = {
                    jobId: data.jobId || jobId,
                    jobTitle: data.jobTitle || '',
                    questions: Array.isArray(data.questions) ? data.questions : [],
                    requireResume: data.requireResume !== false,
                    requireCoverLetter: data.requireCoverLetter === true,
                    requirePortfolio: data.requirePortfolio === true,
                };
                setAppFormConfig(formData);
            }
        } catch (error) {
            console.error("Failed to load application form:", error);
            // Non-critical - form will work without custom questions
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const updateAnswer = (questionId: string, value: string | string[]) => {
        setCustomAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const toggleCheckboxAnswer = (questionId: string, optionValue: string) => {
        setCustomAnswers(prev => {
            const current = Array.isArray(prev[questionId]) ? prev[questionId] as string[] : [];
            const updated = current.includes(optionValue)
                ? current.filter(v => v !== optionValue)
                : [...current, optionValue];
            return { ...prev, [questionId]: updated };
        });
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

    const sortedQuestions = useMemo(() => {
        if (!appFormConfig?.questions?.length) return [];
        return [...appFormConfig.questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [appFormConfig]);

    const validateCustomAnswers = (): boolean => {
        for (const q of sortedQuestions) {
            if (!q.required) continue;
            const answer = customAnswers[q.id];

            if (q.type === 'file_upload') {
                if (!fileAnswers[q.id]) {
                    toast.error(`Please upload a file for "${q.label}"`);
                    return false;
                }
                continue;
            }

            if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && !answer.trim())) {
                toast.error(`Please answer the required question: "${q.label}"`);
                return false;
            }

            // Validation rules
            if (q.validation) {
                if (typeof answer === 'string') {
                    if (q.validation.minLength && answer.length < q.validation.minLength) {
                        toast.error(`"${q.label}" requires at least ${q.validation.minLength} characters`);
                        return false;
                    }
                    if (q.validation.maxLength && answer.length > q.validation.maxLength) {
                        toast.error(`"${q.label}" cannot exceed ${q.validation.maxLength} characters`);
                        return false;
                    }
                }
                if (q.type === 'number' && typeof answer === 'string') {
                    const num = parseFloat(answer);
                    if (q.validation.minValue !== undefined && num < q.validation.minValue) {
                        toast.error(`"${q.label}" must be at least ${q.validation.minValue}`);
                        return false;
                    }
                    if (q.validation.maxValue !== undefined && num > q.validation.maxValue) {
                        toast.error(`"${q.label}" cannot exceed ${q.validation.maxValue}`);
                        return false;
                    }
                }
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job || !id) return;

        if (!formData.firstName || !formData.lastName || !formData.email) {
            toast.error("Please fill in all required fields");
            return;
        }

        const requireResume = appFormConfig?.requireResume !== false;
        if (requireResume && !selectedResumeId && !resumeFile) {
            toast.error("Please select or upload a resume");
            return;
        }

        if (appFormConfig?.requireCoverLetter && !selectedCoverLetterId && !coverLetterFile) {
            toast.error("Please provide a cover letter");
            return;
        }

        if (appFormConfig?.requirePortfolio && !selectedPortfolioId && !portfolioFile && !portfolioUrl) {
            toast.error("Please provide a portfolio");
            return;
        }

        if (!validateCustomAnswers()) return;

        setSubmitting(true);

        // Build custom answers array for submission
        const answersPayload = sortedQuestions
            .filter(q => customAnswers[q.id] !== undefined)
            .map(q => ({
                questionId: q.id,
                answer: customAnswers[q.id],
            }));

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
                    portfolio: portfolioFile || undefined,
                    invitationToken,
                    jobTargetAttribution,
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

            if (portfolioFile) {
                try {
                    const fd = new FormData();
                    fd.append('file', portfolioFile);
                    fd.append('type', 'portfolio');
                    const response = await apiClient.upload<{ url: string }>('/api/upload', fd);
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
                invitationToken,
                jobTargetAttribution,
                applicationSource: 'CANDIDATE_PORTAL' as const,
                customAnswers: answersPayload.length > 0 ? answersPayload : undefined,
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

    const requireResume = appFormConfig?.requireResume !== false;
    const requireCoverLetter = appFormConfig?.requireCoverLetter === true;
    const requirePortfolio = appFormConfig?.requirePortfolio === true;

    return (
        <Layout showSidebarTrigger={false}>
            <div className="container max-w-3xl py-10">
                <Button variant="ghost" className="mb-6" onClick={() => navigate(`/jobs/${id}${location.search}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Details
                </Button>

                <div className="grid gap-6">
                    <div className="space-y-1">
                        <h1 className="text-lg font-bold">Apply for {job.title}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {job.company?.name ?? 'Unknown Company'}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                            <CardDescription>Review the role details before you submit.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm leading-6 whitespace-pre-wrap">{job.description}</div>
                            {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Requirements</p>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                        {job.requirements.map((requirement, index) => (
                                            <li key={`${index}-${requirement}`}>{requirement}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

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
                                        required={requireResume}
                                        selectedId={selectedResumeId}
                                        onSelect={(id, file) => {
                                            setSelectedResumeId(id);
                                            if (file) setResumeFile(file);
                                        }}
                                    />

                                    <DocumentSelector
                                        type="cover-letter"
                                        required={requireCoverLetter}
                                        selectedId={selectedCoverLetterId}
                                        onSelect={(id, file) => {
                                            setSelectedCoverLetterId(id);
                                            if (file) setCoverLetterFile(file);
                                        }}
                                        description={requireCoverLetter ? "Required for this position" : "Optional, but recommended"}
                                    />

                                    <DocumentSelector
                                        type="portfolio"
                                        required={requirePortfolio}
                                        selectedId={selectedPortfolioId}
                                        onSelect={(id, file, url) => {
                                            setSelectedPortfolioId(id);
                                            if (file) setPortfolioFile(file);
                                            if (url) setPortfolioUrl(url);
                                        }}
                                        description={requirePortfolio ? "Required for this position" : "Share your work samples or project links"}
                                    />
                                </>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="resume-upload">
                                            Resume {requireResume && <span className="text-destructive">*</span>}
                                        </Label>
                                        <Input
                                            id="resume-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                            required={requireResume}
                                        />
                                        <p className="text-xs text-muted-foreground">PDF or Word document up to 5MB</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cl-upload">
                                            Cover Letter {requireCoverLetter ? <span className="text-destructive">*</span> : '(Optional)'}
                                        </Label>
                                        <Input
                                            id="cl-upload"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => setCoverLetterFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="portfolio-upload">
                                            Portfolio {requirePortfolio ? <span className="text-destructive">*</span> : '(Optional)'}
                                        </Label>
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

                    {/* Screening / Custom Questions */}
                    {sortedQuestions.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Screening Questions</CardTitle>
                                <CardDescription>Please answer the following questions from the hiring team.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {sortedQuestions.map((question) => (
                                    <div key={question.id} className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <Label className="flex-1 text-sm font-medium">
                                                {question.label}
                                                {question.required && (
                                                    <span className="text-destructive ml-1">*</span>
                                                )}
                                            </Label>
                                            <Badge variant="outline" className="text-[10px] shrink-0">
                                                {questionTypeLabel(question.type)}
                                            </Badge>
                                        </div>

                                        {question.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {question.description}
                                            </p>
                                        )}

                                        {/* Short text */}
                                        {question.type === 'short_text' && (
                                            <Input
                                                placeholder="Your answer..."
                                                value={(customAnswers[question.id] as string) || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                maxLength={question.validation?.maxLength}
                                            />
                                        )}

                                        {/* Long text */}
                                        {question.type === 'long_text' && (
                                            <Textarea
                                                placeholder="Your answer..."
                                                rows={4}
                                                value={(customAnswers[question.id] as string) || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                maxLength={question.validation?.maxLength}
                                            />
                                        )}

                                        {/* Multiple choice (single select) */}
                                        {question.type === 'multiple_choice' && question.options && (
                                            <RadioGroup
                                                value={(customAnswers[question.id] as string) || ''}
                                                onValueChange={(value) => updateAnswer(question.id, value)}
                                            >
                                                {question.options.map((option) => (
                                                    <div key={option.id} className="flex items-center space-x-2">
                                                        <RadioGroupItem value={option.value} id={`${question.id}-${option.id}`} />
                                                        <Label htmlFor={`${question.id}-${option.id}`} className="font-normal cursor-pointer">
                                                            {option.label}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        )}

                                        {/* Checkbox (multi-select) */}
                                        {question.type === 'checkbox' && question.options && (
                                            <div className="space-y-2">
                                                {question.options.map((option) => {
                                                    const selected = Array.isArray(customAnswers[question.id])
                                                        ? (customAnswers[question.id] as string[]).includes(option.value)
                                                        : false;
                                                    return (
                                                        <div key={option.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`${question.id}-${option.id}`}
                                                                checked={selected}
                                                                onCheckedChange={() => toggleCheckboxAnswer(question.id, option.value)}
                                                            />
                                                            <Label htmlFor={`${question.id}-${option.id}`} className="font-normal cursor-pointer">
                                                                {option.label}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Dropdown */}
                                        {question.type === 'dropdown' && question.options && (
                                            <Select
                                                value={(customAnswers[question.id] as string) || undefined}
                                                onValueChange={(value) => updateAnswer(question.id, value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select an option..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {question.options.map((option) => (
                                                        <SelectItem key={option.id} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {/* Yes / No */}
                                        {question.type === 'yes_no' && (
                                            <RadioGroup
                                                value={(customAnswers[question.id] as string) || ''}
                                                onValueChange={(value) => updateAnswer(question.id, value)}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                                                    <Label htmlFor={`${question.id}-yes`} className="font-normal cursor-pointer">Yes</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="no" id={`${question.id}-no`} />
                                                    <Label htmlFor={`${question.id}-no`} className="font-normal cursor-pointer">No</Label>
                                                </div>
                                            </RadioGroup>
                                        )}

                                        {/* Number */}
                                        {question.type === 'number' && (
                                            <Input
                                                type="number"
                                                placeholder="Enter a number..."
                                                value={(customAnswers[question.id] as string) || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                                min={question.validation?.minValue}
                                                max={question.validation?.maxValue}
                                            />
                                        )}

                                        {/* Date */}
                                        {question.type === 'date' && (
                                            <Input
                                                type="date"
                                                value={(customAnswers[question.id] as string) || ''}
                                                onChange={(e) => updateAnswer(question.id, e.target.value)}
                                            />
                                        )}

                                        {/* File upload */}
                                        {question.type === 'file_upload' && (
                                            <div>
                                                <Input
                                                    type="file"
                                                    accept={question.validation?.fileTypes?.map(t => `.${t}`).join(',') || '.pdf,.doc,.docx,.jpg,.png'}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setFileAnswers(prev => ({ ...prev, [question.id]: file }));
                                                            updateAnswer(question.id, file.name);
                                                        }
                                                    }}
                                                />
                                                {question.validation?.fileTypes && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Accepted: {question.validation.fileTypes.join(', ').toUpperCase()}
                                                        {question.validation.maxFileSize && ` (max ${question.validation.maxFileSize}MB)`}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* Validation hints */}
                                        {question.validation && question.type !== 'file_upload' && (
                                            <p className="text-xs text-muted-foreground">
                                                {question.validation.minLength ? `Min ${question.validation.minLength} characters. ` : ''}
                                                {question.validation.maxLength ? `Max ${question.validation.maxLength} characters. ` : ''}
                                                {question.validation.minValue !== undefined ? `Min value: ${question.validation.minValue}. ` : ''}
                                                {question.validation.maxValue !== undefined ? `Max value: ${question.validation.maxValue}.` : ''}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

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
                        <Button variant="outline" onClick={() => navigate(`/jobs/${id}${location.search}`)} type="button">Cancel</Button>
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

function questionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        'short_text': 'Short Answer',
        'long_text': 'Long Answer',
        'multiple_choice': 'Multiple Choice',
        'checkbox': 'Multi-Select',
        'dropdown': 'Dropdown',
        'file_upload': 'File Upload',
        'date': 'Date',
        'yes_no': 'Yes / No',
        'number': 'Number',
    };
    return labels[type] || type;
}
