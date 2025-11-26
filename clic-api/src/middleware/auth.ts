import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { eq, and } from 'drizzle-orm';
import { db, schema } from '../db';
import type { TenantContext } from './tenant';

// ============================================================================
// CLERK CLIENT
// ============================================================================

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// ============================================================================
// TIPOS
// ============================================================================

export interface UserContext {
  user: {
    id: string;          // UUID interno (de nuestra DB)
    clerkUserId: string; // ID de Clerk
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    permissions: schema.UserPermissions;
    teamId: string | null;
    avatarUrl: string | null;
  };
  clerkOrgId: string | null;
}

declare module 'hono' {
  interface ContextVariableMap extends UserContext, TenantContext {}
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: {
    module: keyof schema.UserPermissions;
    action: string;
    scope?: 'own' | 'team' | 'all';
  };
}

export const authMiddleware = (options: AuthMiddlewareOptions = {}) => {
  const { required = true, roles, permissions } = options;

  return createMiddleware<{ Variables: UserContext & TenantContext }>(async (c, next) => {
    // Obtener token del header
    const authHeader = c.req.header('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      if (required) {
        throw new HTTPException(401, {
          message: 'Authentication required. Provide Bearer token.',
        });
      }
      return next();
    }

    try {
      // Verificar token con Clerk
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });

      const clerkUserId = payload.sub;
      const clerkOrgId = payload.org_id || null;

      // Setear clerkOrgId para que el tenant middleware lo use
      c.set('clerkOrgId' as any, clerkOrgId);

      // Obtener tenant del contexto (si ya está seteado)
      const tenant = c.get('tenant');

      if (!tenant && required) {
        throw new HTTPException(400, {
          message: 'Tenant context is required for authenticated requests.',
        });
      }

      // Buscar usuario en nuestra base de datos
      let user = tenant
        ? await db.query.users.findFirst({
            where: and(
              eq(schema.users.clerkUserId, clerkUserId),
              eq(schema.users.tenantId, tenant.id)
            ),
          })
        : null;

      // Si el usuario no existe en este tenant pero tiene clerkUserId válido,
      // verificar si es la primera vez que accede a esta organización
      if (!user && tenant && clerkOrgId) {
        // Verificar membresía en Clerk
        try {
          const clerkUser = await clerk.users.getUser(clerkUserId);

          // Crear usuario automáticamente si es miembro de la organización
          const memberships = await clerk.organizations.getOrganizationMembershipList({
            organizationId: clerkOrgId,
          });

          const membership = memberships.data.find(
            (m) => m.publicUserData?.userId === clerkUserId
          );

          if (membership) {
            // Auto-crear usuario con rol basado en el rol de Clerk
            const clerkRole = membership.role;
            const mappedRole = mapClerkRoleToInternalRole(clerkRole);

            const [newUser] = await db
              .insert(schema.users)
              .values({
                tenantId: tenant.id,
                clerkUserId,
                email: clerkUser.emailAddresses[0]?.emailAddress || '',
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                avatarUrl: clerkUser.imageUrl,
                role: mappedRole,
                permissions: schema.DEFAULT_PERMISSIONS[mappedRole] || {},
                status: 'active',
              })
              .returning();

            user = newUser;
          }
        } catch (clerkError) {
          console.error('Error syncing user from Clerk:', clerkError);
        }
      }

      if (!user && required) {
        throw new HTTPException(403, {
          message: 'You do not have access to this organization.',
        });
      }

      if (!user) {
        return next();
      }

      // Verificar estado del usuario
      if (user.status === 'suspended') {
        throw new HTTPException(403, {
          message: 'Your account has been suspended. Please contact your administrator.',
        });
      }

      if (user.status === 'archived') {
        throw new HTTPException(403, {
          message: 'Your account has been archived.',
        });
      }

      // Verificar roles permitidos
      if (roles && roles.length > 0 && !roles.includes(user.role)) {
        throw new HTTPException(403, {
          message: `This action requires one of these roles: ${roles.join(', ')}`,
        });
      }

      // Verificar permisos específicos
      if (permissions) {
        const userPermissions = (user.permissions || {}) as schema.UserPermissions;
        const modulePerms = userPermissions[permissions.module];

        if (!modulePerms) {
          throw new HTTPException(403, {
            message: `You don't have access to the ${permissions.module} module.`,
          });
        }

        const actionValue = (modulePerms as any)[permissions.action];

        if (actionValue === false || actionValue === undefined) {
          throw new HTTPException(403, {
            message: `You don't have permission to ${permissions.action} ${permissions.module}.`,
          });
        }

        // Verificar scope si es necesario
        if (permissions.scope && typeof actionValue === 'string') {
          const scopeHierarchy = ['own', 'team', 'all'];
          const requiredScopeIndex = scopeHierarchy.indexOf(permissions.scope);
          const userScopeIndex = scopeHierarchy.indexOf(actionValue);

          if (userScopeIndex < requiredScopeIndex) {
            throw new HTTPException(403, {
              message: `Insufficient scope for this operation. Required: ${permissions.scope}, yours: ${actionValue}`,
            });
          }
        }
      }

      // Setear contexto del usuario
      c.set('user', {
        id: user.id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions: (user.permissions || {}) as schema.UserPermissions,
        teamId: user.teamId,
        avatarUrl: user.avatarUrl,
      });

      c.set('clerkOrgId', clerkOrgId);

      // Actualizar última actividad (async, no bloquear)
      db.update(schema.users)
        .set({ lastActiveAt: new Date() })
        .where(eq(schema.users.id, user.id))
        .execute()
        .catch(console.error);

      return next();
    } catch (error) {
      if (error instanceof HTTPException) {
        throw error;
      }

      console.error('Auth error:', error);
      throw new HTTPException(401, {
        message: 'Invalid or expired token.',
      });
    }
  });
};

// ============================================================================
// HELPERS
// ============================================================================

const mapClerkRoleToInternalRole = (clerkRole: string): string => {
  const roleMap: Record<string, string> = {
    'org:admin': 'admin',
    'org:member': 'agent',
    'org:owner': 'owner',
    admin: 'admin',
    member: 'agent',
    owner: 'owner',
  };

  return roleMap[clerkRole] || 'viewer';
};

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

export const checkPermission = (
  user: UserContext['user'],
  module: keyof schema.UserPermissions,
  action: string,
  resourceOwnerId?: string,
  resourceTeamId?: string
): boolean => {
  const modulePerms = user.permissions[module];
  if (!modulePerms) return false;

  const actionValue = (modulePerms as any)[action];

  if (actionValue === true) return true;
  if (actionValue === false || actionValue === undefined) return false;

  // Verificar scope
  if (actionValue === 'all') return true;

  if (actionValue === 'team') {
    return !resourceTeamId || resourceTeamId === user.teamId;
  }

  if (actionValue === 'own') {
    return resourceOwnerId === user.id;
  }

  return false;
};

export const getScopeFilter = (
  user: UserContext['user'],
  module: keyof schema.UserPermissions,
  action: string = 'read'
): { type: 'all' | 'team' | 'own'; teamId?: string; userId?: string } => {
  const modulePerms = user.permissions[module];
  if (!modulePerms) return { type: 'own', userId: user.id };

  const actionValue = (modulePerms as any)[action];

  if (actionValue === true || actionValue === 'all') {
    return { type: 'all' };
  }

  if (actionValue === 'team' && user.teamId) {
    return { type: 'team', teamId: user.teamId };
  }

  return { type: 'own', userId: user.id };
};

// ============================================================================
// ROLE CHECKING HELPERS
// ============================================================================

export const isOwnerOrAdmin = (user: UserContext['user']): boolean => {
  return ['owner', 'admin'].includes(user.role);
};

export const isManager = (user: UserContext['user']): boolean => {
  return ['owner', 'admin', 'manager'].includes(user.role);
};

export const hasAdminAccess = (user: UserContext['user']): boolean => {
  return user.permissions.admin?.manageSettings === true;
};
