/** URL API partagée (évite import circulaire api ↔ upload). */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/v1'
