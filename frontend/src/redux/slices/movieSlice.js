import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import movieService from '../../services/movieService'

const initialState = {
  movies: [],
  currentMovie: null,
  nowShowing: [],
  comingSoon: [],
  isLoading: false,
  isError: false,
  message: '',
}

// Get all movies
export const getMovies = createAsyncThunk(
  'movies/getAll',
  async (_, thunkAPI) => {
    try {
      return await movieService.getMovies()
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get movie by ID
export const getMovieById = createAsyncThunk(
  'movies/getById',
  async (id, thunkAPI) => {
    try {
      return await movieService.getMovieById(id)
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get now showing movies
export const getNowShowing = createAsyncThunk(
  'movies/getNowShowing',
  async (_, thunkAPI) => {
    try {
      return await movieService.getNowShowing()
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get coming soon movies
export const getComingSoon = createAsyncThunk(
  'movies/getComingSoon',
  async (_, thunkAPI) => {
    try {
      return await movieService.getComingSoon()
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

export const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMovies.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getMovies.fulfilled, (state, action) => {
        state.isLoading = false
        state.movies = action.payload
      })
      .addCase(getMovies.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getMovieById.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getMovieById.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentMovie = action.payload
      })
      .addCase(getMovieById.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getNowShowing.fulfilled, (state, action) => {
        state.nowShowing = action.payload
      })
      .addCase(getComingSoon.fulfilled, (state, action) => {
        state.comingSoon = action.payload
      })
  },
})

export const { reset } = movieSlice.actions
export default movieSlice.reducer
