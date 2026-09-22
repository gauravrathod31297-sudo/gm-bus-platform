import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000', timeout: 30000 })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('client_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(
  (res) => {
    if (res.data?.user?.preferred_language) localStorage.setItem('ui_language', res.data.user.preferred_language)
    return res
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('client_token'); localStorage.removeItem('client_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
export default api
