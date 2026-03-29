import axios from 'axios';

const API_URL = 'https://api.plvcinema.xyz/api/reviews';

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get all reviews for a movie (public)
export const getMovieReviews = async (movieId) => {
  try {
    const response = await axios.get(`${API_URL}/movie/${movieId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching movie reviews:', error);
    throw error;
  }
};

// Get current user's review for a movie (authenticated)
export const getMyReviewForMovie = async (movieId) => {
  try {
    const response = await axiosInstance.get(`/movie/${movieId}/my-review`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // User hasn't reviewed yet
    }
    console.error('Error fetching my review:', error);
    throw error;
  }
};

// Get all reviews by current user (authenticated)
export const getMyReviews = async () => {
  try {
    const response = await axiosInstance.get('/my-reviews');
    return response.data;
  } catch (error) {
    console.error('Error fetching my reviews:', error);
    throw error;
  }
};

// Create a review (authenticated)
export const createReview = async (movieId, reviewData) => {
  try {
    const response = await axiosInstance.post(`/movie/${movieId}`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

// Update a review (authenticated)
export const updateReview = async (reviewId, reviewData) => {
  try {
    const response = await axiosInstance.put(`/${reviewId}`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

// Delete a review (authenticated)
export const deleteReview = async (reviewId) => {
  try {
    await axiosInstance.delete(`/${reviewId}`);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

export default {
  getMovieReviews,
  getMyReviewForMovie,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
};
