/**
 * Candidate Assessment Service
 * Handles assessment-related API calls for candidates
 */

import { apiClient } from '@/shared/services/api';
// import type { AssessmentConfiguration } from '@/shared/services/api/assessmentService';

export interface AssessmentSummary {
  id: string;
  invitationToken: string; // Used for accessing assessment via token-based routes
  status: 'PENDING' | 'INVITED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  jobTitle: string;
  roundName: string;
  deadline?: string; // or expiryDate
  expiryDate?: string;
  invitedAt: string;
  completedAt?: string;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'CODE';
  options?: string[]; // For multiple choice/select
  points: number;
  order: number;
}

export interface AssessmentDetails extends AssessmentSummary {
  questions?: Question[];
  config?: {
    timeLimitMinutes?: number;
    instructions?: string;
  };
  results?: any;
}

export interface AssessmentAnswer {
  questionId: string;
  response: any; // string | string[] | code
}

class CandidateAssessmentService {
  /**
   * Get all assessments for the logged-in candidate
   */
  async getAssessments() {
    return apiClient.get<{ assessments: AssessmentSummary[] }>('/api/candidate/assessments');
  }

  /**
   * Get assessment details by token (not ID - backend uses token-based access)
   */
  async getAssessment(token: string) {
    return apiClient.get<{ assessment: AssessmentDetails }>(`/api/candidate/assessments/${token}`);
  }

  /**
   * Start assessment by token (not ID - backend uses token-based access)
   */
  async startAssessment(token: string) {
    return apiClient.post<{ message: string; startedAt: string }>(`/api/candidate/assessments/${token}/start`);
  }

  /**
   * Submit assessment by token (not ID - backend uses token-based access)
   */
  async submitAssessment(token: string, answers: AssessmentAnswer[]) {
    return apiClient.post<{ message: string }>(`/api/candidate/assessments/${token}/submit`, { answers });
  }
}

export const candidateAssessmentService = new CandidateAssessmentService();
