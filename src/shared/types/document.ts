export type DocumentStatus = 'draft' | 'active' | 'archived' | 'expired';
export type DocumentCategory = 'policy' | 'contract' | 'handbook' | 'form' | 'certificate' | 'personal' | 'legal' | 'other';
export type AccessLevel = 'public' | 'department' | 'role' | 'private';

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  accessLevel: AccessLevel;
  createdBy: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  folderId?: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version: number;
  status: DocumentStatus;
  accessLevel: AccessLevel;
  tags: string[];
  expiryDate?: string;
  requiresSignature: boolean;
  signedBy?: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  downloadCount: number;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  changes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export interface DocumentStats {
  totalDocuments: number;
  activeDocuments: number;
  expiringDocuments: number;
  totalStorage: number;
}

// Candidate-specific document types
export interface CandidateResume {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  isDefault: boolean;
  version: number;
  uploadedAt: Date | string;
}

export interface CandidateCoverLetter {
  id: string;
  title: string;
  content?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  isTemplate: boolean;
  isDraft: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CandidatePortfolio {
  id: string;
  title: string;
  type: string; // 'file' | 'url'
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileType?: string | null;
  externalUrl?: string | null;
  platform?: string | null;
  description?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type DocumentType = 'resume' | 'cover-letter' | 'portfolio';

export interface DocumentSelectorProps {
  type: DocumentType;
  required?: boolean;
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
  onUpload?: (file: File) => void;
  onUrlSubmit?: (url: string) => void; // For portfolio URLs
  label?: string;
  description?: string;
}
