import type { ApprovalStep } from './requisition';

export interface OfferLetter {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  templateId: string;
  offerType: 'full-time' | 'part-time' | 'contract' | 'intern';
  salary: number;
  salaryCurrency: string;
  salaryPeriod: 'annual' | 'hourly';
  startDate: string;
  benefits: string[];
  bonusStructure?: string;
  equityOptions?: string;
  workLocation: string;
  workArrangement: 'on-site' | 'remote' | 'hybrid';
  probationPeriod?: number;
  vacationDays?: number;
  customTerms: { key: string; value: string }[];
  status: 'draft' | 'pending-approval' | 'approved' | 'sent' | 'accepted' | 'declined' | 'expired' | 'withdrawn';
  approvalWorkflow: ApprovalStep[];
  sentDate?: string;
  expiryDate?: string;
  respondedDate?: string;
  declineReason?: string;
  signedDocumentUrl?: string;
  generatedPdfUrl?: string;
  customMessage?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency';
  required: boolean;
  defaultValue?: string;
}

export interface OfferTemplate {
  id: string;
  name: string;
  description: string;
  category: 'full-time' | 'part-time' | 'executive' | 'contract' | 'intern';
  content: string;
  variables: TemplateVariable[];
  isSystemTemplate: boolean;
  createdBy?: string;
  createdAt: string;
}
