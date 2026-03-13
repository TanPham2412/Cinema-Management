import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import cinemaService from '../../services/cinemaService'

const initialState = {
  cinemas: [],
  currentCinema: null,
  isLoading: false,
  isError: false,
  message: '',
}

// Get all cinemas
export const getCinemas = createAsyncThunk(
  'cinemas/getAll',
  async (_, thunkAPI) => {
    try {
      return await cinemaService.getCinemas()
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

export const cinemaSlice = createSlice({
  name: 'cinemas',
  initialState,
  reducers: {
    reset: (state) => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCinemas.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCinemas.fulfilled, (state, action) => {
        state.isLoading = false
        state.cinemas = action.payload
      })
      .addCase(getCinemas.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
  },
})

export const { reset } = cinemaSlice.actions
export default cinemaSlice.reducer
