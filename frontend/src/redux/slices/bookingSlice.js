import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import bookingService from '../../services/bookingService'

const initialState = {
  selectedSeats: [],
  selectedCombos: [],
  screening: null,
  totalAmount: 0,
  bookings: [],
  currentBooking: null,
  isLoading: false,
  isError: false,
  message: '',
}

// Create booking
export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData, thunkAPI) => {
    try {
      return await bookingService.createBooking(bookingData)
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

// Get user bookings
export const getUserBookings = createAsyncThunk(
  'booking/getUserBookings',
  async (_, thunkAPI) => {
    try {
      return await bookingService.getUserBookings()
    } catch (error) {
      const message = error.response?.data?.message || error.message
      return thunkAPI.rejectWithValue(message)
    }
  }
)

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setSelectedSeats: (state, action) => {
      state.selectedSeats = action.payload
    },
    addSelectedSeat: (state, action) => {
      state.selectedSeats.push(action.payload)
    },
    removeSelectedSeat: (state, action) => {
      state.selectedSeats = state.selectedSeats.filter(
        (seat) => seat.id !== action.payload
      )
    },
    setSelectedCombos: (state, action) => {
      state.selectedCombos = action.payload
    },
    addCombo: (state, action) => {
      const existingCombo = state.selectedCombos.find(
        (c) => c.id === action.payload.id
      )
      if (existingCombo) {
        existingCombo.quantity += 1
      } else {
        state.selectedCombos.push({ ...action.payload, quantity: 1 })
      }
    },
    removeCombo: (state, action) => {
      const existingCombo = state.selectedCombos.find(
        (c) => c.id === action.payload
      )
      if (existingCombo && existingCombo.quantity > 1) {
        existingCombo.quantity -= 1
      } else {
        state.selectedCombos = state.selectedCombos.filter(
          (c) => c.id !== action.payload
        )
      }
    },
    setScreening: (state, action) => {
      state.screening = action.payload
    },
    calculateTotal: (state) => {
      const seatsTotal = state.selectedSeats.reduce(
        (sum, seat) => sum + seat.price,
        0
      )
      const combosTotal = state.selectedCombos.reduce(
        (sum, combo) => sum + combo.price * combo.quantity,
        0
      )
      state.totalAmount = seatsTotal + combosTotal
    },
    resetBooking: (state) => {
      state.selectedSeats = []
      state.selectedCombos = []
      state.totalAmount = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentBooking = action.payload
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false
        state.isError = true
        state.message = action.payload
      })
      .addCase(getUserBookings.fulfilled, (state, action) => {
        state.bookings = action.payload
      })
  },
})

export const {
  setSelectedSeats,
  addSelectedSeat,
  removeSelectedSeat,
  setSelectedCombos,
  addCombo,
  removeCombo,
  setScreening,
  calculateTotal,
  resetBooking,
} = bookingSlice.actions

export default bookingSlice.reducer
