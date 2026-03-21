import api from './api'

const register = async (userData) => {
  const response = await api.post('/auth/register', userData)
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

const login = async (userData) => {
  const response = await api.post('/auth/login', userData)
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}

const getCurrentUser = async () => {
  const response = await api.get('/users/me')
  const user = response.data
  localStorage.setItem('user', JSON.stringify(user))
  return user
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

const authService = {
  register,
  login,
  getCurrentUser,
  logout,
}

export default authService
