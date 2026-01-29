export interface LoginCredentials {
    email: string;
    password?: string;
}

export interface RegisterData {
    email: string;
    firstName: string;
    lastName: string;
    password?: string;
    phone?: string;
}

export interface VerifyEmailData {
    email: string;
    code: string;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    candidate?: any; // Will use Candidate type from shared/types
    message?: string;
    error?: string;
}
