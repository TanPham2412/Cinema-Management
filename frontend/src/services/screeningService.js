import api from './api'

const getAllScreenings = async () => {
  const response = await api.get('/screenings')
  return response.data
}

const getScreeningById = async (id) => {
  const response = await api.get(`/screenings/${id}`)
  return response.data
}

const getScreeningsByMovie = async (movieId, date) => {
  const params = date ? { date } : {}
  const response = await api.get(`/screenings/movie/${movieId}`, { params })
  return response.data
}

const getScreeningsByCinema = async (cinemaId) => {
  const response = await api.get(`/screenings/cinema/${cinemaId}`)
  return response.data
}

const createScreening = async (data) => {
  const response = await api.post('/screenings/admin', data)
  return response.data
}

const updateScreening = async (id, data) => {
  const response = await api.put(`/screenings/admin/${id}`, data)
  return response.data
}

const deleteScreening = async (id) => {
  await api.delete(`/screenings/admin/${id}`)
}

const screeningService = {
  getAllScreenings,
  getScreeningById,
  getScreeningsByMovie,
  getScreeningsByCinema,
  createScreening,
  updateScreening,
  deleteScreening,
}

export default screeningService
