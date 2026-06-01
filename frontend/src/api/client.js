import axios from 'axios'

// El backend se sirve bajo /api (proxy en dev, mismo dominio en prod).
const api = axios.create({ baseURL: '/api' })

// Inyecta el token JWT del admin si existe.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Endpoints públicos
export const getConfig = () => api.get('/public/config').then((r) => r.data)
export const getCourses = () => api.get('/public/courses').then((r) => r.data)
export const getTeachers = () => api.get('/public/teachers').then((r) => r.data)
export const getSchedule = () => api.get('/public/schedule').then((r) => r.data)
export const getEvents = () => api.get('/public/events').then((r) => r.data)
export const getSocial = () => api.get('/public/social').then((r) => r.data)
export const submitContact = (payload) => api.post('/public/contact', payload).then((r) => r.data)
export const trackWhatsapp = () => api.post('/public/track/whatsapp').catch(() => {})

// Admin
export const login = (email, password) => {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return api.post('/auth/login', form).then((r) => r.data)
}
export const getMe = () => api.get('/auth/me').then((r) => r.data)
export const adminGet = (path) => api.get(`/admin/${path}`).then((r) => r.data)
export const adminPost = (path, body) => api.post(`/admin/${path}`, body).then((r) => r.data)
export const adminPut = (path, body) => api.put(`/admin/${path}`, body).then((r) => r.data)
export const adminPatch = (path, body) => api.patch(`/admin/${path}`, body).then((r) => r.data)
export const adminDelete = (path) => api.delete(`/admin/${path}`).then((r) => r.data)

// Apariencia / tema (hoja de estilos activa)
export const getActiveTheme = () => api.get('/public/theme').then((r) => r.data)
export const adminGetThemes = () => api.get('/admin/themes').then((r) => r.data)
export const adminSetTheme = (active) => api.put('/admin/themes', { active }).then((r) => r.data)

// Generación de imágenes IA
export const imageStatus = () => api.get('/admin/images/status').then((r) => r.data)
export const generateCourseImage = (id) => api.post(`/admin/images/course/${id}`).then((r) => r.data)
export const generateEventImage = (id) => api.post(`/admin/images/event/${id}`).then((r) => r.data)

export default api
