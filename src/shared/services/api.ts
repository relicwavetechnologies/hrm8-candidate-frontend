/**
 * API Client Configuration
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const REQUEST_TIMEOUT_MS = 30_000;

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fields?: Record<string, string>; // Zod field-level validation errors
  details?: Record<string, unknown>;
  code?: string;
  status?: number;
}

function extractError(data: any, httpStatus: number, statusText: string): string {
  return data?.error || data?.message || `Request failed (${httpStatus}: ${statusText})`;
}

function dispatchUnauthorized() {
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      let data: any = null;
      try { data = await response.json(); } catch { /* empty body */ }

      if (!response.ok) {
        if (response.status === 401) dispatchUnauthorized();
        return {
          success: false,
          error: extractError(data, response.status, response.statusText),
          fields: data?.fields,
          details: data?.details,
          code: data?.code,
          status: response.status,
        };
      }

      return (data || { success: true }) as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as any)?.name === 'AbortError') {
        return { success: false, error: 'Request timed out. Please try again.' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error. Check your connection.',
      };
    }
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', ...options });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body != null ? JSON.stringify(body) : undefined,
    });
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    const config: RequestInit = {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      let data: any = null;
      try { data = await response.json(); } catch { /* empty body */ }

      if (!response.ok) {
        if (response.status === 401) dispatchUnauthorized();
        return {
          success: false,
          error: extractError(data, response.status, response.statusText),
          fields: data?.fields,
          details: data?.details,
          status: response.status,
        };
      }

      return (data || { success: true }) as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);
      if ((error as any)?.name === 'AbortError') {
        return { success: false, error: 'Upload timed out. Please try again.' };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed.',
      };
    }
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body != null ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body != null ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: body != null ? JSON.stringify(body) : undefined,
    });
  }

  async getBlob(endpoint: string): Promise<Blob | null> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) dispatchUnauthorized();
        console.error(`[ApiClient.getBlob] HTTP ${response.status}: ${response.statusText}`);
        return null;
      }
      return await response.blob();
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('[ApiClient.getBlob] Failed:', error);
      return null;
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiResponse };
