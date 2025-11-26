// Permission checking middleware
// Determines if user can perform action on module based on their role
import { UserContext } from './auth.ts';

// Module access by role
const MODULE_ACCESS: Record<string, string[]> = {
  dashboard: ['super_admin', 'admin', 'manager', 'agent', 'accountant'],
  properties: ['super_admin', 'admin', 'manager', 'agent'],
  contacts: ['super_admin', 'admin', 'manager', 'agent'],
  deals: ['super_admin', 'admin', 'manager', 'agent', 'accountant'],
  content: ['super_admin', 'admin'],
  users: ['super_admin', 'admin'],
  config: ['super_admin', 'admin'],
  reports: ['super_admin', 'admin', 'manager', 'accountant'],
  calendar: ['super_admin', 'admin', 'manager', 'agent'],
};

// Action permissions by role
const ACTION_PERMISSIONS: Record<string, string[]> = {
  create: ['super_admin', 'admin', 'manager', 'agent'],
  read: ['super_admin', 'admin', 'manager', 'agent', 'accountant', 'client', 'viewer'],
  update: ['super_admin', 'admin', 'manager', 'agent'],
  delete: ['super_admin', 'admin'],
  export: ['super_admin', 'admin', 'manager', 'accountant'],
  manage: ['super_admin'],
  bulk: ['super_admin', 'admin'],
};

// Map common action names to permission actions
const ACTION_MAP: Record<string, string> = {
  list: 'read',
  get: 'read',
  view: 'read',
  create: 'create',
  insert: 'create',
  update: 'update',
  edit: 'update',
  patch: 'update',
  delete: 'delete',
  remove: 'delete',
  export: 'export',
  download: 'export',
  bulk_create: 'bulk',
  bulk_update: 'bulk',
  bulk_delete: 'bulk',
  manage: 'manage',
};

export function checkPermission(
  context: UserContext,
  module: string,
  action: string
): boolean {
  // Get primary role
  const primaryRole = context.roles[0]?.name || 'agent';

  // Check if user has access to module
  const moduleRoles = MODULE_ACCESS[module];
  if (!moduleRoles || !moduleRoles.includes(primaryRole)) {
    console.log(`❌ Role '${primaryRole}' denied access to module '${module}'`);
    return false;
  }

  // Map action to permission action
  const permissionAction = ACTION_MAP[action] || action;

  // Check if user can perform action
  const actionRoles = ACTION_PERMISSIONS[permissionAction];
  if (!actionRoles || !actionRoles.includes(primaryRole)) {
    console.log(`❌ Role '${primaryRole}' denied action '${action}' on module '${module}'`);
    return false;
  }

  console.log(`✅ Role '${primaryRole}' granted ${action} on ${module}`);
  return true;
}

// Check if user can access specific record (ownership check)
export async function checkRecordAccess(
  context: UserContext,
  recordOwnerId: string,
  recordTeamId?: string,
  recordCountryCode?: string
): Promise<boolean> {
  // Super admin can access everything
  if (context.scope === 'all') {
    return true;
  }

  // Country scope: check country match
  if (context.scope === 'country') {
    return recordCountryCode === context.country_code;
  }

  // Team scope: check team match
  if (context.scope === 'team') {
    if (recordTeamId && recordTeamId === context.team_id) {
      return true;
    }
    // Also allow if user owns the record
    return recordOwnerId === context.userId;
  }

  // Own scope: only own records
  if (context.scope === 'own') {
    return recordOwnerId === context.userId;
  }

  return false;
}
