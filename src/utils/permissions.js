// Matrice de permissions pour les rôles admin Taoman.
// Synchronisé avec backend/src/common/auth/role-permissions.ts

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*', 'admins.manage'],
  DG: ['*'],
  COMPLIANCE: [
    'dashboard.view',
    'users.view',
    'kyc.view', 'kyc.review',
    'subscriptions.view',
    'audit.view',
    'service-requests.view',
  ],
  MARKETING: [
    'dashboard.view',
    'banners.view', 'banners.write',
    'plans.view', 'plans.write',
    'sectors.view', 'sectors.write',
    'cms.view', 'cms.write',
  ],
  FINANCE: [
    'dashboard.view',
    'finance.view', 'finance.write',
    'subscriptions.view',
  ],
  SERVICE_MANAGER: [
    'dashboard.view',
    'service-requests.view', 'service-requests.quote', 'service-requests.reject',
    'sectors.view',
  ],
  READ_ONLY: [
    'dashboard.view',
    'users.view',
    'subscriptions.view',
    'kyc.view',
    'plans.view',
    'sectors.view',
    'banners.view',
    'finance.view',
    'audit.view',
    'service-requests.view',
    'cms.view',
  ],
}

export function hasPerm(role, perm) {
  if (!perm) return true
  const perms = ROLE_PERMISSIONS[role] || []
  if (perms.includes(perm)) return true
  // Permission "admins.manage" est réservée au SUPER_ADMIN (pas inclus dans le wildcard)
  if (perm === 'admins.manage') return false
  if (perms.includes('*')) return true
  return false
}

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  DG: 'DG',
  COMPLIANCE: 'Conformité',
  MARKETING: 'Marketing',
  FINANCE: 'Finance',
  SERVICE_MANAGER: 'Service Manager',
  READ_ONLY: 'Lecture seule',
}
