'use client';

import { useAuth, useOrganization } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiResponse } from '@/lib/api';
import { useEffect } from 'react';

// Configure API client with auth
export function useApiConfig() {
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  useEffect(() => {
    const configureApi = async () => {
      const token = await getToken();
      api.setToken(token);
      api.setTenantId(organization?.id || null);
    };

    configureApi();
  }, [getToken, organization?.id]);
}

// Generic query hook
export function useApiQuery<T>(
  key: string[],
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  }
) {
  const { getToken } = useAuth();
  const { organization } = useOrganization();

  return useQuery({
    queryKey: [...key, organization?.id, params],
    queryFn: async () => {
      const token = await getToken();
      api.setToken(token);
      api.setTenantId(organization?.id || null);

      const response = await api.get<T>(endpoint, params);

      if (!response.success) {
        throw new Error(response.error?.message || 'API Error');
      }

      return response;
    },
    enabled: options?.enabled !== false && !!organization?.id,
    staleTime: options?.staleTime,
    refetchInterval: options?.refetchInterval,
  });
}

// Generic mutation hook
export function useApiMutation<TData, TVariables>(
  endpoint: string | ((variables: TVariables) => string),
  method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
  options?: {
    invalidateKeys?: string[][];
    onSuccess?: (data: ApiResponse<TData>) => void;
    onError?: (error: Error) => void;
  }
) {
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const token = await getToken();
      api.setToken(token);
      api.setTenantId(organization?.id || null);

      const url = typeof endpoint === 'function' ? endpoint(variables) : endpoint;

      let response: ApiResponse<TData>;

      switch (method) {
        case 'POST':
          response = await api.post<TData>(url, variables);
          break;
        case 'PATCH':
          response = await api.patch<TData>(url, variables);
          break;
        case 'DELETE':
          response = await api.delete<TData>(url);
          break;
      }

      if (!response.success) {
        throw new Error(response.error?.message || 'API Error');
      }

      return response;
    },
    onSuccess: (data) => {
      // Invalidate queries
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
}
