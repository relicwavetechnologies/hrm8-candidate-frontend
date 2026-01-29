export type AssessmentType = 
  | 'cognitive' 
  | 'personality' 
  | 'technical-skills'
  | 'situational-judgment'
  | 'behavioral'
  | 'culture-fit'
  | 'custom';

export type AssessmentProvider = 
  | 'testgorilla'
  | 'vervoe'
  | 'criteria'
  | 'harver'
  | 'shl'
  | 'codility'
  | 'internal';

export type AssessmentStatus = 
  | 'draft'
  | 'pending-invitation'
  | 'invited'
  | 'in-progress'
  | 'completed'
  | 'expired'
  | 'cancelled';

export interface AssessmentResult {
  assessmentType: AssessmentType;
  score: number; // 0-100
  percentile?: number;
  status: 'passed' | 'failed' | 'needs-review';
  completedDate: string;
  timeSpent: number; // minutes
  details?: {
    categoryScores?: Record<string, number>;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
  };
  reportUrl?: string;
}

export interface Assessment {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobId?: string;
  jobTitle?: string;
  employerId?: string;
  employerName?: string;
  employerLogo?: string;
  applicationId?: string;
  assessmentType: AssessmentType;
  provider: AssessmentProvider;
  status: AssessmentStatus;
  invitedBy: string;
  invitedByName: string;
  invitedDate: string;
  expiryDate: string;
  completedDate?: string;
  result?: AssessmentResult;
  overallScore?: number;
  passed?: boolean;
  passThreshold: number;
  invitationToken?: string;
  remindersSent: number;
  lastReminderDate?: string;
  cost: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  billedTo?: string;
  billedToName?: string;
  notes?: string;
  country?: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentTemplate {
  id: string;
  name: string;
  description: string;
  assessmentType: AssessmentType;
  provider: AssessmentProvider;
  duration: number; // minutes
  questionCount: number;
  passThreshold: number;
  categories: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
