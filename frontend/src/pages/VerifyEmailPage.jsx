import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { Film, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'
  const [email, setEmail] = useState('')
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      return
    }
    api.get('/auth/verify-email', { params: { token } })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [searchParams])

  const handleResend = async () => {
    if (!email.trim()) return
    setResending(true)
    try {
      await api.post('/auth/resend-verification', { email: email.trim() })
      alert('Email xác nhận đã được gửi lại! Vui lòng kiểm tra hộp thư.')
    } catch {
      alert('Không thể gửi lại email. Vui lòng thử lại sau.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cinema-darker via-cinema-dark to-cinema-gray flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 -top-48 -left-48 bg-cinema-red opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cinema-gold opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-cinema-red blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative p-4 bg-gradient-to-br from-cinema-red to-cinema-red-dark rounded-2xl shadow-2xl shadow-cinema-red/50">
              <Film className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-cinema-gray/80 backdrop-blur-xl rounded-2xl p-8 border border-cinema-gray-light shadow-2xl">
          {status === 'loading' && (
            <>
              <Loader2 className="w-14 h-14 text-cinema-gold animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Đang xác nhận email...</h2>
              <p className="text-gray-400 text-sm">Vui lòng chờ trong giây lát.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">Xác nhận thành công!</h2>
              <p className="text-gray-400 mb-8">
                Tài khoản của bạn đã được kích hoạt. Bạn có thể đóng trang này và đăng nhập trên bất kỳ thiết bị nào.
              </p>
              <Link
                to="/login"
                className="block w-full py-3 px-6 bg-gradient-to-r from-cinema-red to-cinema-red-dark hover:from-cinema-red-dark hover:to-cinema-red text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-cinema-red/30"
              >
                Đăng nhập
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-14 h-14 text-cinema-red mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">Link không hợp lệ</h2>
              <p className="text-gray-400 mb-6">
                Link xác nhận không hợp lệ hoặc đã hết hạn (sau 24 giờ). Nhập email của bạn để nhận link mới.
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập địa chỉ email"
                  className="flex-1 bg-cinema-darker border border-cinema-gray-light rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cinema-red text-sm"
                />
                <button
                  onClick={handleResend}
                  disabled={resending || !email.trim()}
                  className="px-4 py-3 bg-cinema-red hover:bg-cinema-red-dark text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <Link
                to="/login"
                className="block text-center text-cinema-gold hover:text-cinema-gold/80 transition-colors text-sm"
              >
                Quay lại đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmailPage
