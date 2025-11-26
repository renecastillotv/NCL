import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, sql, desc } from 'drizzle-orm';
import { createClerkClient } from '@clerk/backend';
import { db, schema } from '../../db';
import { authMiddleware, isOwnerOrAdmin } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  parsePagination,
} from '../../lib/response';
import { inviteUserSchema, updateUserSchema } from '../../lib/validation';
import { NotFoundError, ForbiddenError, PlanLimitError, ConflictError } from '../../lib/errors';

// ============================================================================
// USERS MODULE
// ============================================================================

const users = new Hono();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// Apply middleware
users.use('*', tenantMiddleware());
users.use('*', authMiddleware());

// ============================================================================
// LIST USERS
// ============================================================================

users.get('/', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const query = c.req.query();

  // Only admins can list all users
  if (!isOwnerOrAdmin(user)) {
    throw new ForbiddenError('Only administrators can view all users');
  }

  const { page, limit, offset } = parsePagination(query);

  const conditions = [eq(schema.users.tenantId, tenant.id)];

  if (query.status) {
    conditions.push(eq(schema.users.status, query.status as any));
  }
  if (query.role) {
    conditions.push(eq(schema.users.role, query.role as any));
  }
  if (query.teamId) {
    conditions.push(eq(schema.users.teamId, query.teamId));
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(...conditions));

  const results = await db
    .select()
    .from(schema.users)
    .where(and(...conditions))
    .orderBy(desc(schema.users.createdAt))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(c, results, { total: Number(count), page, limit });
});

// ============================================================================
// GET CURRENT USER (ME)
// ============================================================================

users.get('/me', async (c) => {
  const user = c.get('user');
  const tenant = c.get('tenant');

  const fullUser = await db.query.users.findFirst({
    where: eq(schema.users.id, user.id),
  });

  return successResponse(c, {
    ...fullUser,
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      features: tenant.features,
    },
  });
});

// ============================================================================
// GET SINGLE USER
// ============================================================================

users.get('/:id', async (c) => {
  const tenant = c.get('tenant');
  const currentUser = c.get('user');
  const { id } = c.req.param();

  // Users can view themselves, admins can view anyone
  if (id !== currentUser.id && !isOwnerOrAdmin(currentUser)) {
    throw new ForbiddenError('You can only view your own profile');
  }

  const user = await db.query.users.findFirst({
    where: and(
      eq(schema.users.id, id),
      eq(schema.users.tenantId, tenant.id)
    ),
  });

  if (!user) {
    throw new NotFoundError('User', id);
  }

  return successResponse(c, user);
});

// ============================================================================
// INVITE USER
// ============================================================================

users.post(
  '/invite',
  zValidator('json', inviteUserSchema),
  async (c) => {
    const tenant = c.get('tenant');
    const currentUser = c.get('user');
    const data = c.req.valid('json');

    // Only admins can invite users
    if (!currentUser.permissions.admin?.manageUsers) {
      throw new ForbiddenError('You do not have permission to invite users');
    }

    // Check plan limits
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.users)
      .where(and(
        eq(schema.users.tenantId, tenant.id),
        eq(schema.users.status, 'active')
      ));

    if (tenant.maxUsers > 0 && Number(count) >= tenant.maxUsers) {
      throw new PlanLimitError('users', tenant.plan);
    }

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: and(
        eq(schema.users.tenantId, tenant.id),
        eq(schema.users.email, data.email.toLowerCase())
      ),
    });

    if (existing) {
      throw new ConflictError(`User with email ${data.email} already exists`);
    }

    // Invite user via Clerk
    let clerkInvitation;
    try {
      if (tenant.clerkOrgId) {
        clerkInvitation = await clerk.organizations.createOrganizationInvitation({
          organizationId: tenant.clerkOrgId,
          emailAddress: data.email,
          role: mapInternalRoleToClerkRole(data.role),
          inviterUserId: currentUser.clerkUserId,
        });
      }
    } catch (clerkError) {
      console.error('Clerk invitation error:', clerkError);
      // Continue without Clerk invitation if it fails
    }

    // Create user record
    const [user] = await db
      .insert(schema.users)
      .values({
        tenantId: tenant.id,
        clerkUserId: `pending_${Date.now()}`, // Will be updated when user accepts
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        permissions: schema.DEFAULT_PERMISSIONS[data.role] || {},
        teamId: data.teamId,
        status: 'invited',
        invitedBy: currentUser.id,
        invitedAt: new Date(),
      })
      .returning();

    return createdResponse(c, {
      ...user,
      invitationId: clerkInvitation?.id,
    });
  }
);

// ============================================================================
// UPDATE USER
// ============================================================================

users.patch(
  '/:id',
  zValidator('json', updateUserSchema),
  async (c) => {
    const tenant = c.get('tenant');
    const currentUser = c.get('user');
    const { id } = c.req.param();
    const data = c.req.valid('json');

    // Users can update themselves (limited), admins can update anyone
    const isSelf = id === currentUser.id;
    const isAdmin = isOwnerOrAdmin(currentUser);

    if (!isSelf && !isAdmin) {
      throw new ForbiddenError('You can only update your own profile');
    }

    // Non-admins cannot change their role or permissions
    if (!isAdmin && (data.role || data.permissions)) {
      throw new ForbiddenError('You cannot change your own role or permissions');
    }

    const existing = await db.query.users.findFirst({
      where: and(
        eq(schema.users.id, id),
        eq(schema.users.tenantId, tenant.id)
      ),
    });

    if (!existing) {
      throw new NotFoundError('User', id);
    }

    // Prevent demoting the owner
    if (existing.role === 'owner' && data.role && data.role !== 'owner') {
      throw new ForbiddenError('Cannot change the role of the organization owner');
    }

    // Update permissions if role changes
    let permissions = data.permissions;
    if (data.role && data.role !== existing.role && !permissions) {
      permissions = schema.DEFAULT_PERMISSIONS[data.role];
    }

    const [user] = await db
      .update(schema.users)
      .set({
        ...data,
        permissions: permissions || existing.permissions,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning();

    return successResponse(c, user);
  }
);

// ============================================================================
// DEACTIVATE USER
// ============================================================================

users.delete('/:id', async (c) => {
  const tenant = c.get('tenant');
  const currentUser = c.get('user');
  const { id } = c.req.param();

  if (!currentUser.permissions.admin?.manageUsers) {
    throw new ForbiddenError('You do not have permission to deactivate users');
  }

  // Cannot deactivate yourself
  if (id === currentUser.id) {
    throw new ForbiddenError('You cannot deactivate yourself');
  }

  const existing = await db.query.users.findFirst({
    where: and(
      eq(schema.users.id, id),
      eq(schema.users.tenantId, tenant.id)
    ),
  });

  if (!existing) {
    throw new NotFoundError('User', id);
  }

  // Cannot deactivate the owner
  if (existing.role === 'owner') {
    throw new ForbiddenError('Cannot deactivate the organization owner');
  }

  // Deactivate (soft delete)
  await db
    .update(schema.users)
    .set({
      status: 'archived',
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, id));

  // Remove from Clerk organization
  try {
    if (tenant.clerkOrgId) {
      await clerk.organizations.deleteOrganizationMembership({
        organizationId: tenant.clerkOrgId,
        userId: existing.clerkUserId,
      });
    }
  } catch (clerkError) {
    console.error('Clerk removal error:', clerkError);
  }

  return noContentResponse(c);
});

// ============================================================================
// TEAMS
// ============================================================================

users.get('/teams', async (c) => {
  const tenant = c.get('tenant');

  const teams = await db.query.teams.findMany({
    where: eq(schema.teams.tenantId, tenant.id),
  });

  return successResponse(c, teams);
});

users.post('/teams', async (c) => {
  const tenant = c.get('tenant');
  const currentUser = c.get('user');
  const data = await c.req.json();

  if (!currentUser.permissions.admin?.manageTeams) {
    throw new ForbiddenError('You do not have permission to create teams');
  }

  const [team] = await db
    .insert(schema.teams)
    .values({
      tenantId: tenant.id,
      name: data.name,
      description: data.description,
      leaderId: data.leaderId,
    })
    .returning();

  return createdResponse(c, team);
});

// ============================================================================
// HELPERS
// ============================================================================

function mapInternalRoleToClerkRole(role: string): string {
  const roleMap: Record<string, string> = {
    owner: 'org:admin',
    admin: 'org:admin',
    manager: 'org:member',
    agent: 'org:member',
    assistant: 'org:member',
    accountant: 'org:member',
    viewer: 'org:member',
  };
  return roleMap[role] || 'org:member';
}

export default users;
