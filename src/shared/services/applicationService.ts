/**
 * Application Service
 * Handles job application API calls
 */

import { apiClient } from '@/shared/services/api';

export interface SubmitApplicationRequest {
  jobId: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  websiteUrl?: string;
  customAnswers?: Array<{
    questionId: string;
    answer: string | string[];
  }>;
  questionnaireData?: any;
  tags?: string[];
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: string;
  stage: string;
  appliedDate: string;
  resumeUrl?: string;
  coverLetterUrl?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  websiteUrl?: string;
  customAnswers?: any;
  questionnaireData?: any;
  isRead: boolean;
  isNew: boolean;
  tags: string[];
  score?: number;
  rank?: number;
  shortlisted: boolean;
  shortlistedAt?: string;
  shortlistedBy?: string;
  manuallyAdded: boolean;
  addedBy?: string;
  addedAt?: string;
  recruiterNotes?: string;
  createdAt: string;
  updatedAt: string;
}

class ApplicationService {
  async submitApplication(data: SubmitApplicationRequest) {
    return apiClient.post<{ application: Application; message: string }>('/api/applications', data);
  }

  async getApplication(id: string) {
    return apiClient.get<{ application: Application }>(`/api/applications/${id}`);
  }

  // Recruiter/admin view – does not require candidate auth
  async getApplicationForAdmin(id: string) {
    return apiClient.get<{ application: Application }>(`/api/applications/admin/${id}`);
  }

  // Get application resume with content
  async getApplicationResume(id: string) {
    return apiClient.get<{
      id: string;
      candidateId: string;
      fileName: string;
      fileUrl: string;
      fileSize: number;
      fileType: string;
      uploadedAt: string;
      content?: string;
      uploadedBy?: string;
    }>(`/api/applications/${id}/resume`);
  }

  async getCandidateApplications() {
    return apiClient.get<{ applications: Application[] }>('/api/applications');
  }

  async getJobApplications(
    jobId: string,
    filters?: {
      status?: string;
      stage?: string;
      minScore?: number;
      maxScore?: number;
      shortlisted?: boolean;
    }
  ) {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.stage) queryParams.append('stage', filters.stage);
    if (filters?.minScore !== undefined) queryParams.append('minScore', filters.minScore.toString());
    if (filters?.maxScore !== undefined) queryParams.append('maxScore', filters.maxScore.toString());
    if (filters?.shortlisted !== undefined) queryParams.append('shortlisted', filters.shortlisted.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/applications/job/${jobId}${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<{ applications: Application[] }>(endpoint);
  }

  async withdrawApplication(id: string) {
    return apiClient.post<{ application: Application; message: string }>(`/api/applications/${id}/withdraw`);
  }

  /**
   * Create application manually (by recruiter)
   */
  async createManualApplication(data: {
    jobId: string;
    candidateId: string;
    resumeUrl?: string;
    coverLetterUrl?: string;
    portfolioUrl?: string;
    linkedInUrl?: string;
    websiteUrl?: string;
    tags?: string[];
    notes?: string;
  }) {
    return apiClient.post<{ application: Application; message: string }>('/api/applications/manual', data);
  }

  /**
   * Update application score
   */
  async updateScore(id: string, score: number) {
    return apiClient.put<{ application: Application; message: string }>(`/api/applications/${id}/score`, { score });
  }

  /**
   * Bulk score candidates using AI (backend handles OpenAI)
   * POST /api/applications/bulk-score
   */
  async bulkScoreCandidates(applicationIds: string[], jobId: string) {
    return apiClient.post<{
      results: Array<{
        applicationId: string;
        score: number;
        analysis: any;
        success: boolean;
      }>;
      progress: Array<{ completed: number; total: number; current: string }>;
      summary: {
        total: number;
        successful: number;
        failed: number;
      };
    }>('/api/applications/bulk-score', {
      applicationIds,
      jobId,
    });
  }

  /**
   * Update application tags
   */
  async updateTags(id: string, tags: string[]) {
    return apiClient.put<{ application: Application; message: string }>(`/api/applications/${id}/tags`, { tags });
  }

  /**
   * Update application rank
   */
  async updateRank(id: string, rank: number) {
    return apiClient.put<{ application: Application; message: string }>(`/api/applications/${id}/rank`, { rank });
  }

  /**
   * Shortlist candidate
   */
  async shortlistCandidate(id: string) {
    return apiClient.post<{ application: Application; message: string }>(`/api/applications/${id}/shortlist`);
  }

  /**
   * Unshortlist candidate
   */
  async unshortlistCandidate(id: string) {
    return apiClient.post<{ application: Application; message: string }>(`/api/applications/${id}/unshortlist`);
  }

  /**
   * Update application stage
   */
  async updateStage(id: string, stage: string) {
    return apiClient.put<{ application: Application; message: string }>(`/api/applications/${id}/stage`, { stage });
  }

  /**
   * Move application to a round
   */
  async moveToRound(id: string, roundId: string) {
    return apiClient.put<{ application: Application; message: string }>(`/api/applications/${id}/round/${roundId}`);
  }

  /**
   * Update recruiter notes
   */
  async updateNotes(id: string, notes: string) {
    return apiClient.put<{ application: Application; message: string }>(`/api/applications/${id}/notes`, { notes });
  }

  /**
   * Update manual screening results
   */
  async updateManualScreening(id: string, data: {
    score?: number;
    status?: 'PENDING' | 'PASSED' | 'FAILED';
    notes?: string;
    completed?: boolean;
  }) {
    return apiClient.put<{ application: Application; message: string }>(
      `/api/applications/${id}/manual-screening`,
      data
    );
  }

  /**
   * Add candidate from talent pool to job
   */
  async addFromTalentPool(data: {
    jobId: string;
    candidateId: string;
    notes?: string;
  }) {
    return apiClient.post<{ application: Application; message: string }>('/api/applications/from-talent-pool', data);
  }
  /**
   * Approve a hire (Company Admin action)
   */
  async approveHire(applicationId: string) {
    return apiClient.post<{
      success: boolean;
      message: string;
      data: {
        applicationId: string;
        commissionConfirmed: boolean
      }
    }>(`/api/employer/hires/${applicationId}/approve`);
  }
}

export interface TalentPoolCandidate {
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
  visaStatus?: string;
  workEligibility?: string;
  jobTypePreference: string[];
  salaryPreference?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  relocationWilling?: boolean;
  remotePreference?: string;
  emailVerified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

class TalentPoolService {
  /**
   * Search candidates in talent pool
   */
  async searchCandidates(filters?: {
    search?: string;
    city?: string;
    state?: string;
    country?: string;
    status?: string;
    jobId?: string; // To check if candidates have already applied
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.city) queryParams.append('city', filters.city);
    if (filters?.state) queryParams.append('state', filters.state);
    if (filters?.country) queryParams.append('country', filters.country);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.jobId) queryParams.append('jobId', filters.jobId);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/talent-pool/search${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<{
      candidates: (TalentPoolCandidate & { hasApplied?: boolean })[];
      total: number;
      limit: number;
      offset: number;
    }>(endpoint);
  }

  /**
   * Send job invitation email to non-user
   */
  async sendJobInvitation(data: {
    email: string;
    jobId: string;
  }) {
    return apiClient.post<{ message: string }>('/api/talent-pool/invite', data);
  }
}

export const talentPoolService = new TalentPoolService();

export const applicationService = new ApplicationService();

