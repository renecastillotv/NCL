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
import { createPropertySchema, updatePropertySchema } from '../../lib/validation';
import { NotFoundError, ForbiddenError, PlanLimitError } from '../../lib/errors';
import { nanoid } from 'nanoid';

// ============================================================================
// PROPERTIES MODULE
// ============================================================================

const properties = new Hono();

// Apply middleware to all routes
properties.use('*', tenantMiddleware());
properties.use('*', authMiddleware());

// ============================================================================
// LIST PROPERTIES
// ============================================================================

properties.get('/', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const query = c.req.query();

  // Get user's data scope
  const scope = getScopeFilter(user, 'properties', 'read');

  // Pagination
  const { page, limit, offset } = parsePagination(query);

  // Sorting
  const { orderBy, orderDirection } = parseSort(
    query,
    ['createdAt', 'updatedAt', 'priceUsd', 'title', 'viewsCount'],
    { orderBy: 'createdAt', orderDirection: 'desc' }
  );

  // Build base query conditions
  const conditions = [eq(schema.properties.tenantId, tenant.id)];

  // Apply scope filters
  if (scope.type === 'own') {
    conditions.push(eq(schema.properties.createdBy, user.id));
  } else if (scope.type === 'team' && scope.teamId) {
    conditions.push(
      or(
        eq(schema.properties.teamId, scope.teamId),
        eq(schema.properties.createdBy, user.id)
      )!
    );
  }

  // Apply query filters
  if (query.status) {
    conditions.push(eq(schema.properties.status, query.status as any));
  }
  if (query.propertyType) {
    conditions.push(eq(schema.properties.propertyType, query.propertyType as any));
  }
  if (query.operationType) {
    conditions.push(eq(schema.properties.operationType, query.operationType as any));
  }
  if (query.cityId) {
    conditions.push(eq(schema.properties.cityId, query.cityId));
  }
  if (query.sectorId) {
    conditions.push(eq(schema.properties.sectorId, query.sectorId));
  }
  if (query.agentId) {
    conditions.push(eq(schema.properties.agentId, query.agentId));
  }
  if (query.isFeatured === 'true') {
    conditions.push(eq(schema.properties.isFeatured, true));
  }

  // Price range
  if (query.minPrice) {
    conditions.push(sql`${schema.properties.priceUsd} >= ${parseFloat(query.minPrice)}`);
  }
  if (query.maxPrice) {
    conditions.push(sql`${schema.properties.priceUsd} <= ${parseFloat(query.maxPrice)}`);
  }

  // Bedrooms
  if (query.minBedrooms) {
    conditions.push(sql`${schema.properties.bedrooms} >= ${parseInt(query.minBedrooms)}`);
  }

  // Search
  if (query.q) {
    const searchTerm = `%${query.q}%`;
    conditions.push(
      or(
        ilike(schema.properties.title, searchTerm),
        ilike(schema.properties.code, searchTerm),
        ilike(schema.properties.address, searchTerm)
      )!
    );
  }

  // Execute count query
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.properties)
    .where(and(...conditions));

  // Execute main query with sorting
  const orderColumn = schema.properties[orderBy as keyof typeof schema.properties] || schema.properties.createdAt;
  const orderFn = orderDirection === 'asc' ? asc : desc;

  const results = await db
    .select()
    .from(schema.properties)
    .where(and(...conditions))
    .orderBy(orderFn(orderColumn as any))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(c, results, {
    total: Number(count),
    page,
    limit,
  });
});

// ============================================================================
// GET SINGLE PROPERTY
// ============================================================================

properties.get('/:id', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const { id } = c.req.param();

  const property = await db.query.properties.findFirst({
    where: and(
      eq(schema.properties.id, id),
      eq(schema.properties.tenantId, tenant.id)
    ),
  });

  if (!property) {
    throw new NotFoundError('Property', id);
  }

  // Check read permission for this specific property
  const canRead = checkPermission(
    user,
    'properties',
    'read',
    property.createdBy || undefined,
    property.teamId || undefined
  );

  if (!canRead) {
    throw new ForbiddenError('You do not have permission to view this property');
  }

  return successResponse(c, property);
});

// ============================================================================
// CREATE PROPERTY
// ============================================================================

properties.post(
  '/',
  zValidator('json', createPropertySchema),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const data = c.req.valid('json');

    // Check permission
    if (!checkPermission(user, 'properties', 'create')) {
      throw new ForbiddenError('You do not have permission to create properties');
    }

    // Check plan limits
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.properties)
      .where(eq(schema.properties.tenantId, tenant.id));

    if (tenant.maxProperties > 0 && Number(count) >= tenant.maxProperties) {
      throw new PlanLimitError('properties', tenant.plan);
    }

    // Generate unique code
    const code = `${tenant.slug.toUpperCase().slice(0, 4)}-${nanoid(6).toUpperCase()}`;

    // Generate slug
    const baseSlug = data.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${nanoid(4)}`;

    // Create property
    const [property] = await db
      .insert(schema.properties)
      .values({
        ...data,
        tenantId: tenant.id,
        code,
        slug,
        priceUsd: data.priceUsd?.toString(),
        priceDop: data.priceDop?.toString(),
        priceEur: data.priceEur?.toString(),
        areaM2: data.areaM2?.toString(),
        lotSizeM2: data.lotSizeM2?.toString(),
        latitude: data.latitude?.toString(),
        longitude: data.longitude?.toString(),
        countryCode: data.countryCode || tenant.countryCode,
        createdBy: user.id,
        teamId: data.teamId || user.teamId,
      })
      .returning();

    return createdResponse(c, property);
  }
);

// ============================================================================
// UPDATE PROPERTY
// ============================================================================

properties.patch(
  '/:id',
  zValidator('json', updatePropertySchema),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const { id } = c.req.param();
    const data = c.req.valid('json');

    // Find property
    const existing = await db.query.properties.findFirst({
      where: and(
        eq(schema.properties.id, id),
        eq(schema.properties.tenantId, tenant.id)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Property', id);
    }

    // Check permission
    const canUpdate = checkPermission(
      user,
      'properties',
      'update',
      existing.createdBy || undefined,
      existing.teamId || undefined
    );

    if (!canUpdate) {
      throw new ForbiddenError('You do not have permission to update this property');
    }

    // Update property
    const [property] = await db
      .update(schema.properties)
      .set({
        ...data,
        priceUsd: data.priceUsd?.toString(),
        priceDop: data.priceDop?.toString(),
        priceEur: data.priceEur?.toString(),
        areaM2: data.areaM2?.toString(),
        lotSizeM2: data.lotSizeM2?.toString(),
        latitude: data.latitude?.toString(),
        longitude: data.longitude?.toString(),
        updatedBy: user.id,
        updatedAt: new Date(),
        // Set publishedAt if status changes to active
        ...(data.status === 'active' && existing.status !== 'active'
          ? { publishedAt: new Date() }
          : {}),
      })
      .where(eq(schema.properties.id, id))
      .returning();

    return successResponse(c, property);
  }
);

// ============================================================================
// DELETE PROPERTY
// ============================================================================

properties.delete('/:id', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const { id } = c.req.param();

  // Find property
  const existing = await db.query.properties.findFirst({
    where: and(
      eq(schema.properties.id, id),
      eq(schema.properties.tenantId, tenant.id)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Property', id);
  }

  // Check permission
  const canDelete = checkPermission(
    user,
    'properties',
    'delete',
    existing.createdBy || undefined,
    existing.teamId || undefined
  );

  if (!canDelete) {
    throw new ForbiddenError('You do not have permission to delete this property');
  }

  // Soft delete (change status to archived)
  await db
    .update(schema.properties)
    .set({
      status: 'archived',
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(schema.properties.id, id));

  return noContentResponse(c);
});

// ============================================================================
// PROPERTY STATISTICS
// ============================================================================

properties.get('/stats/summary', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');

  const scope = getScopeFilter(user, 'properties', 'read');
  const conditions = [eq(schema.properties.tenantId, tenant.id)];

  if (scope.type === 'own') {
    conditions.push(eq(schema.properties.createdBy, user.id));
  } else if (scope.type === 'team' && scope.teamId) {
    conditions.push(
      or(
        eq(schema.properties.teamId, scope.teamId),
        eq(schema.properties.createdBy, user.id)
      )!
    );
  }

  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${schema.properties.status} = 'active')`,
      sold: sql<number>`count(*) filter (where ${schema.properties.status} = 'sold')`,
      rented: sql<number>`count(*) filter (where ${schema.properties.status} = 'rented')`,
      draft: sql<number>`count(*) filter (where ${schema.properties.status} = 'draft')`,
      totalViews: sql<number>`coalesce(sum(${schema.properties.viewsCount}), 0)`,
      totalInquiries: sql<number>`coalesce(sum(${schema.properties.inquiriesCount}), 0)`,
    })
    .from(schema.properties)
    .where(and(...conditions));

  return successResponse(c, stats[0]);
});

export default properties;
