import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useSelector((state) => state.auth)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

// Chỉ cho phép USER truy cập — admin/staff bị redirect về dashboard của họ
export const UserOnlyRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin" replace />
  }

  if (user.role === 'STAFF') {
    return <Navigate to="/staff" replace />
  }

  return children
}

export default ProtectedRoute
