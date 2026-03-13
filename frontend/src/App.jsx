import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import MovieDetailPage from './pages/MovieDetailPage'
import BookingPage from './pages/BookingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import MovieManagement from './pages/admin/MovieManagement'
import GenreManagement from './pages/admin/GenreManagement'
import StaffDashboard from './pages/staff/StaffDashboard'
import ProtectedRoute from './components/ProtectedRoute'
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
          <Route path="booking/:screeningId" element={<BookingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="auth/google/callback" element={<OAuth2RedirectHandler />} />
          
          {/* Protected Routes */}
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
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
          
          {/* Staff Routes */}
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
