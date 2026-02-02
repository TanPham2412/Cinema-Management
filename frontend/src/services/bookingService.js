import api from './api'

const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData)
  return response.data
}

const getUserBookings = async () => {
  const response = await api.get('/bookings/my-bookings')
  return response.data
}

const getBookingByCode = async (code) => {
  const response = await api.get(`/bookings/${code}`)
  return response.data
}

const cancelBooking = async (bookingId) => {
  const response = await api.put(`/bookings/${bookingId}/cancel`)
  return response.data
}

const getScreeningSeats = async (screeningId) => {
  const response = await api.get(`/screenings/${screeningId}/seats`)
  return response.data
}

const bookingService = {
  createBooking,
  getUserBookings,
  getBookingByCode,
  cancelBooking,
  getScreeningSeats,
}

export default bookingService
