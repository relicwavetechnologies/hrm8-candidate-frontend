import { apiClient } from './api';
import type { CandidateResume, CandidateCoverLetter, CandidatePortfolio } from '../types/document';

class DocumentService {
    /**
     * Get all resumes for the authenticated candidate
     */
    async getResumes() {
        return apiClient.get<CandidateResume[]>('/api/candidate/documents/resumes');
    }

    /**
     * Get all cover letters for the authenticated candidate
     */
    async getCoverLetters() {
        return apiClient.get<CandidateCoverLetter[]>('/api/candidate/documents/cover-letters');
    }

    /**
     * Get all portfolio items for the authenticated candidate
     */
    async getPortfolios() {
        return apiClient.get<CandidatePortfolio[]>('/api/candidate/documents/portfolio');
    }

    /**
     * Upload a new resume
     */
    async uploadResume(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.upload<CandidateResume>('/api/candidate/documents/resumes', formData);
    }

    /**
     * Set a resume as default
     */
    async setDefaultResume(resumeId: string) {
        return apiClient.put<CandidateResume>(`/api/candidate/documents/resumes/${resumeId}/set-default`, {});
    }

    /**
     * Delete a resume
     */
    async deleteResume(resumeId: string) {
        return apiClient.delete(`/api/candidate/documents/resumes/${resumeId}`);
    }

    /**
     * Create a new cover letter
     */
    async createCoverLetter(data: { title: string; content?: string; file?: File; isTemplate?: boolean; isDraft?: boolean }) {
        const formData = new FormData();
        formData.append('title', data.title);
        if (data.content) formData.append('content', data.content);
        if (data.file) formData.append('file', data.file);
        if (data.isTemplate !== undefined) formData.append('isTemplate', String(data.isTemplate));
        if (data.isDraft !== undefined) formData.append('isDraft', String(data.isDraft));

        return apiClient.upload<CandidateCoverLetter>('/api/candidate/documents/cover-letters', formData);
    }

    /**
     * Delete a cover letter
     */
    async deleteCoverLetter(coverLetterId: string) {
        return apiClient.delete(`/api/candidate/documents/cover-letters/${coverLetterId}`);
    }

    /**
     * Create a new portfolio item
     */
    async createPortfolio(data: {
        title: string;
        type: 'file' | 'url';
        file?: File;
        externalUrl?: string;
        platform?: string;
        description?: string;
    }) {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('type', data.type);
        if (data.file) formData.append('file', data.file);
        if (data.externalUrl) formData.append('externalUrl', data.externalUrl);
        if (data.platform) formData.append('platform', data.platform);
        if (data.description) formData.append('description', data.description);

        return apiClient.upload<CandidatePortfolio>('/api/candidate/documents/portfolio', formData);
    }

    /**
     * Delete a portfolio item
     */
    async deletePortfolio(portfolioId: string) {
        return apiClient.delete(`/api/candidate/documents/portfolio/${portfolioId}`);
    }
}

export const documentService = new DocumentService();
