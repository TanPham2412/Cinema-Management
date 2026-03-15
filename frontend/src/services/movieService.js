import api from './api'

// Get all movies with pagination
const getMovies = async (params = {}) => {
  const { page = 0, size = 10, sortBy = 'releaseDate', sortDirection = 'DESC' } = params;
  const response = await api.get('/movies', {
    params: { page, size, sortBy, sortDirection }
  });
  return response.data;
}

const getMovieById = async (id) => {
  const response = await api.get(`/movies/${id}`)
  return response.data
}

// Search movies
const searchMovies = async (searchParams) => {
  const response = await api.get('/movies/search', { params: searchParams });
  return response.data;
}

const getNowShowing = async () => {
  const response = await api.get('/movies/now-showing')
  return response.data
}

const getComingSoon = async () => {
  const response = await api.get('/movies/upcoming')
  return response.data
}

// Get top rated movies
const getTopRated = async (page = 0, size = 10) => {
  const response = await api.get('/movies/top-rated', {
    params: { page, size }
  });
  return response.data;
}

const getScreenings = async (movieId) => {
  const response = await api.get(`/screenings/movie/${movieId}`)
  return response.data
}

// Admin: Create movie
const createMovie = async (movieData) => {
  const response = await api.post('/movies', movieData);
  return response.data;
}

// Admin: Update movie
const updateMovie = async (id, movieData) => {
  const response = await api.put(`/movies/${id}`, movieData);
  return response.data;
}

// Admin: Delete movie
const deleteMovie = async (id) => {
  const response = await api.delete(`/movies/${id}`);
  return response.data;
}

// Admin: Upload poster
const uploadPoster = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/movies/upload-poster', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// Admin: Upload banner
const uploadBanner = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/movies/upload-banner', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

const movieService = {
  getMovies,
  getMovieById,
  searchMovies,
  getNowShowing,
  getComingSoon,
  getTopRated,
  getScreenings,
  createMovie,
  updateMovie,
  deleteMovie,
  uploadPoster,
  uploadBanner,
}

export default movieService
