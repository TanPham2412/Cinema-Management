import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Film, Building2, Calendar, Clock, ChevronLeft, X, CheckCircle, Banknote, QrCode } from 'lucide-react'
import bookingService from '../../services/bookingService'
import api from '../../services/api'
import websocketService from '../../services/websocketService'

const SEAT_TYPES = {
  REGULAR: { label: 'Ghế thường', price: 0 },
  VIP:     { label: 'Ghế VIP',    price: 30000 },
  COUPLE:  { label: 'Ghế đôi',    price: 50000 },
}

const ROW_ORDER = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A']

const MB_ACCOUNT = '7053765633'
const MB_ACCOUNT_NAME = 'Pham Minh Tan'

function SeatBtn({ seat, selected, onClick }) {
  const booked = seat.status === 'BOOKED'
  const held   = seat.status === 'HELD'
  let cls = 'w-[44px] h-[38px] rounded flex items-center justify-center text-[10px] font-bold select-none transition-colors '
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
    <div className={cls} style={style} onClick={() => !booked && !held && onClick(seat)}>
      {seat.seatRow}{seat.seatNumber}
    </div>
  )
}

function LegendSeat({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-8 h-7 rounded ${color}`} />
      <span className="text-xs text-gray-300">{label}</span>
    </div>
  )
}

const StaffBookingPage = () => {
  const { screeningSlug } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const [screeningId, setScreeningId] = useState(null)
  const [seats, setSeats] = useState([])
  const [screeningInfo, setScreeningInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [booking, setBooking] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)

  const [wsHeldSeats, setWsHeldSeats] = useState(new Set())
  const [wsBookedSeats, setWsBookedSeats] = useState(new Set())
  const selectedSeatsRef = useRef([])
  const bookingCreatedRef = useRef(false)

  useEffect(() => { selectedSeatsRef.current = selectedSeats }, [selectedSeats])

  useEffect(() => {
    if (!screeningId) return
    api.get(`/screenings/${screeningId}/held-seats`).then(res => {
      setWsHeldSeats(new Set((res.data || []).map(String)))
    }).catch(() => {})

    websocketService.connect(screeningId, (msg) => {
      const { seatId, action, userId } = msg
      if (userId === user?.email) return
      if (action === 'CONFIRM') {
        setWsHeldSeats(prev => { const n = new Set(prev); n.delete(String(seatId)); return n })
        setWsBookedSeats(prev => { const n = new Set(prev); n.add(String(seatId)); return n })
        setSeats(prev => prev.map(s => String(s.id) === String(seatId) ? { ...s, status: 'BOOKED' } : s))
      } else if (action === 'SELECT') {
        setWsHeldSeats(prev => { const n = new Set(prev); n.add(String(seatId)); return n })
      } else {
        setWsHeldSeats(prev => { const n = new Set(prev); n.delete(String(seatId)); return n })
        setSeats(prev => prev.map(s => String(s.id) === String(seatId) ? { ...s, status: 'AVAILABLE' } : s))
      }
    })
    return () => {
      if (!bookingCreatedRef.current) {
        selectedSeatsRef.current.forEach(seat => {
          websocketService.sendSeatSelection(screeningId, seat.id, 'RELEASE', user?.email)
        })
      }
      websocketService.disconnect()
    }
  }, [screeningId]) // eslint-disable-line

  useEffect(() => {
    fetchSeats()
  }, [screeningSlug]) // eslint-disable-line

  const fetchSeats = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getScreeningSeatsBySlug(screeningSlug)
      setSeats(data.seats || [])
      if (data.screening?.id) setScreeningId(data.screening.id)
      const s = data.screening || {}
      const startTime = s.startTime || ''
      setScreeningInfo({
        movieTitle:  s.movieTitle  || '—',
        posterUrl:   s.posterUrl   || null,
        cinemaName:  s.cinemaName  || '—',
        screenName:  s.screenName  || '—',
        date:        startTime ? new Date(startTime).toLocaleDateString('vi-VN', { weekday:'short', day:'2-digit', month:'2-digit', year:'numeric' }) : '—',
        time:        startTime ? startTime.substring(11, 16) : '—',
        basePrice:   s.basePrice   || 90000,
        duration:    s.duration    || null,
      })
    } catch (e) {
      // If fetch fails, show error and go back
      navigate('/d73')
    } finally {
      setLoading(false)
    }
  }

  const getEffectiveStatus = (seat) => {
    const isOwn = selectedSeats.find(s => s.id === seat.id)
    if (seat.status === 'BOOKED') return 'BOOKED'
    if (wsBookedSeats.has(String(seat.id))) return 'BOOKED'
    if (seat.status === 'HELD' && !isOwn) return 'HELD'
    if (wsHeldSeats.has(String(seat.id)) && !isOwn) return 'HELD'
    return seat.status
  }

  const toggleSeat = (seat) => {
    if (seat.status === 'BOOKED') return
    const isOwn = selectedSeats.find(s => s.id === seat.id)
    if (seat.status === 'HELD' && !isOwn) return
    if (isOwn) {
      websocketService.sendSeatSelection(screeningId, seat.id, 'RELEASE', user?.email)
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id))
    } else if (selectedSeats.length < 8) {
      websocketService.sendSeatSelection(screeningId, seat.id, 'SELECT', user?.email)
      setSelectedSeats(prev => [...prev, seat])
    }
  }

  const seatPrice = (seat) =>
    (screeningInfo?.basePrice || 90000) + (SEAT_TYPES[seat.seatType]?.price || 0)

  const grandTotal = selectedSeats.reduce((sum, s) => sum + seatPrice(s), 0)

  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.seatRow]) acc[seat.seatRow] = []
    acc[seat.seatRow].push(seat)
    return acc
  }, {})

  const vietQrUrl = `https://img.vietqr.io/image/MB-${MB_ACCOUNT}-compact2.png?amount=${grandTotal}&addInfo=Thanh+toan+ve+phim&accountName=${encodeURIComponent(MB_ACCOUNT_NAME)}`

  const handleBook = async () => {
    if (!selectedSeats.length) return
    setBooking(true)
    try {
      selectedSeats.forEach(seat => {
        websocketService.sendSeatSelection(screeningId, seat.id, 'SELECT', user?.email)
      })
      const result = await bookingService.createBooking({
        screeningId: screeningId,
        seatIds: selectedSeats.map(s => s.id),
        combos: [],
        paymentMethod,
      })
      bookingCreatedRef.current = true
      setBookingResult(result)
      setShowCheckout(false)
      // Mark booked seats as BOOKED immediately so the map turns red without waiting for WS
      const bookedIds = new Set(selectedSeats.map(s => String(s.id)))
      setSeats(prev => prev.map(s => bookedIds.has(String(s.id)) ? { ...s, status: 'BOOKED' } : s))
      setWsHeldSeats(prev => { const n = new Set(prev); bookedIds.forEach(id => n.delete(id)); return n })
      setSelectedSeats([])
      setShowSuccess(true)
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
    <div className="min-h-screen bg-cinema-darker pb-24">
      {/* Header */}
      <div className="bg-cinema-gray border-b border-cinema-gray-light px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/d73')} className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft size={22} />
          </button>
          <div>
            <p className="text-white font-bold text-sm">{screeningInfo?.movieTitle}</p>
            <p className="text-gray-400 text-xs">{screeningInfo?.date} · {screeningInfo?.time} · {screeningInfo?.cinemaName} — {screeningInfo?.screenName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        <div className="flex gap-5 items-start">
          {/* Seat map */}
          <div className="flex-1 bg-cinema-gray rounded-lg border border-cinema-gray-light overflow-hidden">
            <div className="p-5">
              {/* Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mb-7">
                <LegendSeat color="bg-[#c8cad0]" label="Ghế thường" />
                <LegendSeat color="bg-[#f5c842]" label="Ghế VIP" />
                <LegendSeat color="bg-pink-300"  label="Ghế đôi" />
                <LegendSeat color="bg-[#1a3a6c]" label="Đang chọn" />
                <LegendSeat color="bg-[#5cb8e4]" label="Đang giữ" />
                <LegendSeat color="bg-red-500"   label="Đã bán" />
              </div>

              {/* Screen */}
              <div className="mb-8 px-6">
                <div className="relative w-4/5 mx-auto overflow-hidden" style={{ height: 18 }}>
                  <div className="absolute inset-x-0 bg-gradient-to-b from-gray-500 to-cinema-gray"
                    style={{ height: 80, top: 0, borderRadius: '50%', boxShadow: '0 4px 16px rgba(255,255,255,0.08)' }} />
                </div>
                <p className="text-center text-gray-500 tracking-[0.2em] text-xs mt-2 font-medium">MÀN HÌNH CHIẾU</p>
              </div>

              {/* Seats */}
              <div className="overflow-x-auto">
                <div className="flex flex-col items-center gap-2 min-w-max mx-auto">
                  {ROW_ORDER.map(row => {
                    const rowSeats = (seatsByRow[row] || []).sort((a, b) => b.seatNumber - a.seatNumber)
                    if (!rowSeats.length) return null
                    return (
                      <div key={row} className="flex gap-1.5">
                        {rowSeats.map(seat => (
                          <SeatBtn
                            key={seat.id}
                            seat={{ ...seat, status: getEffectiveStatus(seat) }}
                            selected={!!selectedSeats.find(s => s.id === seat.id)}
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

          {/* Right panel */}
          <div className="w-64 shrink-0 bg-cinema-gray rounded-lg border border-cinema-gray-light sticky top-4 overflow-hidden">
            {screeningInfo?.posterUrl ? (
              <img
                src={screeningInfo.posterUrl.startsWith('/api') ? screeningInfo.posterUrl : `/api${screeningInfo.posterUrl}`}
                alt={screeningInfo.movieTitle}
                className="w-full aspect-[2/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-cinema-gray-light flex items-center justify-center">
                <Film className="w-12 h-12 text-gray-600" />
              </div>
            )}

            <div className="p-4 space-y-2">
              <h2 className="text-sm font-black text-white leading-tight">{screeningInfo?.movieTitle}</h2>

              <div className="text-xs text-gray-400 space-y-1 pt-1">
                <div className="flex items-center gap-1.5"><Building2 size={11} />{screeningInfo?.cinemaName}</div>
                <div className="flex items-center gap-1.5"><Film size={11} />{screeningInfo?.screenName}</div>
                <div className="flex items-center gap-1.5"><Calendar size={11} />{screeningInfo?.date}</div>
                <div className="flex items-center gap-1.5"><Clock size={11} />{screeningInfo?.time}</div>
              </div>

              {selectedSeats.length > 0 && (
                <div className="pt-2 border-t border-cinema-gray-light">
                  <p className="text-xs text-gray-400 mb-1">Đã chọn</p>
                  <p className="text-white text-sm font-bold">
                    {selectedSeats.map(s => `${s.seatRow}${s.seatNumber}`).join(', ')}
                  </p>
                  <p className="text-cinema-gold font-black text-base mt-1">
                    {grandTotal.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowCheckout(true)}
                disabled={!selectedSeats.length}
                className="mt-2 w-full py-2.5 bg-cinema-red hover:bg-red-700 disabled:bg-cinema-gray-light disabled:text-gray-600 disabled:cursor-not-allowed text-white font-black rounded text-sm transition-colors"
              >
                TIẾP TỤC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 inset-x-0 bg-cinema-gray border-t border-cinema-gray-light z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
          <div className="flex items-center gap-5 flex-1">
            <LegendSeat color="bg-[#c8cad0]" label="Ghế thường" />
            <LegendSeat color="bg-[#f5c842]" label="Ghế VIP" />
            <LegendSeat color="bg-pink-300"  label="Ghế đôi" />
          </div>
          <div className="px-6 border-x border-cinema-gray-light text-center shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Tổng tiền</p>
            <p className="font-black text-cinema-gold text-sm">{grandTotal > 0 ? grandTotal.toLocaleString('vi-VN') + ' đ' : '0 đ'}</p>
          </div>
          <div className="text-center shrink-0">
            <p className="text-xs text-gray-400 mb-0.5">Ghế đã chọn</p>
            <p className="font-black text-white text-base">{selectedSeats.length} ghế</p>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-0 sm:px-4">
          <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-600">
                  <ChevronLeft size={20} />
                </button>
                <h2 className="font-black text-gray-800 text-base">Xác nhận đặt vé (Tại quầy)</h2>
              </div>
              <button onClick={() => setShowCheckout(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Movie summary */}
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                <p className="font-black text-gray-800 text-base">{screeningInfo?.movieTitle}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {screeningInfo?.cinemaName} · {screeningInfo?.screenName} · {screeningInfo?.date} · {screeningInfo?.time}
                </p>
              </div>

              {/* Seat summary */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Ghế đã chọn</p>
                <div className="flex flex-wrap gap-2 mb-3">
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
                <div className="space-y-1">
                  {selectedSeats.map(s => (
                    <div key={s.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">Ghế {s.seatRow}{s.seatNumber}</span>
                      <span className="font-semibold text-gray-800">{seatPrice(s).toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment method */}
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Phương thức thanh toán</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Banknote size={24} className={paymentMethod === 'CASH' ? 'text-green-600' : 'text-gray-400'} />
                    <span className={`text-sm font-bold ${paymentMethod === 'CASH' ? 'text-green-700' : 'text-gray-600'}`}>
                      Tiền mặt
                    </span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <QrCode size={24} className={paymentMethod === 'BANK_TRANSFER' ? 'text-blue-600' : 'text-gray-400'} />
                    <span className={`text-sm font-bold ${paymentMethod === 'BANK_TRANSFER' ? 'text-blue-700' : 'text-gray-600'}`}>
                      Chuyển khoản
                    </span>
                  </button>
                </div>

                {/* MB Bank QR */}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-center text-sm font-bold text-blue-800 mb-3">Quét mã QR để thanh toán</p>
                    <div className="flex justify-center">
                      <img
                        src={vietQrUrl}
                        alt="MB Bank QR"
                        className="w-52 h-52 rounded-lg"
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-center">
                      <p className="font-bold text-gray-800">MB Bank</p>
                      <p className="text-gray-600">STK: <span className="font-mono font-bold text-blue-700">{MB_ACCOUNT}</span></p>
                      <p className="text-gray-600">Tên TK: <span className="font-semibold">{MB_ACCOUNT_NAME}</span></p>
                      <p className="text-lg font-black text-blue-700 mt-2">{grandTotal.toLocaleString('vi-VN')} đ</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-semibold">Tổng cộng</span>
                  <span className="text-2xl font-black text-gray-900">{grandTotal.toLocaleString('vi-VN')} đ</span>
                </div>
                {paymentMethod === 'CASH' && (
                  <p className="text-xs text-gray-400 mt-1">Thu tiền mặt từ khách và bấm xác nhận.</p>
                )}
                {paymentMethod === 'BANK_TRANSFER' && (
                  <p className="text-xs text-gray-400 mt-1">Xác nhận sau khi khách đã chuyển khoản thành công.</p>
                )}
              </div>
            </div>

            {/* Confirm button */}
            <div className="px-5 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={handleBook}
                disabled={booking}
                className="w-full py-3.5 bg-cinema-red hover:bg-red-700 disabled:bg-gray-300 text-white font-black rounded-xl text-base transition-colors"
              >
                {booking ? 'Đang xử lý...' : (paymentMethod === 'CASH' ? '✓ Xác nhận thu tiền & Đặt vé' : '✓ Đã nhận chuyển khoản & Đặt vé')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {showSuccess && bookingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-green-500 px-6 py-8 text-center">
              <CheckCircle className="w-16 h-16 text-white mx-auto mb-3" />
              <h2 className="text-2xl font-black text-white">Đặt vé thành công!</h2>
              <p className="text-green-100 text-sm mt-1">Vé đã được xác nhận</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="text-center">
                <p className="text-gray-400 text-xs mb-1">Mã đặt vé</p>
                <p className="font-mono font-black text-2xl text-gray-900 tracking-wider">{bookingResult.bookingCode}</p>
              </div>
              <hr />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Phim</span>
                  <span className="font-semibold text-gray-800">{screeningInfo?.movieTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Suất chiếu</span>
                  <span className="font-semibold text-gray-800">{screeningInfo?.date} · {screeningInfo?.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ghế</span>
                  <span className="font-semibold text-gray-800">
                    {selectedSeats.map(s => `${s.seatRow}${s.seatNumber}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Thanh toán</span>
                  <span className="font-semibold text-gray-800">
                    {paymentMethod === 'CASH' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}
                  </span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="font-bold text-gray-700">Tổng cộng</span>
                  <span className="font-black text-green-600">{grandTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/d73')}
                className="w-full py-3 bg-cinema-red hover:bg-red-700 text-white font-black rounded-xl text-sm transition-colors mt-2"
              >
                Quay về Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffBookingPage
