// ============================================================================
// TENANT TYPES
// ============================================================================

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  countryCode: string;
  currency: string;
  timezone: string;
  logoUrl?: string;
  primaryColor?: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  status: 'active' | 'suspended' | 'pending_setup' | 'archived';
  settings: TenantSettings;
  features: TenantFeatures;
  maxUsers: number;
  maxProperties: number;
  createdAt: string;
}

export interface TenantSettings {
  defaultCurrency?: 'USD' | 'DOP' | 'EUR';
  showPriceInBothCurrencies?: boolean;
  exchangeRate?: number;
  googleMapsApiKey?: string;
  whatsappBusinessId?: string;
}

export interface TenantFeatures {
  deals?: boolean;
  marketing?: boolean;
  analytics?: boolean;
  apiAccess?: boolean;
  whiteLabel?: boolean;
  customReports?: boolean;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  tenantId: string;
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  permissions: UserPermissions;
  teamId?: string;
  position?: string;
  status: 'active' | 'invited' | 'suspended' | 'archived';
  lastActiveAt?: string;
  createdAt: string;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'agent' | 'assistant' | 'accountant' | 'viewer';

export interface UserPermissions {
  properties?: PermissionSet;
  contacts?: PermissionSet;
  deals?: PermissionSet;
  admin?: AdminPermissions;
}

export interface PermissionSet {
  create?: boolean;
  read?: 'own' | 'team' | 'all';
  update?: 'own' | 'team' | 'all';
  delete?: 'own' | 'team' | 'all' | boolean;
  export?: boolean;
}

export interface AdminPermissions {
  manageUsers?: boolean;
  manageTeams?: boolean;
  manageSettings?: boolean;
  manageBilling?: boolean;
  viewReports?: boolean;
}

// ============================================================================
// PROPERTY TYPES
// ============================================================================

export interface Property {
  id: string;
  tenantId: string;
  code: string;
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  propertyType: PropertyType;
  operationType: OperationType;
  priceUsd?: string;
  priceDop?: string;
  priceEur?: string;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpots?: number;
  floors?: number;
  yearBuilt?: number;
  areaM2?: string;
  lotSizeM2?: string;
  countryCode: string;
  cityId?: string;
  sectorId?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  amenities: string[];
  features: PropertyFeatures;
  images: PropertyImage[];
  virtualTourUrl?: string;
  videoUrl?: string;
  status: PropertyStatus;
  isFeatured: boolean;
  isExclusive: boolean;
  showOnWebsite: boolean;
  agentId?: string;
  teamId?: string;
  viewsCount: number;
  inquiriesCount: number;
  favoritesCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'penthouse'
  | 'villa'
  | 'townhouse'
  | 'land'
  | 'commercial'
  | 'office'
  | 'warehouse'
  | 'building'
  | 'hotel'
  | 'farm'
  | 'other';

export type OperationType = 'sale' | 'rent' | 'rent_to_own' | 'auction';

export type PropertyStatus = 'draft' | 'pending' | 'active' | 'reserved' | 'sold' | 'rented' | 'archived';

export interface PropertyFeatures {
  furnished?: boolean;
  airConditioning?: boolean;
  pool?: boolean;
  garden?: boolean;
  elevator?: boolean;
  security24h?: boolean;
  gym?: boolean;
  [key: string]: boolean | undefined;
}

export interface PropertyImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  order: number;
  isPrimary: boolean;
}

// ============================================================================
// CONTACT TYPES
// ============================================================================

export interface Contact {
  id: string;
  tenantId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  position?: string;
  type: ContactType;
  status: ContactStatus;
  source: ContactSource;
  score: number;
  isHot: boolean;
  preferences: ContactPreferences;
  budgetMin?: number;
  budgetMax?: number;
  budgetCurrency: string;
  assignedTo?: string;
  teamId?: string;
  tags: string[];
  notes?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContactType = 'buyer' | 'seller' | 'renter' | 'landlord' | 'investor' | 'developer' | 'other';

export type ContactStatus = 'new' | 'contacted' | 'qualified' | 'touring' | 'negotiating' | 'converted' | 'lost' | 'archived';

export type ContactSource = 'website' | 'whatsapp' | 'phone' | 'email' | 'referral' | 'walk_in' | 'social_media' | 'portal' | 'event' | 'advertising' | 'other';

export interface ContactPreferences {
  propertyTypes?: string[];
  operationTypes?: string[];
  cities?: string[];
  sectors?: string[];
  minBedrooms?: number;
  maxBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
  urgency?: 'low' | 'medium' | 'high';
  financing?: 'cash' | 'mortgage' | 'both';
}

// ============================================================================
// DEAL TYPES
// ============================================================================

export interface Deal {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  description?: string;
  type: 'sale' | 'rent' | 'rent_to_own';
  pipelineId?: string;
  stageId?: string;
  amount?: string;
  currency: string;
  commissionPercent?: string;
  commissionAmount?: string;
  contactId?: string;
  propertyId?: string;
  assignedTo?: string;
  teamId?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  probability: number;
  lostReason?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  wonAt?: string;
  lostAt?: string;
}

export interface DealPipeline {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  stages: DealStage[];
}

export interface DealStage {
  id: string;
  pipelineId: string;
  name: string;
  color: string;
  sortOrder: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface SearchParams {
  q?: string;
}

export type ListParams = PaginationParams & SortParams & SearchParams;
