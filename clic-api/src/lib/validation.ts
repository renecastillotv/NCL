import { z } from 'zod';

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

// UUID
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Email
export const emailSchema = z.string().email('Invalid email format').toLowerCase();

// Phone (flexible)
export const phoneSchema = z
  .string()
  .min(7, 'Phone number too short')
  .max(20, 'Phone number too long')
  .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone format');

// URL
export const urlSchema = z.string().url('Invalid URL format');

// Slug
export const slugSchema = z
  .string()
  .min(2, 'Slug too short')
  .max(100, 'Slug too long')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format (use lowercase letters, numbers, and hyphens)');

// Money amount
export const moneySchema = z
  .number()
  .positive('Amount must be positive')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places');

// Percentage
export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be negative')
  .max(100, 'Percentage cannot exceed 100');

// Country code (ISO 3166-1 alpha-3)
export const countryCodeSchema = z
  .string()
  .length(3, 'Country code must be 3 characters')
  .toUpperCase();

// Currency code (ISO 4217)
export const currencyCodeSchema = z
  .string()
  .length(3, 'Currency code must be 3 characters')
  .toUpperCase();

// Date (ISO 8601)
export const dateSchema = z.coerce.date();

// Positive integer
export const positiveIntSchema = z.number().int().positive();

// Non-negative integer
export const nonNegativeIntSchema = z.number().int().nonnegative();

// ============================================================================
// PAGINATION SCHEMA
// ============================================================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

// ============================================================================
// SORT SCHEMA
// ============================================================================

export const sortSchema = z.object({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// SEARCH SCHEMA
// ============================================================================

export const searchSchema = z.object({
  q: z.string().min(1).max(100).optional(),
});

// ============================================================================
// PROPERTY VALIDATION SCHEMAS
// ============================================================================

export const createPropertySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().max(5000).optional(),
  excerpt: z.string().max(500).optional(),

  propertyType: z.enum([
    'apartment', 'house', 'penthouse', 'villa', 'townhouse',
    'land', 'commercial', 'office', 'warehouse', 'building',
    'hotel', 'farm', 'other'
  ]),
  operationType: z.enum(['sale', 'rent', 'rent_to_own', 'auction']),

  priceUsd: moneySchema.optional(),
  priceDop: moneySchema.optional(),
  priceEur: moneySchema.optional(),
  currency: currencyCodeSchema.optional().default('USD'),

  bedrooms: nonNegativeIntSchema.optional(),
  bathrooms: z.number().nonnegative().optional(),
  parkingSpots: nonNegativeIntSchema.optional(),
  floors: positiveIntSchema.optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear() + 5).optional(),

  areaM2: z.number().positive().optional(),
  lotSizeM2: z.number().positive().optional(),

  countryCode: countryCodeSchema,
  cityId: uuidSchema.optional(),
  sectorId: uuidSchema.optional(),
  address: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),

  amenities: z.array(z.string()).optional().default([]),
  features: z.record(z.unknown()).optional().default({}),

  images: z.array(z.object({
    url: urlSchema,
    alt: z.string().optional(),
    order: z.number().int().nonnegative(),
    isPrimary: z.boolean().default(false),
  })).optional().default([]),

  virtualTourUrl: urlSchema.optional(),
  videoUrl: urlSchema.optional(),

  status: z.enum(['draft', 'pending', 'active']).optional().default('draft'),
  isFeatured: z.boolean().optional().default(false),
  isExclusive: z.boolean().optional().default(false),
  showOnWebsite: z.boolean().optional().default(true),

  agentId: uuidSchema.optional(),
  teamId: uuidSchema.optional(),
});

export const updatePropertySchema = createPropertySchema.partial();

// ============================================================================
// CONTACT VALIDATION SCHEMAS
// ============================================================================

export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().max(100).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  whatsapp: phoneSchema.optional(),

  company: z.string().max(255).optional(),
  position: z.string().max(100).optional(),

  type: z.enum(['buyer', 'seller', 'renter', 'landlord', 'investor', 'developer', 'other']).optional().default('buyer'),
  source: z.enum([
    'website', 'whatsapp', 'phone', 'email', 'referral',
    'walk_in', 'social_media', 'portal', 'event', 'advertising', 'other'
  ]).optional().default('website'),

  budgetMin: positiveIntSchema.optional(),
  budgetMax: positiveIntSchema.optional(),
  budgetCurrency: currencyCodeSchema.optional().default('USD'),

  preferences: z.record(z.unknown()).optional().default({}),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().max(5000).optional(),

  assignedTo: uuidSchema.optional(),
  teamId: uuidSchema.optional(),

  // UTM tracking
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
}).refine(
  (data) => data.email || data.phone || data.whatsapp,
  { message: 'At least one contact method (email, phone, or whatsapp) is required' }
);

export const updateContactSchema = createContactSchema.partial();

// ============================================================================
// DEAL VALIDATION SCHEMAS
// ============================================================================

export const createDealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional(),

  type: z.enum(['sale', 'rent', 'rent_to_own']),

  amount: moneySchema.optional(),
  currency: currencyCodeSchema.optional().default('USD'),
  commissionPercent: percentageSchema.optional(),

  contactId: uuidSchema.optional(),
  propertyId: uuidSchema.optional(),

  pipelineId: uuidSchema.optional(),
  stageId: uuidSchema.optional(),

  assignedTo: uuidSchema.optional(),
  teamId: uuidSchema.optional(),

  expectedCloseDate: dateSchema.optional(),
  probability: percentageSchema.optional().default(0),

  notes: z.string().max(5000).optional(),
});

export const updateDealSchema = createDealSchema.partial();

// ============================================================================
// USER VALIDATION SCHEMAS
// ============================================================================

export const inviteUserSchema = z.object({
  email: emailSchema,
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.enum(['admin', 'manager', 'agent', 'assistant', 'accountant', 'viewer']).default('agent'),
  teamId: uuidSchema.optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: phoneSchema.optional(),
  role: z.enum(['admin', 'manager', 'agent', 'assistant', 'accountant', 'viewer']).optional(),
  teamId: uuidSchema.optional(),
  permissions: z.record(z.unknown()).optional(),
  publicProfile: z.record(z.unknown()).optional(),
});

// ============================================================================
// TENANT VALIDATION SCHEMAS
// ============================================================================

export const createTenantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  slug: slugSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  website: urlSchema.optional(),
  countryCode: countryCodeSchema,
  timezone: z.string().max(50).optional(),
  currency: currencyCodeSchema.optional().default('USD'),
});

export const updateTenantSchema = createTenantSchema.partial().omit({ slug: true });
