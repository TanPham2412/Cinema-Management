import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Tag, Clock, Building2, Calendar, Film, X, ChevronLeft, ShoppingBag } from 'lucide-react'
import bookingService from '../services/bookingService'
import comboService from '../services/comboService'
import api from '../services/api'
import websocketService from '../services/websocketService'

const PAYMENT_METHODS = [
  { value: 'VNPAY', label: 'VNPay', icon: '💳', desc: 'Thanh toán qua VNPay' },
  { value: 'MOMO',  label: 'MoMo',  icon: '🟣', desc: 'Ví điện tử MoMo' },
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
  const held = seat.status === 'HELD'
  let cls =
    'w-[44px] h-[38px] rounded flex items-center justify-center text-[10px] font-bold select-none transition-colors '
  let style = {}

  if (booked) {
    cls += 'bg-red-500 text-white cursor-not-allowed'
  } else if (selected) {
    cls += 'bg-[#1a3a6c] text-white cursor-pointer'
    style.boxShadow = '0 3px 0 rgba(15,35,80,0.4)'
  } else if (held) {
    cls += 'bg-[#5cb8e4] text-white cursor-not-allowed'
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
  const [momoBookingCode, setMomoBookingCode] = useState(null)
  const [momoPaymentUrl, setMomoPaymentUrl] = useState(null)
  const [momoConfirming, setMomoConfirming] = useState(false)

  // Real-time seat holding via WebSocket
  const [wsHeldSeats, setWsHeldSeats] = useState(new Set())
  const [wsBookedSeats, setWsBookedSeats] = useState(new Set()) // confirmed by others in real-time
  const [timerRunning, setTimerRunning] = useState(false)
  const [showExpiredDialog, setShowExpiredDialog] = useState(false)
  const selectedSeatsRef = useRef([])
  const bookingCreatedRef = useRef(false)
  const vnpayOpenedRef = useRef(false)   // true while VNPay new-tab is open
  const [momoBookingId, setMomoBookingId] = useState(null)
  const [vnpayBookingCode, setVnpayBookingCode] = useState(null)
  const [vnpayBookingId, setVnpayBookingId] = useState(null)
  const [vnpayPaymentUrl, setVnpayPaymentUrl] = useState(null)

  // Combo state
  const [combos, setCombos] = useState([])
  const [selectedCombos, setSelectedCombos] = useState({}) // { comboId: quantity }

  useEffect(() => { selectedSeatsRef.current = selectedSeats }, [selectedSeats])

  useEffect(() => {
    comboService.getAvailableCombos().then(setCombos).catch(() => {})
  }, [])

  const handleMomoTestConfirm = async () => {
    setMomoConfirming(true)
    try {
      await api.get(`/payment/momo/test-confirm`, { params: { bookingCode: momoBookingCode } })
    } catch {
      // backend redirects which axios will follow — ignore redirect error
    }
    // Navigate to result page directly
    navigate(`/payment/momo/result?success=true&bookingCode=${momoBookingCode}&resultCode=0&message=Test+success`)
  }

  // Start timer when user selects first seat; reset/stop when all deselected
  useEffect(() => {
    if (selectedSeats.length > 0 && !timerRunning) {
      setTimerRunning(true)
      setTimeLeft(600)
    } else if (selectedSeats.length === 0 && timerRunning) {
      setTimerRunning(false)
      setTimeLeft(600)
    }
  }, [selectedSeats.length]) // eslint-disable-line

  // Countdown — only when running
  useEffect(() => {
    if (!timerRunning) return
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [timerRunning])

  // Timer expiry: release seats and show expired dialog
  useEffect(() => {
    if (timeLeft === 0 && timerRunning) {
      selectedSeatsRef.current.forEach((seat) => {
        websocketService.sendSeatSelection(parseInt(screeningId), seat.id, 'RELEASE', user?.email)
      })
      setSelectedSeats([])
      setTimerRunning(false)
      setShowExpiredDialog(true)
    }
  }, [timeLeft]) // eslint-disable-line

  // WebSocket: connect for real-time seat updates; release + disconnect on unmount
  useEffect(() => {
    // Fetch initial held seats from backend (for users who join late)
    api.get(`/screenings/${screeningId}/held-seats`).then((res) => {
      const heldIds = res.data || []
      setWsHeldSeats(new Set(heldIds.map(String)))
    }).catch(() => {})

    websocketService.connect(parseInt(screeningId), (msg) => {
      const { seatId, action, userId } = msg
      if (userId === user?.email) return // ignore own messages
      if (action === 'CONFIRM') {
        // Payment confirmed: seat is now sold — move from held to booked
        setWsHeldSeats((prev) => { const n = new Set(prev); n.delete(String(seatId)); return n })
        setWsBookedSeats((prev) => { const n = new Set(prev); n.add(String(seatId)); return n })
        // Update local seat status to prevent stale DB cache showing as HELD
        setSeats((prev) => prev.map((s) => String(s.id) === String(seatId) ? { ...s, status: 'BOOKED' } : s))
        // If this confirms MY payment (seat in my selection), navigate to profile
        if (selectedSeatsRef.current.some((s) => String(s.id) === String(seatId))) {
          vnpayOpenedRef.current = false
          navigate('/profile')
        }
      } else if (action === 'SELECT') {
        setWsHeldSeats((prev) => { const n = new Set(prev); n.add(String(seatId)); return n })
      } else { // RELEASE
        setWsHeldSeats((prev) => { const n = new Set(prev); n.delete(String(seatId)); return n })
        // CRITICAL: update local seat status to AVAILABLE so stale DB HELD doesn't block rebooking
        setSeats((prev) => prev.map((s) => String(s.id) === String(seatId) ? { ...s, status: 'AVAILABLE' } : s))
      }
    })
    return () => {
      if (!bookingCreatedRef.current) {
        // Only release from SeatHoldStore if no booking was created yet
        // (once a booking exists as PENDING in DB, it owns the hold — expiry scheduler will release)
        selectedSeatsRef.current.forEach((seat) => {
          websocketService.sendSeatSelection(parseInt(screeningId), seat.id, 'RELEASE', user?.email)
        })
      }
      websocketService.disconnect()
    }
  }, [screeningId]) // eslint-disable-line

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

  // Compute effective seat status: DB status > WS real-time
  // Own selected seats should NOT show as HELD (their HELD/PENDING is from our own booking)
  const getEffectiveStatus = (seat) => {
    const isOwnSelection = selectedSeats.find((s) => s.id === seat.id)
    if (seat.status === 'BOOKED') return 'BOOKED'
    if (wsBookedSeats.has(String(seat.id))) return 'BOOKED'
    if (seat.status === 'HELD' && !isOwnSelection) return 'HELD'
    if (wsHeldSeats.has(String(seat.id)) && !isOwnSelection) return 'HELD'
    return seat.status
  }

  const toggleSeat = (seat) => {
    if (seat.status === 'BOOKED') return
    // Block clicking on HELD seats that aren't our own selection
    const isOwnSelection = selectedSeats.find((s) => s.id === seat.id)
    if (seat.status === 'HELD' && !isOwnSelection) return
    if (isOwnSelection) {
      websocketService.sendSeatSelection(parseInt(screeningId), seat.id, 'RELEASE', user?.email)
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id))
    } else if (selectedSeats.length < 8) {
      websocketService.sendSeatSelection(parseInt(screeningId), seat.id, 'SELECT', user?.email)
      setSelectedSeats((prev) => [...prev, seat])
    }
  }

  const seatPrice = (seat) =>
    (screeningInfo?.basePrice || 90000) + (SEAT_TYPES[seat.seatType]?.price || 0)

  const comboTotal = Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
    const combo = combos.find(c => c.id === Number(id))
    return sum + (combo ? combo.price * qty : 0)
  }, 0)

  const total = selectedSeats.reduce((sum, s) => sum + seatPrice(s), 0) + comboTotal

  const changeComboQty = (comboId, delta) => {
    setSelectedCombos(prev => {
      const cur = prev[comboId] || 0
      const next = Math.max(0, cur + delta)
      if (next === 0) {
        const { [comboId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [comboId]: next }
    })
  }

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
      // Re-send SELECT for all seats (ensures SeatHoldStore is current, handles payment retries)
      selectedSeats.forEach((seat) => {
        websocketService.sendSeatSelection(parseInt(screeningId), seat.id, 'SELECT', user?.email)
      })

      const result = await bookingService.createBooking({
        screeningId: parseInt(screeningId),
        seatIds: selectedSeats.map((s) => s.id),
        combos: Object.entries(selectedCombos)
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => ({ comboId: Number(id), quantity: qty })),
        paymentMethod,
      })

      setShowCheckout(false)

      // Booking created (PENDING in DB) — DB now owns the seat hold.
      // Backend will broadcast CONFIRM via WebSocket when payment is actually confirmed.
      bookingCreatedRef.current = true

      if (paymentMethod === 'VNPAY') {
        const { paymentUrl } = await bookingService.createVNPayUrl(result.bookingCode)
        setVnpayBookingCode(result.bookingCode)
        setVnpayBookingId(result.id)
        setVnpayPaymentUrl(paymentUrl)
        vnpayOpenedRef.current = true
        window.open(paymentUrl, '_blank') // keep BookingPage alive; user can retry if payment fails
      } else if (paymentMethod === 'MOMO') {
        const { paymentUrl } = await bookingService.createMoMoUrl(result.bookingCode)
        setMomoBookingCode(result.bookingCode)
        setMomoBookingId(result.id)
        setMomoPaymentUrl(paymentUrl)
        window.open(paymentUrl, '_blank')
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

  // Cancel an in-progress MoMo payment (user closed/cancelled the MoMo tab)
  const handleMomoCancel = async () => {
    try {
      if (momoBookingId) await bookingService.cancelBooking(momoBookingId)
    } catch {
      // ignore — booking may have already expired or been cancelled
    }
    // Explicitly release WS hold and update local seat state
    selectedSeatsRef.current.forEach((seat) => {
      websocketService.sendSeatSelection(parseInt(screeningId), seat.id, 'RELEASE', user?.email)
      setSeats((prev) => prev.map((s) => s.id === seat.id ? { ...s, status: 'AVAILABLE' } : s))
    })
    setSelectedSeats([])
    setMomoBookingCode(null)
    setMomoBookingId(null)
    setMomoPaymentUrl(null)
    bookingCreatedRef.current = false
  }

  // Cancel an in-progress VNPay payment (user closed the VNPay tab without paying)
  const handleVnpayCancel = async () => {
    try {
      if (vnpayBookingId) await bookingService.cancelBooking(vnpayBookingId)
    } catch {
      // ignore — booking may have already been cancelled via redirect
    }
    selectedSeatsRef.current.forEach((seat) => {
      websocketService.sendSeatSelection(parseInt(screeningId), seat.id, 'RELEASE', user?.email)
      setSeats((prev) => prev.map((s) => s.id === seat.id ? { ...s, status: 'AVAILABLE' } : s))
    })
    setSelectedSeats([])
    setVnpayBookingCode(null)
    setVnpayBookingId(null)
    setVnpayPaymentUrl(null)
    vnpayOpenedRef.current = false
    bookingCreatedRef.current = false
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
                            seat={{ ...seat, status: getEffectiveStatus(seat) }}
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
                onClick={() => {
                  if (!selectedSeats.length) return
                  // Prevent WebSocket seat release on unmount
                  bookingCreatedRef.current = true
                  navigate('/booking/confirm', {
                    state: {
                      preBooking: {
                        screeningId: parseInt(screeningId),
                        seats: selectedSeats,
                        screeningInfo,
                      }
                    }
                  })
                }}
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
            <p className={`font-black text-2xl tracking-tight leading-none ${
              timerRunning && timeLeft <= 60 ? 'text-red-400 animate-pulse' : 'text-white'
            }`}>
              {timerRunning ? fmtTimer(timeLeft) : '--:--'}
            </p>
          </div>
        </div>
      </div>
      {/* ─── Checkout overlay ─── */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md px-0 sm:px-4">
          <div className="w-full sm:max-w-lg bg-[#111111] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowCheckout(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <h2 className="font-black text-white text-lg tracking-wide uppercase">Xác nhận đặt vé</h2>
              </div>
              <button onClick={() => setShowCheckout(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {/* Movie + screening summary */}
              <div className="px-6 py-5 bg-[#181818] border-b border-white/5">
                <div className="flex gap-4 items-start">
                  {screeningInfo?.posterUrl && (
                    <div className="relative shrink-0">
                      <img
                        src={screeningInfo.posterUrl.startsWith('/api') ? screeningInfo.posterUrl : `/api${screeningInfo.posterUrl}`}
                        alt={screeningInfo.movieTitle}
                        className="w-20 rounded-lg object-cover aspect-[2/3] shadow-lg"
                      />
                      <div className="absolute inset-0 rounded-lg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"></div>
                    </div>
                  )}
                  <div className="flex-1 mt-1">
                    <p className="font-black text-white text-lg leading-tight uppercase">{screeningInfo?.movieTitle}</p>
                    <p className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold mt-1">{screeningInfo?.format || '2D Phụ đề'}</p>
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs text-gray-400 flex items-center gap-2"><Building2 size={13} className="shrink-0 text-cinema-red" /> <span className="text-gray-300 font-medium">{screeningInfo?.cinemaName}</span> · {screeningInfo?.screenName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-2"><Calendar size={13} className="shrink-0 text-cinema-red" /> <span className="text-gray-300 font-medium">{screeningInfo?.date}</span> &nbsp;·&nbsp; {screeningInfo?.time}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seat summary */}
              <div className="px-6 py-5 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-bold">Ghế đã chọn</p>
                  <span className="text-xs font-semibold text-cinema-gold">{selectedSeats.length} ghế</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {selectedSeats.map(s => (
                    <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded bg-[#181818] border ${
                      s.seatType === 'VIP' ? 'border-[#f5c842]/30 text-[#f5c842]'
                      : s.seatType === 'COUPLE' ? 'border-pink-300/30 text-pink-300'
                      : 'border-white/10 text-white'
                    }`}>
                      <span className="text-sm font-black">{s.seatRow}{s.seatNumber}</span>
                      <span className="w-px h-3 bg-white/20"></span>
                      <span className="text-[10px] font-medium opacity-80 uppercase tracking-wide">
                        {s.seatType === 'VIP' ? 'VIP' : s.seatType === 'COUPLE' ? 'Đôi' : 'Thường'}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Per-seat price breakdown */}
                <div className="mt-4 space-y-2">
                  {selectedSeats.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                      <span className="text-gray-400">
                        Ghế <span className="text-white font-bold">{s.seatRow}{s.seatNumber}</span> 
                        <span className="text-[10px] ml-1 opacity-70">({s.seatType === 'VIP' ? 'VIP' : s.seatType === 'COUPLE' ? 'Đôi' : 'Thường'})</span>
                      </span>
                      <span className="font-semibold text-gray-200">{seatPrice(s).toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Combo section */}
              {combos.length > 0 && (
                <div className="px-6 py-5 border-b border-white/5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShoppingBag size={14} className="text-cinema-gold" />
                    <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-bold">Combo ưu đãi</p>
                  </div>
                  <div className="space-y-3">
                    {combos.map(combo => {
                      const qty = selectedCombos[combo.id] || 0
                      return (
                        <div key={combo.id} className="flex items-center gap-3 bg-[#181818] rounded-xl p-3 border border-white/5">
                          {combo.imageUrl ? (
                            <img src={combo.imageUrl} alt={combo.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-[#222] flex items-center justify-center shrink-0 text-2xl">🍿</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm leading-tight">{combo.name}</p>
                            <p className="text-gray-400 text-[11px] mt-0.5 line-clamp-2 leading-relaxed">{combo.description}</p>
                            <p className="text-cinema-gold font-black text-sm mt-1">{combo.price.toLocaleString('vi-VN')} đ</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => changeComboQty(combo.id, -1)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded bg-[#333] hover:bg-[#444] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center text-lg leading-none transition-colors"
                            >−</button>
                            <span className="w-5 text-center text-white font-bold text-sm">{qty}</span>
                            <button
                              onClick={() => changeComboQty(combo.id, 1)}
                              className="w-7 h-7 rounded bg-cinema-red hover:bg-red-700 text-white font-bold flex items-center justify-center text-lg leading-none transition-colors"
                            >+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {comboTotal > 0 && (
                    <div className="mt-3 flex justify-between items-center text-sm border-t border-white/5 pt-3">
                      <span className="text-gray-400">Tổng combo</span>
                      <span className="text-cinema-gold font-bold">{comboTotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment method */}
              <div className="px-6 py-5">
                <p className="text-[11px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-4">Phương thức thanh toán</p>                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(pm => {
                    const active = paymentMethod === pm.value;
                    return (
                      <button
                        key={pm.value}
                        onClick={() => setPaymentMethod(pm.value)}
                        className={`flex flex-col items-start gap-3 p-4 rounded-xl border transition-all text-left relative overflow-hidden ${
                          active
                            ? 'border-cinema-red bg-cinema-red/10'
                            : 'border-white/10 bg-[#181818] hover:border-white/30 hover:bg-[#222]'
                        }`}
                      >
                        {/* Active Indicator Line */}
                        {active && <div className="absolute top-0 left-0 w-full h-[2px] bg-cinema-red shadow-[0_0_8px_rgba(229,9,20,0.8)]"></div>}
                        
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-black/50 ${active ? 'ring-2 ring-cinema-red/50 ring-offset-2 ring-offset-transparent' : 'ring-1 ring-white/10'}`}>
                          {pm.icon}
                        </div>
                        <div>
                          <p className={`text-sm font-black leading-tight tracking-wide ${active ? 'text-white' : 'text-gray-300'}`}>{pm.label}</p>
                          <p className={`text-[10px] mt-1 ${active ? 'text-gray-300' : 'text-gray-500'}`}>{pm.desc}</p>
                        </div>
                        {active && (
                          <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-cinema-red flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom: total + confirm button */}
            <div className="px-6 py-5 border-t border-white/10 bg-[#181818] shrink-0">
              <div className="flex items-end justify-between mb-4">
                <span className="text-gray-400 font-semibold text-sm">Tổng thanh toán</span>
                <div className="text-right">
                  <span className="text-cinema-red font-black text-2xl leading-none">{total.toLocaleString('vi-VN')}</span>
                  <span className="text-gray-400 text-sm ml-1 font-bold">đ</span>
                </div>
              </div>
              <button
                onClick={handleBook}
                disabled={booking}
                className="relative w-full py-4 bg-cinema-red hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-black rounded-xl tracking-[0.15em] text-base transition-all group overflow-hidden"
              >
                {/* Glow effect */}
                {!booking && <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-cinema-red opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {booking ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ĐANG XỬ LÝ...
                    </>
                  ) : '🎬 XÁC NHẬN ĐẶT VÉ'}
                </span>
              </button>
              <p className="text-center text-[10px] text-gray-500 mt-3 font-medium">
                Bằng cách đặt vé, bạn đồng ý với <a href="#" className="underline hover:text-gray-300">điều khoản sử dụng</a> của LLMCinema
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Timer Expired Dialog ─── */}
      {showExpiredDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-red-600 px-6 py-6 text-center">
              <div className="text-5xl mb-2">⏰</div>
              <h2 className="text-white font-black text-lg">Quá thời gian thanh toán!</h2>
              <p className="text-red-200 text-sm mt-1">Thời gian giữ ghế (10 phút) đã hết</p>
            </div>
            <div className="px-6 py-5 text-center space-y-4">
              <p className="text-gray-600 text-sm">
                Các ghế đã chọn đã được giải phóng. Vui lòng chọn lại ghế và hoàn tất thanh toán trước khi hết giờ.
              </p>
              <button
                onClick={() => setShowExpiredDialog(false)}
                className="w-full py-3 bg-cinema-red hover:bg-red-700 text-white font-black rounded-xl text-sm transition-colors"
              >
                Chọn lại ghế
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── VNPay Pending Dialog ─── */}
      {vnpayBookingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#0066b2] px-6 py-5 text-center">
              <div className="text-4xl mb-1">💳</div>
              <h2 className="text-white font-black text-lg">Thanh toán VNPay</h2>
              <p className="text-blue-200 text-xs mt-1">Cổng thanh toán đã mở ở tab mới</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Mã đặt vé</p>
                <p className="font-mono font-bold text-gray-800 text-sm tracking-wider">{vnpayBookingCode}</p>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Vui lòng hoàn tất thanh toán trên trang VNPay. Trang sẽ tự động chuyển khi thanh toán thành công.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => window.open(vnpayPaymentUrl, '_blank')}
                  className="w-full py-2.5 border-2 border-[#0066b2] text-[#0066b2] font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors"
                >
                  🔗 Mở lại trang VNPay
                </button>
                <button
                  onClick={handleVnpayCancel}
                  className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  Hủy thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MoMo Test Confirm Dialog ─── */}
      {momoBookingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#ae2070] px-6 py-5 text-center">
              <div className="text-4xl mb-1">🟣</div>
              <h2 className="text-white font-black text-lg">Thanh toán MoMo</h2>
              <p className="text-pink-200 text-xs mt-1">Cổng thanh toán đã mở ở tab mới</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Mã đặt vé</p>
                <p className="font-mono font-bold text-gray-800 text-sm tracking-wider">{momoBookingCode}</p>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Sau khi thanh toán xong trên trang MoMo, bấm nút bên dưới để xác nhận.
              </p>
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                ⚠️ Chế độ TEST — bấm xác nhận để giả lập thanh toán thành công
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleMomoTestConfirm}
                  disabled={momoConfirming}
                  className="block w-full py-3 bg-[#ae2070] hover:bg-[#8f1a5c] disabled:bg-gray-400 text-white font-black rounded-xl text-center text-sm transition-colors"
                >
                  {momoConfirming ? 'Đang xác nhận...' : '✅ Xác nhận đã thanh toán (Test)'}
                </button>
                <button
                  onClick={() => window.open(momoPaymentUrl, '_blank')}
                  className="w-full py-2.5 border-2 border-[#ae2070] text-[#ae2070] font-bold rounded-xl text-sm hover:bg-pink-50 transition-colors"
                >
                  🔗 Mở lại trang MoMo
                </button>
                <button
                  onClick={handleMomoCancel}
                  className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors"
                >
                  Hủy thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingPage
