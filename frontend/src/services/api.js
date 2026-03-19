import axios from 'axios'

/*const api = axios.create({
  //baseURL: '/api',
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})
*/
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://eduregister-backend-production.up.railway.app/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach token on every request ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Handle 401 → try refresh ───────────────────────────────────────────────
let refreshing = false
let queue = []

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then(() => api(original))
      }

      original._retry = true
      refreshing = true

      try {
        const refresh = localStorage.getItem('refresh_token')
        //const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
        //const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'https://eduregister-backend.up.railway.app/api'}/auth/token/refresh/`, { refresh })
        const { data } = await api.post('/auth/token/refresh/', { refresh })
        localStorage.setItem('access_token', data.access)
        queue.forEach(({ resolve }) => resolve())
        queue = []
        return api(original)
      } catch (_) {
        queue.forEach(({ reject }) => reject(_))
        queue = []
        localStorage.clear()
        window.location.href = '/login'
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// ── Named service helpers ───────────────────────────────────────────────────
export const authService = {
  login:       (creds)  => api.post('/auth/login/', creds),
  logout:      (data)   => api.post('/auth/logout/', data),
  me:          ()       => api.get('/auth/me/'),
  users:       (params) => api.get('/auth/users/', { params }),
  createUser:  (data)   => api.post('/auth/register/', data),
  updateUser:  (id, d)  => api.patch(`/auth/users/${id}/`, d),
  deleteUser:  (id)     => api.delete(`/auth/users/${id}/`),
  dashboard:   ()       => api.get('/auth/dashboard/'),
}

export const studentService = {
  list:         (params) => api.get('/students/',                    { params }),
  detail:       (id)     => api.get(`/students/${id}/`),
  create:       (data)   => api.post('/students/', data),
  update:       (id, d)  => api.patch(`/students/${id}/`, d),
  delete:       (id)     => api.delete(`/students/${id}/`),
  register:     (id)     => api.post(`/students/${id}/register/`),
  feeStatus:    (id)     => api.get(`/students/${id}/fee-status/`),
  programs:     (params) => api.get('/students/programs/', { params }),
  createProgram:(data)   => api.post('/students/programs/', data),
  academicYears:()       => api.get('/students/academic-years/'),
  createYear:   (data)   => api.post('/students/academic-years/', data),
}

export const feeService = {
  types:         (params) => api.get('/fees/types/', { params }),
  createType:    (data)   => api.post('/fees/types/', data),
  records:       (params) => api.get('/fees/records/', { params }),
  record:        (id)     => api.get(`/fees/records/${id}/`),
  createRecord:  (data)   => api.post('/fees/records/', data),
  updateRecord:  (id, d)  => api.patch(`/fees/records/${id}/`, d),
  payments:      (params) => api.get('/fees/payments/', { params }),
  createPayment: (data)   => api.post('/fees/payments/', data),
  analytics:     ()       => api.get('/fees/analytics/'),
}

export const courseService = {
  list:   (params) => api.get('/courses/', { params }),
  create: (data)   => api.post('/courses/', data),
  update: (id, d)  => api.patch(`/courses/${id}/`, d),
  delete: (id)     => api.delete(`/courses/${id}/`),
}
