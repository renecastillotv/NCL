import { auth } from '@clerk/nextjs/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    status: number;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
    hasMore?: boolean;
  };
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    const url = new URL(`${this.baseUrl}/api/v1${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.tenantId) {
      headers['X-Tenant-ID'] = this.tenantId;
    }

    try {
      const response = await fetch(this.buildUrl(endpoint, params), {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            message: 'An error occurred',
            code: 'UNKNOWN_ERROR',
            status: response.status,
          },
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 'NETWORK_ERROR',
          status: 0,
        },
      };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Hook-compatible version that auto-configures token
export async function createServerApi() {
  const { getToken, orgId } = await auth();
  const token = await getToken();

  const serverApi = new ApiClient(API_URL);
  serverApi.setToken(token);
  serverApi.setTenantId(orgId);

  return serverApi;
}
