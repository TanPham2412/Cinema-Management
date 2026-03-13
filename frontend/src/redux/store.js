import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import movieReducer from './slices/movieSlice'
import bookingReducer from './slices/bookingSlice'
import cinemaReducer from './slices/cinemaSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    movies: movieReducer,
    booking: bookingReducer,
    cinemas: cinemaReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
