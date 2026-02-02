import api from './api'

const getMovies = async () => {
  const response = await api.get('/movies')
  return response.data
}

const getMovieById = async (id) => {
  const response = await api.get(`/movies/${id}`)
  return response.data
}

const getNowShowing = async () => {
  const response = await api.get('/movies/now-showing')
  return response.data
}

const getComingSoon = async () => {
  const response = await api.get('/movies/coming-soon')
  return response.data
}

const getScreenings = async (movieId) => {
  const response = await api.get(`/movies/${movieId}/screenings`)
  return response.data
}

const movieService = {
  getMovies,
  getMovieById,
  getNowShowing,
  getComingSoon,
  getScreenings,
}

export default movieService
