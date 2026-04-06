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
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
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
import VerifyEmailPage from './pages/VerifyEmailPage'
import Chatbox from './components/Chatbox'
import { R } from './constants/roles'

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="movies/:slug" element={<MovieDetailPage />} />
          <Route path="movies/:slug/screenings" element={<ScreeningSelectionPage />} />
          <Route path="cinemas" element={<CinemasPage />} />
          <Route path="cinemas/:slug" element={<CinemaDetailPage />} />
          <Route path="booking/:screeningSlug" element={<UserOnlyRoute><BookingPage /></UserOnlyRoute>} />
          <Route path="booking/confirm" element={<UserOnlyRoute><BookingConfirmPage /></UserOnlyRoute>} />
          <Route path="payment/vnpay/result" element={<UserOnlyRoute><VNPayReturnPage /></UserOnlyRoute>} />
          <Route path="payment/momo/result" element={<UserOnlyRoute><MoMoReturnPage /></UserOnlyRoute>} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="auth/google/callback" element={<OAuth2RedirectHandler />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          
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
            path="d57"
            element={
              <ProtectedRoute roles={[R.ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="d57/movies"
            element={
              <ProtectedRoute roles={[R.ADMIN]}>
                <MovieManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="d57/genres"
            element={
              <ProtectedRoute roles={[R.ADMIN]}>
                <GenreManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="d57/cinemas"
            element={
              <ProtectedRoute roles={[R.ADMIN]}>
                <CinemaManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="d57/screenings"
            element={
              <ProtectedRoute roles={[R.ADMIN]}>
                <ScreeningManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="d57/users"
            element={
              <ProtectedRoute roles={[R.ADMIN]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="d57/bookings"
            element={
              <ProtectedRoute roles={[R.ADMIN]}>
                <BookingManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="d57/revenue"
            element={
              <ProtectedRoute roles={[R.ADMIN]}>
                <RevenueManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Staff Routes */}
          <Route
            path="d73/booking/:screeningSlug"
            element={
              <ProtectedRoute roles={[R.STAFF, R.ADMIN]}>
                <StaffBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="d73/*"
            element={
              <ProtectedRoute roles={[R.STAFF, R.ADMIN]}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Chatbox />
    </>
  )
}

export default App
