/**
 * Job Service
 * Handles job-related API calls
 */

import { apiClient } from '@/shared/services/api';

export interface PublicJob {
  id: string;
  title: string;
  description: string;
  jobSummary?: string;
  category?: string;
  location: string;
  department?: string;
  workArrangement: string;
  employmentType: string;
  numberOfVacancies: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  salaryDescription?: string;
  requirements: string[];
  responsibilities: string[];
  promotionalTags: string[];
  featured: boolean;
  postingDate?: string;
  expiryDate?: string;
  regionId?: string;
  company: {
    id: string;
    name: string;
    website: string;
    domain?: string;
    logoUrl?: string | null;
    aboutCompany?: string | null;
  };
  applicationForm?: any;
  createdAt: string;
}

export interface PublicJobSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  companyId?: string;
  department?: string;
  category?: string;
  tags?: string;
  employmentType?: string;
  workArrangement?: string;
  salaryMin?: number;
  salaryMax?: number;
  featured?: boolean;
  // Keep offset for backward compatibility
  offset?: number;
}

export interface JobFilterOptions {
  categories: string[];
  departments: string[];
  locations: string[];
  companies: Array<{ id: string; name: string }>;
  tags: string[];
}

export interface JobAggregation {
  value: string;
  count: number;
}

export interface JobAggregationsResponse {
  categories: JobAggregation[];
  locations: JobAggregation[];
  departments: JobAggregation[];
  tags: JobAggregation[];
  employmentTypes: JobAggregation[];
  workArrangements: JobAggregation[];
}

export interface PublicJobSearchResponse {
  jobs: PublicJob[];
  total: number;
  limit: number;
  offset?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  isRegionFiltered?: boolean;
  regionNote?: string | null;
}

export interface ApplicationFormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
}

export interface ApplicationFormQuestion {
  id: string;
  type: 'short_text' | 'long_text' | 'multiple_choice' | 'file_upload';
  label: string;
  required: boolean;
  options?: Array<{ id: string; value: string; label: string }>;
}

export interface ApplicationFormResponse {
  jobId: string;
  title: string;
  company: {
    id: string;
    name: string;
    domain: string;
  };
  form: {
    fields: ApplicationFormField[];
    questions: ApplicationFormQuestion[];
  } | null;
}

class JobService {
  async getPublicJobs(params?: PublicJobSearchParams) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.companyId) queryParams.append('companyId', params.companyId);
    if (params?.department) queryParams.append('department', params.department);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.tags) queryParams.append('tags', params.tags);
    if (params?.employmentType) queryParams.append('employmentType', params.employmentType);
    if (params?.workArrangement) queryParams.append('workArrangement', params.workArrangement);
    if (params?.salaryMin !== undefined) queryParams.append('salaryMin', params.salaryMin.toString());
    if (params?.salaryMax !== undefined) queryParams.append('salaryMax', params.salaryMax.toString());
    if (params?.featured !== undefined) queryParams.append('featured', params.featured.toString());
    // Keep offset for backward compatibility
    if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());

    return apiClient.get<PublicJobSearchResponse>(
      `/api/public/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
  }

  async getPublicJobById(id: string) {
    // Backend returns { success: true, data: { ...jobFields } } directly, not { job: {...} }
    return apiClient.get<PublicJob>(`/api/public/jobs/${id}`);
  }

  async getFilterOptions() {
    return apiClient.get<{ data: JobFilterOptions }>('/api/public/jobs/filters');
  }

  /**
   * Get filter aggregations with job counts
   * Returns categories, locations, tags, etc. with how many jobs match each
   */
  async getAggregations() {
    return apiClient.get<JobAggregationsResponse>('/api/public/jobs/aggregations');
  }

  /**
   * Get related jobs from the same company
   * @param jobId - The job ID to get related jobs for
   * @param limit - Maximum number of related jobs to return (default: 5)
   */
  async getRelatedJobs(jobId: string, limit: number = 5) {
    return apiClient.get<{ jobs: PublicJob[] }>(`/api/public/jobs/${jobId}/related?limit=${limit}`);
  }

  /**
   * Get application form configuration for a specific job
   * @param jobId - The job ID to get the application form for
   */
  async getApplicationForm(jobId: string) {
    return apiClient.get<ApplicationFormResponse>(`/api/public/jobs/${jobId}/application-form`);
  }
}

export const jobService = new JobService();