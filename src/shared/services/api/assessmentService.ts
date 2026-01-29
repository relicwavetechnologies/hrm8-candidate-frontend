/**
 * Assessment Service - Frontend API client
 */

import { apiClient } from '../api';

export interface AssessmentConfiguration {
  id?: string;
  jobRoundId: string;
  enabled: boolean;
  autoAssign: boolean;
  deadlineDays?: number;
  timeLimitMinutes?: number;
  passThreshold?: number;
  provider?: string;
  providerConfig?: any;
  questions?: AssessmentQuestion[];
  instructions?: string;
}

export interface AssessmentQuestion {
  id?: string;
  questionText: string;
  type: 'MULTIPLE_CHOICE' | 'MULTIPLE_SELECT' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'CODE';
  options?: string[];
  correctAnswer?: any;
  points?: number;
  order?: number;
}

export interface CreateAssessmentRequest {
  enabled: boolean;
  autoAssign?: boolean;
  deadlineDays?: number;
  timeLimitMinutes?: number;
  passThreshold?: number;
  provider?: string;
  providerConfig?: any;
  questions?: AssessmentQuestion[];
  instructions?: string;
}

class AssessmentService {
  /**
   * Get assessment configuration for a job round
   */
  async getAssessmentConfig(jobId: string, roundId: string) {
    return apiClient.get<{ config: AssessmentConfiguration | null }>(
      `/api/jobs/${jobId}/rounds/${roundId}/assessment-config`
    );
  }

  /**
   * Configure assessment for a job round
   */
  async configureAssessment(jobId: string, roundId: string, config: CreateAssessmentRequest) {
    return apiClient.post<{ message: string }>(
      `/api/jobs/${jobId}/rounds/${roundId}/assessment-config`,
      config
    );
  }
}

export const assessmentService = new AssessmentService();

