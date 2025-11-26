'use client';

import { useApiQuery, useApiMutation } from './use-api';
import type { Contact, ListParams } from '@/types';

interface ContactStatsResponse {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  hot: number;
  bySource: { source: string; count: number }[];
}

// List contacts
export function useContacts(params?: ListParams & { status?: string; source?: string; isHot?: boolean }) {
  return useApiQuery<Contact[]>(
    ['contacts'],
    '/contacts',
    params as Record<string, string | number | boolean>
  );
}

// Get single contact
export function useContact(id: string) {
  return useApiQuery<Contact & { activities: any[]; propertyInterests: any[] }>(
    ['contact', id],
    `/contacts/${id}`,
    undefined,
    { enabled: !!id }
  );
}

// Contact stats
export function useContactStats() {
  return useApiQuery<ContactStatsResponse>(
    ['contacts', 'stats'],
    '/contacts/stats/summary'
  );
}

// Create contact
export function useCreateContact() {
  return useApiMutation<Contact, Partial<Contact>>(
    '/contacts',
    'POST',
    {
      invalidateKeys: [['contacts']],
    }
  );
}

// Update contact
export function useUpdateContact(id: string) {
  return useApiMutation<Contact, Partial<Contact>>(
    `/contacts/${id}`,
    'PATCH',
    {
      invalidateKeys: [['contacts'], ['contact', id]],
    }
  );
}

// Delete contact
export function useDeleteContact() {
  return useApiMutation<void, { id: string }>(
    (variables) => `/contacts/${variables.id}`,
    'DELETE',
    {
      invalidateKeys: [['contacts']],
    }
  );
}

// Add activity
export function useAddContactActivity(contactId: string) {
  return useApiMutation<any, { type: string; title: string; description?: string }>(
    `/contacts/${contactId}/activities`,
    'POST',
    {
      invalidateKeys: [['contact', contactId]],
    }
  );
}
