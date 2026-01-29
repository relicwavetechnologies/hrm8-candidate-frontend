import type { ApplicationFormConfig } from './applicationForm';

export interface HiringTeamMember {
  id: string;
  userId?: string;
  email: string;
  name: string;
  role: 'hiring_manager' | 'recruiter' | 'interviewer' | 'coordinator';
  permissions: {
    canViewApplications: boolean;
    canShortlist: boolean;
    canScheduleInterviews: boolean;
    canMakeOffers: boolean;
  };
  status: 'active' | 'pending_invite';
  invitedAt?: string;
  addedBy?: string;
}

export type JobPipelineStage =
  | 'INTAKE'
  | 'SOURCING'
  | 'SCREENING'
  | 'SHORTLIST_SENT'
  | 'INTERVIEW'
  | 'OFFER'
  | 'PLACED'
  | 'ON_HOLD'
  | 'CLOSED';

export interface JobPipelineStatus {
  stage: JobPipelineStage;
  progress?: number;
  note?: string | null;
  updatedAt?: string | null;
  updatedBy?: string | null;
  consultantId?: string;
}

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  employerLogo?: string;
  createdBy: string;
  createdByName: string;
  title: string;
  numberOfVacancies: number;
  jobCode: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  department: string;
  location: string;
  country?: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'casual';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'annual';
  salaryDescription?: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  status: 'draft' | 'open' | 'closed' | 'on-hold' | 'filled' | 'cancelled' | 'template';
  visibility: 'public' | 'private';
  stealth: boolean;
  postingDate: string;
  closeDate?: string;
  tags: string[];
  workArrangement: 'on-site' | 'remote' | 'hybrid';
  aiGeneratedDescription: boolean;
  serviceType: 'self-managed' | 'shortlisting' | 'full-service' | 'executive-search' | 'rpo';
  serviceStatus?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedConsultantId?: string;
  assignedConsultantName?: string;
  pipeline?: JobPipelineStatus;
  jobBoardDistribution: string[];
  applicantsCount: number;
  unreadApplicants?: number;
  viewsCount: number;
  clicksCount?: number;
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  hiringTeam?: HiringTeamMember[];
  applicationForm?: ApplicationFormConfig;

  // JobTarget Promotion & Payment
  hasJobTargetPromotion?: boolean;
  jobTargetPromotionId?: string;
  jobTargetChannels?: string[];
  jobTargetBudget?: number;
  jobTargetBudgetSpent?: number;
  jobTargetBudgetRemaining?: number;
  jobTargetStatus?: 'pending' | 'active' | 'paused' | 'completed';
  jobTargetApproved?: boolean;
  jobTargetPromotions?: string[];
  paymentId?: string;
  requiresPayment?: boolean;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'PENDING' | 'PAID' | 'FAILED' | 'PROCESSING' | 'REFUNDED';
  serviceFee?: number;
  servicePackage?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  paymentCompletedAt?: Date | string;
  paymentFailedAt?: Date | string;
  termsAccepted?: boolean;
  termsAcceptedAt?: Date;
  termsAcceptedBy?: string;

  // Post-Launch Configuration
  alertsEnabled?: {
    newApplicants?: boolean;
    inactivity?: boolean;
    deadlines?: boolean;
    inactivityDays?: number;
  };
  shareLink?: string;
  referralLink?: string;
  savedAsTemplate?: boolean;
  templateId?: string;

  // Internal Job Posting Fields
  isInternal?: boolean;
  internalOnly?: boolean;
  eligibleDepartments?: string[];
  internalApplyDeadline?: string;
  currentEmployeePriority?: boolean;

  // Requisition Link
  requisitionId?: string;

  // AI Interview Configuration
  aiInterviewConfig?: {
    defaultMode: 'video' | 'phone' | 'text';
    questionSource: 'predefined' | 'ai-generated' | 'hybrid';
    defaultQuestions?: Array<{
      question: string;
      category: 'technical' | 'behavioral' | 'situational' | 'cultural' | 'experience';
    }>;
  };

  // Video Interviewing
  videoInterviewingEnabled?: boolean;
}

export interface JobTemplate {
  id: string;
  employerId?: string;
  templateName: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  employmentType: string;
  department: string;
  experienceLevel: string;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: string;
}

export interface JobActivity {
  id: string;
  jobId: string;
  userId: string;
  userName: string;
  activityType: 'created' | 'updated' | 'status-changed' | 'service-activated' | 'candidate-moved' | 'published' | 'closed';
  activityDescription: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface JobFormData {
  // Service Type
  serviceType: 'self-managed' | 'shortlisting' | 'full-service' | 'executive-search' | 'rpo';

  // Step 1: Basic Details
  title: string;
  numberOfVacancies: number;
  department: string;
  location: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'casual';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  workArrangement: 'on-site' | 'remote' | 'hybrid';
  tags: string[]; // Legacy field - keep for backward compatibility
  category_id?: string; // NEW: FK to JobCategory
  tag_ids?: string[]; // NEW: Array of JobTag IDs

  // Step 2: Job Description
  positionDescriptionFile?: File | null;
  positionDescriptionText?: string;
  extractedJobData?: {
    title?: string;
    description?: string;
    requirements: string[];
    responsibilities: string[];
    qualifications?: string[];
    benefits?: string[];
    salaryRange?: {
      min?: number;
      max?: number;
      currency?: string;
      period?: string;
    };
    location?: string;
    employmentType?: string;
    experienceLevel?: string;
    department?: string;
  };
  description: string;
  requirements: Array<{ id: string; text: string; order: number }>;
  responsibilities: Array<{ id: string; text: string; order: number }>;

  // Step 3: Compensation, Details & Hiring Team
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryPeriod: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'annual';
  salaryDescription?: string;
  hideSalary: boolean;
  closeDate?: string;
  visibility: 'public' | 'private';
  stealth: boolean;
  hiringTeam: HiringTeamMember[];

  // Step 4: Application Form
  applicationForm: ApplicationFormConfig;

  // Step 5: Review & Publish
  status: 'draft' | 'open';
  jobBoardDistribution: string[];

  // Step 6: Payment & JobTarget
  includeJobTargetPromotion?: boolean;
  jobTargetBudgetTier?: 'basic' | 'standard' | 'premium' | 'executive' | 'custom' | 'none';
  jobTargetBudgetCustom?: number;
  selectedPaymentMethod?: 'account' | 'credit_card';
  paymentInvoiceRequested?: boolean;
  termsAccepted?: boolean;

  // Video Interviewing
  videoInterviewingEnabled?: boolean;

  // Consultant Assignment
  assignedConsultantId?: string;
  assignmentMode?: 'AUTO' | 'MANUAL';
  regionId?: string;

  // Screening
  screeningEnabled?: boolean;
  automatedScreeningEnabled?: boolean;
  screeningCriteria?: unknown;
  preInterviewQuestionnaireEnabled?: boolean;

  // Job Rounds (for future use)
  jobRounds?: unknown[];
}
