import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'owner',        // Dueño de la inmobiliaria (1 por tenant)
  'admin',        // Administrador con acceso total
  'manager',      // Gerente de equipo
  'agent',        // Asesor inmobiliario
  'assistant',    // Asistente administrativo
  'accountant',   // Solo acceso financiero
  'viewer',       // Solo lectura
]);

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'invited',      // Invitación enviada
  'suspended',
  'archived',
]);

// ============================================================================
// USERS
// ============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  // Clerk User ID
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),

  // Información personal
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),

  // Rol y permisos
  role: userRoleEnum('role').default('agent'),
  permissions: jsonb('permissions').$type<UserPermissions>().default({}),

  // Organización dentro del tenant
  teamId: uuid('team_id').references(() => teams.id),
  position: varchar('position', { length: 100 }), // "Senior Agent", "Sales Director"

  // Configuración personal
  settings: jsonb('settings').$type<UserSettings>().default({}),

  // Perfil público (para página web)
  publicProfile: jsonb('public_profile').$type<PublicProfile>().default({}),

  // Estado
  status: userStatusEnum('status').default('invited'),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),

  // Invitación
  invitedBy: uuid('invited_by'),
  invitedAt: timestamp('invited_at', { withTimezone: true }),

  // Auditoría
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantEmailIdx: uniqueIndex('users_tenant_email_idx').on(table.tenantId, table.email),
  tenantStatusIdx: index('users_tenant_status_idx').on(table.tenantId, table.status),
  clerkUserIdx: index('users_clerk_user_idx').on(table.clerkUserId),
}));

// ============================================================================
// TEAMS (Equipos dentro de un tenant)
// ============================================================================

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),

  // Líder del equipo
  leaderId: uuid('leader_id'), // Se actualiza después de crear el usuario

  // Configuración
  settings: jsonb('settings').default({}),

  // Auditoría
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantNameIdx: uniqueIndex('teams_tenant_name_idx').on(table.tenantId, table.name),
}));

// ============================================================================
// TIPOS
// ============================================================================

export interface UserPermissions {
  // Propiedades
  properties?: {
    create?: boolean;
    read?: 'own' | 'team' | 'all';
    update?: 'own' | 'team' | 'all';
    delete?: 'own' | 'team' | 'all';
    publish?: boolean;
    export?: boolean;
  };

  // Contactos
  contacts?: {
    create?: boolean;
    read?: 'own' | 'team' | 'all';
    update?: 'own' | 'team' | 'all';
    delete?: 'own' | 'team' | 'all';
    export?: boolean;
    import?: boolean;
  };

  // Negocios
  deals?: {
    create?: boolean;
    read?: 'own' | 'team' | 'all';
    update?: 'own' | 'team' | 'all';
    delete?: 'own' | 'team' | 'all';
    export?: boolean;
  };

  // Administración
  admin?: {
    manageUsers?: boolean;
    manageTeams?: boolean;
    manageSettings?: boolean;
    manageBilling?: boolean;
    viewReports?: boolean;
    manageIntegrations?: boolean;
  };
}

export interface UserSettings {
  // Notificaciones
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  dailyDigest?: boolean;

  // Preferencias
  language?: 'es' | 'en' | 'fr';
  dateFormat?: string;
  timezone?: string;

  // Dashboard
  defaultView?: 'properties' | 'contacts' | 'deals' | 'dashboard';
  dashboardWidgets?: string[];
}

export interface PublicProfile {
  bio?: string;
  specialties?: string[]; // ["Luxury", "Commercial", "Residential"]
  languages?: string[];
  certifications?: string[];
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
  };
  showOnWebsite?: boolean;
  slug?: string; // para URL pública: /agentes/juan-perez
}

// ============================================================================
// DEFAULT PERMISSIONS BY ROLE
// ============================================================================

export const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  owner: {
    properties: { create: true, read: 'all', update: 'all', delete: 'all', publish: true, export: true },
    contacts: { create: true, read: 'all', update: 'all', delete: 'all', export: true, import: true },
    deals: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    admin: { manageUsers: true, manageTeams: true, manageSettings: true, manageBilling: true, viewReports: true, manageIntegrations: true },
  },
  admin: {
    properties: { create: true, read: 'all', update: 'all', delete: 'all', publish: true, export: true },
    contacts: { create: true, read: 'all', update: 'all', delete: 'all', export: true, import: true },
    deals: { create: true, read: 'all', update: 'all', delete: 'all', export: true },
    admin: { manageUsers: true, manageTeams: true, manageSettings: true, manageBilling: false, viewReports: true, manageIntegrations: true },
  },
  manager: {
    properties: { create: true, read: 'team', update: 'team', delete: 'team', publish: true, export: true },
    contacts: { create: true, read: 'team', update: 'team', delete: 'team', export: true, import: false },
    deals: { create: true, read: 'team', update: 'team', delete: 'team', export: true },
    admin: { manageUsers: false, manageTeams: false, manageSettings: false, manageBilling: false, viewReports: true, manageIntegrations: false },
  },
  agent: {
    properties: { create: true, read: 'own', update: 'own', delete: false, publish: false, export: false },
    contacts: { create: true, read: 'own', update: 'own', delete: false, export: false, import: false },
    deals: { create: true, read: 'own', update: 'own', delete: false, export: false },
    admin: { manageUsers: false, manageTeams: false, manageSettings: false, manageBilling: false, viewReports: false, manageIntegrations: false },
  },
  assistant: {
    properties: { create: true, read: 'all', update: 'all', delete: false, publish: false, export: true },
    contacts: { create: true, read: 'all', update: 'all', delete: false, export: true, import: true },
    deals: { create: false, read: 'all', update: false, delete: false, export: true },
    admin: { manageUsers: false, manageTeams: false, manageSettings: false, manageBilling: false, viewReports: false, manageIntegrations: false },
  },
  accountant: {
    properties: { create: false, read: 'all', update: false, delete: false, publish: false, export: true },
    contacts: { create: false, read: 'all', update: false, delete: false, export: true, import: false },
    deals: { create: false, read: 'all', update: false, delete: false, export: true },
    admin: { manageUsers: false, manageTeams: false, manageSettings: false, manageBilling: true, viewReports: true, manageIntegrations: false },
  },
  viewer: {
    properties: { create: false, read: 'all', update: false, delete: false, publish: false, export: false },
    contacts: { create: false, read: 'all', update: false, delete: false, export: false, import: false },
    deals: { create: false, read: 'all', update: false, delete: false, export: false },
    admin: { manageUsers: false, manageTeams: false, manageSettings: false, manageBilling: false, viewReports: false, manageIntegrations: false },
  },
};
