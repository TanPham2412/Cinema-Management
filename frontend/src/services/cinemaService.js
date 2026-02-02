import api from './api'

const getCinemas = async () => {
  const response = await api.get('/cinemas')
  return response.data
}

const getCinemaById = async (id) => {
  const response = await api.get(`/cinemas/${id}`)
  return response.data
}

const cinemaService = {
  getCinemas,
  getCinemaById,
}

export default cinemaService
