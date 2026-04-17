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
  provider?: string;
  deliveryMode?: 'NATIVE' | 'REDIRECT';
  providerStatus?: string | null;
  syncState?: 'SYNCED' | 'PENDING' | 'ERROR';
  launchUrl?: string | null;
  reportUrl?: string | null;
  packageRef?: {
    packageId?: string;
    packageName?: string;
    durationMinutes?: number | null;
    cutoffScore?: number | null;
    resultMode?: 'SCORE' | 'PASS_FAIL' | 'REPORT_ONLY' | null;
  } | null;
  packageName?: string | null;
  launchable?: boolean;
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
  deliveryMode?: 'NATIVE' | 'REDIRECT';
  providerSummary?: Record<string, any> | null;
  providerStatus?: string | null;
  packageRef?: AssessmentSummary['packageRef'];
  reportUrl?: string | null;
  managementUrl?: string | null;
  syncState?: 'SYNCED' | 'PENDING' | 'ERROR';
  launchUrl?: string | null;
  integritySummary?: Record<string, any> | null;
  instructions?: string | null;
  launch?: {
    ready: boolean;
    mode: 'REDIRECT';
    redirectUrl?: string | null;
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
    return apiClient.post<{ message?: string; startedAt?: string; redirectUrl?: string }>(`/api/candidate/assessments/${token}/start`);
  }

  /**
   * Start assessment by token (public route — no auth required)
   */
  async startAssessmentPublic(token: string) {
    return apiClient.post<{ message?: string; startedAt?: string; redirectUrl?: string }>(`/api/assessment/${token}/start`);
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
