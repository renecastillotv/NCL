import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users, teams } from './users';
import { properties } from './properties';

// ============================================================================
// ENUMS
// ============================================================================

export const contactStatusEnum = pgEnum('contact_status', [
  'new',          // Nuevo lead
  'contacted',    // Contactado
  'qualified',    // Calificado (interés real)
  'touring',      // En visitas
  'negotiating',  // Negociando
  'converted',    // Convertido (compró/alquiló)
  'lost',         // Perdido
  'archived',     // Archivado
]);

export const contactSourceEnum = pgEnum('contact_source', [
  'website',      // Formulario web
  'whatsapp',
  'phone',
  'email',
  'referral',     // Referido
  'walk_in',      // Llegó a oficina
  'social_media',
  'portal',       // Portal inmobiliario externo
  'event',        // Evento/Feria
  'advertising',  // Publicidad
  'other',
]);

export const contactTypeEnum = pgEnum('contact_type', [
  'buyer',
  'seller',
  'renter',
  'landlord',
  'investor',
  'developer',
  'other',
]);

// ============================================================================
// CONTACTS (Leads/Clientes)
// ============================================================================

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  // Información personal
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  whatsapp: varchar('whatsapp', { length: 50 }),

  // Empresa (si aplica)
  company: varchar('company', { length: 255 }),
  position: varchar('position', { length: 100 }),

  // Clasificación
  type: contactTypeEnum('type').default('buyer'),
  status: contactStatusEnum('status').default('new'),
  source: contactSourceEnum('source').default('website'),

  // Calificación del lead
  score: integer('score').default(0), // 0-100, puede ser calculado por AI
  isHot: boolean('is_hot').default(false), // Lead caliente (prioridad)

  // Preferencias de búsqueda
  preferences: jsonb('preferences').$type<ContactPreferences>().default({}),

  // Presupuesto
  budgetMin: integer('budget_min'),
  budgetMax: integer('budget_max'),
  budgetCurrency: varchar('budget_currency', { length: 3 }).default('USD'),

  // Ubicación del contacto
  countryCode: varchar('country_code', { length: 3 }),
  city: varchar('city', { length: 100 }),
  address: varchar('address', { length: 500 }),

  // Asignación
  assignedTo: uuid('assigned_to').references(() => users.id),
  teamId: uuid('team_id').references(() => teams.id),

  // Seguimiento
  lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
  nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }),

  // Notas
  notes: text('notes'),

  // Tags personalizados
  tags: jsonb('tags').$type<string[]>().default([]),

  // Tracking (de dónde vino)
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  utmCampaign: varchar('utm_campaign', { length: 100 }),
  referrer: varchar('referrer', { length: 500 }),
  landingPage: varchar('landing_page', { length: 500 }),

  // Auditoría
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantEmailIdx: index('contacts_tenant_email_idx').on(table.tenantId, table.email),
  tenantPhoneIdx: index('contacts_tenant_phone_idx').on(table.tenantId, table.phone),
  tenantStatusIdx: index('contacts_tenant_status_idx').on(table.tenantId, table.status),
  tenantAssignedIdx: index('contacts_tenant_assigned_idx').on(table.tenantId, table.assignedTo),
  tenantSourceIdx: index('contacts_tenant_source_idx').on(table.tenantId, table.source),
  tenantCreatedAtIdx: index('contacts_tenant_created_at_idx').on(table.tenantId, table.createdAt),
  isHotIdx: index('contacts_is_hot_idx').on(table.tenantId, table.isHot),
}));

// ============================================================================
// CONTACT ACTIVITIES (Historial de interacciones)
// ============================================================================

export const contactActivities = pgTable('contact_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  type: varchar('type', { length: 50 }).notNull(), // call, email, meeting, note, tour, offer, etc.
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Relaciones opcionales
  propertyId: uuid('property_id').references(() => properties.id),
  dealId: uuid('deal_id'), // Se referenciará a deals

  // Metadata
  metadata: jsonb('metadata').default({}),

  // Duración (para llamadas/reuniones)
  durationMinutes: integer('duration_minutes'),

  // Autor
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  contactIdx: index('contact_activities_contact_idx').on(table.contactId),
  tenantTypeIdx: index('contact_activities_tenant_type_idx').on(table.tenantId, table.type),
  createdAtIdx: index('contact_activities_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// CONTACT PROPERTY INTERESTS (Propiedades de interés)
// ============================================================================

export const contactPropertyInterests = pgTable('contact_property_interests', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  interestLevel: varchar('interest_level', { length: 20 }).default('medium'), // low, medium, high
  status: varchar('status', { length: 20 }).default('interested'), // interested, toured, offered, rejected

  // Visitas
  touredAt: timestamp('toured_at', { withTimezone: true }),
  tourNotes: text('tour_notes'),

  // Oferta (si hizo)
  offerAmount: integer('offer_amount'),
  offerCurrency: varchar('offer_currency', { length: 3 }),
  offerStatus: varchar('offer_status', { length: 20 }), // pending, accepted, rejected, countered

  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  contactPropertyIdx: uniqueIndex('contact_property_interests_contact_property_idx').on(table.contactId, table.propertyId),
  tenantContactIdx: index('contact_property_interests_tenant_contact_idx').on(table.tenantId, table.contactId),
}));

// ============================================================================
// TIPOS
// ============================================================================

export interface ContactPreferences {
  // Tipo de propiedad
  propertyTypes?: string[]; // apartment, house, etc.
  operationTypes?: string[]; // sale, rent

  // Ubicación
  cities?: string[];
  sectors?: string[];

  // Características
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  minArea?: number;
  maxArea?: number;

  // Amenidades deseadas
  amenities?: string[];

  // Otros
  urgency?: 'low' | 'medium' | 'high';
  timeline?: string; // "3 meses", "inmediato"
  financing?: 'cash' | 'mortgage' | 'both';
  preApproved?: boolean;
}
