import { apiClient } from '@/shared/services/api-client';
import type { LoginCredentials, RegisterData, AuthResponse, VerifyEmailData } from './types';

export const authService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        return apiClient.post('/api/auth/candidate/login', credentials);
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        return apiClient.post('/api/auth/candidate/register', data);
    },

    verifyEmail: async (data: VerifyEmailData): Promise<{ success: boolean; message: string }> => {
        return apiClient.post('/api/auth/candidate/verify-email', data);
    },

    resendVerification: async (email: string): Promise<{ success: boolean; message: string }> => {
        return apiClient.post('/api/auth/candidate/resend-verification', { email });
    },

    forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
        return apiClient.post('/api/auth/candidate/forgot-password', { email });
    },

    resetPassword: async (data: any): Promise<{ success: boolean; message: string }> => {
        return apiClient.post('/api/auth/candidate/reset-password', data);
    }
};
