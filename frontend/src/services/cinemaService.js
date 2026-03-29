import api from './api'

const getCinemas = async () => {
  const response = await api.get('/cinemas')
  return response.data
}

const getCinemaById = async (id) => {
  const response = await api.get(`/cinemas/${id}`)
  return response.data
}

const getAdminCinemas = async () => {
  const response = await api.get('/cinemas/admin/all')
  return response.data
}

const createCinema = async (data) => {
  const response = await api.post('/cinemas/admin', data)
  return response.data
}

const updateCinema = async (id, data) => {
  const response = await api.put(`/cinemas/admin/${id}`, data)
  return response.data
}

const deleteCinema = async (id) => {
  await api.delete(`/cinemas/admin/${id}`)
}

const toggleCinemaActive = async (id) => {
  const response = await api.put(`/cinemas/admin/${id}/toggle-active`)
  return response.data
}

const getScreensByCinema = async (cinemaId) => {
  const response = await api.get(`/cinemas/${cinemaId}/screens`)
  return response.data
}

const getScreenWithSeats = async (screenId) => {
  const response = await api.get(`/cinemas/screens/${screenId}/seats`)
  return response.data
}

const addScreen = async (cinemaId, data) => {
  const response = await api.post(`/cinemas/admin/${cinemaId}/screens`, data)
  return response.data
}

const updateScreen = async (screenId, data) => {
  const response = await api.put(`/cinemas/admin/screens/${screenId}`, data)
  return response.data
}

const toggleScreenActive = async (screenId) => {
  const response = await api.put(`/cinemas/admin/screens/${screenId}/toggle-active`)
  return response.data
}

const cinemaService = {
  getCinemas,
  getCinemaById,
  getAdminCinemas,
  createCinema,
  updateCinema,
  deleteCinema,
  toggleCinemaActive,
  getScreensByCinema,
  getScreenWithSeats,
  addScreen,
  updateScreen,
  toggleScreenActive,
}

export default cinemaService
