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
        setCandidate(response.data.candidate);
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
        setCandidate(response.data.candidate);
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${response.data.candidate.firstName} ${response.data.candidate.lastName}`,
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
        setCandidate(response.data.candidate);
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

