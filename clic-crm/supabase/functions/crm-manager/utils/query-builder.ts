// Query builder with automatic scope filtering
import { UserContext } from '../middleware/auth.ts';

export interface QueryOptions {
  filters?: Record<string, any>;
  search?: string;
  searchFields?: string[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  pagination?: {
    page: number;
    limit: number;
  };
}

// Apply scope-based filtering to query
export function applyScopeFilters(
  query: any,
  context: UserContext,
  options: {
    ownerField?: string;
    teamField?: string;
    countryField?: string;
  } = {}
): any {
  const {
    ownerField = 'created_by',
    teamField = 'team_id',
    countryField = 'country_code',
  } = options;

  // Apply filters based on user scope
  switch (context.scope) {
    case 'own':
      // Only show records owned by user
      query = query.eq(ownerField, context.userId);
      break;

    case 'team':
      // Show records from user's team OR owned by user
      if (context.team_id) {
        query = query.or(`${teamField}.eq.${context.team_id},${ownerField}.eq.${context.userId}`);
      } else {
        query = query.eq(ownerField, context.userId);
      }
      break;

    case 'country':
      // Show all records from user's country
      query = query.eq(countryField, context.country_code);
      break;

    case 'all':
      // Super admin: no filtering
      break;
  }

  return query;
}

// Apply additional filters from request params
export function applyFilters(query: any, filters: Record<string, any>): any {
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    // Handle array values (IN queries)
    if (Array.isArray(value)) {
      query = query.in(key, value);
    }
    // Handle range queries
    else if (typeof value === 'object' && (value.gte !== undefined || value.lte !== undefined)) {
      if (value.gte !== undefined) {
        query = query.gte(key, value.gte);
      }
      if (value.lte !== undefined) {
        query = query.lte(key, value.lte);
      }
    }
    // Handle boolean
    else if (typeof value === 'boolean') {
      query = query.eq(key, value);
    }
    // Handle text search with ILIKE
    else if (typeof value === 'string' && value.includes('%')) {
      query = query.ilike(key, value);
    }
    // Standard equality
    else {
      query = query.eq(key, value);
    }
  });

  return query;
}

// Apply search across multiple fields
export function applySearch(
  query: any,
  searchTerm: string,
  searchFields: string[]
): any {
  if (!searchTerm || !searchFields.length) {
    return query;
  }

  // Build OR conditions for search
  const conditions = searchFields
    .map((field) => `${field}.ilike.%${searchTerm}%`)
    .join(',');

  return query.or(conditions);
}

// Apply ordering
export function applyOrdering(
  query: any,
  orderBy?: string,
  direction: 'asc' | 'desc' = 'desc'
): any {
  if (!orderBy) {
    return query.order('created_at', { ascending: direction === 'asc' });
  }

  return query.order(orderBy, { ascending: direction === 'asc' });
}

// Apply pagination
export function applyPagination(
  query: any,
  pagination?: { page: number; limit: number }
): any {
  if (!pagination) {
    return query;
  }

  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  return query.range(offset, offset + limit - 1);
}

// Build complete query with all options
export function buildQuery(
  baseQuery: any,
  context: UserContext,
  options: QueryOptions,
  scopeOptions?: {
    ownerField?: string;
    teamField?: string;
    countryField?: string;
  }
): any {
  let query = baseQuery;

  // Apply scope filtering
  query = applyScopeFilters(query, context, scopeOptions);

  // Apply additional filters
  if (options.filters) {
    query = applyFilters(query, options.filters);
  }

  // Apply search
  if (options.search && options.searchFields) {
    query = applySearch(query, options.search, options.searchFields);
  }

  // Apply ordering
  query = applyOrdering(query, options.orderBy, options.orderDirection);

  // Apply pagination
  if (options.pagination) {
    query = applyPagination(query, options.pagination);
  }

  return query;
}
