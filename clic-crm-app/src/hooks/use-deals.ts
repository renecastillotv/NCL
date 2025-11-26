'use client';

import { useApiQuery, useApiMutation } from './use-api';
import type { Deal, DealPipeline, ListParams } from '@/types';

interface DealStatsResponse {
  total: number;
  won: number;
  lost: number;
  open: number;
  totalValue: number;
  wonValue: number;
  avgDealSize: number;
}

// List deals
export function useDeals(params?: ListParams & { stageId?: string; pipelineId?: string }) {
  return useApiQuery<Deal[]>(
    ['deals'],
    '/deals',
    params as Record<string, string | number | boolean>
  );
}

// Get single deal
export function useDeal(id: string) {
  return useApiQuery<Deal & { activities: any[]; documents: any[]; commissions: any[] }>(
    ['deal', id],
    `/deals/${id}`,
    undefined,
    { enabled: !!id }
  );
}

// Deal stats
export function useDealStats() {
  return useApiQuery<DealStatsResponse>(
    ['deals', 'stats'],
    '/deals/stats/summary'
  );
}

// Get pipelines
export function usePipelines() {
  return useApiQuery<DealPipeline[]>(
    ['pipelines'],
    '/deals/pipelines'
  );
}

// Create deal
export function useCreateDeal() {
  return useApiMutation<Deal, Partial<Deal>>(
    '/deals',
    'POST',
    {
      invalidateKeys: [['deals']],
    }
  );
}

// Update deal
export function useUpdateDeal(id: string) {
  return useApiMutation<Deal, Partial<Deal>>(
    `/deals/${id}`,
    'PATCH',
    {
      invalidateKeys: [['deals'], ['deal', id]],
    }
  );
}

// Delete deal
export function useDeleteDeal() {
  return useApiMutation<void, { id: string }>(
    (variables) => `/deals/${variables.id}`,
    'DELETE',
    {
      invalidateKeys: [['deals']],
    }
  );
}
