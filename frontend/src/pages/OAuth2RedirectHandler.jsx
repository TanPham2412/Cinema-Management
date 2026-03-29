import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCredentials } from '../redux/slices/authSlice'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'
import api from '../services/api'
import { Shield } from 'lucide-react'

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()

  const [requires2fa, setRequires2fa] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('token', token)
    dispatch(setCredentials({ user, token }))
    toast.success('Đăng nhập thành công!')
    if (user.role === 'ADMIN') navigate('/admin')
    else if (user.role === 'STAFF') navigate('/staff')
    else navigate('/')
  }

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')
    const r2fa = searchParams.get('requires2fa')
    const emailParam = searchParams.get('email')

    if (error) {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại!')
      navigate('/login')
      return
    }

    if (r2fa === 'true' && emailParam) {
      setEmail(emailParam)
      setRequires2fa(true)
      return
    }

    if (token) {
      try {
        const decoded = jwtDecode(token)
        handleLoginSuccess(token, {
          email: decoded.sub,
          fullName: decoded.name || decoded.sub,
          role: decoded.role || 'CUSTOMER'
        })
      } catch {
        toast.error('Token không hợp lệ!')
        navigate('/login')
      }
    } else {
      navigate('/login')
    }
  }, [searchParams]) // eslint-disable-line

  const handleVerify2fa = async (e) => {
    e.preventDefault()
    if (code.length !== 6) return
    setLoading(true)
    try {
      const res = await api.post('/auth/2fa/verify', { email, code })
      handleLoginSuccess(res.data.token, res.data.user)
    } catch {
      toast.error('Mã xác thực không đúng hoặc đã hết hạn!')
    } finally {
      setLoading(false)
    }
  }

  if (requires2fa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cinema-darker via-cinema-dark to-cinema-gray flex items-center justify-center p-4">
        <div className="bg-cinema-gray border border-cinema-gray-light rounded-2xl p-8 w-full max-w-sm text-center shadow-xl">
          <div className="w-14 h-14 bg-cinema-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-cinema-red" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Xác thực 2 lớp</h2>
          <p className="text-gray-400 text-sm mb-6">Nhập mã 6 chữ số từ ứng dụng Google Authenticator</p>
          <form onSubmit={handleVerify2fa} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-cinema-red"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-cinema-red hover:bg-cinema-red-dark disabled:bg-gray-700 text-white rounded-xl font-semibold transition-colors"
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận'}
            </button>
            <button type="button" onClick={() => navigate('/login')} className="w-full text-gray-400 hover:text-white text-sm transition-colors">
              ← Quay lại đăng nhập
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cinema-darker via-cinema-dark to-cinema-gray flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-lg">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  )
}

export default OAuth2RedirectHandler
