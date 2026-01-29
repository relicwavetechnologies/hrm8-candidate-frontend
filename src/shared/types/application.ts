import type { TeamMemberFeedback } from './collaborativeFeedback';

export type ApplicationStatus = 
  | 'applied' 
  | 'screening' 
  | 'interview' 
  | 'offer' 
  | 'hired' 
  | 'rejected' 
  | 'withdrawn';

export type ApplicationStage = 
  | 'New Application'
  | 'Resume Review'
  | 'Phone Screen'
  | 'Technical Interview'
  | 'Manager Interview'
  | 'Final Round'
  | 'Reference Check'
  | 'Offer Extended'
  | 'Offer Accepted'
  | 'Rejected'
  | 'Withdrawn';

export interface ApplicationAnswer {
  questionId: string;
  question: string;
  answer: string | string[];
}

export interface ApplicationNote {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

export interface ApplicationActivity {
  id: string;
  type: 'status_change' | 'note_added' | 'email_sent' | 'interview_scheduled' | 'document_uploaded' | 'rating_changed' | 'application_viewed';
  description: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  isRead?: boolean;
}

export interface Interview {
  id: string;
  type: 'phone' | 'video' | 'onsite' | 'technical' | 'behavioral';
  scheduledDate: Date;
  duration: number; // minutes
  interviewers: string[];
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  feedback?: string;
  rating?: number;
  recordingUrl?: string;
  notes?: string;
}

export interface ScorecardCriterion {
  id: string;
  name: string;
  description?: string;
  rating: number; // 1-5
  weight: number; // percentage
  notes?: string;
}

export interface Scorecard {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorRole: string;
  evaluatorPhoto?: string;
  template: string; // e.g., 'Technical Interview', 'Culture Fit', 'Leadership'
  criteria: ScorecardCriterion[];
  overallScore: number; // calculated weighted average
  recommendation: 'strong-hire' | 'hire' | 'neutral' | 'no-hire' | 'strong-no-hire';
  strengths?: string[];
  concerns?: string[];
  overallFeedback?: string;
  notes?: string;
  status: 'draft' | 'completed';
  completedAt: Date;
  createdAt: Date;
}

export interface CandidateEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate?: Date;
  endDate?: Date;
  current: boolean;
  grade?: string;
  description?: string;
}

export interface CandidateSkill {
  id: string;
  name: string;
  level?: string;
}

export interface CandidateWorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
  location?: string;
}

export interface Application {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateCity?: string;
  candidateState?: string;
  candidateCountry?: string;
  candidatePhoto?: string;
  // Nested candidate object from backend
  candidate?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    photo?: string;
    linkedInUrl?: string;
    city?: string;
    state?: string;
    country?: string;
    emailVerified: boolean;
    status: string;
    education?: CandidateEducation[];
    skills?: CandidateSkill[];
    workExperience?: CandidateWorkExperience[];
  };
  jobId: string;
  jobTitle: string;
  employerName: string;
  
  // Application Details
  appliedDate: Date;
  status: ApplicationStatus;
  stage: ApplicationStage;
  roundId?: string; // ID of the current assessment round
  
  // Internal Candidate Fields
  isInternalCandidate?: boolean;
  currentEmployeeId?: string;
  currentDepartment?: string;
  currentPosition?: string;
  currentManager?: string;
  yearsAtCompany?: number;
  internalReferral?: boolean;
  referredBy?: string;
  
  // Documents
  resumeUrl?: string;
  coverLetterUrl?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  
  // Parsed Resume Data
  parsedResume?: ParsedResume;
  
  // Candidate Preferences (from backend)
  candidatePreferences?: {
    salaryPreference?: {
      min?: number;
      max?: number;
      currency?: string;
      period?: string;
    };
    workArrangement?: string[]; // remote, hybrid, onsite
    employmentType?: string[]; // full-time, contract, etc.
    startDate?: Date;
    noticePeriod?: string;
    willingToRelocate?: boolean;
    visaStatus?: string;
  };

  // Questionnaire responses
  questionnaireData?: QuestionnaireData;
  
  // Custom Responses
  customAnswers: ApplicationAnswer[];
  
  // Scoring & Rating
  score?: number; // 0-100 fit score
  rank?: number; // Rank within job (1, 2, 3...)
  rating?: number; // 1-5 stars
  aiMatchScore?: number; // 0-100 AI-generated match percentage
  aiAnalysis?: {
    scores: {
      skills: number;
      experience: number;
      education: number;
      interview: number;
      culture: number;
      overall: number;
    };
    strengths: string[];
    concerns: string[];
    recommendation: 'strong_hire' | 'hire' | 'maybe' | 'no_hire' | 'strong_no_hire';
    justification: string;
    improvementAreas: string[];
    detailedAnalysis: {
      skillsAnalysis: string;
      experienceAnalysis: string;
      educationAnalysis: string;
      culturalFitAnalysis: string;
      overallAssessment: string;
    };
    // Enhanced AI Insights
    summary?: string;
    behavioralTraits?: string[];
    communicationStyle?: string;
    careerTrajectory?: string;
    flightRisk?: {
      level: 'Low' | 'Medium' | 'High';
      reason: string;
    };
    salaryBenchmark?: {
      position: 'Below' | 'Within' | 'Above';
      marketRange: string;
    };
    culturalFit?: {
      score: number;
      analysis: string;
      valuesMatched: string[];
    };
    analyzedAt: string;
  };
  shortlisted: boolean;
  shortlistedAt?: Date;
  shortlistedBy?: string;
  manuallyAdded: boolean;
  addedBy?: string;
  addedAt?: Date;
  recruiterNotes?: string;
  
  // Read Status
  isRead?: boolean; // Track if application has been viewed
  isNew?: boolean; // Track if application is newly submitted
  
  // Notes & Activities
  notes: ApplicationNote[];
  activities: ApplicationActivity[];
  
  // Interviews
  interviews: Interview[];
  
  // Scorecards
  scorecards?: Scorecard[];
  
  // Team Reviews
  teamReviews?: TeamMemberFeedback[];
  
  // Assignment
  assignedTo?: string; // Recruiter ID
  assignedToName?: string;
  
  // Rejection
  rejectionReason?: string;
  rejectionDate?: Date;
  
  // Tags
  tags?: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkExperience {
  id: string;
  company: string;
  companyLogo?: string;
  title: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  location?: string;
  description?: string;
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship';
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  reasonForLeaving?: string;
}

export interface Education {
  id: string;
  institution: string;
  institutionLogo?: string;
  degree: string;
  field: string;
  startDate?: Date;
  endDate?: Date;
  gpa?: number | string;
  maxGpa?: number;
  honors?: string;
  relevantCoursework?: string[];
  thesisTitle?: string;
}

export interface Skill {
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience?: number;
  lastUsed?: Date;
  endorsements?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  verificationUrl?: string;
  description?: string;
}

export interface ParsedResume {
  workHistory: WorkExperience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  summary?: string;
  parsedAt: Date;
}

export interface QuestionnaireQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiple-choice' | 'yes-no' | 'rating' | 'file';
  required: boolean;
  category?: string;
}

export interface QuestionnaireResponse {
  questionId: string;
  question: string;
  answer: string;
  type: QuestionnaireQuestion['type'];
  aiAnalysis?: {
    sentiment: 'positive' | 'neutral' | 'negative';
    qualityScore: number; // 0-100
    keyInsights: string[];
    concerns?: string[];
    strengths?: string[];
  };
}

export interface QuestionnaireData {
  responses: QuestionnaireResponse[];
  overallScore?: number;
  completionRate: number;
  timeSpent?: number; // minutes
}

export interface ApplicationFilters {
  search?: string;
  status?: ApplicationStatus[];
  stage?: ApplicationStage[];
  jobId?: string;
  candidateId?: string;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minScore?: number;
  maxScore?: number;
  tags?: string[];
}
