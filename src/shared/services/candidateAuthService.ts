/**
 * Candidate Authentication Service
 * Handles candidate authentication-related API calls
 */

import { apiClient } from '@/shared/services/api';

export interface Candidate {
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

  // Work Eligibility
  visaStatus?: string;
  workEligibility?: string;
  requiresSponsorship?: boolean;

  // Job Preferences
  jobTypePreference?: string[];
  expectedSalaryMin?: string;
  expectedSalaryMax?: string;
  salaryCurrency?: string;
  salaryPreference?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  relocationWilling?: boolean;
  preferredLocations?: string;
  remotePreference?: string;
  resumeUrl?: string;

  // Privacy & Visibility
  profileVisibility?: string;
  showContactInfo?: boolean;
  showSalaryExpectations?: boolean;
  allowRecruiterContact?: boolean;
}

export interface CandidateLoginRequest {
  email: string;
  password: string;
}

export interface CandidateRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface CandidateLoginResponse {
  candidate: Candidate;
}

export interface CandidateRegisterResponse {
  candidate?: Candidate;
  message: string;
  email?: string;
}

export interface CandidateVerifyEmailResponse {
  candidate: Candidate;
  message: string;
}

class CandidateAuthService {
  async login(credentials: CandidateLoginRequest) {
    return apiClient.post<CandidateLoginResponse>('/api/candidate/auth/login', credentials);
  }

  async logout() {
    return apiClient.post('/api/candidate/auth/logout');
  }

  async register(data: CandidateRegisterRequest) {
    return apiClient.post<CandidateRegisterResponse>('/api/candidate/auth/register', data);
  }

  async getCurrentCandidate() {
    return apiClient.get<{ candidate: Candidate }>('/api/candidate/auth/me');
  }

  async verifyEmail(token: string) {
    return apiClient.get<CandidateVerifyEmailResponse>(`/api/candidate/auth/verify-email?token=${token}`);
  }
}

export const candidateAuthService = new CandidateAuthService();

