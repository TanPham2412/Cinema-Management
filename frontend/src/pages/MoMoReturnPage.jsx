import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { CheckCircle, XCircle, Clock, Home, Ticket } from 'lucide-react'
import { refreshUser } from '../redux/slices/authSlice'

// MoMo result code descriptions
const RESULT_MESSAGES = {
  '0':    'Giao dịch thành công',
  '1000': 'Giao dịch được khởi tạo, chờ người dùng xác nhận thanh toán.',
  '1001': 'Giao dịch thất bại do tài khoản không đủ số dư.',
  '1002': 'Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán.',
  '1003': 'Giao dịch bị từ chối do quá giới hạn giao dịch của ví MoMo.',
  '1004': 'Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức.',
  '1005': 'URL thanh toán hết hạn hoặc đã được kích hoạt.',
  '1006': 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán.',
  '1007': 'Giao dịch bị từ chối do tài khoản MoMo bị khoá.',
  '1026': 'Giao dịch bị hạn chế theo thể lệ chương trình khuyến mãi.',
  '1080': 'Thanh toán bằng thẻ thất bại.',
  '1081': 'Thanh toán bằng thẻ bị từ chối từ phía ngân hàng phát hành.',
  '2001': 'Giao dịch thất bại do sai thông tin liên kết.',
  '2007': 'Phương thức thanh toán không được hỗ trợ.',
  '3001': 'Giao dịch thất bại do người dùng từ chối xác nhận.',
  '3002': 'Giao dịch bị từ chối do quy tắc hạn chế.',
  '4001': 'Giao dịch bị hạn chế do tài khoản chưa xác minh danh tính.',
  '4010': 'Xác minh OTP thất bại.',
  '4011': 'OTP chưa được gửi hoặc hết hạn.',
  '4100': 'Người dùng không đăng nhập thành công.',
  '9000': 'Giao dịch được xác nhận thành công.',
}

const MoMoReturnPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const success = searchParams.get('success') === 'true'
  const bookingCode = searchParams.get('bookingCode') || ''
  const resultCode = searchParams.get('resultCode') || '-1'
  const messageParam = searchParams.get('message') || ''
  const message = RESULT_MESSAGES[resultCode] || messageParam || 'Lỗi không xác định.'

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
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-[#ae2070] font-black text-lg">M</span>
            <span className="text-gray-400 text-sm font-semibold">MoMo</span>
          </div>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoMoReturnPage
