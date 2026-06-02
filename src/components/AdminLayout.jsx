import { Outlet, useLocation } from 'react-router-dom'
import { TopBar } from './UI'

const PAGE_META = {
  '/': {
    title: 'Tableau de bord',
    subtitle: 'Indicateurs, graphiques et files d\'attente',
  },
  '/investors': {
    title: 'Investisseurs',
    subtitle: 'Gestion des comptes investisseurs TAOMAN',
  },
  '/subscriptions': {
    title: 'Souscriptions',
    subtitle: 'Suivi des investissements et statuts',
  },
  '/documents': {
    title: 'Documents KYC',
    subtitle: 'Vérification des pièces d\'identité',
  },
  '/service-requests': {
    title: 'Demandes de services',
    subtitle: 'Devis et réservations envoyés depuis l\'application',
  },
  '/service-sectors': {
    title: 'Secteurs services',
    subtitle: 'Contenu affiché dans la partie services mobile',
  },
  '/plans': {
    title: 'Plans d\'investissement',
    subtitle: 'Catalogue des projets TAOMAN',
  },
  '/banners': {
    title: 'Bannières',
    subtitle: 'Carrousel de l\'application mobile',
  },
  '/finance': {
    title: 'Finances',
    subtitle: 'Dépôts, retraits et transactions',
  },
  '/audit': {
    title: 'Journal de conformité',
    subtitle: 'Audit append-only (BCEAO / CREPMF)',
  },
  '/settings': {
    title: 'Paramètres',
    subtitle: 'Configuration TAOMAN Admin',
  },
  '/mediatek': {
    title: 'Mediatheque',
    subtitle: 'Bibliotheque de medias reutilisables',
  },
}

function resolveMeta(pathname) {
  if (pathname.startsWith('/investors/') && pathname !== '/investors') {
    return { title: 'Fiche investisseur', subtitle: null }
  }
  return PAGE_META[pathname] || { title: 'TAOMAN Admin', subtitle: null }
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { title, subtitle } = resolveMeta(pathname)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
      <TopBar title={title} subtitle={subtitle} />
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'linear-gradient(180deg, var(--bg) 0%, #EEF2FF 120%)',
        }}
      >
        <Outlet />
      </div>
    </div>
  )
}
