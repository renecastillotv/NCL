import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, decimal, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { users, teams } from './users';

// ============================================================================
// ENUMS
// ============================================================================

export const propertyStatusEnum = pgEnum('property_status', [
  'draft',        // Borrador
  'pending',      // Pendiente de aprobación
  'active',       // Publicada y disponible
  'reserved',     // Reservada (con señal)
  'sold',         // Vendida
  'rented',       // Alquilada
  'archived',     // Archivada
]);

export const operationTypeEnum = pgEnum('operation_type', [
  'sale',
  'rent',
  'rent_to_own',  // Alquiler con opción a compra
  'auction',      // Subasta
]);

export const propertyTypeEnum = pgEnum('property_type', [
  'apartment',
  'house',
  'penthouse',
  'villa',
  'townhouse',
  'land',
  'commercial',
  'office',
  'warehouse',
  'building',
  'hotel',
  'farm',
  'other',
]);

// ============================================================================
// PROPERTIES
// ============================================================================

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  // Identificación
  code: varchar('code', { length: 50 }).notNull(), // CLIC-001, único por tenant
  slug: varchar('slug', { length: 255 }).notNull(), // apartamento-piantini-3-habitaciones

  // Información básica
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  excerpt: varchar('excerpt', { length: 500 }), // Resumen corto

  // Tipo y operación
  propertyType: propertyTypeEnum('property_type').notNull(),
  operationType: operationTypeEnum('operation_type').notNull(),

  // Precios
  priceUsd: decimal('price_usd', { precision: 15, scale: 2 }),
  priceDop: decimal('price_dop', { precision: 15, scale: 2 }),
  priceEur: decimal('price_eur', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  pricePerM2: decimal('price_per_m2', { precision: 10, scale: 2 }),
  maintenanceFee: decimal('maintenance_fee', { precision: 10, scale: 2 }),

  // Características físicas
  bedrooms: integer('bedrooms'),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }), // 2.5 baños
  parkingSpots: integer('parking_spots'),
  floors: integer('floors'),
  yearBuilt: integer('year_built'),

  // Áreas
  areaM2: decimal('area_m2', { precision: 10, scale: 2 }),
  lotSizeM2: decimal('lot_size_m2', { precision: 10, scale: 2 }),
  coveredAreaM2: decimal('covered_area_m2', { precision: 10, scale: 2 }),

  // Ubicación
  countryCode: varchar('country_code', { length: 3 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),
  cityId: uuid('city_id').references(() => cities.id),
  sectorId: uuid('sector_id').references(() => sectors.id),
  address: varchar('address', { length: 500 }),

  // Coordenadas (para mapa)
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  // Amenidades y características (JSON para flexibilidad)
  amenities: jsonb('amenities').$type<string[]>().default([]),
  features: jsonb('features').$type<PropertyFeatures>().default({}),

  // SEO
  metaTitle: varchar('meta_title', { length: 70 }),
  metaDescription: varchar('meta_description', { length: 160 }),

  // Multimedia
  images: jsonb('images').$type<PropertyImage[]>().default([]),
  virtualTourUrl: varchar('virtual_tour_url', { length: 500 }),
  videoUrl: varchar('video_url', { length: 500 }),

  // Estado y visibilidad
  status: propertyStatusEnum('status').default('draft'),
  isFeatured: boolean('is_featured').default(false),
  isExclusive: boolean('is_exclusive').default(false),
  showOnWebsite: boolean('show_on_website').default(true),

  // Disponibilidad
  availableFrom: timestamp('available_from', { withTimezone: true }),

  // Asignación
  agentId: uuid('agent_id').references(() => users.id),
  teamId: uuid('team_id').references(() => teams.id),

  // Estadísticas
  viewsCount: integer('views_count').default(0),
  inquiriesCount: integer('inquiries_count').default(0),
  favoritesCount: integer('favorites_count').default(0),

  // Auditoría
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
}, (table) => ({
  tenantCodeIdx: uniqueIndex('properties_tenant_code_idx').on(table.tenantId, table.code),
  tenantSlugIdx: uniqueIndex('properties_tenant_slug_idx').on(table.tenantId, table.slug),
  tenantStatusIdx: index('properties_tenant_status_idx').on(table.tenantId, table.status),
  tenantTypeIdx: index('properties_tenant_type_idx').on(table.tenantId, table.propertyType),
  tenantOperationIdx: index('properties_tenant_operation_idx').on(table.tenantId, table.operationType),
  tenantCityIdx: index('properties_tenant_city_idx').on(table.tenantId, table.cityId),
  tenantAgentIdx: index('properties_tenant_agent_idx').on(table.tenantId, table.agentId),
  priceIdx: index('properties_price_idx').on(table.priceUsd),
  featuredIdx: index('properties_featured_idx').on(table.tenantId, table.isFeatured),
  createdAtIdx: index('properties_created_at_idx').on(table.createdAt),
}));

// ============================================================================
// CITIES
// ============================================================================

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  countryCode: varchar('country_code', { length: 3 }).notNull(),
  stateProvince: varchar('state_province', { length: 100 }),

  // Puede ser global (tenantId = null) o específica del tenant
  isGlobal: boolean('is_global').default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantSlugIdx: uniqueIndex('cities_tenant_slug_idx').on(table.tenantId, table.slug),
}));

// ============================================================================
// SECTORS (Barrios/Zonas dentro de una ciudad)
// ============================================================================

export const sectors = pgTable('sectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  cityId: uuid('city_id').notNull().references(() => cities.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),

  // Puede ser global o específico del tenant
  isGlobal: boolean('is_global').default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCitySlugIdx: uniqueIndex('sectors_tenant_city_slug_idx').on(table.tenantId, table.cityId, table.slug),
}));

// ============================================================================
// PROPERTY CATEGORIES (Categorías custom por tenant)
// ============================================================================

export const propertyCategories = pgTable('property_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),

  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantSlugIdx: uniqueIndex('property_categories_tenant_slug_idx').on(table.tenantId, table.slug),
}));

// ============================================================================
// PROPERTY TAGS
// ============================================================================

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).default('#666666'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantSlugIdx: uniqueIndex('tags_tenant_slug_idx').on(table.tenantId, table.slug),
}));

export const propertyTags = pgTable('property_tags', {
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: uniqueIndex('property_tags_pk').on(table.propertyId, table.tagId),
}));

// ============================================================================
// PROPERTY DOCUMENTS
// ============================================================================

export const propertyDocuments = pgTable('property_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // title_deed, floor_plan, contract, etc.
  url: varchar('url', { length: 500 }).notNull(),
  size: integer('size'), // en bytes
  mimeType: varchar('mime_type', { length: 100 }),

  isPublic: boolean('is_public').default(false), // visible para clientes

  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// TIPOS
// ============================================================================

export interface PropertyFeatures {
  // Características internas
  furnished?: boolean;
  airConditioning?: boolean;
  heating?: boolean;
  fireplace?: boolean;
  closets?: boolean;
  kitchen?: 'equipped' | 'semi-equipped' | 'empty';
  laundryRoom?: boolean;
  serviceRoom?: boolean;

  // Características externas
  garden?: boolean;
  pool?: boolean;
  terrace?: boolean;
  balcony?: boolean;
  rooftop?: boolean;

  // Edificio
  elevator?: boolean;
  lobby?: boolean;
  security24h?: boolean;
  concierge?: boolean;
  gym?: boolean;
  commonAreas?: boolean;
  generator?: boolean;
  cistern?: boolean;

  // Servicios
  water?: boolean;
  electricity?: boolean;
  gas?: boolean;
  internet?: boolean;
  cableTV?: boolean;

  // Otros
  petsAllowed?: boolean;
  wheelchairAccessible?: boolean;
}

export interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  order: number;
  isPrimary: boolean;
}
