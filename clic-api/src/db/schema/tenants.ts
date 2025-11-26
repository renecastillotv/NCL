import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, integer, pgEnum } from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'free',        // Prueba gratuita
  'starter',     // 1-5 usuarios, funciones básicas
  'professional', // 6-20 usuarios, todas las funciones
  'enterprise',  // 20+ usuarios, API access, white-label
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'paused',
]);

export const tenantStatusEnum = pgEnum('tenant_status', [
  'active',
  'suspended',
  'pending_setup',
  'archived',
]);

// ============================================================================
// TENANTS (Inmobiliarias)
// ============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Identificación única del tenant
  slug: varchar('slug', { length: 63 }).notNull().unique(), // clic-rd, remax-usa
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).unique(), // org_xxxxx de Clerk

  // Información de la inmobiliaria
  name: varchar('name', { length: 255 }).notNull(),
  legalName: varchar('legal_name', { length: 255 }),
  taxId: varchar('tax_id', { length: 50 }), // RNC, EIN, etc.

  // Contacto
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),

  // Ubicación
  countryCode: varchar('country_code', { length: 3 }).notNull(), // DOM, USA, ESP
  timezone: varchar('timezone', { length: 50 }).default('America/Santo_Domingo'),
  currency: varchar('currency', { length: 3 }).default('USD'),

  // Branding
  logoUrl: varchar('logo_url', { length: 500 }),
  primaryColor: varchar('primary_color', { length: 7 }).default('#0066CC'),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#FF6600'),

  // Configuración
  settings: jsonb('settings').$type<TenantSettings>().default({}),
  features: jsonb('features').$type<TenantFeatures>().default({}),

  // Suscripción
  plan: subscriptionPlanEnum('plan').default('free'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('trialing'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  subscriptionEndsAt: timestamp('subscription_ends_at', { withTimezone: true }),

  // Límites según plan
  maxUsers: integer('max_users').default(3),
  maxProperties: integer('max_properties').default(50),
  maxStorageMb: integer('max_storage_mb').default(500),

  // Estado
  status: tenantStatusEnum('status').default('pending_setup'),

  // Auditoría
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid('created_by'), // Super admin que creó el tenant
});

// ============================================================================
// TIPOS
// ============================================================================

export interface TenantSettings {
  // Propiedades
  defaultCurrency?: 'USD' | 'DOP' | 'EUR';
  showPriceInBothCurrencies?: boolean;
  exchangeRate?: number;

  // Contacto
  requirePhoneVerification?: boolean;
  autoAssignLeads?: boolean;
  leadAssignmentStrategy?: 'round_robin' | 'load_balanced' | 'manual';

  // Notificaciones
  emailNotifications?: boolean;
  whatsappNotifications?: boolean;
  slackWebhook?: string;

  // Integraciones
  googleMapsApiKey?: string;
  whatsappBusinessId?: string;
  facebookPixelId?: string;
  googleAnalyticsId?: string;

  // Personalización
  customDomain?: string;
  customEmailDomain?: string;
}

export interface TenantFeatures {
  // Módulos habilitados
  deals?: boolean;
  marketing?: boolean;
  analytics?: boolean;
  apiAccess?: boolean;
  whiteLabel?: boolean;
  customReports?: boolean;

  // AI Features
  aiPropertyDescriptions?: boolean;
  aiLeadScoring?: boolean;
  aiPriceEstimation?: boolean;

  // Integraciones
  portalSyndication?: boolean; // Publicar en portales externos
  virtualTours?: boolean;
  documentSigning?: boolean;
}

// ============================================================================
// TENANT DOMAINS (para white-label)
// ============================================================================

export const tenantDomains = pgTable('tenant_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  domain: varchar('domain', { length: 255 }).notNull().unique(),
  isPrimary: boolean('is_primary').default(false),
  isVerified: boolean('is_verified').default(false),
  verificationToken: varchar('verification_token', { length: 255 }),
  sslStatus: varchar('ssl_status', { length: 50 }).default('pending'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// TENANT USAGE (para facturación y límites)
// ============================================================================

export const tenantUsage = pgTable('tenant_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  // Período
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

  // Contadores
  usersCount: integer('users_count').default(0),
  propertiesCount: integer('properties_count').default(0),
  contactsCount: integer('contacts_count').default(0),
  dealsCount: integer('deals_count').default(0),
  storageUsedMb: integer('storage_used_mb').default(0),
  apiCallsCount: integer('api_calls_count').default(0),
  emailsSent: integer('emails_sent').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================================
// TENANT BILLING
// ============================================================================

export const tenantBilling = pgTable('tenant_billing', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  // Stripe
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),

  // Facturación
  billingEmail: varchar('billing_email', { length: 255 }),
  billingName: varchar('billing_name', { length: 255 }),
  billingAddress: jsonb('billing_address'),

  // Último pago
  lastPaymentAt: timestamp('last_payment_at', { withTimezone: true }),
  lastPaymentAmount: integer('last_payment_amount'), // en centavos

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
