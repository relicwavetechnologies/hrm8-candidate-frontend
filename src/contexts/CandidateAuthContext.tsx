/**
 * Candidate Authentication Context
 * Manages candidate authentication state across the application
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateAuthService } from '@/shared/services/candidateAuthService';
import type { Candidate, CandidateRegisterRequest } from '@/shared/services/candidateAuthService';
import { useToast } from '@/shared/hooks/use-toast';

interface CandidateAuthContextType {
  candidate: Candidate | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: CandidateRegisterRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshCandidate: () => Promise<void>;
}

const CandidateAuthContext = createContext<CandidateAuthContextType | undefined>(undefined);

// Normalize the backend response (snake_case DB columns) to camelCase Candidate type
function normalizeCandidate(raw: any): Candidate {
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.firstName ?? raw.first_name ?? '',
    lastName: raw.lastName ?? raw.last_name ?? '',
    phone: raw.phone,
    photo: raw.photo,
    linkedInUrl: raw.linkedInUrl ?? raw.linkedin_url,
    city: raw.city,
    state: raw.state,
    country: raw.country,
    emailVerified: raw.emailVerified ?? raw.email_verified ?? false,
    status: raw.status,
    visaStatus: raw.visaStatus ?? raw.visa_status,
    workEligibility: raw.workEligibility ?? raw.work_eligibility,
    requiresSponsorship: raw.requiresSponsorship ?? raw.requires_sponsorship,
    jobTypePreference: raw.jobTypePreference ?? raw.job_type_preference,
    expectedSalaryMin: raw.expectedSalaryMin ?? raw.expected_salary_min,
    expectedSalaryMax: raw.expectedSalaryMax ?? raw.expected_salary_max,
    salaryCurrency: raw.salaryCurrency ?? raw.salary_currency,
    salaryPreference: raw.salaryPreference ?? raw.salary_preference,
    relocationWilling: raw.relocationWilling ?? raw.relocation_willing,
    preferredLocations: raw.preferredLocations ?? raw.preferred_locations,
    remotePreference: raw.remotePreference ?? raw.remote_preference,
    resumeUrl: raw.resumeUrl ?? raw.resume_url,
    profileVisibility: raw.profileVisibility ?? raw.profile_visibility,
    showContactInfo: raw.showContactInfo ?? raw.show_contact_info,
    showSalaryExpectations: raw.showSalaryExpectations ?? raw.show_salary_expectations,
    allowRecruiterContact: raw.allowRecruiterContact ?? raw.allow_recruiter_contact,
  };
}

export function CandidateAuthProvider({ children }: { children: ReactNode }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if candidate is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await candidateAuthService.getCurrentCandidate();
      if (response.data?.candidate) {
        setCandidate(normalizeCandidate(response.data.candidate));
      } else {
        setCandidate(null);
      }
    } catch (error) {
      setCandidate(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await candidateAuthService.login({ email, password });
      if (!response.success) {
        const errorMessage = response.error || 'Login failed. Please check your credentials.';
        toast({
          title: 'Login failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      }

      if (response.data?.candidate) {
        const normalized = normalizeCandidate(response.data.candidate);
        setCandidate(normalized);
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${normalized.firstName} ${normalized.lastName}`,
        });
        navigate('/candidate/dashboard');
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please check your credentials.';
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (
    data: CandidateRegisterRequest
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await candidateAuthService.register(data);
      if (!response.success) {
        const errorMessage = response.error || 'Registration failed. Please try again.';
        toast({
          title: 'Registration failed',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: errorMessage };
      }

      if (response.success) {
        // Registration successful but verification needed
        toast({
          title: 'Registration successful!',
          description: response.data?.message || 'Please check your email to verify your account.',
        });
        // Do not set candidate or navigate - let the component handle the UI
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error: any) {
      const errorMessage = error?.message || 'Registration failed. Please try again.';
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await candidateAuthService.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      setCandidate(null);
      navigate('/candidate/login');
    }
  };

  const refreshCandidate = async (): Promise<void> => {
    try {
      const response = await candidateAuthService.getCurrentCandidate();
      if (response.data?.candidate) {
        setCandidate(normalizeCandidate(response.data.candidate));
      } else {
        setCandidate(null);
      }
    } catch (error) {
      setCandidate(null);
    }
  };

  return (
    <CandidateAuthContext.Provider
      value={{
        candidate,
        isLoading,
        isAuthenticated: !!candidate,
        login,
        register,
        logout,
        refreshCandidate,
      }}
    >
      {children}
    </CandidateAuthContext.Provider>
  );
}

export function useCandidateAuth() {
  const context = useContext(CandidateAuthContext);
  if (context === undefined) {
    throw new Error('useCandidateAuth must be used within a CandidateAuthProvider');
  }
  return context;
}

