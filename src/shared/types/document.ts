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
