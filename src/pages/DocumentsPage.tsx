/**
 * Documents Page
 * Manage resumes, cover letters, and portfolio items
 */

import { useState, useEffect } from 'react';
import { CandidatePageLayout } from '@/shared/components/layouts/CandidatePageLayout';
import { AtsPageHeader } from '@/shared/components/layouts/AtsPageHeader';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import { apiClient } from '@/shared/services/api';
import {
  FileText,
  Upload,
  Trash2,
  Star,
  ExternalLink,
  Edit,
  Plus,
  File,
  Link as LinkIcon,
  Download,
  Github,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  isDefault: boolean;
  version: number;
  uploadedAt: string;
}

interface CoverLetter {
  id: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  isTemplate: boolean;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  type: 'file' | 'link';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  externalUrl?: string;
  platform?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('resumes');
  const [isLoading, setIsLoading] = useState(true);

  // Data state
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  // Dialog states
  const [isResumeUploadOpen, setIsResumeUploadOpen] = useState(false);
  const [isCoverLetterDialogOpen, setIsCoverLetterDialogOpen] = useState(false);
  const [isPortfolioDialogOpen, setIsPortfolioDialogOpen] = useState(false);
  const [editingCoverLetter, setEditingCoverLetter] = useState<CoverLetter | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);

  // Form states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [coverLetterForm, setCoverLetterForm] = useState({
    title: '',
    content: '',
    isTemplate: false,
    isDraft: true,
    file: null as File | null,
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    type: 'link' as 'file' | 'link',
    externalUrl: '',
    platform: '',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchResumes(),
        fetchCoverLetters(),
        fetchPortfolioItems(),
      ]);
    } catch (error) {
      console.error('Failed to load documents', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await apiClient.get<Resume[]>('/api/candidate/documents/resumes');
      if (response.success && response.data) {
        setResumes(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch resumes', error);
    }
  };

  const fetchCoverLetters = async () => {
    try {
      const response = await apiClient.get<CoverLetter[]>('/api/candidate/documents/cover-letters');
      if (response.success && response.data) {
        setCoverLetters(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch cover letters', error);
    }
  };

  const fetchPortfolioItems = async () => {
    try {
      const response = await apiClient.get<PortfolioItem[]>('/api/candidate/documents/portfolio');
      if (response.success && response.data) {
        setPortfolioItems(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio items', error);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;

    setIsParsing(true);
    const formData = new FormData();
    formData.append('file', resumeFile);

    try {
      // Simple upload without parsing
      const response = await apiClient.upload<Resume>('/api/candidate/documents/resumes', formData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to upload resume');
      }

      toast({
        title: 'Resume Uploaded',
        description: 'Your resume has been successfully uploaded to your documents.',
      });

      // Close dialog and reset state
      setIsResumeUploadOpen(false);
      setResumeFile(null);

      // Refresh resumes list
      await fetchResumes();

    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.error || error.message || 'Failed to upload resume',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSetDefaultResume = async (resumeId: string) => {
    try {
      const response = await apiClient.put(`/api/candidate/documents/resumes/${resumeId}/set-default`);
      if (response.success) {
        toast({ title: 'Default resume updated' });
        await fetchResumes();
      }
    } catch (error) {
      console.error('Error setting default resume', error);
      toast({ title: 'Failed to set default resume', variant: 'destructive' });
    }
  };

  const handleDeleteResume = async (resumeId: string) => {
    try {
      const response = await apiClient.delete(`/api/candidate/documents/resumes/${resumeId}`);
      if (response.success) {
        toast({ title: 'Resume deleted' });
        setDeleteConfirm(null);
        await fetchResumes();
      }
    } catch (error) {
      console.error('Error deleting resume', error);
      toast({ title: 'Failed to delete resume', variant: 'destructive' });
    }
  };

  const handleCreateCoverLetter = async () => {
    try {
      const formData = new FormData();
      formData.append('title', coverLetterForm.title);
      formData.append('content', coverLetterForm.content || '');
      formData.append('isTemplate', String(coverLetterForm.isTemplate));
      formData.append('isDraft', String(coverLetterForm.isDraft));
      if (coverLetterForm.file) {
        formData.append('file', coverLetterForm.file);
      }

      const response = await apiClient.upload<CoverLetter>('/api/candidate/documents/cover-letters', formData);
      if (response.success) {
        toast({ title: 'Cover letter created' });
        setIsCoverLetterDialogOpen(false);
        setCoverLetterForm({ title: '', content: '', isTemplate: false, isDraft: true, file: null });
        await fetchCoverLetters();
      } else {
        toast({ title: 'Failed to create cover letter', variant: 'destructive', description: response.error });
      }
    } catch (error) {
      console.error('Error creating cover letter', error);
      toast({ title: 'Failed to create cover letter', variant: 'destructive' });
    }
  };

  const handleUpdateCoverLetter = async () => {
    if (!editingCoverLetter) return;

    try {
      const formData = new FormData();
      formData.append('title', coverLetterForm.title);
      formData.append('content', coverLetterForm.content || '');
      formData.append('isTemplate', String(coverLetterForm.isTemplate));
      formData.append('isDraft', String(coverLetterForm.isDraft));
      if (coverLetterForm.file) {
        formData.append('file', coverLetterForm.file);
      }

      // Use fetch directly for PUT with FormData
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/candidate/documents/cover-letters/${editingCoverLetter.id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Cover letter updated' });
        setIsCoverLetterDialogOpen(false);
        setEditingCoverLetter(null);
        setCoverLetterForm({ title: '', content: '', isTemplate: false, isDraft: true, file: null });
        await fetchCoverLetters();
      } else {
        toast({ title: 'Failed to update cover letter', variant: 'destructive', description: data.error });
      }
    } catch (error) {
      console.error('Error updating cover letter', error);
      toast({ title: 'Failed to update cover letter', variant: 'destructive' });
    }
  };

  const handleDeleteCoverLetter = async (coverLetterId: string) => {
    try {
      const response = await apiClient.delete(`/api/candidate/documents/cover-letters/${coverLetterId}`);
      if (response.success) {
        toast({ title: 'Cover letter deleted' });
        setDeleteConfirm(null);
        await fetchCoverLetters();
      }
    } catch (error) {
      console.error('Error deleting cover letter', error);
      toast({ title: 'Failed to delete cover letter', variant: 'destructive' });
    }
  };

  const handleCreatePortfolioItem = async () => {
    try {
      const formData = new FormData();
      formData.append('title', portfolioForm.title);
      formData.append('type', portfolioForm.type);
      if (portfolioForm.type === 'link') {
        formData.append('externalUrl', portfolioForm.externalUrl);
        formData.append('platform', portfolioForm.platform);
      }
      formData.append('description', portfolioForm.description || '');
      if (portfolioForm.file) {
        formData.append('file', portfolioForm.file);
      }

      const response = await apiClient.upload<PortfolioItem>('/api/candidate/documents/portfolio', formData);
      if (response.success) {
        toast({ title: 'Portfolio item created' });
        setIsPortfolioDialogOpen(false);
        setPortfolioForm({ title: '', type: 'link', externalUrl: '', platform: '', description: '', file: null });
        await fetchPortfolioItems();
      } else {
        toast({ title: 'Failed to create portfolio item', variant: 'destructive', description: response.error });
      }
    } catch (error) {
      console.error('Error creating portfolio item', error);
      toast({ title: 'Failed to create portfolio item', variant: 'destructive' });
    }
  };

  const handleUpdatePortfolioItem = async () => {
    if (!editingPortfolio) return;

    try {
      const formData = new FormData();
      formData.append('title', portfolioForm.title);
      if (portfolioForm.type === 'link') {
        formData.append('externalUrl', portfolioForm.externalUrl);
        formData.append('platform', portfolioForm.platform);
      }
      formData.append('description', portfolioForm.description || '');
      if (portfolioForm.file) {
        formData.append('file', portfolioForm.file);
      }

      // Use fetch directly for PUT with FormData
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/candidate/documents/portfolio/${editingPortfolio.id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Portfolio item updated' });
        setIsPortfolioDialogOpen(false);
        setEditingPortfolio(null);
        setPortfolioForm({ title: '', type: 'link', externalUrl: '', platform: '', description: '', file: null });
        await fetchPortfolioItems();
      } else {
        toast({ title: 'Failed to update portfolio item', variant: 'destructive', description: data.error });
      }
    } catch (error) {
      console.error('Error updating portfolio item', error);
      toast({ title: 'Failed to update portfolio item', variant: 'destructive' });
    }
  };

  const handleDeletePortfolioItem = async (portfolioId: string) => {
    try {
      const response = await apiClient.delete(`/api/candidate/documents/portfolio/${portfolioId}`);
      if (response.success) {
        toast({ title: 'Portfolio item deleted' });
        setDeleteConfirm(null);
        await fetchPortfolioItems();
      }
    } catch (error) {
      console.error('Error deleting portfolio item', error);
      toast({ title: 'Failed to delete portfolio item', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPlatformIcon = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'behance':
      case 'dribbble':
      case 'website':
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <CandidatePageLayout>
      <div className="p-6 space-y-6">
        <AtsPageHeader
          title="Documents"
          subtitle="Manage your resumes, cover letters, and portfolio"
        >
          <div className="flex items-center gap-2">
            {activeTab === 'resumes' && (
              <Dialog open={isResumeUploadOpen} onOpenChange={setIsResumeUploadOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Resume
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Resume</DialogTitle>
                    <DialogDescription>
                      Upload a PDF, DOC, or DOCX file (max 10MB).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="resume-file">Resume File</Label>
                      <Input
                        id="resume-file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                      />
                      {resumeFile && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {resumeFile.name} ({(formatFileSize(resumeFile.size))})
                        </p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResumeUploadOpen(false)} disabled={isParsing}>Cancel</Button>
                    <Button onClick={handleResumeUpload} disabled={!resumeFile || isParsing}>
                      {isParsing ? 'Uploading...' : 'Upload'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {activeTab === 'cover-letters' && (
              <Dialog open={isCoverLetterDialogOpen} onOpenChange={(open) => {
                setIsCoverLetterDialogOpen(open);
                if (!open) {
                  setEditingCoverLetter(null);
                  setCoverLetterForm({ title: '', content: '', isTemplate: false, isDraft: true, file: null });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Cover Letter
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCoverLetter ? 'Edit Cover Letter' : 'Create Cover Letter'}</DialogTitle>
                    <DialogDescription>
                      Create a new cover letter draft or template
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="cover-letter-title">Title *</Label>
                      <Input
                        id="cover-letter-title"
                        value={coverLetterForm.title}
                        onChange={(e) => setCoverLetterForm({ ...coverLetterForm, title: e.target.value })}
                        placeholder="e.g., Software Engineer Cover Letter"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cover-letter-content">Content</Label>
                      <Textarea
                        id="cover-letter-content"
                        value={coverLetterForm.content}
                        onChange={(e) => setCoverLetterForm({ ...coverLetterForm, content: e.target.value })}
                        placeholder="Write your cover letter content here..."
                        rows={10}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cover-letter-file">Or Upload File</Label>
                      <Input
                        id="cover-letter-file"
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={(e) => setCoverLetterForm({ ...coverLetterForm, file: e.target.files?.[0] || null })}
                      />
                      {coverLetterForm.file && (
                        <p className="text-sm text-muted-foreground">
                          Selected: {coverLetterForm.file.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is-template"
                          checked={coverLetterForm.isTemplate}
                          onChange={(e) => setCoverLetterForm({ ...coverLetterForm, isTemplate: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="is-template" className="text-sm cursor-pointer">Save as Template</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is-draft"
                          checked={coverLetterForm.isDraft}
                          onChange={(e) => setCoverLetterForm({ ...coverLetterForm, isDraft: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor="is-draft" className="text-sm cursor-pointer">Mark as Draft</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCoverLetterDialogOpen(false)}>Cancel</Button>
                    <Button onClick={editingCoverLetter ? handleUpdateCoverLetter : handleCreateCoverLetter} disabled={!coverLetterForm.title}>
                      {editingCoverLetter ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {activeTab === 'portfolio' && (
              <Dialog open={isPortfolioDialogOpen} onOpenChange={(open) => {
                setIsPortfolioDialogOpen(open);
                if (!open) {
                  setEditingPortfolio(null);
                  setPortfolioForm({ title: '', type: 'link', externalUrl: '', platform: '', description: '', file: null });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Portfolio Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPortfolio ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</DialogTitle>
                    <DialogDescription>
                      Add a file or external link to your portfolio
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="portfolio-title">Title *</Label>
                      <Input
                        id="portfolio-title"
                        value={portfolioForm.title}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                        placeholder="e.g., My GitHub Profile"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portfolio-type">Type</Label>
                      <Select
                        value={portfolioForm.type}
                        onValueChange={(val: 'file' | 'link') => setPortfolioForm({ ...portfolioForm, type: val })}
                      >
                        <SelectTrigger id="portfolio-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="link">External Link</SelectItem>
                          <SelectItem value="file">Upload File</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {portfolioForm.type === 'link' ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="portfolio-url">URL *</Label>
                          <Input
                            id="portfolio-url"
                            type="url"
                            value={portfolioForm.externalUrl}
                            onChange={(e) => setPortfolioForm({ ...portfolioForm, externalUrl: e.target.value })}
                            placeholder="https://github.com/username"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="portfolio-platform">Platform</Label>
                          <Select
                            value={portfolioForm.platform || 'website'}
                            onValueChange={(val) => setPortfolioForm({ ...portfolioForm, platform: val })}
                          >
                            <SelectTrigger id="portfolio-platform">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="github">GitHub</SelectItem>
                              <SelectItem value="behance">Behance</SelectItem>
                              <SelectItem value="dribbble">Dribbble</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="portfolio-file">File</Label>
                        <Input
                          id="portfolio-file"
                          type="file"
                          accept=".pdf,.zip,.doc,.docx"
                          onChange={(e) => setPortfolioForm({ ...portfolioForm, file: e.target.files?.[0] || null })}
                        />
                        {portfolioForm.file && (
                          <p className="text-sm text-muted-foreground">
                            Selected: {portfolioForm.file.name}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="portfolio-description">Description</Label>
                      <Textarea
                        id="portfolio-description"
                        value={portfolioForm.description}
                        onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                        placeholder="Brief description of this portfolio item..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPortfolioDialogOpen(false)}>Cancel</Button>
                    <Button onClick={editingPortfolio ? handleUpdatePortfolioItem : handleCreatePortfolioItem} disabled={!portfolioForm.title || (portfolioForm.type === 'link' && !portfolioForm.externalUrl)}>
                      {editingPortfolio ? 'Update' : 'Create'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </AtsPageHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="inline-flex w-auto gap-1 rounded-full border bg-muted/40 px-1 py-1 shadow-sm">
              <TabsTrigger
                value="resumes"
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                Resumes
                {resumes.length > 0 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-xs rounded-full ml-1">
                    {resumes.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="cover-letters"
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                Cover Letters
                {coverLetters.length > 0 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-xs rounded-full ml-1">
                    {coverLetters.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <LinkIcon className="h-3.5 w-3.5 flex-shrink-0" />
                Portfolio
                {portfolioItems.length > 0 && (
                  <Badge variant="outline" className="h-4 px-1.5 text-xs rounded-full ml-1">
                    {portfolioItems.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resumes" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : resumes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base font-semibold mb-2">No resumes uploaded</p>
                  <p className="text-sm mb-6">Upload your first resume to get started.</p>
                  <Button size="sm" onClick={() => setIsResumeUploadOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Resume
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <Card key={resume.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-base font-semibold">{resume.fileName}</h3>
                            {resume.isDefault && (
                              <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-success/10 text-success border-success/20">
                                Default
                              </Badge>
                            )}
                            <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">
                              Version {resume.version}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatFileSize(resume.fileSize)}</span>
                            <span>•</span>
                            <span>
                              {resume.uploadedAt && !isNaN(new Date(resume.uploadedAt).getTime())
                                ? format(new Date(resume.uploadedAt), 'MMM d, yyyy')
                                : 'Recently'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!resume.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultResume(resume.id)}
                              title="Set as default"
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          {resume.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title="Default resume"
                            >
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (resume.fileUrl) {
                                // Download the file
                                const link = document.createElement('a');
                                link.href = resume.fileUrl;
                                link.download = resume.fileName;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } else {
                                toast({
                                  title: 'Error',
                                  description: 'Resume URL is not available',
                                  variant: 'destructive',
                                });
                              }
                            }}
                            title="Download to View"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm({ type: 'resume', id: resume.id, name: resume.fileName })}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cover-letters" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : coverLetters.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base font-semibold mb-2">No cover letters</p>
                  <p className="text-sm mb-6">Create your first cover letter or template.</p>
                  <Button size="sm" onClick={() => setIsCoverLetterDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Cover Letter
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {coverLetters.map((coverLetter) => (
                  <Card key={coverLetter.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <h3 className="text-base font-semibold">{coverLetter.title}</h3>
                            {coverLetter.isTemplate && (
                              <Badge variant="outline" className="h-6 px-2 text-xs rounded-full bg-primary/10 text-primary border-primary/20">
                                Template
                              </Badge>
                            )}
                            {coverLetter.isDraft && (
                              <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">
                                Draft
                              </Badge>
                            )}
                          </div>
                          {coverLetter.content && (
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {coverLetter.content.substring(0, 150)}...
                            </p>
                          )}
                          {coverLetter.fileName && (
                            <p className="text-xs text-muted-foreground mb-2">
                              File: {coverLetter.fileName}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              Updated {coverLetter.updatedAt && !isNaN(new Date(coverLetter.updatedAt).getTime())
                                ? format(new Date(coverLetter.updatedAt), 'MMM d, yyyy')
                                : 'Recently'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {coverLetter.fileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (coverLetter.fileUrl) {
                                  // Download the file
                                  const link = document.createElement('a');
                                  link.href = coverLetter.fileUrl;
                                  link.download = `${coverLetter.title}.pdf` || 'cover-letter.pdf';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else {
                                  toast({
                                    title: 'Error',
                                    description: 'Cover letter URL is not available',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                              title="Download to View"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCoverLetter(coverLetter);
                              setCoverLetterForm({
                                title: coverLetter.title,
                                content: coverLetter.content || '',
                                isTemplate: coverLetter.isTemplate,
                                isDraft: coverLetter.isDraft,
                                file: null,
                              });
                              setIsCoverLetterDialogOpen(true);
                            }}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm({ type: 'cover-letter', id: coverLetter.id, name: coverLetter.title })}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : portfolioItems.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base font-semibold mb-2">No portfolio items</p>
                  <p className="text-sm mb-6">Add files or links to showcase your work.</p>
                  <Button size="sm" onClick={() => setIsPortfolioDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Portfolio Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {portfolioItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {item.type === 'link' ? (
                              <LinkIcon className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <File className="h-5 w-5 text-muted-foreground" />
                            )}
                            <h3 className="text-base font-semibold">{item.title}</h3>
                            {item.platform && (
                              <Badge variant="outline" className="h-6 px-2 text-xs rounded-full">
                                {item.platform}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          {item.type === 'link' && item.externalUrl && (
                            <a
                              href={item.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              {getPlatformIcon(item.platform)}
                              {item.externalUrl}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {item.type === 'file' && item.fileName && (
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{item.fileName}</span>
                              {item.fileSize && <span>• {formatFileSize(item.fileSize)}</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span>
                              Added {item.createdAt && !isNaN(new Date(item.createdAt).getTime())
                                ? format(new Date(item.createdAt), 'MMM d, yyyy')
                                : 'Recently'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.type === 'link' && item.externalUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(item.externalUrl, '_blank')}
                              title="Open link"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {item.type === 'file' && item.fileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (item.fileUrl) {
                                  // Download the file
                                  const link = document.createElement('a');
                                  link.href = item.fileUrl;
                                  link.download = item.fileName || `${item.title}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else {
                                  toast({
                                    title: 'Error',
                                    description: 'Portfolio file URL is not available',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                              title="Download to View"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPortfolio(item);
                              setPortfolioForm({
                                title: item.title,
                                type: item.type,
                                externalUrl: item.externalUrl || '',
                                platform: item.platform || '',
                                description: item.description || '',
                                file: null,
                              });
                              setIsPortfolioDialogOpen(true);
                            }}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm({ type: 'portfolio', id: item.id, name: item.title })}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {deleteConfirm?.type === 'resume' ? 'Resume' : deleteConfirm?.type === 'cover-letter' ? 'Cover Letter' : 'Portfolio Item'}?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!deleteConfirm) return;
                  if (deleteConfirm.type === 'resume') {
                    handleDeleteResume(deleteConfirm.id);
                  } else if (deleteConfirm.type === 'cover-letter') {
                    handleDeleteCoverLetter(deleteConfirm.id);
                  } else {
                    handleDeletePortfolioItem(deleteConfirm.id);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CandidatePageLayout>
  );
}

