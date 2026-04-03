import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Tag, Clock, Building2, Calendar, Film, X, ChevronLeft, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react'
import bookingService from '../services/bookingService'
import api from '../services/api'
import websocketService from '../services/websocketService'

// ── Tier food discount config ───────────────────────────────────────────────
const TIER_FOOD = {
  BRONZE:   { discount: 0,    label: null },
  SILVER:   { discount: 0.05, label: '🥈 Bạn được giảm 5% đồ ăn & nước uống' },
  GOLD:     { discount: 0.10, label: '🥇 Bạn được giảm 10% + miễn phí 1 lần nâng size' },
  PLATINUM: { discount: 0.15, label: '💎 Giảm 15% + Tặng 1 Nước suối miễn phí + 1 lần nâng size' },
  DIAMOND:  { discount: 0.20, label: '👑 Giảm 20% + Tặng 1 Combo 1 người miễn phí + 1 lần nâng size' },
}

const CATEGORY_TAB = [
  { key: 'COMBO',   label: '🎁 Combo' },
  { key: 'POPCORN', label: '🍿 Bắp' },
  { key: 'DRINK',   label: '🥤 Nước' },
]

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
  const [vnpayConfirming, setVnpayConfirming] = useState(false)

  // ── Food & drink state ──────────────────────────────────────────────────────
  const [foodItems, setFoodItems] = useState([])       // loaded from API
  const [selectedFood, setSelectedFood] = useState({}) // { id: qty }
  const [foodCategory, setFoodCategory] = useState('COMBO')
  const [foodExpanded, setFoodExpanded] = useState(true)
  const [upgradeApplied, setUpgradeApplied] = useState(false) // free size upgrade used
  const [upgradeLItemId, setUpgradeLItemId] = useState(null)  // Size L item that got free upgrade

  useEffect(() => { selectedSeatsRef.current = selectedSeats }, [selectedSeats])

  // ── Load food items from backend ─────────────────────────────────────────────
  useEffect(() => {
    api.get('/combos').then(res => {
      const items = res.data || []
      setFoodItems(items)
      // Auto-add free gifts based on tier
      const tier = user?.membershipTier || 'BRONZE'
      const gifts = {}
      if (tier === 'PLATINUM') {
        const water = items.find(i => i.name === 'Nước suối')
        if (water) gifts[water.id] = (gifts[water.id] || 0) + 1
      }
      if (tier === 'DIAMOND') {
        const combo1 = items.find(i => i.name === 'Combo 1 người')
        if (combo1) gifts[combo1.id] = (gifts[combo1.id] || 0) + 1
      }
      if (Object.keys(gifts).length) setSelectedFood(gifts)
    }).catch(() => {})
  }, []) // eslint-disable-line

  const handleMomoTestConfirm = async () => {
    setMomoConfirming(true)
    try {
      const res = await api.get(`/payment/momo/test-confirm`, { params: { bookingCode: momoBookingCode } })
      const ok = res.data?.success === true
      navigate(`/payment/momo/result?success=${ok}&bookingCode=${momoBookingCode}&resultCode=${ok ? '0' : '-1'}&message=${ok ? 'Thanh+toán+thành+công' : 'Xác+nhận+thất+bại'}`)
    } catch {
      navigate(`/payment/momo/result?success=false&bookingCode=${momoBookingCode}&resultCode=-1&message=Lỗi+xác+nhận+thanh+toán`)
    }
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

  // Food helpers
  const tierFoodConfig = TIER_FOOD[user?.membershipTier] || TIER_FOOD.BRONZE
  const discountedFoodPrice = (price) => Math.round(price * (1 - tierFoodConfig.discount))
  const hasSizeUpgrade = ['GOLD', 'PLATINUM', 'DIAMOND'].includes(user?.membershipTier)
  const getBaseName = (name) => name.replace(/ Size [ML]$/, '')
  const findSizeLItem = (mItem) => foodItems.find(i => i.name === getBaseName(mItem.name) + ' Size L')
  const findSizeMItem = (lItem) => foodItems.find(i => i.name === getBaseName(lItem.name) + ' Size M')
  const getFreeQty = (item) => {
    if (user?.membershipTier === 'PLATINUM' && item.name === 'Nước suối') return 1
    if (user?.membershipTier === 'DIAMOND'  && item.name === 'Combo 1 người') return 1
    return 0
  }

  const handleSizeUpgrade = (mItem) => {
    const lItem = findSizeLItem(mItem)
    if (!lItem || upgradeApplied) return
    setSelectedFood(prev => {
      const next = { ...prev }
      const mQty = next[mItem.id] || 0
      if (mQty <= 1) delete next[mItem.id]
      else next[mItem.id] = mQty - 1
      next[lItem.id] = (next[lItem.id] || 0) + 1
      return next
    })
    setUpgradeApplied(true)
    setUpgradeLItemId(lItem.id)
  }

  const foodTotal = foodItems.reduce((sum, item) => {
    const qty = selectedFood[item.id] || 0
    if (!qty) return sum
    const freeQty = getFreeQty(item)
    const paidQty = Math.max(0, qty - freeQty)
    if (paidQty === 0) return sum
    // Size upgrade: 1 paid unit of the upgraded Size L item costs Size M price
    if (upgradeApplied && upgradeLItemId === item.id) {
      const mItem = findSizeMItem(item)
      if (mItem) {
        const upgradeUnitPrice = discountedFoodPrice(mItem.price)
        const normalUnitPrice  = discountedFoodPrice(item.price)
        return sum + upgradeUnitPrice + normalUnitPrice * Math.max(0, paidQty - 1)
      }
    }
    return sum + discountedFoodPrice(item.price) * paidQty
  }, 0)

  const grandTotal = selectedSeats.reduce((sum, s) => sum + seatPrice(s), 0) + foodTotal

  const adjustFood = (itemId, delta) => {
    setSelectedFood(prev => {
      const cur = prev[itemId] || 0
      const next = Math.max(0, Math.min(10, cur + delta))
      if (next === 0) {
        const n = { ...prev }
        delete n[itemId]
        // Reset size upgrade if the upgraded item is removed
        if (itemId === upgradeLItemId) {
          setUpgradeApplied(false)
          setUpgradeLItemId(null)
        }
        return n
      }
      return { ...prev, [itemId]: next }
    })
  }

  const foodOrderList = foodItems
    .filter(i => (selectedFood[i.id] || 0) > 0)
    .map(i => ({ ...i, qty: selectedFood[i.id] }))

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
        combos: Object.entries(selectedFood).map(([id, quantity]) => ({ id: parseInt(id), quantity })),
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
  const handleVnpayTestConfirm = async () => {
    setVnpayConfirming(true)
    try {
      const res = await api.get(`/payment/vnpay/test-confirm`, { params: { bookingCode: vnpayBookingCode } })
      const ok = res.data?.success === true
      navigate(`/payment/vnpay/result?success=${ok}&bookingCode=${vnpayBookingCode}&responseCode=${ok ? '00' : '99'}`)
    } catch {
      navigate(`/payment/vnpay/result?success=false&bookingCode=${vnpayBookingCode}&responseCode=99`)
    }
  }

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

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* ─── Left: Seat map ─── */}
          <div className="w-full lg:flex-1 lg:min-w-0 bg-cinema-gray rounded-lg shadow-sm overflow-hidden border border-cinema-gray-light">
            <div className="p-3 sm:p-5 md:p-7">
              {/* Seat legend */}
              <div className="flex flex-wrap gap-x-2 sm:gap-x-4 md:gap-x-5 gap-y-2 mb-5 sm:mb-7">
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
          <div className="w-full lg:w-64 shrink-0 bg-cinema-gray rounded-lg shadow-sm lg:sticky lg:top-4 overflow-hidden border border-cinema-gray-light">
            {/* Poster - hidden on mobile, shown on desktop */}
            {screeningInfo?.posterUrl ? (
              <div className="relative hidden lg:block">
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
              <div className="w-full aspect-[2/3] bg-cinema-gray-light hidden lg:flex items-center justify-center">
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

      {/* ─── Food & Drink section ─── */}
      {foodItems.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 pb-6 mt-4">
          <div className="bg-cinema-gray rounded-lg border border-cinema-gray-light overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setFoodExpanded(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🍿</span>
                <div className="text-left">
                  <p className="font-bold text-white text-sm">Đồ ăn & nước uống</p>
                  <p className="text-gray-400 text-xs">Nhận tại quầy khi đến rạp</p>
                </div>
                {foodOrderList.length > 0 && (
                  <span className="ml-2 bg-cinema-red text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {foodOrderList.reduce((s, i) => s + i.qty, 0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {tierFoodConfig.label && (
                  <span className="hidden sm:block text-xs font-semibold text-cinema-gold bg-cinema-gold/10 border border-cinema-gold/30 px-3 py-1 rounded-full">
                    {tierFoodConfig.label}
                  </span>
                )}
                {foodExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </div>
            </button>

            {foodExpanded && (
              <div className="border-t border-cinema-gray-light">
                {tierFoodConfig.label && (
                  <div className="sm:hidden px-4 py-2 bg-cinema-gold/10 border-b border-cinema-gold/20">
                    <p className="text-cinema-gold text-xs font-semibold text-center">{tierFoodConfig.label}</p>
                  </div>
                )}

                {/* Category tabs */}
                <div className="flex border-b border-cinema-gray-light">
                  {CATEGORY_TAB.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFoodCategory(tab.key)}
                      className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                        foodCategory === tab.key
                          ? 'text-cinema-gold border-b-2 border-cinema-gold bg-cinema-gold/5'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Items grid */}
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {foodItems.filter(i => i.category === foodCategory).map(item => {
                    const qty = selectedFood[item.id] || 0
                    const freeQtyForItem = getFreeQty(item)   // 0 or 1
                    const hasFreeUnit  = freeQtyForItem > 0   // PLATINUM water / DIAMOND combo
                    const isUpgradeItem = upgradeApplied && upgradeLItemId === item.id
                    const isMSizeItem   = item.name.endsWith(' Size M') && !!findSizeLItem(item)
                    const canUpgrade    = hasSizeUpgrade && !upgradeApplied && qty > 0 && isMSizeItem
                    const showDiscounted = tierFoodConfig.discount > 0
                    const discPrice = discountedFoodPrice(item.price)

                    return (
                      <div
                        key={item.id}
                        className={`relative rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                          qty > 0
                            ? 'border-cinema-gold bg-cinema-gold/5 shadow-[0_0_12px_rgba(var(--cinema-gold-rgb),0.15)]'
                            : 'border-cinema-gray-light bg-cinema-darker hover:border-gray-500'
                        }`}
                      >
                        {/* Free badge: ×1 only */}
                        {hasFreeUnit && (
                          <span className="absolute top-2 right-2 text-[9px] font-black bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                            ×1 MIỄN PHÍ
                          </span>
                        )}
                        {/* Upgrade badge */}
                        {isUpgradeItem && !hasFreeUnit && (
                          <span className="absolute top-2 right-2 text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                            ↑ NÂNG SIZE
                          </span>
                        )}
                        <div>
                          <p className="text-white text-xs font-bold leading-tight pr-10">{item.name}</p>
                          <p className="text-gray-500 text-[10px] leading-tight mt-0.5 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="flex items-end justify-between gap-1 mt-auto">
                          <div>
                            {hasFreeUnit && qty <= freeQtyForItem ? (
                              // 1st unit is free — show free label
                              <p className="text-green-400 font-black text-sm">Miễn phí 🎁</p>
                            ) : (
                              <>
                                {showDiscounted && (
                                  <p className="text-gray-500 line-through text-[10px]">
                                    {item.price.toLocaleString('vi-VN')}đ
                                  </p>
                                )}
                                <p className="text-cinema-gold font-black text-sm">
                                  {discPrice.toLocaleString('vi-VN')}đ
                                </p>
                                {hasFreeUnit && qty > freeQtyForItem && (
                                  <p className="text-green-400 text-[10px]">×1 miễn phí</p>
                                )}
                                {isUpgradeItem && (
                                  <p className="text-blue-400 text-[10px]">↑ nâng size miễn phí</p>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => adjustFood(item.id, -1)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded-lg bg-cinema-gray-light hover:bg-gray-600 disabled:opacity-30 flex items-center justify-center transition-colors"
                            >
                              <Minus size={12} className="text-white" />
                            </button>
                            <span className="w-6 text-center text-white font-bold text-sm">{qty}</span>
                            <button
                              onClick={() => adjustFood(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-cinema-red hover:bg-red-700 flex items-center justify-center transition-colors"
                            >
                              <Plus size={12} className="text-white" />
                            </button>
                          </div>
                        </div>
                        {/* Free size upgrade button — appears on Size M items */}
                        {canUpgrade && (
                          <button
                            onClick={() => handleSizeUpgrade(item)}
                            className="w-full mt-1 py-1 text-[10px] font-bold bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
                          >
                            ↑ Nâng size miễn phí
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Food subtotal */}
                {foodOrderList.length > 0 && (
                  <div className="mx-4 mb-4 px-4 py-3 bg-cinema-darker rounded-xl border border-cinema-gold/30">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm font-semibold">Tổng đồ ăn</span>
                      <span className="text-cinema-gold font-bold text-base">
                        {foodTotal > 0 ? foodTotal.toLocaleString('vi-VN') + 'đ' : 'Miễn phí 🎁'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {foodOrderList.map(i => (
                        <span key={i.id} className="text-xs bg-cinema-gray-light text-gray-300 px-2 py-0.5 rounded-full">
                          {i.name} ×{i.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Fixed bottom bar ─── */}
      <div className="fixed bottom-0 inset-x-0 bg-cinema-gray border-t border-cinema-gray-light shadow-[0_-4px_20px_rgba(0,0,0,0.4)] z-40">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3 sm:gap-6">
          {/* Seat type legend */}
          <div className="hidden sm:flex items-center gap-5 flex-1">
            <LegendSeat color="bg-[#c8cad0]" label="Ghế thường" />
            <LegendSeat color="bg-[#f5c842]" label="Ghế VIP" />
            <LegendSeat color="bg-pink-300"  label="Ghế đôi" />
          </div>

          {/* Total */}
          <div className="px-3 sm:px-6 sm:border-x border-cinema-gray-light text-center shrink-0 flex-1 sm:flex-none">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">Tổng tiền</p>
            <p className="font-black text-cinema-gold text-sm">
              {grandTotal > 0 ? grandTotal.toLocaleString('vi-VN') + ' vnđ' : '0 vnđ'}
            </p>
          </div>

          {/* Countdown */}
          <div className="text-center shrink-0">
            <p className="text-[10px] sm:text-xs text-gray-400 mb-0.5">Thời gian</p>
            <p className={`font-black text-xl sm:text-2xl tracking-tight leading-none ${
              timerRunning && timeLeft <= 60 ? 'text-red-400 animate-pulse' : 'text-white'
            }`}>
              {timerRunning ? fmtTimer(timeLeft) : '--:--'}
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

              {/* Food/drink summary in checkout */}
              {foodOrderList.length > 0 && (
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Đồ ăn & nước uống</p>
                  <div className="space-y-1.5">
                    {foodOrderList.map(item => {
                      const isFreeWater  = user?.membershipTier === 'PLATINUM' && item.name === 'Nước suối'
                      const isFreeCombo1 = user?.membershipTier === 'DIAMOND'  && item.name === 'Combo 1 người'
                      const isFree = isFreeWater || isFreeCombo1
                      const unitPrice = isFree ? 0 : discountedFoodPrice(item.price)
                      return (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name} ×{item.qty}
                            {isFree && <span className="ml-1 text-green-600 text-xs font-bold">🎁</span>}
                          </span>
                          <span className="font-semibold text-gray-800">
                            {isFree ? 'Miễn phí' : (unitPrice * item.qty).toLocaleString('vi-VN') + ' đ'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {tierFoodConfig.discount > 0 && (
                    <p className="text-xs text-green-600 mt-2 font-semibold">✓ Đã áp dụng ưu đãi hạng thành viên</p>
                  )}
                </div>
              )}

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
                <span className="text-[#1a3a6c] font-black text-xl">{grandTotal.toLocaleString('vi-VN')} đ</span>
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
                Sau khi thanh toán xong trên trang VNPay, bấm nút bên dưới để xác nhận.
              </p>
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                ⚠️ Chế độ TEST — bấm xác nhận để giả lập thanh toán thành công
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleVnpayTestConfirm}
                  disabled={vnpayConfirming}
                  className="block w-full py-3 bg-[#0066b2] hover:bg-[#004f8a] disabled:bg-gray-400 text-white font-black rounded-xl text-center text-sm transition-colors"
                >
                  {vnpayConfirming ? 'Đang xác nhận...' : '✅ Xác nhận đã thanh toán (Test)'}
                </button>
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
