import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq, and, or, ilike, sql, desc, asc } from 'drizzle-orm';
import { db, schema } from '../../db';
import { authMiddleware, getScopeFilter, checkPermission } from '../../middleware/auth';
import { tenantMiddleware } from '../../middleware/tenant';
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  parsePagination,
  parseSort,
} from '../../lib/response';
import { createContactSchema, updateContactSchema } from '../../lib/validation';
import { NotFoundError, ForbiddenError } from '../../lib/errors';

// ============================================================================
// CONTACTS MODULE
// ============================================================================

const contacts = new Hono();

// Apply middleware to all routes
contacts.use('*', tenantMiddleware());
contacts.use('*', authMiddleware());

// ============================================================================
// LIST CONTACTS
// ============================================================================

contacts.get('/', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const query = c.req.query();

  const scope = getScopeFilter(user, 'contacts', 'read');
  const { page, limit, offset } = parsePagination(query);
  const { orderBy, orderDirection } = parseSort(
    query,
    ['createdAt', 'updatedAt', 'firstName', 'lastName', 'score', 'lastContactedAt'],
    { orderBy: 'createdAt', orderDirection: 'desc' }
  );

  const conditions = [eq(schema.contacts.tenantId, tenant.id)];

  // Apply scope
  if (scope.type === 'own') {
    conditions.push(
      or(
        eq(schema.contacts.createdBy, user.id),
        eq(schema.contacts.assignedTo, user.id)
      )!
    );
  } else if (scope.type === 'team' && scope.teamId) {
    conditions.push(
      or(
        eq(schema.contacts.teamId, scope.teamId),
        eq(schema.contacts.createdBy, user.id),
        eq(schema.contacts.assignedTo, user.id)
      )!
    );
  }

  // Filters
  if (query.status) {
    conditions.push(eq(schema.contacts.status, query.status as any));
  }
  if (query.type) {
    conditions.push(eq(schema.contacts.type, query.type as any));
  }
  if (query.source) {
    conditions.push(eq(schema.contacts.source, query.source as any));
  }
  if (query.assignedTo) {
    conditions.push(eq(schema.contacts.assignedTo, query.assignedTo));
  }
  if (query.isHot === 'true') {
    conditions.push(eq(schema.contacts.isHot, true));
  }

  // Search
  if (query.q) {
    const searchTerm = `%${query.q}%`;
    conditions.push(
      or(
        ilike(schema.contacts.firstName, searchTerm),
        ilike(schema.contacts.lastName, searchTerm),
        ilike(schema.contacts.email, searchTerm),
        ilike(schema.contacts.phone, searchTerm),
        ilike(schema.contacts.company, searchTerm)
      )!
    );
  }

  // Count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.contacts)
    .where(and(...conditions));

  // Results
  const orderColumn = schema.contacts[orderBy as keyof typeof schema.contacts] || schema.contacts.createdAt;
  const orderFn = orderDirection === 'asc' ? asc : desc;

  const results = await db
    .select()
    .from(schema.contacts)
    .where(and(...conditions))
    .orderBy(orderFn(orderColumn as any))
    .limit(limit)
    .offset(offset);

  return paginatedResponse(c, results, { total: Number(count), page, limit });
});

// ============================================================================
// GET SINGLE CONTACT
// ============================================================================

contacts.get('/:id', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const { id } = c.req.param();

  const contact = await db.query.contacts.findFirst({
    where: and(
      eq(schema.contacts.id, id),
      eq(schema.contacts.tenantId, tenant.id)
    ),
  });

  if (!contact) {
    throw new NotFoundError('Contact', id);
  }

  const canRead = checkPermission(
    user, 'contacts', 'read',
    contact.createdBy || contact.assignedTo || undefined,
    contact.teamId || undefined
  );

  if (!canRead) {
    throw new ForbiddenError('You do not have permission to view this contact');
  }

  // Get activities
  const activities = await db.query.contactActivities.findMany({
    where: eq(schema.contactActivities.contactId, id),
    orderBy: [desc(schema.contactActivities.createdAt)],
    limit: 20,
  });

  // Get property interests
  const propertyInterests = await db.query.contactPropertyInterests.findMany({
    where: eq(schema.contactPropertyInterests.contactId, id),
  });

  return successResponse(c, {
    ...contact,
    activities,
    propertyInterests,
  });
});

// ============================================================================
// CREATE CONTACT
// ============================================================================

contacts.post(
  '/',
  zValidator('json', createContactSchema),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const data = c.req.valid('json');

    if (!checkPermission(user, 'contacts', 'create')) {
      throw new ForbiddenError('You do not have permission to create contacts');
    }

    const [contact] = await db
      .insert(schema.contacts)
      .values({
        ...data,
        tenantId: tenant.id,
        createdBy: user.id,
        assignedTo: data.assignedTo || user.id,
        teamId: data.teamId || user.teamId,
        countryCode: tenant.countryCode,
      })
      .returning();

    // Log activity
    await db.insert(schema.contactActivities).values({
      contactId: contact.id,
      tenantId: tenant.id,
      type: 'note',
      title: 'Contact created',
      description: `Contact created from ${data.source || 'manual entry'}`,
      createdBy: user.id,
    });

    return createdResponse(c, contact);
  }
);

// ============================================================================
// UPDATE CONTACT
// ============================================================================

contacts.patch(
  '/:id',
  zValidator('json', updateContactSchema),
  async (c) => {
    const tenant = c.get('tenant');
    const user = c.get('user');
    const { id } = c.req.param();
    const data = c.req.valid('json');

    const existing = await db.query.contacts.findFirst({
      where: and(
        eq(schema.contacts.id, id),
        eq(schema.contacts.tenantId, tenant.id)
      ),
    });

    if (!existing) {
      throw new NotFoundError('Contact', id);
    }

    const canUpdate = checkPermission(
      user, 'contacts', 'update',
      existing.createdBy || existing.assignedTo || undefined,
      existing.teamId || undefined
    );

    if (!canUpdate) {
      throw new ForbiddenError('You do not have permission to update this contact');
    }

    // Track status change
    const statusChanged = data.status && data.status !== existing.status;

    const [contact] = await db
      .update(schema.contacts)
      .set({
        ...data,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.contacts.id, id))
      .returning();

    // Log status change
    if (statusChanged) {
      await db.insert(schema.contactActivities).values({
        contactId: contact.id,
        tenantId: tenant.id,
        type: 'note',
        title: 'Status changed',
        description: `Status changed from ${existing.status} to ${data.status}`,
        createdBy: user.id,
      });
    }

    return successResponse(c, contact);
  }
);

// ============================================================================
// DELETE CONTACT
// ============================================================================

contacts.delete('/:id', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const { id } = c.req.param();

  const existing = await db.query.contacts.findFirst({
    where: and(
      eq(schema.contacts.id, id),
      eq(schema.contacts.tenantId, tenant.id)
    ),
  });

  if (!existing) {
    throw new NotFoundError('Contact', id);
  }

  const canDelete = checkPermission(
    user, 'contacts', 'delete',
    existing.createdBy || undefined,
    existing.teamId || undefined
  );

  if (!canDelete) {
    throw new ForbiddenError('You do not have permission to delete this contact');
  }

  // Soft delete
  await db
    .update(schema.contacts)
    .set({
      status: 'archived',
      updatedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(schema.contacts.id, id));

  return noContentResponse(c);
});

// ============================================================================
// ADD ACTIVITY
// ============================================================================

contacts.post('/:id/activities', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');
  const { id } = c.req.param();
  const data = await c.req.json();

  const contact = await db.query.contacts.findFirst({
    where: and(
      eq(schema.contacts.id, id),
      eq(schema.contacts.tenantId, tenant.id)
    ),
  });

  if (!contact) {
    throw new NotFoundError('Contact', id);
  }

  const [activity] = await db
    .insert(schema.contactActivities)
    .values({
      contactId: id,
      tenantId: tenant.id,
      type: data.type || 'note',
      title: data.title,
      description: data.description,
      propertyId: data.propertyId,
      durationMinutes: data.durationMinutes,
      metadata: data.metadata || {},
      createdBy: user.id,
    })
    .returning();

  // Update last contacted
  if (['call', 'email', 'meeting', 'tour'].includes(data.type)) {
    await db
      .update(schema.contacts)
      .set({ lastContactedAt: new Date() })
      .where(eq(schema.contacts.id, id));
  }

  return createdResponse(c, activity);
});

// ============================================================================
// CONTACT STATISTICS
// ============================================================================

contacts.get('/stats/summary', async (c) => {
  const tenant = c.get('tenant');
  const user = c.get('user');

  const scope = getScopeFilter(user, 'contacts', 'read');
  const conditions = [eq(schema.contacts.tenantId, tenant.id)];

  if (scope.type === 'own') {
    conditions.push(
      or(
        eq(schema.contacts.createdBy, user.id),
        eq(schema.contacts.assignedTo, user.id)
      )!
    );
  } else if (scope.type === 'team' && scope.teamId) {
    conditions.push(
      or(
        eq(schema.contacts.teamId, scope.teamId),
        eq(schema.contacts.createdBy, user.id)
      )!
    );
  }

  const stats = await db
    .select({
      total: sql<number>`count(*)`,
      new: sql<number>`count(*) filter (where ${schema.contacts.status} = 'new')`,
      contacted: sql<number>`count(*) filter (where ${schema.contacts.status} = 'contacted')`,
      qualified: sql<number>`count(*) filter (where ${schema.contacts.status} = 'qualified')`,
      converted: sql<number>`count(*) filter (where ${schema.contacts.status} = 'converted')`,
      hot: sql<number>`count(*) filter (where ${schema.contacts.isHot} = true)`,
    })
    .from(schema.contacts)
    .where(and(...conditions));

  // By source
  const bySource = await db
    .select({
      source: schema.contacts.source,
      count: sql<number>`count(*)`,
    })
    .from(schema.contacts)
    .where(and(...conditions))
    .groupBy(schema.contacts.source);

  return successResponse(c, {
    ...stats[0],
    bySource,
  });
});

export default contacts;
