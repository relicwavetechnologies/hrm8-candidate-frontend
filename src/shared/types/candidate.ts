export type ConsultantType = 'sales-rep' | 'recruiter' | '360-consultant' | 'industry-partner';

export type ConsultantStatus = 'active' | 'on-leave' | 'inactive' | 'suspended';

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'freelance';

export type PrimaryRole = 'recruitment' | 'sales' | 'both';

export interface SalesMetrics {
  closedDeals: number;
  totalSalesRevenue: number;
  activeOpportunities: number;
  averageDealSize: number;
  quotaAttainment: number; // Percentage
}

export interface RecruitmentMetrics {
  totalPlacements: number;
  totalRevenue: number;
  successRate: number;
  averageDaysToFill: number;
}

export interface Consultant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  
  // Type & Status
  type: ConsultantType;
  primaryRole: PrimaryRole; // Clarifies if they focus on recruitment, sales, or both
  status: ConsultantStatus;
  employmentType: EmploymentType;
  
  // Professional Details
  title?: string;
  specialization: string[];
  yearsOfExperience: number;
  bio?: string;
  
  // Employment Details
  hireDate: string;
  terminationDate?: string;
  reportingTo?: string;
  reportingToName?: string;
  department?: string;
  
  // Location
  location: string; // "City, State" format for display
  officeLocation?: string;
  city?: string;
  state?: string;
  country: string;
  timezone?: string;
  
  // Capacity & Limits
  maxEmployers: number;
  currentEmployers: number;
  maxJobs: number;
  currentJobs: number;
  
  // Performance Metrics (Quick Access)
  totalPlacements: number;
  totalRevenue: number;
  successRate: number;
  averageDaysToFill: number;
  clientSatisfaction?: number;
  candidateSatisfaction?: number;
  
  // Role-Specific Metrics
  salesMetrics?: SalesMetrics; // For sales-rep and 360-consultant
  recruitmentMetrics?: RecruitmentMetrics; // For recruiter and 360-consultant
  
  // Commission
  commissionStructure: 'percentage' | 'flat' | 'tiered' | 'custom';
  defaultCommissionRate?: number;
  totalCommissionsPaid: number;
  pendingCommissions: number;
  
  // Relationships
  assignedEmployers: string[]; // Employer IDs
  assignedJobs: string[]; // Job IDs
  
  // Social & Links
  linkedInUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  
  // Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  calendarIntegration?: boolean;
  
  // Tags & Classification
  tags: string[];
  certifications?: string[];
  languages?: string[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
  
  // Internal Notes
  internalNotes?: string;
}
