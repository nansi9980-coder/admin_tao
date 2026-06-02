import axios from 'axios'
import { API_BASE } from '../config/apiBase'
import { uploadMultipart } from '../utils/upload'

export { API_BASE }
const BASE_URL = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('taoman_admin_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status
    const isAuthRoute = err.config?.url?.includes('admin/auth/')
    if ((status === 401 || status === 403) && !isAuthRoute) {
      const hadToken = localStorage.getItem('taoman_admin_token')
      if (hadToken) {
        localStorage.removeItem('taoman_admin_token')
        localStorage.removeItem('taoman_admin_user')
        if (!window.location.pathname.includes('login')) {
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(err)
  },
)

export const authService = {
  adminLogin: (email, password) => api.post('admin/auth/login', { email, password }),
  verify2fa: (tempToken, code) => api.post('admin/auth/2fa/verify', { tempToken, code }),
  resetPassword: (email) => api.post('admin/auth/password-reset/request', { email }),
  confirmPasswordReset: (token, password) => api.post('admin/auth/password-reset/confirm', { token, password }),
}

export const dashboardService = {
  getStats: () => api.get('admin/dashboard/stats'),
}

export const investorsService = {
  getAll: (params = {}) => api.get(`admin/users?${new URLSearchParams(params)}`),
  getOne: (id) => api.get(`admin/users/${id}`),
  suspend: (id) => api.patch(`admin/users/${id}/suspend`),
  activate: (id) => api.patch(`admin/users/${id}/activate`),
  approveKyc: (id) => api.patch(`admin/users/${id}/kyc/approve`),
  rejectKyc: (id, reason) => api.patch(`admin/users/${id}/kyc/reject`, { reason }),
}

export const documentsService = {
  getAll: (status) => api.get(`admin/kyc/documents${status && status !== 'ALL' ? `?status=${status}` : ''}`),
  approve: (id) => api.patch(`admin/kyc/documents/${id}/approve`),
  reject: (id, reason) => api.patch(`admin/kyc/documents/${id}/reject`, { reason }),
}

export const subscriptionsService = {
  getAll: (params = {}) => api.get(`admin/subscriptions?${new URLSearchParams(params)}`),
}

export const financeService = {
  getStats: () => api.get('admin/finance/stats'),
  getChart: (period = 'weekly') => api.get(`admin/finance/chart?period=${period}`),
  getTransactions: (page = 1, limit = 20) => api.get(`admin/finance/transactions?page=${page}&limit=${limit}`),
  getPendingDeposits: () => api.get('admin/finance/deposits/pending'),
  confirmTransaction: (id) => api.patch(`admin/transactions/${id}/confirm`),
  rejectTransaction: (id, reason) => api.patch(`admin/transactions/${id}/reject`, { reason }),
}

export const plansService = {
  getAll: () => api.get('admin/plans'),
  create: (data) => api.post('admin/plans', data),
  update: (id, data) => api.patch(`admin/plans/${id}`, data),
  reorder: (ids) => api.post('admin/plans/reorder', { ids }),
  delete: (id) => api.delete(`admin/plans/${id}`),
  uploadHero: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return uploadMultipart(`admin/plans/${id}/hero-image`, fd)
  },
}

export const bannersService = {
  getAll: () => api.get('admin/banners'),
  create: (data) => api.post('admin/banners', data),
  createWithFile: (file, fields = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    Object.entries(fields).forEach(([k, v]) => {
      if (v != null && v !== '') fd.append(k, String(v))
    })
    return uploadMultipart('admin/banners/upload', fd)
  },
  update: (id, data) => api.patch(`admin/banners/${id}`, data),
  uploadImage: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return uploadMultipart(`admin/banners/${id}/image`, fd)
  },
  delete: (id) => api.delete(`admin/banners/${id}`),
}

export const mediaService = {
  getAll: () => api.get('admin/mediatek'),
  upload: (file, { folder = 'taoman/mediatek', tags = '' } = {}) => {
    const fd = new FormData()
    fd.append('file', file)
    if (folder) fd.append('folder', folder)
    if (tags) fd.append('tags', tags)
    return uploadMultipart('admin/mediatek/upload', fd)
  },
  delete: (id) => api.delete(`admin/mediatek/${id}`),
}

export const driversService = {
  getAll: (params = {}) => api.get(`admin/drivers?${new URLSearchParams(params)}`),
  getOne: (id) => api.get(`admin/drivers/${id}`),
  approve: (id) => api.patch(`admin/drivers/${id}/approve`),
  reject: (id, reason) => api.patch(`admin/drivers/${id}/reject`, { reason }),
  suspend: (id) => api.patch(`admin/drivers/${id}/suspend`),
  activate: (id) => api.patch(`admin/drivers/${id}/activate`),
}

export const auditService = {
  getAll: (params = {}) => api.get(`admin/audit-logs?${new URLSearchParams(params)}`),
}

/** Aperçu identique à l'app mobile (endpoint public, sans auth). */
export const publicServiceSectorsPreview = () =>
  axios.get(`${API_BASE.replace(/\/$/, '')}/public/service-sectors`).then((r) => r.data)

export const serviceSectorsService = {
  getAll: () => api.get('admin/service-sectors'),
  create: (data) => api.post('admin/service-sectors', data),
  update: (id, data) => api.patch(`admin/service-sectors/${id}`, data),
  reorder: (ids) => api.post('admin/service-sectors/reorder', { ids }),
  delete: (id) => api.delete(`admin/service-sectors/${id}`),
  uploadHero: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return uploadMultipart(`admin/service-sectors/${id}/hero-image`, fd)
  },
  createOffer: (sectorId, data) => api.post(`admin/service-sectors/${sectorId}/offers`, data),
  updateOffer: (offerId, data) => api.patch(`admin/service-offers/${offerId}`, data),
  deleteOffer: (offerId) => api.delete(`admin/service-offers/${offerId}`),
}

export const serviceRequestsService = {
  getAll: (params = {}) => {
    const p = typeof params === 'string' ? { status: params } : params
    return api.get(`admin/service-requests?${new URLSearchParams(p)}`)
  },
  getOne: (id) => api.get(`admin/service-requests/${id}`),
  update: (id, data) => api.patch(`admin/service-requests/${id}`, data),
  quote: (id, amountXof, notes) => api.post(`admin/service-requests/${id}/quote`, { amountXof, notes }),
  reject: (id, reason) => api.post(`admin/service-requests/${id}/reject`, { reason }),
  delete: (id) => api.delete(`admin/service-requests/${id}`),
}

export const cmsService = {
  listSections: () => api.get('admin/cms/sections'),
  listAll: (section) => api.get(`admin/cms/blocks${section ? `?section=${encodeURIComponent(section)}` : ''}`),
  create: (data) => api.post('admin/cms/blocks', data),
  update: (id, data) => api.patch(`admin/cms/blocks/${id}`, data),
  remove: (id) => api.delete(`admin/cms/blocks/${id}`),
  reorder: (items) => api.post('admin/cms/reorder', { items }),
  uploadImage: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return uploadMultipart(`admin/cms/blocks/${id}/image`, fd)
  },
  seedDefaults: () => api.post('admin/cms/seed-defaults'),
}

export const adminUsersService = {
  getAll: () => api.get('admin/admin-users'),
  create: (data) => api.post('admin/admin-users', data),
  update: (id, data) => api.patch(`admin/admin-users/${id}`, data),
  disable: (id) => api.patch(`admin/admin-users/${id}/disable`),
  enable: (id) => api.patch(`admin/admin-users/${id}/enable`),
  forcePasswordChange: (id) => api.patch(`admin/admin-users/${id}/force-password-change`),
  resetPassword: (id, password) => api.post(`admin/admin-users/${id}/reset-password`, password ? { password } : {}),
}

export default api
