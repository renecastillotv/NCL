import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, decimal, pgEnum, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users, teams } from './users';
import { properties } from './properties';
import { contacts } from './contacts';

// ============================================================================
// ENUMS
// ============================================================================

export const dealStageEnum = pgEnum('deal_stage', [
  'lead',           // Lead inicial
  'qualified',      // Lead calificado
  'touring',        // En visitas
  'negotiation',    // Negociando
  'offer',          // Oferta presentada
  'contract',       // Contrato en proceso
  'closing',        // Cierre en proceso
  'won',            // Ganado/Cerrado
  'lost',           // Perdido
]);

export const dealTypeEnum = pgEnum('deal_type', [
  'sale',
  'rent',
  'rent_to_own',
]);

// ============================================================================
// DEAL PIPELINES (Embudos personalizables por tenant)
// ============================================================================

export const dealPipelines = pgTable('deal_pipelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// DEAL STAGES (Etapas del pipeline)
// ============================================================================

export const dealStages = pgTable('deal_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pipelineId: uuid('pipeline_id').notNull().references(() => dealPipelines.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#666666'),
  sortOrder: integer('sort_order').default(0),

  // Probabilidad de cierre en esta etapa
  probability: integer('probability').default(0), // 0-100

  // Es etapa de cierre?
  isWon: boolean('is_won').default(false),
  isLost: boolean('is_lost').default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// DEALS (Negocios/Oportunidades)
// ============================================================================

export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  // Identificación
  code: varchar('code', { length: 50 }).notNull(), // DEAL-001
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Tipo y pipeline
  type: dealTypeEnum('type').notNull(),
  pipelineId: uuid('pipeline_id').references(() => dealPipelines.id),
  stageId: uuid('stage_id').references(() => dealStages.id),

  // Valor del negocio
  amount: decimal('amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),

  // Comisión esperada
  commissionPercent: decimal('commission_percent', { precision: 5, scale: 2 }),
  commissionAmount: decimal('commission_amount', { precision: 15, scale: 2 }),

  // Relaciones
  contactId: uuid('contact_id').references(() => contacts.id),
  propertyId: uuid('property_id').references(() => properties.id),

  // Asignación
  assignedTo: uuid('assigned_to').references(() => users.id),
  teamId: uuid('team_id').references(() => teams.id),

  // Fechas importantes
  expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
  actualCloseDate: timestamp('actual_close_date', { withTimezone: true }),

  // Probabilidad de cierre
  probability: integer('probability').default(0), // 0-100

  // Razón de pérdida (si aplica)
  lostReason: varchar('lost_reason', { length: 255 }),
  lostNotes: text('lost_notes'),
  competitorName: varchar('competitor_name', { length: 255 }),

  // Notas
  notes: text('notes'),

  // Auditoría
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  wonAt: timestamp('won_at', { withTimezone: true }),
  lostAt: timestamp('lost_at', { withTimezone: true }),
}, (table) => ({
  tenantCodeIdx: index('deals_tenant_code_idx').on(table.tenantId, table.code),
  tenantStageIdx: index('deals_tenant_stage_idx').on(table.tenantId, table.stageId),
  tenantAssignedIdx: index('deals_tenant_assigned_idx').on(table.tenantId, table.assignedTo),
  tenantContactIdx: index('deals_tenant_contact_idx').on(table.tenantId, table.contactId),
  tenantPropertyIdx: index('deals_tenant_property_idx').on(table.tenantId, table.propertyId),
  tenantCreatedAtIdx: index('deals_tenant_created_at_idx').on(table.tenantId, table.createdAt),
}));

// ============================================================================
// DEAL ACTIVITIES (Historial del negocio)
// ============================================================================

export const dealActivities = pgTable('deal_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  type: varchar('type', { length: 50 }).notNull(), // stage_change, note, call, meeting, email, document, etc.
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Para cambios de etapa
  fromStageId: uuid('from_stage_id').references(() => dealStages.id),
  toStageId: uuid('to_stage_id').references(() => dealStages.id),

  // Metadata
  metadata: jsonb('metadata').default({}),

  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealIdx: index('deal_activities_deal_idx').on(table.dealId),
  tenantTypeIdx: index('deal_activities_tenant_type_idx').on(table.tenantId, table.type),
}));

// ============================================================================
// DEAL DOCUMENTS
// ============================================================================

export const dealDocuments = pgTable('deal_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // contract, offer, addendum, identification, etc.
  url: varchar('url', { length: 500 }).notNull(),
  size: integer('size'),
  mimeType: varchar('mime_type', { length: 100 }),

  // Para documentos que requieren firma
  requiresSignature: boolean('requires_signature').default(false),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  signedBy: uuid('signed_by').references(() => users.id),

  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// COMMISSIONS (Comisiones)
// ============================================================================

export const commissions = pgTable('commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').notNull().references(() => deals.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),

  // Monto
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }), // % del total

  // Tipo de comisión
  type: varchar('type', { length: 50 }).notNull(), // listing, selling, referral, bonus

  // Estado
  status: varchar('status', { length: 20 }).default('pending'), // pending, approved, paid

  // Pago
  paidAt: timestamp('paid_at', { withTimezone: true }),
  paymentReference: varchar('payment_reference', { length: 255 }),

  notes: text('notes'),

  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dealIdx: index('commissions_deal_idx').on(table.dealId),
  tenantUserIdx: index('commissions_tenant_user_idx').on(table.tenantId, table.userId),
  statusIdx: index('commissions_status_idx').on(table.tenantId, table.status),
}));
