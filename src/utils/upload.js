import axios from 'axios'
import { API_BASE } from '../config/apiBase'

const BASE_URL = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`

export async function uploadMultipart(path, formData) {
  const token = localStorage.getItem('taoman_admin_token')
  const res = await axios.post(`${BASE_URL}${path.replace(/^\//, '')}`, formData, {
    headers: {
      Authorization: token ? `Bearer ${token}` : undefined,
    },
    timeout: 120000,
  })
  return res.data
}
