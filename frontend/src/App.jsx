import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import MovieDetailPage from './pages/MovieDetailPage'
import BookingPage from './pages/BookingPage'
import BookingConfirmPage from './pages/BookingConfirmPage'
import VNPayReturnPage from './pages/VNPayReturnPage'
import MoMoReturnPage from './pages/MoMoReturnPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import MovieManagement from './pages/admin/MovieManagement'
import GenreManagement from './pages/admin/GenreManagement'
import CinemaManagement from './pages/admin/CinemaManagement'
import ScreeningManagement from './pages/admin/ScreeningManagement'
import UserManagement from './pages/admin/UserManagement'
import BookingManagement from './pages/admin/BookingManagement'
import RevenueManagement from './pages/admin/RevenueManagement'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffBookingPage from './pages/staff/StaffBookingPage'
import ScreeningSelectionPage from './pages/ScreeningSelectionPage'
import CinemasPage from './pages/CinemasPage'
import CinemaDetailPage from './pages/CinemaDetailPage'
import ProtectedRoute, { UserOnlyRoute } from './components/ProtectedRoute'
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="movies/:id" element={<MovieDetailPage />} />
          <Route path="movies/:id/screenings" element={<ScreeningSelectionPage />} />
          <Route path="cinemas" element={<CinemasPage />} />
          <Route path="cinemas/:id" element={<CinemaDetailPage />} />
          <Route path="booking/:screeningId" element={<UserOnlyRoute><BookingPage /></UserOnlyRoute>} />
          <Route path="booking/confirm" element={<UserOnlyRoute><BookingConfirmPage /></UserOnlyRoute>} />
          <Route path="payment/vnpay/result" element={<UserOnlyRoute><VNPayReturnPage /></UserOnlyRoute>} />
          <Route path="payment/momo/result" element={<UserOnlyRoute><MoMoReturnPage /></UserOnlyRoute>} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="auth/google/callback" element={<OAuth2RedirectHandler />} />
          
          {/* Protected Routes - User only */}
          <Route
            path="profile"
            element={
              <UserOnlyRoute>
                <ProfilePage />
              </UserOnlyRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/movies"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <MovieManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/genres"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <GenreManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/cinemas"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <CinemaManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/screenings"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <ScreeningManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/bookings"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <BookingManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/revenue"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <RevenueManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Staff Routes */}
          <Route
            path="staff/booking/:screeningId"
            element={
              <ProtectedRoute roles={['STAFF', 'ADMIN']}>
                <StaffBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="staff/*"
            element={
              <ProtectedRoute roles={['STAFF', 'ADMIN']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
