import type { Context } from 'hono';

// ============================================================================
// STANDARD API RESPONSES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    status: number;
    details?: unknown;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
    hasMore?: boolean;
    timestamp: string;
    requestId?: string;
  };
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export const successResponse = <T>(
  c: Context,
  data: T,
  meta?: Partial<ApiResponse['meta']>,
  status = 200
) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
      requestId: c.req.header('x-request-id') || crypto.randomUUID(),
    },
  };

  return c.json(response, status as any);
};

export const paginatedResponse = <T>(
  c: Context,
  data: T[],
  pagination: {
    total: number;
    page: number;
    limit: number;
  }
) => {
  const pages = Math.ceil(pagination.total / pagination.limit);
  const hasMore = pagination.page < pages;

  return successResponse(c, data, {
    total: pagination.total,
    page: pagination.page,
    limit: pagination.limit,
    pages,
    hasMore,
  });
};

export const createdResponse = <T>(c: Context, data: T) => {
  return successResponse(c, data, undefined, 201);
};

export const noContentResponse = (c: Context) => {
  return c.body(null, 204);
};

// ============================================================================
// PAGINATION HELPERS
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const parsePagination = (
  query: { page?: string; limit?: string },
  defaults = { page: 1, limit: 30, maxLimit: 100 }
): PaginationParams => {
  const page = Math.max(1, parseInt(query.page || String(defaults.page), 10));
  const limit = Math.min(
    defaults.maxLimit,
    Math.max(1, parseInt(query.limit || String(defaults.limit), 10))
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

// ============================================================================
// SORTING HELPERS
// ============================================================================

export interface SortParams {
  orderBy: string;
  orderDirection: 'asc' | 'desc';
}

export const parseSort = (
  query: { sort?: string; order?: string },
  allowedFields: string[],
  defaults = { orderBy: 'createdAt', orderDirection: 'desc' as const }
): SortParams => {
  const orderBy = allowedFields.includes(query.sort || '')
    ? query.sort!
    : defaults.orderBy;

  const orderDirection =
    query.order === 'asc' || query.order === 'desc'
      ? query.order
      : defaults.orderDirection;

  return { orderBy, orderDirection };
};

// ============================================================================
// FILTER HELPERS
// ============================================================================

export const parseFilters = <T extends Record<string, unknown>>(
  query: Record<string, string | undefined>,
  allowedFilters: (keyof T)[]
): Partial<T> => {
  const filters: Partial<T> = {};

  for (const key of allowedFilters) {
    const value = query[key as string];
    if (value !== undefined && value !== '') {
      (filters as any)[key] = value;
    }
  }

  return filters;
};
