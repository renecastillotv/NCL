// ============================================================================
// CLIC CRM - Middleware Index
// ============================================================================

export { tenantMiddleware, withTenant, hasFeature, PLAN_LIMITS } from './tenant';
export type { TenantContext } from './tenant';

export {
  authMiddleware,
  checkPermission,
  getScopeFilter,
  isOwnerOrAdmin,
  isManager,
  hasAdminAccess
} from './auth';
export type { UserContext } from './auth';
