/**
 * Candidate Assessment Service
 * Handles assessment-related API calls for candidates
 * Supports both authenticated (candidate portal) and public (token-based email link) access
 */

import { apiClient } from '@/shared/services/api';

export interface AssessmentSummary {
  id: string;
  invitationToken: string;
  status: 'PENDING' | 'INVITED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  jobTitle: string;
  roundName: string;
  deadline?: string;
  expiryDate?: string;
  invitedAt: string;
  completedAt?: string;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'CODE';
  options?: string[];
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
  response: any;
}

class CandidateAssessmentService {
  /**
   * Get all assessments for the logged-in candidate (authenticated)
   */
  async getAssessments() {
    return apiClient.get<{ assessments: AssessmentSummary[] }>('/api/candidate/assessments');
  }

  /**
   * Get assessment details by token (authenticated candidate route)
   */
  async getAssessment(token: string) {
    return apiClient.get<{ assessment: AssessmentDetails }>(`/api/candidate/assessments/${token}`);
  }

  /**
   * Get assessment details by token (public route — no auth required)
   */
  async getAssessmentPublic(token: string) {
    return apiClient.get<{ assessment: AssessmentDetails }>(`/api/assessment/${token}`);
  }

  /**
   * Start assessment by token (authenticated candidate route)
   */
  async startAssessment(token: string) {
    return apiClient.post<{ message: string; startedAt: string }>(`/api/candidate/assessments/${token}/start`);
  }

  /**
   * Start assessment by token (public route — no auth required)
   */
  async startAssessmentPublic(token: string) {
    return apiClient.post<{ message: string; startedAt: string }>(`/api/assessment/${token}/start`);
  }

  /**
   * Submit assessment by token (authenticated candidate route)
   */
  async submitAssessment(token: string, answers: AssessmentAnswer[]) {
    return apiClient.post<{ message: string }>(`/api/candidate/assessments/${token}/submit`, { answers });
  }

  /**
   * Submit assessment by token (public route — no auth required)
   * Note: public route backend expects field name `responses`, not `answers`
   */
  async submitAssessmentPublic(token: string, answers: AssessmentAnswer[]) {
    return apiClient.post<{ message: string }>(`/api/assessment/${token}/submit`, { responses: answers });
  }

  /**
   * Save individual response (public route — no auth required, supports auto-save)
   */
  async saveResponsePublic(token: string, questionId: string, response: any) {
    return apiClient.post<{ message: string }>(`/api/assessment/${token}/save`, { questionId, response });
  }
}

export const candidateAssessmentService = new CandidateAssessmentService();
