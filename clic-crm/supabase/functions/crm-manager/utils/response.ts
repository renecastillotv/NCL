// Response formatting utilities
import { corsHeaders } from '../cors.ts';
import { UserContext } from '../middleware/auth.ts';

export interface ApiResponse {
  success: boolean;
  data?: any;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    pages?: number;
    scope?: string;
    filters_applied?: Record<string, any>;
    timestamp?: string;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export function formatResponse(result: any, context: UserContext): Response {
  const response: ApiResponse = {
    success: true,
    data: result.data,
    meta: {
      ...result.meta,
      scope: context.scope,
      timestamp: new Date().toISOString(),
    },
  };

  return new Response(JSON.stringify(response), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status: 200,
  });
}

export function formatError(message: string, status: number = 500): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code: status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : 'ERROR',
    },
  };

  return new Response(JSON.stringify(response), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
    status,
  });
}
