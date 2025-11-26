import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, or, ilike, sql, desc, asc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authMiddleware, getScopeFilter, checkPermission } from '../../middleware/auth';
import { tenantMiddleware, hasFeature } from '../../middleware/tenant';
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  parsePagination,
  parseSort,
} from '../../lib/response';
import { createDealSchema, updateDealSchema } from '../../lib/validation';
import { NotFoundError, ForbiddenError } from '../../lib/errors';
import { nanoid } from 'nanoid';

// ============================================================================
// DEALS MODULE
// ============================================================================

const deals = new Hono();

// Apply middleware
deals.use('*', tenantMiddleware());
deals.use('*', authMiddleware());

// Feature check middleware
deals.use('*', async (c, next) => {
  const tenant = c.get('tenant');
  if (!hasFeature(tenant.features, 'deals')) {
    throw new ForbiddenError('Deals feature is not enabled for your plan. Please upgrade.');
  }
  return next();
});

// ============================================================================
// LIST DEALS
// ============================================================================

deals.get('/', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const query = c.req.query();

  const scope = getScopeFilter(user, 'deals', 'read');
  const { page, limit, offset } = parsePagination(query);
  const { orderBy, orderDirection } = parseSort(
    query,
    ['createdAt', 'updatedAt', 'amount', 'expectedCloseDate', 'probability'],
    { orderBy: 'createdAt', orderDirection: 'desc' }
  );

  const conditions = [eq(schema.deals.tenantId, tenant.id)];

  // Apply scope
  if (scope.type === 'own') {
    conditions.push(
      or(
        eq(schema.deals.createdBy, user.id),
        eq(schema.deals.assignedTo, user.id)
      )!
    );
  } else if (scope.type === 'team' && scope.teamId) {
    conditions.push(
      or(
        eq(schema.deals.teamId, scope.teamId),
        eq(schema.deals.createdBy, user.id),
        eq(schema.deals.assignedTo, user.id)
      )!
    );
  }

  // Filters
  if (query.stageId) {
    conditions.push(eq(schema.deals.stageId, query.stageId));
  }
  if (query.pipelineId) {
    conditions.push(eq(schema.deals.pipelineId, query.pipelineId));
  }
  if (query.type) {
    conditions.push(eq(schema.deals.type, query.type as any));
  }
  if (query.assignedTo) {
    conditions.push(eq(schema.deals.assignedTo, query.assignedTo));
  }
  if (query.contactId) {
    conditions.push(eq(schema.deals.contactId, query.contactId));
  }
  if (query.propertyId) {
    conditions.push(eq(schema.deals.propertyId, query.propertyId));
  }

  // Search
  if (query.q) {
    const searchTerm = `%${query.q}%`;
    conditions.push(
      or(
        ilike(schema.deals.title, searchTerm),
        ilike(schema.deals.code, searchTerm)
      )!
    );
  }

  // Count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.deals)
    .where(and(...conditions));

  // Results
  const orderColumn = schema.deals[orderBy as keyof typeof schema.deals] || schema.deals.createdAt;
  const orderFn = orderDirection === 'asc' ? asc : desc;

  const results = await db
    .select()
    .from(schema.deals)
    .where(and(...conditions))
    .orderBy(orderFn(orderColumn as any))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(c, results, { total: Number(count), page, limit });
});

// ============================================================================
// GET SINGLE DEAL
// ============================================================================

deals.get('/:id', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const { id } = c.req.param();

  const deal = await db.query.deals.findFirst({
    where: and(
      eq(schema.deals.id, id),
      eq(schema.deals.tenantId, tenant.id)
    ),
  });

  if (!deal) {
    throw new NotFoundError('Deal', id);
  }

  const canRead = checkPermission(
    user, 'deals', 'read',
    deal.createdBy || deal.assignedTo || undefined,
    deal.teamId || undefined
  );

  if (!canRead) {
    throw new ForbiddenError('You do not have permission to view this deal');
  }

  // Get activities
  const activities = await db.query.dealActivities.findMany({
    where: eq(schema.dealActivities.dealId, id),
    orderBy: [desc(schema.dealActivities.createdAt)],
    limit: 50,
  });

  // Get documents
  const documents = await db.query.dealDocuments.findMany({
    where: eq(schema.dealDocuments.dealId, id),
  });

  // Get commissions
  const commissions = await db.query.commissions.findMany({
    where: eq(schema.commissions.dealId, id),
  });

  return successResponse(c, {
    ...deal,
    activities,
    documents,
    commissions,
  });
});

// ============================================================================
// CREATE DEAL
// ============================================================================

deals.post(
  '/',
  zValidator('json', createDealSchema),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const data = c.req.valid('json');

    if (!checkPermission(user, 'deals', 'create')) {
      throw new ForbiddenError('You do not have permission to create deals');
    }

    // Generate code
    const code = `DEAL-${nanoid(6).toUpperCase()}`;

    // Get default pipeline if not specified
    let pipelineId = data.pipelineId;
    let stageId = data.stageId;

    if (!pipelineId) {
      const defaultPipeline = await db.query.dealPipelines.findFirst({
        where: and(
          eq(schema.dealPipelines.tenantId, tenant.id),
          eq(schema.dealPipelines.isDefault, true)
        ),
      });
      if (defaultPipeline) {
        pipelineId = defaultPipeline.id;
      }
    }

    // Get first stage if not specified
    if (pipelineId && !stageId) {
      const firstStage = await db.query.dealStages.findFirst({
        where: eq(schema.dealStages.pipelineId, pipelineId),
        orderBy: [asc(schema.dealStages.sortOrder)],
      });
      if (firstStage) {
        stageId = firstStage.id;
      }
    }

    const [deal] = await db
      .insert(schema.deals)
      .values({
        ...data,
        tenantId: tenant.id,
        code,
        pipelineId,
        stageId,
        amount: data.amount?.toString(),
        commissionPercent: data.commissionPercent?.toString(),
        createdBy: user.id,
        assignedTo: data.assignedTo || user.id,
        teamId: data.teamId || user.teamId,
      })
      .returning();

    // Log activity
    await db.insert(schema.dealActivities).values({
      dealId: deal.id,
      tenantId: tenant.id,
      type: 'note',
      title: 'Deal created',
      createdBy: user.id,
    });

    return createdResponse(c, deal);
  }
);

// ============================================================================
// UPDATE DEAL
// ============================================================================

deals.patch(
  '/:id',
  zValidator('json', updateDealSchema),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const { id } = c.req.param();
    const data = c.req.valid('json');

    const existing = await db.query.deals.findFirst({
      where: and(
        eq(schema.deals.id, id),
        eq(schema.deals.tenantId, tenant.id)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Deal', id);
    }

    const canUpdate = checkPermission(
      user, 'deals', 'update',
      existing.createdBy || existing.assignedTo || undefined,
      existing.teamId || undefined
    );

    if (!canUpdate) {
      throw new ForbiddenError('You do not have permission to update this deal');
    }

    // Track stage change
    const stageChanged = data.stageId && data.stageId !== existing.stageId;

    const [deal] = await db
      .update(schema.deals)
      .set({
        ...data,
        amount: data.amount?.toString(),
        commissionPercent: data.commissionPercent?.toString(),
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.deals.id, id))
      .returning();

    // Log stage change
    if (stageChanged) {
      // Get stage info
      const newStage = await db.query.dealStages.findFirst({
        where: eq(schema.dealStages.id, data.stageId!),
      });

      await db.insert(schema.dealActivities).values({
        dealId: deal.id,
        tenantId: tenant.id,
        type: 'stage_change',
        title: `Moved to ${newStage?.name || 'new stage'}`,
        fromStageId: existing.stageId,
        toStageId: data.stageId,
        createdBy: user.id,
      });

      // Check if won or lost
      if (newStage?.isWon) {
        await db.update(schema.deals)
          .set({ wonAt: new Date(), actualCloseDate: new Date() })
          .where(eq(schema.deals.id, id));
      } else if (newStage?.isLost) {
        await db.update(schema.deals)
          .set({ lostAt: new Date() })
          .where(eq(schema.deals.id, id));
      }
    }

    return successResponse(c, deal);
  }
);

// ============================================================================
// DELETE DEAL
// ============================================================================

deals.delete('/:id', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const { id } = c.req.param();

  const existing = await db.query.deals.findFirst({
    where: and(
      eq(schema.deals.id, id),
      eq(schema.deals.tenantId, tenant.id)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Deal', id);
  }

  const canDelete = checkPermission(
    user, 'deals', 'delete',
    existing.createdBy || undefined,
    existing.teamId || undefined
  );

  if (!canDelete) {
    throw new ForbiddenError('You do not have permission to delete this deal');
  }

  // Hard delete (deals should be deleted, not archived)
  await db.delete(schema.deals).where(eq(schema.deals.id, id));

  return noContentResponse(c);
});

// ============================================================================
// DEAL STATISTICS
// ============================================================================

deals.get('/stats/summary', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');

  const scope = getScopeFilter(user, 'deals', 'read');
  const conditions = [eq(schema.deals.tenantId, tenant.id)];

  if (scope.type === 'own') {
    conditions.push(
      or(
        eq(schema.deals.createdBy, user.id),
        eq(schema.deals.assignedTo, user.id)
      )!
    );
  } else if (scope.type === 'team' && scope.teamId) {
    conditions.push(
      or(
        eq(schema.deals.teamId, scope.teamId),
        eq(schema.deals.createdBy, user.id)
      )!
    );
  }

  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      won: sql<number>`count(*) filter (where ${schema.deals.wonAt} is not null)`,
      lost: sql<number>`count(*) filter (where ${schema.deals.lostAt} is not null)`,
      open: sql<number>`count(*) filter (where ${schema.deals.wonAt} is null and ${schema.deals.lostAt} is null)`,
      totalValue: sql<number>`coalesce(sum(${schema.deals.amount}::numeric), 0)`,
      wonValue: sql<number>`coalesce(sum(${schema.deals.amount}::numeric) filter (where ${schema.deals.wonAt} is not null), 0)`,
      avgDealSize: sql<number>`coalesce(avg(${schema.deals.amount}::numeric), 0)`,
    })
    .from(schema.deals)
    .where(and(...conditions));

  return successResponse(c, stats[0]);
});

// ============================================================================
// PIPELINE ROUTES
// ============================================================================

deals.get('/pipelines', async (c) => {
  const tenant = c.get('tenant');

  const pipelines = await db.query.dealPipelines.findMany({
    where: and(
      eq(schema.dealPipelines.tenantId, tenant.id),
      eq(schema.dealPipelines.isActive, true)
    ),
  });

  // Get stages for each pipeline
  const pipelinesWithStages = await Promise.all(
    pipelines.map(async (pipeline) => {
      const stages = await db.query.dealStages.findMany({
        where: eq(schema.dealStages.pipelineId, pipeline.id),
        orderBy: [asc(schema.dealStages.sortOrder)],
      });
      return { ...pipeline, stages };
    })
  );

  return successResponse(c, pipelinesWithStages);
});

export default deals;
