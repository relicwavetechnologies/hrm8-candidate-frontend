/**
 * Candidate Work History Page
 * Manage work experience, skills, and resume parsing
 */

import { useState, useEffect } from 'react';
import { useCandidateAuth } from '@/contexts/CandidateAuthContext';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { apiClient } from '@/shared/services/api';
import { Loader2, Upload, Plus, Trash2, Briefcase, Calendar, MapPin, Edit2, FileText, ExternalLink, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Checkbox } from '@/shared/components/ui/checkbox';

import { Skeleton } from '@/shared/components/ui/skeleton';

interface WorkExperience {
    id: string;
    company: string;
    role: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    location?: string;
}

interface Skill {
    id: string;
    name: string;
    level?: string;
}

export default function WorkHistoryPage() {
    const { candidate, refreshCandidate } = useCandidateAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isParsing, setIsParsing] = useState(false);
    const [workHistory, setWorkHistory] = useState<WorkExperience[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);

    // Work Experience Form State
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        location: '',
    });

    // Skills State
    const [newSkill, setNewSkill] = useState('');
    const [uploadedFileName, setUploadedFileName] = useState<string>('');

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchWorkHistory(), fetchSkills()]);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const fetchWorkHistory = async () => {
        try {
            const response = await apiClient.get<WorkExperience[]>('/api/candidate/work-history');
            if (response.success && response.data) {
                setWorkHistory(response.data);
            } else {
                setWorkHistory([]);
            }
        } catch (error) {
            console.error('Failed to fetch work history', error);
            setWorkHistory([]);
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await apiClient.get<Skill[]>('/api/candidate/skills');
            if (response.success && response.data) {
                setSkills(response.data);
            } else {
                setSkills([]);
            }
        } catch (error) {
            console.error('Failed to fetch skills', error);
            setSkills([]);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);
        const formData = new FormData();
        formData.append('resume', file);

        try {
            const response = await apiClient.upload<{
                workExperience: WorkExperience[],
                skills: Skill[],
                education: any[],
                certifications: any[],
                training: any[],
                resumeUrl?: string
            }>('/api/candidate/resume/parse', formData);

            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to parse resume');
            }

            const parsedData = response.data;
            let totalItems = 0;

            // Clear all existing data first
            try {
                // Delete all work history
                const existingWorkHistory = await apiClient.get<WorkExperience[]>('/api/candidate/work-history');
                if (existingWorkHistory.success && existingWorkHistory.data) {
                    for (const exp of existingWorkHistory.data) {
                        await apiClient.delete(`/api/candidate/work-history/${exp.id}`);
                    }
                }

                // Delete all skills
                await apiClient.post('/api/candidate/skills', { skills: [] });

                // Delete all education
                const existingEducation = await apiClient.get<any[]>('/api/candidate/qualifications/education');
                if (existingEducation.success && existingEducation.data) {
                    for (const edu of existingEducation.data) {
                        await apiClient.delete(`/api/candidate/qualifications/education/${edu.id}`);
                    }
                }

                // Delete all certifications
                const existingCerts = await apiClient.get<any[]>('/api/candidate/qualifications/certifications');
                if (existingCerts.success && existingCerts.data) {
                    for (const cert of existingCerts.data) {
                        await apiClient.delete(`/api/candidate/qualifications/certifications/${cert.id}`);
                    }
                }

                // Delete all training
                const existingTraining = await apiClient.get<any[]>('/api/candidate/qualifications/training');
                if (existingTraining.success && existingTraining.data) {
                    for (const train of existingTraining.data) {
                        await apiClient.delete(`/api/candidate/qualifications/training/${train.id}`);
                    }
                }
            } catch (error) {
                console.error('Error clearing old data:', error);
                // Continue with parsing even if clearing fails
            }

            // Auto-fill work history
            if (parsedData.workExperience && parsedData.workExperience.length > 0) {
                for (const exp of parsedData.workExperience) {
                    await apiClient.post('/api/candidate/work-history', exp);
                }
                totalItems += parsedData.workExperience.length;
                fetchWorkHistory(); // Refresh list
            }

            // Auto-fill skills
            if (parsedData.skills && parsedData.skills.length > 0) {
                await apiClient.post('/api/candidate/skills', { skills: parsedData.skills });
                totalItems += parsedData.skills.length;
                fetchSkills(); // Refresh list
            }

            // Auto-fill education
            if (parsedData.education && parsedData.education.length > 0) {
                for (const edu of parsedData.education) {
                    await apiClient.post('/api/candidate/qualifications/education', edu);
                }
                totalItems += parsedData.education.length;
            }

            // Auto-fill certifications
            if (parsedData.certifications && parsedData.certifications.length > 0) {
                for (const cert of parsedData.certifications) {
                    await apiClient.post('/api/candidate/qualifications/certifications', cert);
                }
                totalItems += parsedData.certifications.length;
            }

            // Auto-fill training
            if (parsedData.training && parsedData.training.length > 0) {
                for (const train of parsedData.training) {
                    await apiClient.post('/api/candidate/qualifications/training', train);
                }
                totalItems += parsedData.training.length;
            }

            // Store the resume file in documents (so it appears in the Documents list)
            if (parsedData.resumeUrl) {
                try {
                    const documentFormData = new FormData();
                    documentFormData.append('file', file);
                    await apiClient.upload('/api/candidate/documents/resumes', documentFormData);
                } catch (docError) {
                    console.error('Failed to store resume in documents:', docError);
                    // Continue even if document storage fails - parsing was successful
                }
            }

            // Show success message
            toast({
                title: 'Resume Parsed Successfully',
                description: `Extracted ${totalItems} items from your resume. Check Work History and Qualifications pages.`,
            });

            // Refresh candidate profile to show new resume URL
            if (parsedData.resumeUrl) {
                await refreshCandidate();
                setUploadedFileName(file.name); // Store the uploaded filename
            }

        } catch (error: any) {
            toast({
                title: 'Parsing Failed',
                description: error.response?.data?.error || 'Failed to parse resume',
                variant: 'destructive',
            });
        } finally {
            setIsParsing(false);
        }
    };

    const handleSaveExperience = async () => {
        try {
            if (editingId) {
                await apiClient.put(`/api/candidate/work-history/${editingId}`, formData);
                toast({ title: 'Updated', description: 'Work experience updated successfully' });
            } else {
                await apiClient.post('/api/candidate/work-history', formData);
                toast({ title: 'Added', description: 'Work experience added successfully' });
            }
            setIsAddDialogOpen(false);
            resetForm();
            fetchWorkHistory();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save work experience',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteExperience = async (id: string) => {
        try {
            await apiClient.delete(`/api/candidate/work-history/${id}`);
            toast({ title: 'Deleted', description: 'Work experience deleted successfully' });
            fetchWorkHistory();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete work experience',
                variant: 'destructive',
            });
        }
    };

    const handleAddSkill = async () => {
        if (!newSkill.trim()) return;
        try {
            const updatedSkills = [...skills, { name: newSkill, level: 'intermediate' }];
            await apiClient.post('/api/candidate/skills', { skills: updatedSkills });
            setNewSkill('');
            fetchSkills();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add skill', variant: 'destructive' });
        }
    };

    const handleDeleteSkill = async (skillName: string) => {
        try {
            const updatedSkills = skills.filter(s => s.name !== skillName);
            await apiClient.post('/api/candidate/skills', { skills: updatedSkills });
            fetchSkills();
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete skill', variant: 'destructive' });
        }
    };

    const resetForm = () => {
        setFormData({
            company: '',
            role: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
            location: '',
        });
        setEditingId(null);
    };

    const openEditDialog = (exp: WorkExperience) => {
        setFormData({
            company: exp.company,
            role: exp.role,
            startDate: exp.startDate.split('T')[0], // Format for input date
            endDate: exp.endDate ? exp.endDate.split('T')[0] : '',
            current: exp.current,
            description: exp.description || '',
            location: exp.location || '',
        });
        setEditingId(exp.id);
        setIsAddDialogOpen(true);
    };

    return (
        <CandidatePageLayout>
            <div className="p-6 space-y-6">
                <AtsPageHeader
                    title="Work History & Skills"
                    subtitle="Manage your professional experience and competencies"
                />

                {/* Resume Upload Section - Compact AI-Powered Design */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 shrink-0">
                                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        Auto-fill with AI
                                    </h3>
                                    <Badge variant="secondary" className="h-5 px-2 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        AI-Powered
                                    </Badge>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Upload your resume to automatically extract work history, skills & qualifications
                                </p>
                            </div>
                        </div>

                        {isParsing ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Parsing...</span>
                            </div>
                        ) : (
                            <>
                                <Input
                                    type="file"
                                    accept=".pdf,.docx,.doc"
                                    className="hidden"
                                    id="resume-upload"
                                    onChange={handleFileUpload}
                                />
                                <Label
                                    htmlFor="resume-upload"
                                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors shrink-0"
                                >
                                    <Upload className="h-4 w-4" />
                                    Upload Resume
                                </Label>
                            </>
                        )}
                    </div>

                    {candidate?.resumeUrl && !isParsing && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                            <a
                                href={candidate.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                <span className="font-medium">{uploadedFileName || 'Current Resume'}</span>
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Work History Timeline */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <Briefcase className="h-5 w-5" />
                            Work Experience
                        </h2>
                        <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Experience
                        </Button>
                    </div>

                    <div className="space-y-4 relative pl-4 border-l border-muted">
                        {isLoading ? (
                            // Skeleton loading
                            Array.from({ length: 2 }).map((_, i) => (
                                <Card key={i} className="relative">
                                    <div className="absolute -left-[21px] top-6 h-3 w-3 rounded-full bg-muted border-2 border-background" />
                                    <CardHeader className="pb-2">
                                        <Skeleton className="h-5 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-3 w-40" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                        <Skeleton className="h-16 w-full" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : workHistory.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">
                                No work history added yet. Upload a resume or add manually.
                            </div>
                        ) : (
                            workHistory.map((exp) => (
                                <Card key={exp.id} className="relative">
                                    <div className="absolute -left-[21px] top-6 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base font-semibold">{exp.role}</CardTitle>
                                                <CardDescription className="text-base font-medium text-foreground">
                                                    {exp.company}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(exp)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteExperience(exp.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>
                                                    {new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} -
                                                    {exp.current ? ' Present' : exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : ''}
                                                </span>
                                            </div>
                                            {exp.location && (
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{exp.location}</span>
                                                </div>
                                            )}
                                        </div>
                                        {exp.description && (
                                            <p className="text-sm whitespace-pre-line mt-2">
                                                {exp.description}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div >

                {/* Skills Section */}
                < Card >
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Skills & Competencies</CardTitle>
                        <CardDescription>Add skills to highlight your expertise</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Add a skill..."
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                            />
                            <Button size="icon" onClick={handleAddSkill}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {isLoading ? (
                                // Skeleton loading for skills
                                Array.from({ length: 6 }).map((_, i) => (
                                    <Skeleton key={i} className="h-7 w-24" />
                                ))
                            ) : skills.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
                            ) : (
                                skills.map((skill) => (
                                    <Badge key={skill.id || skill.name} variant="outline" className="h-6 px-2 text-xs rounded-full flex items-center gap-2">
                                        {skill.name}
                                        <button onClick={() => handleDeleteSkill(skill.name)} className="hover:text-destructive">
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card >

                {/* Add/Edit Experience Dialog */}
                < Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} >
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Work Experience' : 'Add Work Experience'}</DialogTitle>
                            <DialogDescription>
                                Add details about your professional experience.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Job Title *</Label>
                                    <Input
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        placeholder="e.g. Senior Software Engineer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company">Company *</Label>
                                    <Input
                                        id="company"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        placeholder="e.g. Tech Corp"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        disabled={formData.current}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="current"
                                    checked={formData.current}
                                    onCheckedChange={(checked: boolean) => setFormData({ ...formData, current: checked as boolean })}
                                />
                                <Label htmlFor="current">I currently work here</Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. San Francisco, CA"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your responsibilities and achievements..."
                                    rows={4}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveExperience}>Save Experience</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog >

            </div >
        </CandidatePageLayout >
    );
}
