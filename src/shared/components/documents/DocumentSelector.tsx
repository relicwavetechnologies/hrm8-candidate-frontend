import { useState, useEffect } from 'react';
import { documentService } from '@/shared/services/documentService';
import type { CandidateResume, CandidateCoverLetter, CandidatePortfolio, DocumentType } from '@/shared/types/document';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Loader2, Upload, FileText, CheckCircle2, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentSelectorProps {
    type: DocumentType;
    required?: boolean;
    selectedId?: string | null;
    onSelect: (id: string | null, file?: File, url?: string) => void;
    label?: string;
    description?: string;
}

type DocumentItem = CandidateResume | CandidateCoverLetter | CandidatePortfolio;

export function DocumentSelector({
    type,
    required = false,
    selectedId,
    onSelect,
    label,
    description
}: DocumentSelectorProps) {
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOption, setSelectedOption] = useState<string>(''); // documentId or 'new' or 'url'
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [portfolioUrl, setPortfolioUrl] = useState<string>('');
    const [portfolioType, setPortfolioType] = useState<'file' | 'url'>('file');

    useEffect(() => {
        fetchDocuments();
    }, [type]);

    useEffect(() => {
        // Auto-fill logic: if only 1 document exists, auto-select it
        if (documents.length === 1 && !selectedId) {
            const doc = documents[0];
            setSelectedOption(doc.id);
            onSelect(doc.id);
        } else if (selectedId) {
            setSelectedOption(selectedId);
        }
    }, [documents, selectedId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            let response;
            if (type === 'resume') {
                response = await documentService.getResumes();
            } else if (type === 'cover-letter') {
                response = await documentService.getCoverLetters();
            } else {
                response = await documentService.getPortfolios();
            }

            if (response.success && response.data) {
                setDocuments(response.data);
            }
        } catch (error) {
            console.error(`Failed to fetch ${type}s:`, error);
            toast.error(`Failed to load ${type}s`);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (value: string) => {
        setSelectedOption(value);
        setUploadFile(null);
        setPortfolioUrl('');

        if (value === 'new' || value === 'url') {
            onSelect(null);
        } else {
            onSelect(value);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validation
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }

            setUploadFile(file);
            setSelectedOption('new');
            onSelect(null, file);
        }
    };

    const handleUrlSubmit = () => {
        if (!portfolioUrl) {
            toast.error('Please enter a URL');
            return;
        }

        // Basic URL validation
        try {
            new URL(portfolioUrl);
            setSelectedOption('url');
            onSelect(null, undefined, portfolioUrl);
        } catch {
            toast.error('Please enter a valid URL');
        }
    };

    const getDocumentTitle = (doc: DocumentItem): string => {
        if ('fileName' in doc) return doc.fileName || 'Untitled';
        if ('title' in doc) return doc.title;
        return 'Untitled';
    };

    const getDocumentSubtitle = (doc: DocumentItem): string => {
        if ('uploadedAt' in doc) {
            const date = new Date(doc.uploadedAt).toLocaleDateString();
            const isDefault = 'isDefault' in doc && doc.isDefault;
            return `${date}${isDefault ? ' (Default)' : ''}`;
        }
        if ('updatedAt' in doc) {
            return new Date(doc.updatedAt).toLocaleDateString();
        }
        return '';
    };

    const defaultLabel = type === 'resume' ? 'Resume' : type === 'cover-letter' ? 'Cover Letter' : 'Portfolio';
    const displayLabel = label || `${defaultLabel}${required ? ' *' : ''}`;

    if (loading) {
        return (
            <div className="space-y-2">
                <Label>{displayLabel}</Label>
                <div className="flex items-center justify-center p-8 border rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <Label>{displayLabel}</Label>
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>

            {/* Existing Documents */}
            {documents.length > 0 && (
                <RadioGroup value={selectedOption} onValueChange={handleSelect}>
                    <div className="grid gap-3">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedOption === doc.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                                    }`}
                                onClick={() => handleSelect(doc.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <RadioGroupItem value={doc.id} id={doc.id} />
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium text-sm">{getDocumentTitle(doc)}</p>
                                        <p className="text-xs text-muted-foreground">{getDocumentSubtitle(doc)}</p>
                                    </div>
                                </div>
                                {selectedOption === doc.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                            </div>
                        ))}
                    </div>
                </RadioGroup>
            )}

            {/* Upload New Option */}
            {type !== 'portfolio' && (
                <div
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${selectedOption === 'new' ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                    onClick={() => handleSelect('new')}
                >
                    <div className="flex items-center gap-3">
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">Upload New {defaultLabel}</span>
                    </div>
                    {selectedOption === 'new' && <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
            )}

            {/* Portfolio: File or URL Toggle */}
            {type === 'portfolio' && (
                <div className="space-y-3">
                    <RadioGroup value={portfolioType} onValueChange={(val) => setPortfolioType(val as 'file' | 'url')}>
                        <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="file" id="portfolio-file" />
                                <Label htmlFor="portfolio-file" className="cursor-pointer">Upload File</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="url" id="portfolio-url" />
                                <Label htmlFor="portfolio-url" className="cursor-pointer">External URL</Label>
                            </div>
                        </div>
                    </RadioGroup>
                </div>
            )}

            {/* File Upload Area */}
            {(selectedOption === 'new' || (type === 'portfolio' && portfolioType === 'file')) && (
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative">
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                    />
                    {uploadFile ? (
                        <div className="flex flex-col items-center text-primary">
                            <FileText className="h-8 w-8 mb-2" />
                            <span className="font-medium text-sm">{uploadFile.name}</span>
                            <span className="text-xs text-muted-foreground mt-1">Click to change</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                            <Upload className="h-8 w-8 mb-2" />
                            <span className="font-medium text-sm">Click to upload {defaultLabel}</span>
                            <span className="text-xs mt-1">PDF, DOCX, JPG, PNG up to 5MB</span>
                        </div>
                    )}
                </div>
            )}

            {/* Portfolio URL Input */}
            {type === 'portfolio' && portfolioType === 'url' && (
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="url"
                                placeholder="https://github.com/username/project"
                                value={portfolioUrl}
                                onChange={(e) => setPortfolioUrl(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        {portfolioUrl && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setPortfolioUrl('')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUrlSubmit}
                        disabled={!portfolioUrl}
                        className="w-full"
                    >
                        Use This URL
                    </Button>
                </div>
            )}

            {/* No Documents Message */}
            {documents.length === 0 && selectedOption !== 'new' && selectedOption !== 'url' && (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                    No {defaultLabel.toLowerCase()}s found. Please upload one above.
                </p>
            )}
        </div>
    );
}
