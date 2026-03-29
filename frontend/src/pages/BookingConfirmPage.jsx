import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Film, Building2, Calendar, Clock, Tag, Ticket } from 'lucide-react'

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-semibold text-gray-800 text-sm text-right max-w-[55%]">{value}</span>
    </div>
  )
}

const BookingConfirmPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const booking = location.state?.booking

  if (!booking) {
    return (
      <div className="min-h-screen bg-cinema-darker flex flex-col items-center justify-center gap-4">
        <p className="text-white text-lg">Không tìm thấy thông tin đặt vé.</p>
        <Link to="/" className="text-cinema-red underline">Về trang chủ</Link>
      </div>
    )
  }

  const seats = booking.seats || []
  const seatLabels = seats.map(s => `${s.seatRow}${s.seatNumber}`).join(', ')
  const seatTypes = [...new Set(seats.map(s =>
    s.seatType === 'VIP' ? 'VIP' : s.seatType === 'COUPLE' ? 'Đôi' : 'Thường'
  ))].join(', ')

  const bookingDate = booking.bookingTime
    ? new Date(booking.bookingTime).toLocaleString('vi-VN')
    : new Date().toLocaleString('vi-VN')

  const total = booking.totalAmount
    ? booking.totalAmount.toLocaleString('vi-VN') + ' đ'
    : '—'

  return (
    <div className="min-h-screen bg-cinema-darker flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Success header */}
        <div className="bg-green-500 px-6 py-7 flex flex-col items-center gap-2">
          <CheckCircle className="w-14 h-14 text-white" strokeWidth={1.5} />
          <h1 className="text-white font-black text-2xl tracking-wide">ĐẶT VÉ THÀNH CÔNG!</h1>
          <p className="text-green-100 text-sm">Cảm ơn bạn đã đặt vé tại LLMCinema</p>
        </div>

        {/* Booking code banner */}
        <div className="bg-gray-50 border-b border-dashed border-gray-300 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Mã đặt vé</p>
            <p className="text-xl font-black text-gray-800 tracking-widest mt-0.5">{booking.bookingCode}</p>
          </div>
          <Ticket className="w-10 h-10 text-green-400" />
        </div>

        {/* Booking details */}
        <div className="px-6 py-4">
          <InfoRow
            icon={<Film size={14} />}
            label="Phim"
            value={booking.movieTitle || '—'}
          />
          <InfoRow
            icon={<Building2 size={14} />}
            label="Rạp chiếu"
            value={`${booking.cinemaName || '—'} · ${booking.screenName || ''}`}
          />
          <InfoRow
            icon={<Calendar size={14} />}
            label="Ngày chiếu"
            value={booking.date || '—'}
          />
          <InfoRow
            icon={<Clock size={14} />}
            label="Giờ chiếu"
            value={booking.time || '—'}
          />
          <InfoRow
            icon={<Tag size={14} />}
            label="Ghế ngồi"
            value={seatLabels || '—'}
          />
          <InfoRow
            icon={<Tag size={14} />}
            label="Loại ghế"
            value={seatTypes || '—'}
          />
          <InfoRow
            icon={<Tag size={14} />}
            label="Số lượng"
            value={`${seats.length} vé`}
          />
        </div>

        {/* Divider */}
        <div className="mx-6 border-t-2 border-dashed border-gray-200" />

        {/* Total */}
        <div className="px-6 py-4 flex items-center justify-between">
          <span className="text-gray-600 font-semibold text-sm">Tổng tiền thanh toán</span>
          <span className="text-green-600 font-black text-xl">{total}</span>
        </div>

        {/* Points info */}
        {booking.pointsEarned > 0 && (
          <div className="mx-6 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
            <span className="text-yellow-500 text-lg">⭐</span>
            <p className="text-xs text-yellow-700 font-medium">
              Bạn nhận được <strong>{booking.pointsEarned} điểm</strong> tích lũy từ đơn này
            </p>
          </div>
        )}

        {/* Note */}
        <div className="mx-6 mb-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          <p className="text-xs text-blue-600 leading-relaxed">
            📌 Vui lòng đến trước giờ chiếu <strong>15 phút</strong> để nhân viên check-in. 
            Mang theo mã đặt vé <strong>{booking.bookingCode}</strong> hoặc xem trong mục <strong>Lịch sử đặt vé</strong>.
          </p>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 flex flex-col gap-2.5">
          <button
            onClick={() => navigate('/profile')}
            className="w-full py-3 bg-cinema-red hover:bg-red-700 text-white font-black rounded-xl tracking-wide transition-colors"
          >
            XEM LỊCH SỬ ĐẶT VÉ
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl tracking-wide transition-colors"
          >
            VỀ TRANG CHỦ
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmPage
