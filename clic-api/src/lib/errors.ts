import { HTTPException } from 'hono/http-exception';

// ============================================================================
// CUSTOM ERROR CLASSES
// ============================================================================

export class ValidationError extends HTTPException {
  constructor(message: string, details?: Record<string, string[]>) {
    super(400, {
      message,
      cause: { type: 'VALIDATION_ERROR', details },
    });
  }
}

export class NotFoundError extends HTTPException {
  constructor(resource: string, identifier?: string) {
    super(404, {
      message: identifier
        ? `${resource} not found: ${identifier}`
        : `${resource} not found`,
      cause: { type: 'NOT_FOUND', resource, identifier },
    });
  }
}

export class UnauthorizedError extends HTTPException {
  constructor(message = 'Authentication required') {
    super(401, {
      message,
      cause: { type: 'UNAUTHORIZED' },
    });
  }
}

export class ForbiddenError extends HTTPException {
  constructor(message = 'Access denied') {
    super(403, {
      message,
      cause: { type: 'FORBIDDEN' },
    });
  }
}

export class ConflictError extends HTTPException {
  constructor(message: string) {
    super(409, {
      message,
      cause: { type: 'CONFLICT' },
    });
  }
}

export class RateLimitError extends HTTPException {
  constructor(retryAfter?: number) {
    super(429, {
      message: 'Too many requests. Please try again later.',
      cause: { type: 'RATE_LIMIT', retryAfter },
    });
  }
}

export class PlanLimitError extends HTTPException {
  constructor(limit: string, currentPlan: string) {
    super(402, {
      message: `You've reached the ${limit} limit for the ${currentPlan} plan. Please upgrade to continue.`,
      cause: { type: 'PLAN_LIMIT', limit, currentPlan },
    });
  }
}

export class InternalError extends HTTPException {
  constructor(message = 'An internal error occurred') {
    super(500, {
      message,
      cause: { type: 'INTERNAL_ERROR' },
    });
  }
}

// ============================================================================
// ERROR HANDLER
// ============================================================================

export const errorResponse = (error: unknown) => {
  if (error instanceof HTTPException) {
    const cause = error.cause as { type?: string; details?: unknown } | undefined;

    return {
      success: false,
      error: {
        message: error.message,
        code: cause?.type || 'ERROR',
        status: error.status,
        details: cause?.details,
      },
    };
  }

  console.error('Unhandled error:', error);

  return {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      status: 500,
    },
  };
};
