export interface ApprovalStep {
  id: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: string;
  order: number;
}

export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  requestedBy: string;
  requestedByName: string;
  numberOfPositions: number;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'casual';
  location: string;
  justification: string;
  budgetCode?: string;
  estimatedSalary: { min: number; max: number; currency: string };
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled' | 'converted';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestDate: string;
  targetStartDate?: string;
  approvalWorkflow: ApprovalStep[];
  currentApprover?: string;
  jobId?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
