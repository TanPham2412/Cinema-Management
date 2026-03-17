import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Tag, Clock, Building2, Calendar, Film, X, ChevronLeft } from 'lucide-react'
import bookingService from '../services/bookingService'

const PAYMENT_METHODS = [
  { value: 'VNPAY',       label: 'VNPay',        icon: '💳', desc: 'Thanh toán qua VNPay' },
  { value: 'MOMO',        label: 'MoMo',          icon: '🟣', desc: 'Ví điện tử MoMo' },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng',  icon: '💰', desc: 'Visa / Mastercard' },
  { value: 'CASH',        label: 'Tiền mặt',      icon: '🏧', desc: 'Thanh toán tại quầy' },
]

const SEAT_TYPES = {
  REGULAR: { label: 'Ghế thường', price: 0 },
  VIP:     { label: 'Ghế VIP',    price: 30000 },
  COUPLE:  { label: 'Ghế đôi',    price: 50000 },
}

const ROW_ORDER = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']

// Seat cushion button — BetaCinemas style
function SeatBtn({ seat, selected, onClick }) {
  const booked = seat.status === 'BOOKED'
  let cls =
    'w-[44px] h-[38px] rounded flex items-center justify-center text-[10px] font-bold select-none transition-colors '
  let style = {}

  if (booked) {
    cls += 'bg-red-500 text-white cursor-not-allowed'
  } else if (selected) {
    cls += 'bg-[#1a3a6c] text-white cursor-pointer'
    style.boxShadow = '0 3px 0 rgba(15,35,80,0.4)'
  } else if (seat.seatType === 'VIP') {
    cls += 'bg-[#f5c842] text-gray-800 cursor-pointer hover:bg-yellow-300'
    style.boxShadow = '0 3px 0 rgba(0,0,0,0.18)'
  } else if (seat.seatType === 'COUPLE') {
    cls += 'bg-pink-300 text-gray-800 cursor-pointer hover:bg-pink-400'
    style.boxShadow = '0 3px 0 rgba(0,0,0,0.18)'
  } else {
    cls += 'bg-[#c8cad0] text-gray-700 cursor-pointer hover:bg-gray-400'
    style.boxShadow = '0 3px 0 rgba(0,0,0,0.18)'
  }

  return (
    <div className={cls} style={style} onClick={() => !booked && onClick(seat)}>
      {seat.seatRow}{seat.seatNumber}
    </div>
  )
}

function LegendSeat({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-8 h-7 rounded ${color}`} style={{ boxShadow: '0 2px 0 rgba(0,0,0,0.35)' }} />
      <span className="text-xs text-gray-300">{label}</span>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 py-[5px]">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <span className="text-gray-400 text-sm shrink-0 min-w-[80px]">{label}</span>
      <span className="text-white font-semibold text-sm text-right flex-1 break-words">{value}</span>
    </div>
  )
}

const BookingPage = () => {
  const { screeningId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const navState = location.state || {}
  const { user } = useSelector((state) => state.auth)

  const [seats, setSeats] = useState([])
  const [screeningInfo, setScreeningInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [booking, setBooking] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600)
  const [showCheckout, setShowCheckout] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('VNPAY')

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchSeats()
  }, [screeningId])

  const fetchSeats = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getScreeningSeats(screeningId)
      setSeats(data.seats || [])
      // Merge API screening info with nav state (nav state has poster/genres/rating)
      setScreeningInfo({
        ...navState,
        ...(data.screening || {}),
        posterUrl: data.screening?.posterUrl || navState.moviePosterUrl || null,
        movieTitle: data.screening?.movieTitle || navState.movieTitle || 'Phim',
        genres: data.screening?.genres || navState.movieGenres || '—',
        ageRating: data.screening?.ageRating || navState.movieRating || null,
        duration: data.screening?.duration || navState.movieDuration || null,
      })
    } catch {
      // Mock seat layout — use real movie info from nav state if available
      const rowConfig = { H: 11, G: 11, F: 9, E: 9, D: 10, C: 10, B: 10, A: 10 }
      const mockSeats = []
      Object.entries(rowConfig).forEach(([row, count]) => {
        for (let n = count; n >= 1; n--) {
          mockSeats.push({
            id: `${row}${n}`,
            seatRow: row,
            seatNumber: n,
            seatType: row === 'A' ? 'VIP' : row === 'H' ? 'COUPLE' : 'REGULAR',
            status: Math.random() < 0.15 ? 'BOOKED' : 'AVAILABLE',
          })
        }
      })
      setSeats(mockSeats)
      setScreeningInfo({
        movieTitle:  navState.movieTitle    || 'Phim đang chiếu',
        posterUrl:   navState.moviePosterUrl ? `/api${navState.moviePosterUrl}` : null,
        format:      '2D Phụ đề',
        ageRating:   navState.movieRating   || null,
        genres:      navState.movieGenres   || '—',
        duration:    navState.movieDuration || null,
        cinemaName:  navState.cinemaName    || 'Beta Cinema',
        screenName:  navState.screenName    || 'Phòng 1',
        date:        navState.date          || new Date().toLocaleDateString('vi-VN'),
        time:        navState.time          || '—',
        basePrice:   navState.basePrice     || 90000,
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSeat = (seat) => {
    if (seat.status === 'BOOKED') return
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id)
      if (exists) return prev.filter((s) => s.id !== seat.id)
      if (prev.length >= 8) return prev // max 8 seats
      return [...prev, seat]
    })
  }

  const seatPrice = (seat) =>
    (screeningInfo?.basePrice || 90000) + (SEAT_TYPES[seat.seatType]?.price || 0)

  const total = selectedSeats.reduce((sum, s) => sum + seatPrice(s), 0)

  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.seatRow]) acc[seat.seatRow] = []
    acc[seat.seatRow].push(seat)
    return acc
  }, {})

  const fmtTimer = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const ageNum = screeningInfo?.ageRating?.replace(/\D/g, '')

  const handleBook = async () => {
    if (!selectedSeats.length) return
    setBooking(true)
    try {
      const result = await bookingService.createBooking({
        screeningId: parseInt(screeningId),
        seatIds: selectedSeats.map((s) => s.id),
        combos: [],
        paymentMethod,
      })

      setShowCheckout(false)

      if (paymentMethod === 'VNPAY') {
        // Get VNPay payment URL and redirect browser to VNPay
        const { paymentUrl } = await bookingService.createVNPayUrl(result.bookingCode)
        window.location.href = paymentUrl
      } else {
        navigate('/booking/confirm', {
          state: {
            booking: {
              ...result,
              movieTitle: screeningInfo?.movieTitle,
              cinemaName: screeningInfo?.cinemaName,
              screenName: screeningInfo?.screenName,
              date: screeningInfo?.date,
              time: screeningInfo?.time,
            }
          }
        })
      }
    } catch (e) {
      alert('Đặt vé thất bại: ' + (e.response?.data?.message || 'Vui lòng thử lại'))
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cinema-darker flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cinema-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cinema-darker pb-20">
      {/* Breadcrumb */}
      <div className="bg-cinema-gray border-b border-cinema-gray-light px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center gap-1 text-sm">
          <Link to="/" className="text-cinema-gold hover:underline font-semibold">
            Trang chủ
          </Link>
          <span className="text-gray-500 mx-1">›</span>
          <span className="text-gray-400">Đặt vé</span>
          <span className="text-gray-500 mx-1">›</span>
          <span className="text-white font-semibold">{screeningInfo?.movieTitle || ''}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5 pb-6">
        {/* Age warning banner */}
        {ageNum && ageNum !== '0' && (
          <div className="bg-yellow-900/30 border border-yellow-600/40 rounded px-4 py-2.5 mb-4">
            <p className="text-yellow-300 text-sm font-medium text-center">
              Theo quy định của cục điện ảnh, phim này không dành cho khán giả dưới {ageNum} tuổi.
            </p>
          </div>
        )}

        <div className="flex gap-5 items-start">
          {/* ─── Left: Seat map ─── */}
          <div className="flex-1 min-w-0 bg-cinema-gray rounded-lg shadow-sm overflow-hidden border border-cinema-gray-light">
            <div className="p-5 sm:p-7">
              {/* Seat legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-7">
                <LegendSeat color="bg-[#c8cad0]" label="Ghế trống" />
                <LegendSeat color="bg-[#1a3a6c]" label="Ghế đang chọn" />
                <LegendSeat color="bg-[#5cb8e4]" label="Ghế đang giữ" />
                <LegendSeat color="bg-red-500"   label="Ghế đã bán" />
                <LegendSeat color="bg-[#f5c842]" label="Ghế đặt trước" />
              </div>

              {/* Curved cinema screen */}
              <div className="mb-8 px-6">
                <div className="relative w-4/5 mx-auto overflow-hidden" style={{ height: 18 }}>
                  <div
                    className="absolute inset-x-0 bg-gradient-to-b from-gray-500 to-cinema-gray"
                    style={{
                      height: 80,
                      top: 0,
                      borderRadius: '50%',
                      boxShadow: '0 4px 16px rgba(255,255,255,0.08)',
                    }}
                  />
                </div>
                <p className="text-center text-gray-500 tracking-[0.2em] text-xs mt-2 font-medium">
                  MÀN HÌNH CHIẾU
                </p>
              </div>

              {/* Seat grid */}
              <div className="overflow-x-auto">
                <div className="flex flex-col items-center gap-2 min-w-max mx-auto">
                  {ROW_ORDER.map((row) => {
                    const rowSeats = (seatsByRow[row] || []).sort(
                      (a, b) => b.seatNumber - a.seatNumber
                    )
                    if (!rowSeats.length) return null
                    return (
                      <div key={row} className="flex gap-1.5">
                        {rowSeats.map((seat) => (
                          <SeatBtn
                            key={seat.id}
                            seat={seat}
                            selected={!!selectedSeats.find((s) => s.id === seat.id)}
                            onClick={toggleSeat}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right: Movie info panel ─── */}
          <div className="w-64 shrink-0 bg-cinema-gray rounded-lg shadow-sm sticky top-4 overflow-hidden border border-cinema-gray-light">
            {/* Poster */}
            {screeningInfo?.posterUrl ? (
              <div className="relative">
                <img
                  src={screeningInfo.posterUrl.startsWith('/api') ? screeningInfo.posterUrl : `/api${screeningInfo.posterUrl}`}
                  alt={screeningInfo.movieTitle}
                  className="w-full aspect-[2/3] object-cover"
                />
                {screeningInfo.ageRating && (
                  <span
                    className={`absolute top-2 left-2 text-white text-xs font-black px-1.5 py-0.5 rounded ${
                      screeningInfo.ageRating === 'T18'
                        ? 'bg-red-600'
                        : screeningInfo.ageRating === 'T16'
                        ? 'bg-orange-500'
                        : screeningInfo.ageRating === 'T13'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  >
                    {screeningInfo.ageRating}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full aspect-[2/3] bg-cinema-gray-light flex items-center justify-center">
                <Film className="w-12 h-12 text-gray-600" />
              </div>
            )}

            <div className="p-4">
              <h2 className="text-base font-black text-white leading-tight">
                {screeningInfo?.movieTitle || '—'}
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">{screeningInfo?.format || '2D Phụ đề'}</p>

              <hr className="my-3 border-cinema-gray-light" />

              <InfoRow
                icon={<Tag size={13} />}
                label="Thể loại"
                value={screeningInfo?.genres || '—'}
              />
              <InfoRow
                icon={<Clock size={13} />}
                label="Thời lượng"
                value={screeningInfo?.duration ? `${screeningInfo.duration} phút` : '—'}
              />

              <hr className="my-3 border-cinema-gray-light" />

              <InfoRow
                icon={<Building2 size={13} />}
                label="Rạp chiếu"
                value={screeningInfo?.cinemaName || '—'}
              />
              <InfoRow
                icon={<Calendar size={13} />}
                label="Ngày chiếu"
                value={screeningInfo?.date || '—'}
              />
              <InfoRow
                icon={<Clock size={13} />}
                label="Giờ chiếu"
                value={screeningInfo?.time || '—'}
              />
              <InfoRow
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
                    <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
                  </svg>
                }
                label="Ghế ngồi"
                value={
                  selectedSeats.length
                    ? selectedSeats.map((s) => `${s.seatRow}${s.seatNumber}`).join(', ')
                    : '—'
                }
              />

              <button
                onClick={() => setShowCheckout(true)}
                disabled={!selectedSeats.length || booking}
                className="mt-4 w-full py-2.5 bg-[#1a3a6c] hover:bg-[#15306b] disabled:bg-cinema-gray-light disabled:text-gray-600 disabled:cursor-not-allowed text-white font-black rounded tracking-[0.15em] text-sm transition-colors"
              >
                TIẾP TỤC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fixed bottom bar ─── */}
      <div className="fixed bottom-0 inset-x-0 bg-cinema-gray border-t border-cinema-gray-light shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          {/* Seat type legend */}
          <div className="flex items-center gap-5 flex-1">
            <LegendSeat color="bg-[#c8cad0]" label="Ghế thường" />
            <LegendSeat color="bg-[#f5c842]" label="Ghế VIP" />
            <LegendSeat color="bg-pink-300"  label="Ghế đôi" />
          </div>

          {/* Total */}
          <div className="px-6 border-x border-cinema-gray-light text-center shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Tổng tiền</p>
            <p className="font-black text-cinema-gold text-sm">
              {total > 0 ? total.toLocaleString('vi-VN') + ' vnđ' : '0 vnđ'}
            </p>
          </div>

          {/* Countdown */}
          <div className="text-center shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Thời gian còn lại</p>
            <p className="font-black text-white text-2xl tracking-tight leading-none">
              {fmtTimer(timeLeft)}
            </p>
          </div>
        </div>
      </div>
      {/* ─── Checkout overlay ─── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
          <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-black text-gray-800 text-base">Xác nhận đặt vé</h2>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Movie + screening summary */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex gap-3 items-start">
                  {screeningInfo?.posterUrl && (
                    <img
                      src={screeningInfo.posterUrl.startsWith('/api') ? screeningInfo.posterUrl : `/api${screeningInfo.posterUrl}`}
                      alt={screeningInfo.movieTitle}
                      className="w-16 rounded-lg object-cover aspect-[2/3] shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-black text-gray-800 text-base leading-tight">{screeningInfo?.movieTitle}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{screeningInfo?.format || '2D Phụ đề'}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500 flex gap-1"><Building2 size={12} className="mt-0.5 shrink-0" />{screeningInfo?.cinemaName} · {screeningInfo?.screenName}</p>
                      <p className="text-xs text-gray-500 flex gap-1"><Calendar size={12} className="mt-0.5 shrink-0" />{screeningInfo?.date} &nbsp;·&nbsp; {screeningInfo?.time}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat summary */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Ghế đã chọn</p>
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map(s => (
                    <div key={s.id} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 ${
                      s.seatType === 'VIP' ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                      : s.seatType === 'COUPLE' ? 'bg-pink-50 border-pink-300 text-pink-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                      {s.seatRow}{s.seatNumber}
                      <span className="font-normal ml-1 opacity-70">
                        {s.seatType === 'VIP' ? 'VIP' : s.seatType === 'COUPLE' ? 'Đôi' : 'Thường'}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Per-seat price breakdown */}
                <div className="mt-3 space-y-1.5">
                  {selectedSeats.map(s => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">Ghế {s.seatRow}{s.seatNumber} ({s.seatType === 'VIP' ? 'VIP' : s.seatType === 'COUPLE' ? 'Đôi' : 'Thường'})</span>
                      <span className="font-semibold text-gray-800">{seatPrice(s).toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Phương thức thanh toán</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                        paymentMethod === pm.value
                          ? 'border-[#1a3a6c] bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xl shrink-0">{pm.icon}</span>
                      <div>
                        <p className={`text-sm font-bold leading-tight ${paymentMethod === pm.value ? 'text-[#1a3a6c]' : 'text-gray-700'}`}>{pm.label}</p>
                        <p className="text-[10px] text-gray-400">{pm.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: total + confirm button */}
            <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-gray-500 font-medium">Tổng thanh toán</span>
                <span className="text-[#1a3a6c] font-black text-xl">{total.toLocaleString('vi-VN')} đ</span>
              </div>
              <button
                onClick={handleBook}
                disabled={booking}
                className="w-full py-3.5 bg-cinema-red hover:bg-red-700 disabled:bg-gray-400 text-white font-black rounded-xl tracking-wide text-base transition-colors"
              >
                {booking ? 'Đang xử lý...' : '🎬 XÁC NHẬN ĐẶT VÉ'}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Bằng cách đặt vé, bạn đồng ý với điều khoản sử dụng của LLMCinema
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingPage
