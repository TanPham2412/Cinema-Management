import api from './api'

// Encode/decode helpers to prevent plaintext user data in localStorage
const encode = (data) => btoa(unescape(encodeURIComponent(JSON.stringify(data))))
const decode = (str) => { try { return JSON.parse(decodeURIComponent(escape(atob(str)))) } catch { return null } }

const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  if (response.data.token) {
    localStorage.setItem('_t', response.data.token)
    localStorage.setItem('_s', encode(response.data.user))
  }
  return response.data
}

const login = async (userData) => {
  const response = await api.post('/auth/login', userData)
  if (response.data.token) {
    localStorage.setItem('_t', response.data.token)
    localStorage.setItem('_s', encode(response.data.user))
  }
  return response.data
}

const logout = () => {
  localStorage.removeItem('_t')
  localStorage.removeItem('_s')
  // Clean up legacy keys
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const getStoredUser = () => decode(localStorage.getItem('_s'))
const getStoredToken = () => localStorage.getItem('_t')

const authService = {
  register,
  login,
  logout,
  getStoredUser,
  getStoredToken,
  encode,
  decode,
}

export default authService
