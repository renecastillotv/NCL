import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { eq, or } from 'drizzle-orm';
import { db, schema } from '../db';

// ============================================================================
// TIPOS
// ============================================================================

export interface TenantContext {
  tenant: {
    id: string;
    slug: string;
    name: string;
    clerkOrgId: string | null;
    plan: string;
    status: string;
    settings: schema.TenantSettings;
    features: schema.TenantFeatures;
    maxUsers: number;
    maxProperties: number;
    countryCode: string;
    currency: string;
    timezone: string;
  };
}

declare module 'hono' {
  interface ContextVariableMap extends TenantContext {}
}

// ============================================================================
// TENANT RESOLUTION STRATEGIES
// ============================================================================

type TenantResolutionStrategy = 'header' | 'subdomain' | 'path' | 'clerk_org';

const resolveTenantFromHeader = (headers: Headers): string | null => {
  // X-Tenant-ID header (para APIs)
  return headers.get('x-tenant-id') || headers.get('x-tenant-slug');
};

const resolveTenantFromSubdomain = (host: string): string | null => {
  // inmobiliaria.clicinmobiliaria.com -> inmobiliaria
  const parts = host.split('.');
  if (parts.length >= 3 && !['www', 'api', 'app'].includes(parts[0])) {
    return parts[0];
  }
  return null;
};

const resolveTenantFromPath = (path: string): string | null => {
  // /t/inmobiliaria/properties -> inmobiliaria
  const match = path.match(/^\/t\/([^\/]+)/);
  return match ? match[1] : null;
};

const resolveTenantFromClerkOrg = (clerkOrgId: string | null): string | null => {
  return clerkOrgId;
};

// ============================================================================
// TENANT MIDDLEWARE
// ============================================================================

interface TenantMiddlewareOptions {
  strategies?: TenantResolutionStrategy[];
  required?: boolean;
  allowedPlans?: string[];
}

export const tenantMiddleware = (options: TenantMiddlewareOptions = {}) => {
  const {
    strategies = ['header', 'clerk_org', 'subdomain', 'path'],
    required = true,
    allowedPlans,
  } = options;

  return createMiddleware<{ Variables: TenantContext }>(async (c, next) => {
    let tenantIdentifier: string | null = null;
    let identifierType: 'id' | 'slug' | 'clerk_org' = 'slug';

    // Intentar resolver el tenant usando las estrategias configuradas
    for (const strategy of strategies) {
      switch (strategy) {
        case 'header':
          tenantIdentifier = resolveTenantFromHeader(c.req.header() as unknown as Headers);
          if (tenantIdentifier) {
            // Determinar si es UUID o slug
            identifierType = isUUID(tenantIdentifier) ? 'id' : 'slug';
          }
          break;

        case 'subdomain':
          const host = c.req.header('host') || '';
          tenantIdentifier = resolveTenantFromSubdomain(host);
          identifierType = 'slug';
          break;

        case 'path':
          tenantIdentifier = resolveTenantFromPath(c.req.path);
          identifierType = 'slug';
          break;

        case 'clerk_org':
          // El clerkOrgId viene del auth middleware (se setea antes)
          const clerkOrgId = c.get('clerkOrgId' as any);
          if (clerkOrgId) {
            tenantIdentifier = clerkOrgId;
            identifierType = 'clerk_org';
          }
          break;
      }

      if (tenantIdentifier) break;
    }

    // Si no se encontró tenant y es requerido
    if (!tenantIdentifier && required) {
      throw new HTTPException(400, {
        message: 'Tenant identifier is required. Provide X-Tenant-ID header or use organization.',
      });
    }

    // Si no hay tenant y no es requerido, continuar
    if (!tenantIdentifier) {
      return next();
    }

    // Buscar el tenant en la base de datos
    const tenant = await db.query.tenants.findFirst({
      where: identifierType === 'id'
        ? eq(schema.tenants.id, tenantIdentifier)
        : identifierType === 'clerk_org'
          ? eq(schema.tenants.clerkOrgId, tenantIdentifier)
          : eq(schema.tenants.slug, tenantIdentifier),
    });

    if (!tenant) {
      throw new HTTPException(404, {
        message: `Tenant not found: ${tenantIdentifier}`,
      });
    }

    // Verificar estado del tenant
    if (tenant.status === 'suspended') {
      throw new HTTPException(403, {
        message: 'This account has been suspended. Please contact support.',
      });
    }

    if (tenant.status === 'archived') {
      throw new HTTPException(410, {
        message: 'This account has been archived.',
      });
    }

    // Verificar plan si se especifican planes permitidos
    if (allowedPlans && !allowedPlans.includes(tenant.plan)) {
      throw new HTTPException(403, {
        message: `This feature requires one of these plans: ${allowedPlans.join(', ')}. Current plan: ${tenant.plan}`,
      });
    }

    // Verificar suscripción activa (excepto free/trial)
    if (tenant.plan !== 'free') {
      const now = new Date();

      // Verificar trial
      if (tenant.subscriptionStatus === 'trialing' && tenant.trialEndsAt) {
        if (new Date(tenant.trialEndsAt) < now) {
          throw new HTTPException(402, {
            message: 'Your trial period has ended. Please upgrade to continue.',
          });
        }
      }

      // Verificar suscripción
      if (tenant.subscriptionStatus === 'past_due') {
        // Permitir acceso pero agregar warning
        c.header('X-Subscription-Warning', 'Payment past due');
      }

      if (tenant.subscriptionStatus === 'canceled') {
        throw new HTTPException(402, {
          message: 'Your subscription has been canceled. Please renew to continue.',
        });
      }
    }

    // Setear el contexto del tenant
    c.set('tenant', {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      clerkOrgId: tenant.clerkOrgId,
      plan: tenant.plan,
      status: tenant.status,
      settings: (tenant.settings || {}) as schema.TenantSettings,
      features: (tenant.features || {}) as schema.TenantFeatures,
      maxUsers: tenant.maxUsers || 3,
      maxProperties: tenant.maxProperties || 50,
      countryCode: tenant.countryCode,
      currency: tenant.currency || 'USD',
      timezone: tenant.timezone || 'America/Santo_Domingo',
    });

    return next();
  });
};

// ============================================================================
// HELPERS
// ============================================================================

const isUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// ============================================================================
// TENANT SCOPED QUERIES HELPER
// ============================================================================

export const withTenant = <T extends { tenantId: string }>(
  tenantId: string,
  data: Omit<T, 'tenantId'>
): T => {
  return { ...data, tenantId } as T;
};

// ============================================================================
// FEATURE FLAG HELPER
// ============================================================================

export const hasFeature = (
  features: schema.TenantFeatures,
  feature: keyof schema.TenantFeatures
): boolean => {
  return features[feature] === true;
};

// ============================================================================
// PLAN LIMITS HELPER
// ============================================================================

export const PLAN_LIMITS = {
  free: {
    maxUsers: 3,
    maxProperties: 50,
    maxStorageMb: 500,
    features: {
      deals: false,
      marketing: false,
      analytics: false,
      apiAccess: false,
      whiteLabel: false,
      customReports: false,
    },
  },
  starter: {
    maxUsers: 5,
    maxProperties: 200,
    maxStorageMb: 2000,
    features: {
      deals: true,
      marketing: false,
      analytics: true,
      apiAccess: false,
      whiteLabel: false,
      customReports: false,
    },
  },
  professional: {
    maxUsers: 20,
    maxProperties: 1000,
    maxStorageMb: 10000,
    features: {
      deals: true,
      marketing: true,
      analytics: true,
      apiAccess: true,
      whiteLabel: false,
      customReports: true,
    },
  },
  enterprise: {
    maxUsers: -1, // unlimited
    maxProperties: -1,
    maxStorageMb: -1,
    features: {
      deals: true,
      marketing: true,
      analytics: true,
      apiAccess: true,
      whiteLabel: true,
      customReports: true,
      aiPropertyDescriptions: true,
      aiLeadScoring: true,
      aiPriceEstimation: true,
    },
  },
} as const;
