import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { createClerkClient } from '@clerk/backend';
import { db, schema } from '../../db';
import { authMiddleware, isOwnerOrAdmin } from '../../middleware/auth';
import { tenantMiddleware, PLAN_LIMITS } from '../../middleware/tenant';
import { successResponse, createdResponse } from '../../lib/response';
import { createTenantSchema, updateTenantSchema } from '../../lib/validation';
import { ForbiddenError, NotFoundError } from '../../lib/errors';

// ============================================================================
// TENANTS MODULE
// ============================================================================

const tenants = new Hono();

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// ============================================================================
// GET CURRENT TENANT
// ============================================================================

tenants.get(
  '/current',
  tenantMiddleware(),
  authMiddleware(),
  async (c) => {
    const tenant = c.get('tenant');

    const fullTenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.id, tenant.id),
    });

    // Get usage stats
    const usage = await db.query.tenantUsage.findFirst({
      where: eq(schema.tenantUsage.tenantId, tenant.id),
      orderBy: (usage, { desc }) => [desc(usage.periodStart)],
    });

    // Get billing info (only for owner/admin)
    const user = c.get('user');
    let billing = null;
    if (isOwnerOrAdmin(user)) {
      billing = await db.query.tenantBilling.findFirst({
        where: eq(schema.tenantBilling.tenantId, tenant.id),
      });
    }

    return successResponse(c, {
      ...fullTenant,
      usage,
      billing,
      limits: PLAN_LIMITS[tenant.plan as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free,
    });
  }
);

// ============================================================================
// UPDATE TENANT
// ============================================================================

tenants.patch(
  '/current',
  tenantMiddleware(),
  authMiddleware(),
  zValidator('json', updateTenantSchema),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const data = c.req.valid('json');

    // Only owner/admin can update tenant
    if (!user.permissions.admin?.manageSettings) {
      throw new ForbiddenError('You do not have permission to update organization settings');
    }

    const [updated] = await db
      .update(schema.tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, tenant.id))
      .returning();

    // Update Clerk organization if name changed
    if (data.name && tenant.clerkOrgId) {
      try {
        await clerk.organizations.updateOrganization(tenant.clerkOrgId, {
          name: data.name,
        });
      } catch (clerkError) {
        console.error('Clerk update error:', clerkError);
      }
    }

    return successResponse(c, updated);
  }
);

// ============================================================================
// UPDATE TENANT SETTINGS
// ============================================================================

tenants.patch(
  '/current/settings',
  tenantMiddleware(),
  authMiddleware(),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const data = await c.req.json();

    if (!user.permissions.admin?.manageSettings) {
      throw new ForbiddenError('You do not have permission to update settings');
    }

    const currentTenant = await db.query.tenants.findFirst({
      where: eq(schema.tenants.id, tenant.id),
    });

    const newSettings = {
      ...(currentTenant?.settings || {}),
      ...data,
    };

    const [updated] = await db
      .update(schema.tenants)
      .set({
        settings: newSettings,
        updatedAt: new Date(),
      })
      .where(eq(schema.tenants.id, tenant.id))
      .returning();

    return successResponse(c, updated);
  }
);

// ============================================================================
// GET TENANT DOMAINS
// ============================================================================

tenants.get(
  '/current/domains',
  tenantMiddleware(),
  authMiddleware(),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');

    if (!isOwnerOrAdmin(user)) {
      throw new ForbiddenError('Only administrators can view domains');
    }

    const domains = await db.query.tenantDomains.findMany({
      where: eq(schema.tenantDomains.tenantId, tenant.id),
    });

    return successResponse(c, domains);
  }
);

// ============================================================================
// ADD DOMAIN
// ============================================================================

tenants.post(
  '/current/domains',
  tenantMiddleware({ allowedPlans: ['professional', 'enterprise'] }),
  authMiddleware(),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const data = await c.req.json();

    if (!user.permissions.admin?.manageSettings) {
      throw new ForbiddenError('You do not have permission to add domains');
    }

    // Generate verification token
    const verificationToken = `clic-verify-${crypto.randomUUID()}`;

    const [domain] = await db
      .insert(schema.tenantDomains)
      .values({
        tenantId: tenant.id,
        domain: data.domain.toLowerCase(),
        verificationToken,
        isPrimary: data.isPrimary || false,
      })
      .returning();

    return createdResponse(c, {
      ...domain,
      verificationInstructions: {
        type: 'TXT',
        name: '_clic-verification',
        value: verificationToken,
      },
    });
  }
);

// ============================================================================
// ONBOARDING - CREATE TENANT (Public endpoint for new signups)
// ============================================================================

tenants.post(
  '/onboard',
  zValidator('json', createTenantSchema),
  async (c) => {
    const data = c.req.valid('json');

    // Get Clerk user from token
    const authHeader = c.req.header('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw new ForbiddenError('Authentication required for onboarding');
    }

    // Verify token and get user
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    const clerkUserId = payload.sub;

    // Create Clerk organization
    let clerkOrg;
    try {
      clerkOrg = await clerk.organizations.createOrganization({
        name: data.name,
        slug: data.slug,
        createdBy: clerkUserId,
      });
    } catch (clerkError: any) {
      if (clerkError.errors?.[0]?.code === 'form_identifier_exists') {
        throw new ForbiddenError(`Organization slug "${data.slug}" is already taken`);
      }
      throw clerkError;
    }

    // Get plan limits
    const planLimits = PLAN_LIMITS.free;

    // Create tenant
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        slug: data.slug,
        clerkOrgId: clerkOrg.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website,
        countryCode: data.countryCode,
        timezone: data.timezone,
        currency: data.currency,
        plan: 'free',
        subscriptionStatus: 'trialing',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        maxUsers: planLimits.maxUsers,
        maxProperties: planLimits.maxProperties,
        maxStorageMb: planLimits.maxStorageMb,
        features: planLimits.features,
        status: 'active',
        createdBy: null, // Will be set after user is created
      })
      .returning();

    // Get Clerk user info
    const clerkUser = await clerk.users.getUser(clerkUserId);

    // Create owner user
    const [owner] = await db
      .insert(schema.users)
      .values({
        tenantId: tenant.id,
        clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress || data.email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatarUrl: clerkUser.imageUrl,
        role: 'owner',
        permissions: schema.DEFAULT_PERMISSIONS.owner,
        status: 'active',
      })
      .returning();

    // Update tenant with createdBy
    await db
      .update(schema.tenants)
      .set({ createdBy: owner.id })
      .where(eq(schema.tenants.id, tenant.id));

    // Create default pipeline
    const [pipeline] = await db
      .insert(schema.dealPipelines)
      .values({
        tenantId: tenant.id,
        name: 'Sales Pipeline',
        description: 'Default sales pipeline',
        isDefault: true,
      })
      .returning();

    // Create default stages
    const defaultStages = [
      { name: 'Lead', color: '#6B7280', probability: 10 },
      { name: 'Qualified', color: '#3B82F6', probability: 25 },
      { name: 'Touring', color: '#8B5CF6', probability: 40 },
      { name: 'Negotiation', color: '#F59E0B', probability: 60 },
      { name: 'Offer', color: '#EC4899', probability: 75 },
      { name: 'Contract', color: '#10B981', probability: 90 },
      { name: 'Won', color: '#059669', probability: 100, isWon: true },
      { name: 'Lost', color: '#EF4444', probability: 0, isLost: true },
    ];

    for (let i = 0; i < defaultStages.length; i++) {
      await db.insert(schema.dealStages).values({
        pipelineId: pipeline.id,
        tenantId: tenant.id,
        name: defaultStages[i].name,
        color: defaultStages[i].color,
        probability: defaultStages[i].probability,
        sortOrder: i,
        isWon: defaultStages[i].isWon || false,
        isLost: defaultStages[i].isLost || false,
      });
    }

    return createdResponse(c, {
      tenant,
      user: owner,
      organization: {
        id: clerkOrg.id,
        slug: clerkOrg.slug,
      },
    });
  }
);

export default tenants;
