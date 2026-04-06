import { Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect, useState } from 'react'
import { R } from '../constants/roles'
import api from '../services/api'
import { setCredentials } from '../redux/slices/authSlice'

const Spinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
)

const ProtectedRoute = ({ children, roles }) => {
  const { token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!token) {
      setStatus('unauthenticated')
      return
    }
    api.get('/auth/me')
      .then((res) => {
        const backendUser = res.data
        dispatch(setCredentials({ user: backendUser, token }))
        if (roles && !roles.includes(backendUser.role)) {
          setStatus('denied')
        } else {
          setStatus('allowed')
        }
      })
      .catch(() => {
        setStatus('unauthenticated')
      })
  }, [])

  if (status === 'loading') return <Spinner />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'denied') return <Navigate to="/" replace />
  return children
}

// Chỉ cho phép USER truy cập — admin/staff bị redirect về dashboard của họ
export const UserOnlyRoute = ({ children }) => {
  const { token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!token) {
      setStatus('unauthenticated')
      return
    }
    api.get('/auth/me')
      .then((res) => {
        const backendUser = res.data
        dispatch(setCredentials({ user: backendUser, token }))
        if (backendUser.role === R.ADMIN) {
          setStatus('admin')
        } else if (backendUser.role === R.STAFF) {
          setStatus('staff')
        } else {
          setStatus('allowed')
        }
      })
      .catch(() => {
        setStatus('unauthenticated')
      })
  }, [])

  if (status === 'loading') return <Spinner />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  if (status === 'admin') return <Navigate to="/d57" replace />
  if (status === 'staff') return <Navigate to="/d73" replace />
  return children
}

export default ProtectedRoute
