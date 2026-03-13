import api from './api';

export const genreService = {
  // Get all genres
  getAllGenres: async () => {
    const response = await api.get('/genres');
    return response.data;
  },

  // Get genre by ID
  getGenreById: async (id) => {
    const response = await api.get(`/genres/${id}`);
    return response.data;
  },

  // Create genre (Admin only)
  createGenre: async (genreData) => {
    const response = await api.post('/genres', genreData);
    return response.data;
  },

  // Update genre (Admin only)
  updateGenre: async (id, genreData) => {
    const response = await api.put(`/genres/${id}`, genreData);
    return response.data;
  },

  // Delete genre (Admin only)
  deleteGenre: async (id) => {
    const response = await api.delete(`/genres/${id}`);
    return response.data;
  },
};
