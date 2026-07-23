// Matrice de permissions pour les rôles admin Taoman.
// Synchronisé avec backend/src/common/permissions/permissions.ts

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*', 'admins.manage'],
  DG: ['*'],
  COMPLIANCE: [
    'dashboard.view',
    'users.view', 'users.manage',
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
    'media.view', 'media.write',
  ],
  FINANCE: [
    'dashboard.view',
    'finance.view', 'finance.write',
    'subscriptions.view',
  ],
  SUPPORT: [
    'dashboard.view',
    'users.view',
    'sectors.view',
    'service-requests.view', 'service-requests.manage',
  ],
  SERVICE_MANAGER: [
    'dashboard.view',
    'sectors.view',
    'service-requests.view', 'service-requests.manage',
    'service-requests.quote', 'service-requests.reject',
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
    'media.view',
  ],
}

// Catalogue complet des permissions accordables individuellement à un
// admin par le super admin, groupées par module pour l'UI de création.
export const PERMISSION_GROUPS = [
  {
    label: 'Général',
    perms: [
      { key: 'dashboard.view', label: 'Voir le tableau de bord' },
      { key: 'audit.view', label: "Voir le journal d'audit" },
    ],
  },
  {
    label: 'Utilisateurs',
    perms: [
      { key: 'users.view', label: 'Voir les utilisateurs' },
      { key: 'users.manage', label: 'Créer / suspendre / activer des utilisateurs' },
    ],
  },
  {
    label: 'KYC',
    perms: [
      { key: 'kyc.view', label: 'Voir les documents KYC' },
      { key: 'kyc.review', label: 'Approuver / rejeter le KYC' },
    ],
  },
  {
    label: 'Investissements',
    perms: [
      { key: 'subscriptions.view', label: 'Voir les souscriptions' },
      { key: 'plans.view', label: 'Voir les plans' },
      { key: 'plans.write', label: 'Créer / modifier les plans' },
    ],
  },
  {
    label: 'Finance',
    perms: [
      { key: 'finance.view', label: 'Voir les finances' },
      { key: 'finance.write', label: 'Valider / rejeter les transactions' },
    ],
  },
  {
    label: 'Services',
    perms: [
      { key: 'sectors.view', label: 'Voir les secteurs de service' },
      { key: 'sectors.write', label: 'Créer / modifier les secteurs' },
      { key: 'service-requests.view', label: 'Voir les demandes de service' },
      { key: 'service-requests.manage', label: 'Gérer les demandes de service' },
      { key: 'service-requests.quote', label: 'Envoyer un devis' },
      { key: 'service-requests.reject', label: 'Rejeter une demande' },
    ],
  },
  {
    label: 'Contenu',
    perms: [
      { key: 'banners.view', label: 'Voir les bannières' },
      { key: 'banners.write', label: 'Créer / modifier les bannières' },
      { key: 'cms.view', label: 'Voir le contenu CMS' },
      { key: 'cms.write', label: 'Modifier le contenu CMS' },
      { key: 'media.view', label: 'Voir la médiathèque' },
      { key: 'media.write', label: 'Ajouter / supprimer des médias' },
    ],
  },
]

export const PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.perms.map((p) => p.key))

export const PERMISSION_LABELS = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.perms.map((p) => [p.key, p.label])),
)

/// `user` peut être une chaîne de rôle (compat) ou un objet { role, permissions }.
/// Si `permissions` est un tableau non vide, il remplace entièrement le jeu
/// de permissions par défaut du rôle (sauf SUPER_ADMIN/DG, toujours wildcard).
export function hasPerm(user, perm) {
  if (!perm) return true
  const role = typeof user === 'string' ? user : user?.role
  const customPermissions = typeof user === 'string' ? [] : user?.permissions || []

  if (role === 'SUPER_ADMIN' || role === 'DG') {
    return true
  }
  if (perm === 'admins.manage') return false

  if (customPermissions.length > 0) {
    return customPermissions.includes(perm)
  }
  const perms = ROLE_PERMISSIONS[role] || []
  return perms.includes(perm)
}

export const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  DG: 'DG',
  COMPLIANCE: 'Conformité',
  MARKETING: 'Marketing',
  FINANCE: 'Finance',
  SUPPORT: 'Support',
  SERVICE_MANAGER: 'Service Manager',
  READ_ONLY: 'Lecture seule',
}
