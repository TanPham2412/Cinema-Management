import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { CheckCircle, XCircle, Clock, Home, Ticket } from 'lucide-react'
import { refreshUser } from '../redux/slices/authSlice'

// VNPay response code descriptions
const RESPONSE_MESSAGES = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
  '10': 'Xác thực thông tin thẻ/tài khoản không thành công quá 3 lần.',
  '11': 'Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.',
  '12': 'Thẻ/Tài khoản của khách hàng bị khóa.',
  '13': 'Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.',
  '24': 'Khách hàng hủy giao dịch.',
  '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
  '75': 'Ngân hàng thanh toán đang bảo trì.',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
  '97': 'Chữ ký không hợp lệ.',
  '99': 'Lỗi không xác định.',
}

const VNPayReturnPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Backend redirect passes these simple params
  const success = searchParams.get('success') === 'true'
  const bookingCode = searchParams.get('bookingCode') || ''
  const responseCode = searchParams.get('responseCode') || '99'
  const message = RESPONSE_MESSAGES[responseCode] || RESPONSE_MESSAGES['99']

  const [countdown, setCountdown] = useState(5)

  // Refresh user data when payment succeeds
  useEffect(() => {
    if (success) {
      dispatch(refreshUser()).catch(() => {})
    }
  }, [success, dispatch])

  useEffect(() => {
    if (!success) return
    if (countdown <= 0) { navigate('/profile'); return }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [success, countdown, navigate])

  return (
    <div className="min-h-screen bg-cinema-darker flex items-center justify-center px-4">
      <div className="bg-cinema-gray rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-cinema-gray-light">
        {/* Header */}
        <div className={`px-6 py-8 text-center ${success ? 'bg-green-900/40' : 'bg-red-900/40'}`}>
          {success ? (
            <CheckCircle className="mx-auto text-green-400 mb-3" size={60} />
          ) : (
            <XCircle className="mx-auto text-red-400 mb-3" size={60} />
          )}
          <h1 className={`text-2xl font-bold ${success ? 'text-green-400' : 'text-red-400'}`}>
            {success ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
          </h1>
          <p className="text-gray-300 mt-2 text-sm">{message}</p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {bookingCode && (
            <div className="bg-cinema-darker rounded-lg p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">Mã đặt vé</p>
              <p className="text-cinema-gold font-mono font-bold text-xl tracking-widest">
                {bookingCode}
              </p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-600/30 rounded-lg px-4 py-3">
              <Clock size={16} className="text-blue-400 shrink-0" />
              <p className="text-blue-300 text-sm">
                Tự động chuyển sang lịch sử đặt vé sau{' '}
                <span className="font-bold text-blue-200">{countdown}s</span>
              </p>
            </div>
          )}

          {!success && (
            <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg px-4 py-3">
              <p className="text-yellow-300 text-sm text-center">
                Ghế đã được giải phóng. Bạn có thể thử đặt vé lại.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            {success && (
              <Link
                to="/profile"
                className="flex items-center justify-center gap-2 bg-cinema-gold text-cinema-darker font-bold py-3 px-6 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <Ticket size={18} />
                Xem lịch sử đặt vé
              </Link>
            )}
            <Link
              to="/"
              className="flex items-center justify-center gap-2 bg-cinema-gray-light text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <Home size={18} />
              Về trang chủ
            </Link>
            {!success && (
              <button
                onClick={() => navigate(-2)}
                className="flex items-center justify-center gap-2 bg-cinema-red text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors"
              >
                Thử lại
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VNPayReturnPage
