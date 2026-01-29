/**
 * Qualifications Page
 * Manages education, certifications, and training
 */

import { useState, useEffect } from 'react';
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
import { Plus, Trash2, Edit2, GraduationCap, Award, BookOpen, Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface Education {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate?: string;
    endDate?: string;
    current: boolean;
    grade?: string;
    description?: string;
}

interface Certification {
    id: string;
    name: string;
    issuingOrg: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    doesNotExpire: boolean;
}

interface Training {
    id: string;
    courseName: string;
    provider: string;
    completedDate?: string;
    duration?: string;
    description?: string;
    certificateUrl?: string;
}

export default function QualificationsPage() {
    const { toast } = useToast();
    const [education, setEducation] = useState<Education[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [training, setTraining] = useState<Training[]>([]);
    const [expiringCerts, setExpiringCerts] = useState<Certification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Dialog states
    const [eduDialogOpen, setEduDialogOpen] = useState(false);
    const [certDialogOpen, setCertDialogOpen] = useState(false);
    const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);

    // Form states
    const [eduForm, setEduForm] = useState<Partial<Education>>({});
    const [certForm, setCertForm] = useState<Partial<Certification>>({});
    const [trainingForm, setTrainingForm] = useState<Partial<Training>>({});

    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchEducation(),
                fetchCertifications(),
                fetchTraining(),
                fetchExpiringCertifications()
            ]);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const fetchEducation = async () => {
        try {
            const response = await apiClient.get<Education[]>('/api/candidate/qualifications/education');
            if (response.success && response.data) {
                setEducation(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch education', error);
        }
    };

    const fetchCertifications = async () => {
        try {
            const response = await apiClient.get<Certification[]>('/api/candidate/qualifications/certifications');
            if (response.success && response.data) {
                setCertifications(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch certifications', error);
        }
    };

    const fetchTraining = async () => {
        try {
            const response = await apiClient.get<Training[]>('/api/candidate/qualifications/training');
            if (response.success && response.data) {
                setTraining(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch training', error);
        }
    };

    const fetchExpiringCertifications = async () => {
        try {
            const response = await apiClient.get<Certification[]>('/api/candidate/qualifications/certifications/expiring');
            if (response.success && response.data) {
                setExpiringCerts(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch expiring certifications', error);
        }
    };

    // Education handlers
    const handleSaveEducation = async () => {
        try {
            if (editingId) {
                await apiClient.put(`/api/candidate/qualifications/education/${editingId}`, eduForm);
                toast({ title: 'Education updated successfully' });
            } else {
                await apiClient.post('/api/candidate/qualifications/education', eduForm);
                toast({ title: 'Education added successfully' });
            }
            setEduDialogOpen(false);
            setEduForm({});
            setEditingId(null);
            fetchEducation();
        } catch (error: any) {
            toast({
                title: 'Failed to save education',
                description: error.response?.data?.error || 'Please try again',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteEducation = async (id: string) => {
        try {
            await apiClient.delete(`/api/candidate/qualifications/education/${id}`);
            toast({ title: 'Education deleted successfully' });
            fetchEducation();
        } catch (error: any) {
            toast({
                title: 'Failed to delete education',
                description: error.response?.data?.error || 'Please try again',
                variant: 'destructive',
            });
        }
    };

    // Certification handlers
    const handleSaveCertification = async () => {
        try {
            if (editingId) {
                await apiClient.put(`/api/candidate/qualifications/certifications/${editingId}`, certForm);
                toast({ title: 'Certification updated successfully' });
            } else {
                await apiClient.post('/api/candidate/qualifications/certifications', certForm);
                toast({ title: 'Certification added successfully' });
            }
            setCertDialogOpen(false);
            setCertForm({});
            setEditingId(null);
            fetchCertifications();
            fetchExpiringCertifications();
        } catch (error: any) {
            toast({
                title: 'Failed to save certification',
                description: error.response?.data?.error || 'Please try again',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteCertification = async (id: string) => {
        try {
            await apiClient.delete(`/api/candidate/qualifications/certifications/${id}`);
            toast({ title: 'Certification deleted successfully' });
            fetchCertifications();
            fetchExpiringCertifications();
        } catch (error: any) {
            toast({
                title: 'Failed to delete certification',
                description: error.response?.data?.error || 'Please try again',
                variant: 'destructive',
            });
        }
    };

    // Training handlers
    const handleSaveTraining = async () => {
        try {
            if (editingId) {
                await apiClient.put(`/api/candidate/qualifications/training/${editingId}`, trainingForm);
                toast({ title: 'Training updated successfully' });
            } else {
                await apiClient.post('/api/candidate/qualifications/training', trainingForm);
                toast({ title: 'Training added successfully' });
            }
            setTrainingDialogOpen(false);
            setTrainingForm({});
            setEditingId(null);
            fetchTraining();
        } catch (error: any) {
            toast({
                title: 'Failed to save training',
                description: error.response?.data?.error || 'Please try again',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteTraining = async (id: string) => {
        try {
            await apiClient.delete(`/api/candidate/qualifications/training/${id}`);
            toast({ title: 'Training deleted successfully' });
            fetchTraining();
        } catch (error: any) {
            toast({
                title: 'Failed to delete training',
                description: error.response?.data?.error || 'Please try again',
                variant: 'destructive',
            });
        }
    };

    const isExpiringSoon = (expiryDate?: string) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiry <= thirtyDaysFromNow && expiry >= new Date();
    };

    return (
        <CandidatePageLayout>
            <div className="p-6 space-y-6">
                <AtsPageHeader
                    title="Qualifications"
                    subtitle="Manage your education, certifications, and training"
                />
                {/* Expiring Certifications Alert */}
                {expiringCerts.length > 0 && (
                    <Card className="border-warning bg-warning/5">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-warning">
                                <AlertCircle className="h-5 w-5" />
                                Certifications Expiring Soon
                            </CardTitle>
                            <CardDescription className="text-sm">Review and renew certifications expiring within 30 days</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {expiringCerts.map((cert) => (
                                    <div key={cert.id} className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{cert.name}</span>
                                        <span className="text-muted-foreground">
                                            Expires: {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Education Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            Education
                        </h2>
                        <Button onClick={() => { setEduForm({}); setEditingId(null); setEduDialogOpen(true); }} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Education
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {isLoading ? (
                            // Skeleton loading
                            Array.from({ length: 2 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="pb-2">
                                        <Skeleton className="h-5 w-64 mb-2" />
                                        <Skeleton className="h-4 w-48" />
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-3 w-32" />
                                            <Skeleton className="h-5 w-16" />
                                        </div>
                                        <Skeleton className="h-12 w-full" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : education.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground italic">
                                    No education records added yet.
                                </CardContent>
                            </Card>
                        ) : (
                            education.map((edu) => (
                                <Card key={edu.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base font-semibold">{edu.degree} in {edu.field}</CardTitle>
                                                <CardDescription className="text-base font-medium text-foreground">
                                                    {edu.institution}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setEduForm(edu);
                                                    setEditingId(edu.id);
                                                    setEduDialogOpen(true);
                                                }}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteEducation(edu.id)}>
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
                                                    {edu.startDate ? new Date(edu.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'} -
                                                    {edu.current ? ' Present' : edu.endDate ? ` ${new Date(edu.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}` : ' N/A'}
                                                </span>
                                            </div>
                                            {edu.grade && (
                                                <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">{edu.grade}</Badge>
                                            )}
                                        </div>
                                        {edu.description && (
                                            <p className="text-sm mt-2">{edu.description}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Certifications Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Certifications & Licenses
                        </h2>
                        <Button onClick={() => { setCertForm({ doesNotExpire: false }); setEditingId(null); setCertDialogOpen(true); }} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Certification
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {isLoading ? (
                            // Skeleton loading
                            Array.from({ length: 2 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="pb-2">
                                        <Skeleton className="h-5 w-56 mb-2" />
                                        <Skeleton className="h-4 w-40" />
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <Skeleton className="h-3 w-28" />
                                            <Skeleton className="h-3 w-28" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : certifications.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground italic">
                                    No certifications added yet.
                                </CardContent>
                            </Card>
                        ) : (
                            certifications.map((cert) => (
                                <Card key={cert.id} className={isExpiringSoon(cert.expiryDate) ? 'border-warning' : ''}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base font-semibold">{cert.name}</CardTitle>
                                                <CardDescription className="text-base font-medium text-foreground">
                                                    {cert.issuingOrg}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                {cert.credentialUrl && (
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setCertForm(cert);
                                                    setEditingId(cert.id);
                                                    setCertDialogOpen(true);
                                                }}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCertification(cert.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                            {cert.issueDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {cert.doesNotExpire ? (
                                                <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">No Expiry</Badge>
                                            ) : cert.expiryDate && (
                                                <div className="flex items-center gap-1">
                                                    <span className={isExpiringSoon(cert.expiryDate) ? 'text-warning font-medium' : ''}>
                                                        Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            {cert.credentialId && (
                                                <span className="text-xs">ID: {cert.credentialId}</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Training Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Training & Courses
                        </h2>
                        <Button onClick={() => { setTrainingForm({}); setEditingId(null); setTrainingDialogOpen(true); }} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Training
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {isLoading ? (
                            // Skeleton loading
                            Array.from({ length: 2 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="pb-2">
                                        <Skeleton className="h-5 w-52 mb-2" />
                                        <Skeleton className="h-4 w-36" />
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <Skeleton className="h-3 w-32" />
                                            <Skeleton className="h-5 w-20" />
                                        </div>
                                        <Skeleton className="h-12 w-full" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : training.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground italic">
                                    No training records added yet.
                                </CardContent>
                            </Card>
                        ) : (
                            training.map((train) => (
                                <Card key={train.id}>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base font-semibold">{train.courseName}</CardTitle>
                                                <CardDescription className="text-base font-medium text-foreground">
                                                    {train.provider}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2">
                                                {train.certificateUrl && (
                                                    <Button variant="ghost" size="icon" asChild>
                                                        <a href={train.certificateUrl} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => {
                                                    setTrainingForm(train);
                                                    setEditingId(train.id);
                                                    setTrainingDialogOpen(true);
                                                }}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTraining(train.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                            {train.completedDate && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Completed: {new Date(train.completedDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                            {train.duration && (
                                                <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">{train.duration}</Badge>
                                            )}
                                        </div>
                                        {train.description && (
                                            <p className="text-sm mt-2">{train.description}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {/* Education Dialog */}
                <Dialog open={eduDialogOpen} onOpenChange={setEduDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Education' : 'Add Education'}</DialogTitle>
                            <DialogDescription>
                                Enter your educational background details
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="institution">Institution *</Label>
                                <Input
                                    id="institution"
                                    value={eduForm.institution || ''}
                                    onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                                    placeholder="e.g., Stanford University"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="degree">Degree *</Label>
                                    <Input
                                        id="degree"
                                        value={eduForm.degree || ''}
                                        onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                                        placeholder="e.g., Bachelor of Science"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="field">Field of Study *</Label>
                                    <Input
                                        id="field"
                                        value={eduForm.field || ''}
                                        onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })}
                                        placeholder="e.g., Computer Science"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={eduForm.startDate?.split('T')[0] || ''}
                                        onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={eduForm.endDate?.split('T')[0] || ''}
                                        onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
                                        disabled={eduForm.current}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="current"
                                    checked={eduForm.current || false}
                                    onCheckedChange={(checked) => setEduForm({ ...eduForm, current: checked as boolean, endDate: checked ? undefined : eduForm.endDate })}
                                />
                                <label htmlFor="current" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    I currently study here
                                </label>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="grade">Grade/GPA</Label>
                                <Input
                                    id="grade"
                                    value={eduForm.grade || ''}
                                    onChange={(e) => setEduForm({ ...eduForm, grade: e.target.value })}
                                    placeholder="e.g., 3.8 GPA, First Class Honours"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={eduForm.description || ''}
                                    onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                                    placeholder="Honors, achievements, relevant coursework..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setEduDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveEducation}>Save Education</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Certification Dialog */}
                <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
                            <DialogDescription>
                                Enter your certification or license details
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="certName">Certification Name *</Label>
                                <Input
                                    id="certName"
                                    value={certForm.name || ''}
                                    onChange={(e) => setCertForm({ ...certForm, name: e.target.value })}
                                    placeholder="e.g., AWS Certified Solutions Architect"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="issuingOrg">Issuing Organization *</Label>
                                <Input
                                    id="issuingOrg"
                                    value={certForm.issuingOrg || ''}
                                    onChange={(e) => setCertForm({ ...certForm, issuingOrg: e.target.value })}
                                    placeholder="e.g., Amazon Web Services"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="issueDate">Issue Date</Label>
                                    <Input
                                        id="issueDate"
                                        type="date"
                                        value={certForm.issueDate?.split('T')[0] || ''}
                                        onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="expiryDate">Expiry Date</Label>
                                    <Input
                                        id="expiryDate"
                                        type="date"
                                        value={certForm.expiryDate?.split('T')[0] || ''}
                                        onChange={(e) => setCertForm({ ...certForm, expiryDate: e.target.value })}
                                        disabled={certForm.doesNotExpire}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="doesNotExpire"
                                    checked={certForm.doesNotExpire || false}
                                    onCheckedChange={(checked) => setCertForm({ ...certForm, doesNotExpire: checked as boolean, expiryDate: checked ? undefined : certForm.expiryDate })}
                                />
                                <label htmlFor="doesNotExpire" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    This certification does not expire
                                </label>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="credentialId">Credential ID</Label>
                                <Input
                                    id="credentialId"
                                    value={certForm.credentialId || ''}
                                    onChange={(e) => setCertForm({ ...certForm, credentialId: e.target.value })}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="credentialUrl">Credential URL</Label>
                                <Input
                                    id="credentialUrl"
                                    type="url"
                                    value={certForm.credentialUrl || ''}
                                    onChange={(e) => setCertForm({ ...certForm, credentialUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCertDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveCertification}>Save Certification</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Training Dialog */}
                <Dialog open={trainingDialogOpen} onOpenChange={setTrainingDialogOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Training' : 'Add Training'}</DialogTitle>
                            <DialogDescription>
                                Enter your training or course details
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="courseName">Course Name *</Label>
                                <Input
                                    id="courseName"
                                    value={trainingForm.courseName || ''}
                                    onChange={(e) => setTrainingForm({ ...trainingForm, courseName: e.target.value })}
                                    placeholder="e.g., Advanced React Patterns"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="provider">Provider *</Label>
                                <Input
                                    id="provider"
                                    value={trainingForm.provider || ''}
                                    onChange={(e) => setTrainingForm({ ...trainingForm, provider: e.target.value })}
                                    placeholder="e.g., Udemy, Coursera, LinkedIn Learning"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="completedDate">Completion Date</Label>
                                    <Input
                                        id="completedDate"
                                        type="date"
                                        value={trainingForm.completedDate?.split('T')[0] || ''}
                                        onChange={(e) => setTrainingForm({ ...trainingForm, completedDate: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="duration">Duration</Label>
                                    <Input
                                        id="duration"
                                        value={trainingForm.duration || ''}
                                        onChange={(e) => setTrainingForm({ ...trainingForm, duration: e.target.value })}
                                        placeholder="e.g., 40 hours, 3 months"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="certificateUrl">Certificate URL</Label>
                                <Input
                                    id="certificateUrl"
                                    type="url"
                                    value={trainingForm.certificateUrl || ''}
                                    onChange={(e) => setTrainingForm({ ...trainingForm, certificateUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="trainDescription">Description</Label>
                                <Textarea
                                    id="trainDescription"
                                    value={trainingForm.description || ''}
                                    onChange={(e) => setTrainingForm({ ...trainingForm, description: e.target.value })}
                                    placeholder="What did you learn? Key takeaways..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setTrainingDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSaveTraining}>Save Training</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </CandidatePageLayout>
    );
}
