// API configuration
// In development: uses localhost:3001
// In production: uses VITE_API_URL environment variable

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = {
  auth: {
    register: `${API_BASE_URL}/api/auth/register`,
    login: `${API_BASE_URL}/api/auth/login`,
    profile: `${API_BASE_URL}/api/auth/profile`,
  },
  investments: `${API_BASE_URL}/api/investments`,
  transactions: `${API_BASE_URL}/api/transactions`,
  deposit: `${API_BASE_URL}/api/deposit`,
  packages: `${API_BASE_URL}/api/packages`,
  invest: `${API_BASE_URL}/api/invest`,
  admin: {
    users: `${API_BASE_URL}/api/admin/users`,
    investments: `${API_BASE_URL}/api/admin/investments`,
  },
}
