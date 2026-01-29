export type SkillCategory = 'technical' | 'soft-skills' | 'leadership' | 'domain-knowledge' | 'tools' | 'certifications';
export type ProficiencyLevel = 'none' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type AssessmentType = 'self' | 'manager' | 'peer' | '360' | 'test';
export type CertificationStatus = 'not-started' | 'in-progress' | 'active' | 'expired' | 'revoked';
export type DevelopmentPlanStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  isCore: boolean; // Core skill for the role
  requiredLevel?: ProficiencyLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SkillAssessment {
  id: string;
  consultantId: string;
  skillId: string;
  skillName: string;
  
  // Assessment details
  currentLevel: ProficiencyLevel;
  targetLevel?: ProficiencyLevel;
  assessmentType: AssessmentType;
  assessedBy: string;
  assessedByName: string;
  assessmentDate: string;
  
  // Evidence & Notes
  evidence?: string;
  notes?: string;
  strengths?: string;
  areasForImprovement?: string;
  
  // Validation
  validated: boolean;
  validatedBy?: string;
  validatedByName?: string;
  validatedDate?: string;
  
  // Metadata
  lastReviewDate?: string;
  nextReviewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  category: SkillCategory;
  currentLevel: ProficiencyLevel;
  requiredLevel: ProficiencyLevel;
  gap: number; // Numeric gap for prioritization
  priority: 'low' | 'medium' | 'high' | 'critical';
  impactOnRole: string;
  suggestedActions: string[];
}

export interface DevelopmentAction {
  id: string;
  type: 'training' | 'mentoring' | 'project' | 'certification' | 'self-study' | 'workshop' | 'other';
  title: string;
  description: string;
  targetSkills: string[]; // Skill IDs
  estimatedDuration: number; // in hours
  estimatedCost?: number;
  provider?: string;
  url?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not-started' | 'in-progress' | 'completed' | 'cancelled';
  completionDate?: string;
  notes?: string;
}

export interface DevelopmentPlan {
  id: string;
  consultantId: string;
  consultantName: string;
  
  // Plan details
  title: string;
  description: string;
  status: DevelopmentPlanStatus;
  
  // Timeline
  startDate: string;
  endDate: string;
  reviewDate?: string;
  
  // Goals & Actions
  goals: string[];
  targetSkills: string[]; // Skill IDs
  actions: DevelopmentAction[];
  
  // Progress
  completionPercentage: number;
  
  // Ownership
  createdBy: string;
  createdByName: string;
  manager?: string;
  managerName?: string;
  
  // Review & Notes
  reviewNotes?: string;
  feedback?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface Certification {
  id: string;
  consultantId: string;
  
  // Certification details
  name: string;
  issuingOrganization: string;
  description?: string;
  category: SkillCategory;
  relatedSkills: string[]; // Skill IDs
  
  // Status & Dates
  status: CertificationStatus;
  issueDate?: string;
  expiryDate?: string;
  renewalDate?: string;
  
  // Verification
  credentialId?: string;
  credentialUrl?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  
  // Documents
  certificateUrl?: string;
  
  // Renewal & Maintenance
  requiresRenewal: boolean;
  renewalPeriod?: number; // in months
  cpeRequired?: number; // Continuing Professional Education hours
  cpeCompleted?: number;
  
  // Costs
  cost?: number;
  renewalCost?: number;
  
  // Notifications
  expiryNotificationSent: boolean;
  renewalReminderSent: boolean;
  
  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillMatrixEntry {
  consultantId: string;
  consultantName: string;
  department?: string;
  role?: string;
  skills: {
    [skillId: string]: {
      level: ProficiencyLevel;
      lastAssessed: string;
      validated: boolean;
    };
  };
}

export interface CompetencyProfile {
  consultantId: string;
  consultantName: string;
  
  // Overall metrics
  totalSkills: number;
  assessedSkills: number;
  skillCompletionRate: number;
  
  // By category
  skillsByCategory: {
    [category: string]: {
      total: number;
      assessed: number;
      averageLevel: number;
    };
  };
  
  // Gaps & Development
  criticalGaps: number;
  highPriorityGaps: number;
  activeDevelopmentPlans: number;
  
  // Certifications
  activeCertifications: number;
  expiringCertifications: number;
  
  // Timeline
  lastAssessmentDate?: string;
  nextReviewDate?: string;
}
