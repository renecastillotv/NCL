'use client';

import { useApiQuery, useApiMutation } from './use-api';
import type { Property, ListParams } from '@/types';

interface PropertiesResponse {
  data: Property[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasMore: boolean;
  };
}

interface PropertyStatsResponse {
  total: number;
  active: number;
  sold: number;
  rented: number;
  draft: number;
  totalViews: number;
  totalInquiries: number;
}

// List properties
export function useProperties(params?: ListParams & { status?: string; propertyType?: string }) {
  return useApiQuery<Property[]>(
    ['properties'],
    '/properties',
    params as Record<string, string | number | boolean>
  );
}

// Get single property
export function useProperty(id: string) {
  return useApiQuery<Property>(
    ['property', id],
    `/properties/${id}`,
    undefined,
    { enabled: !!id }
  );
}

// Property stats
export function usePropertyStats() {
  return useApiQuery<PropertyStatsResponse>(
    ['properties', 'stats'],
    '/properties/stats/summary'
  );
}

// Create property
export function useCreateProperty() {
  return useApiMutation<Property, Partial<Property>>(
    '/properties',
    'POST',
    {
      invalidateKeys: [['properties']],
    }
  );
}

// Update property
export function useUpdateProperty(id: string) {
  return useApiMutation<Property, Partial<Property>>(
    `/properties/${id}`,
    'PATCH',
    {
      invalidateKeys: [['properties'], ['property', id]],
    }
  );
}

// Delete property
export function useDeleteProperty() {
  return useApiMutation<void, { id: string }>(
    (variables) => `/properties/${variables.id}`,
    'DELETE',
    {
      invalidateKeys: [['properties']],
    }
  );
}
