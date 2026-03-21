import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  Minus, Plus, CheckCircle, Tag, Clock, Building2, Calendar,
  Star, ShoppingBag, CreditCard, User, Phone, Mail, Film, ChevronRight, Ticket,
} from 'lucide-react'
import bookingService from '../services/bookingService'
import comboService from '../services/comboService'
import { refreshUser } from '../redux/slices/authSlice'
import toast from 'react-hot-toast'

// ── VNPay SVG logo ────────────────────────────────────────────────────────────
function VNPayLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vnp2" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0e4da4"/><stop offset="1" stopColor="#0a3580"/>
        </linearGradient>
      </defs>
      <rect width="52" height="52" rx="10" fill="url(#vnp2)"/>
      <rect x="6" y="29" width="40" height="3" rx="1.5" fill="#e8381a"/>
      <text x="26" y="24" fontFamily="Arial Black,Arial,sans-serif" fontSize="15" fontWeight="900" fill="white" textAnchor="middle" dominantBaseline="middle">VN</text>
      <text x="26" y="39" fontFamily="Arial,sans-serif" fontSize="9" fontWeight="700" fill="#ffd700" textAnchor="middle" dominantBaseline="middle" letterSpacing="2">PAY</text>
    </svg>
  )
}

// ── MoMo SVG logo ─────────────────────────────────────────────────────────────
function MoMoLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="momo2" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#aa0060"/><stop offset="1" stopColor="#7a004a"/>
        </linearGradient>
      </defs>
      <rect width="52" height="52" rx="10" fill="url(#momo2)"/>
      <circle cx="26" cy="21" r="9" fill="none" stroke="white" strokeWidth="2.5"/>
      <circle cx="26" cy="21" r="4" fill="white"/>
      <text x="26" y="40" fontFamily="Arial Black,Arial,sans-serif" fontSize="11" fontWeight="900" fill="white" textAnchor="middle" dominantBaseline="middle" letterSpacing="1">MoMo</text>
    </svg>
  )
}

// ── All Vietnamese UI strings (unicode escapes, no JSX text) ─────────────────
const S = {
  home:           'Trang ch\u1ee7',
  bookingBread:   '\u0110\u1eb7t v\u00e9',
  payInfo:        'TH\u00d4NG TIN THANH TO\u00c1N',
  comboSection:   'COMBO \u01afU \u0110\u00c3I',
  payMethodSec:   'PH\u01af\u01a0NG TH\u1ee8C THANH TO\u00c1N',
  fullNameLabel:  'H\u1ecd T\u00ean:',
  phoneLabel:     'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i:',
  emailLabel:     'Email:',
  comboNameCol:   'T\u00ean Combo',
  comboDescCol:   'M\u00f4 t\u1ea3',
  comboQtyCol:    'S\u1ed1 l\u01b0\u1ee3ng',
  genreLabel:     'Th\u1ec3 lo\u1ea1i',
  durationLabel:  'Th\u1eddi l\u01b0\u1ee3ng',
  minuteUnit:     'ph\u00fat',
  cinemaLabel:    'R\u1ea1p chi\u1ebfu',
  dateLabel:      'Ng\u00e0y chi\u1ebfu',
  timeLabel:      'Gi\u1edd chi\u1ebfu',
  seatLabel:      'Gh\u1ebf ng\u1ed3i',
  backBtn:        'QUAY L\u1ea0I',
  continueBtn:    'TI\u1ebeP T\u1ee4C',
  seatVip:        'GH\u1ebe VIP',
  seatRegular:    'GH\u1ebe TH\u01af\u1edcNG',
  seatCouple:     'GH\u1ebe \u0110\u00d4I',
  seatSubtotal:   'T\u1ea1m t\u00ednh gh\u1ebf',
  comboSubtotal:  'T\u1ea1m t\u00ednh combo',
  totalLabel:     'T\u1ed4ng ti\u1ec1n',
  tickets:        'v\u00e9',
  vnpayDesc:      'ATM, Visa, Mastercard, QR',
  momoDesc:       'V\u00ed \u0111i\u1ec7n t\u1eed MoMo',
  processing:     '\u0110ang x\u1eed l\u00fd...',
  failMsg:        '\u0110\u1eb7t v\u00e9 th\u1ea5t b\u1ea1i, vui l\u00f2ng th\u1eed l\u1ea1i.',
  successTitle:   '\u0110\u1eb6T V\u00c9 TH\u00c0NH C\u00d4NG!',
  successSub:     'C\u1ea3m \u01a1n b\u1ea1n \u0111\u00e3 \u0111\u1eb7t v\u00e9 t\u1ea1i LLMCinema',
  bookingCode:    'M\u00e3 \u0111\u1eb7t v\u00e9',
  movieLabel:     'Phim',
  cinemaShort:    'R\u1ea1p',
  screenDateShort:'Ng\u00e0y chi\u1ebfu',
  seatsShort:     'Gh\u1ebf',
  viewHistory:    'XEM L\u1ecaCH S\u1eed \u0110\u1eb6T V\u00c9',
  homeBtn:        'V\u1ec0 TRANG CH\u1ee6',
  noteContent:    'Vui l\u00f2ng \u0111\u1ebfn tr\u01b0\u1edbc gi\u1edd chi\u1ebfu 15 ph\u00fat. Mang theo m\u00e3',
  pointsRec:      'B\u1ea1n nh\u1eadn \u0111\u01b0\u1ee3c',
  pointsLabel:    '\u0111i\u1ec3m t\u00edch l\u0169y',
  noBooking:      'Kh\u00f4ng t\u00ecm th\u1ea5y th\u00f4ng tin \u0111\u1eb7t v\u00e9.',
  homeLink:       'V\u1ec1 trang ch\u1ee7',
  ageWarnText:    'Theo quy \u0111\u1ecbnh c\u1ee7a c\u1ee5c \u0111i\u1ec7n \u1ea3nh, phim n\u00e0y kh\u00f4ng d\u00e0nh cho kh\u00e1n gi\u1ea3 d\u01b0\u1edbi 13 tu\u1ed5i.',
  noCombo:        'Ch\u01b0a c\u00f3 combo n\u00e0o.',
  dot:            '\u00b7',
  vnDong:         'vn\u0111',
  dash:           '\u2014',
}

const PAYMENT_METHODS = [
  { value: 'VNPAY', label: 'VNPay', Logo: VNPayLogo, descKey: 'vnpayDesc' },
  { value: 'MOMO',  label: 'MoMo',  Logo: MoMoLogo,  descKey: 'momoDesc'  },
]

const SEAT_KEY = { REGULAR: 'seatRegular', VIP: 'seatVip', COUPLE: 'seatCouple' }

// ── Section card header ────────────────────────────────────────────────────────
function SectionHead({ Icon, label }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-b border-gray-200">
      <div className="w-8 h-8 rounded-full border border-gray-300 bg-white flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <h2 className="text-sm font-black uppercase tracking-wider text-[#1d3461]">{label}</h2>
    </div>
  )
}

// ── Sidebar info row ──────────────────────────────────────────────────────────
function SideRow({ Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between text-sm py-1.5">
      <span className="flex items-center gap-1.5 text-gray-500 shrink-0">
        <Icon className="w-3.5 h-3.5 shrink-0" />{label}
      </span>
      <span className="text-[#1d3461] font-semibold text-right ml-3 leading-snug">{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
const BookingConfirmPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const preBooking = location.state?.preBooking

  const [combos, setCombos] = useState([])
  const [selectedCombos, setSelectedCombos] = useState({})
  const [paymentMethod, setPaymentMethod] = useState('VNPAY')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    comboService.getAvailableCombos().then(setCombos).catch(() => {})
  }, [])

  if (!preBooking) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-700 text-lg">{S.noBooking}</p>
        <Link to="/" className="text-blue-600 underline">{S.homeLink}</Link>
      </div>
    )
  }

  const { seats = [], screeningInfo = {} } = preBooking

  const seatPrice = (seat) => {
    const base = screeningInfo?.basePrice || 90000
    if (seat.seatType === 'VIP') return base + 30000
    if (seat.seatType === 'COUPLE') return base + 50000
    return base
  }

  // Group seats by type for compact display
  const seatGroupMap = {}
  seats.forEach(seat => {
    const type = seat.seatType
    const price = seatPrice(seat)
    if (!seatGroupMap[type]) seatGroupMap[type] = { type, count: 0, price }
    seatGroupMap[type].count++
  })
  const seatGroups = Object.values(seatGroupMap)

  const seatTotal = seatGroups.reduce((s, g) => s + g.count * g.price, 0)
  const comboTotal = Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
    const combo = combos.find((c) => c.id === Number(id))
    return sum + (combo ? combo.price * qty : 0)
  }, 0)
  const grandTotal = seatTotal + comboTotal

  const changeComboQty = (comboId, delta) => {
    setSelectedCombos((prev) => {
      const cur = prev[comboId] || 0
      const next = Math.max(0, cur + delta)
      if (next === 0) { const { [comboId]: _, ...rest } = prev; return rest }
      return { ...prev, [comboId]: next }
    })
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      const result = await bookingService.createBooking({
        screeningId: preBooking.screeningId,
        seatIds: seats.map((s) => s.id),
        combos: Object.entries(selectedCombos)
          .filter(([, qty]) => qty > 0)
          .map(([id, qty]) => ({ comboId: Number(id), quantity: qty })),
        paymentMethod,
      })
      if (paymentMethod === 'VNPAY') {
        const { paymentUrl } = await bookingService.createVNPayUrl(result.bookingCode)
        window.location.href = paymentUrl
      } else if (paymentMethod === 'MOMO') {
        const { paymentUrl } = await bookingService.createMoMoUrl(result.bookingCode)
        window.location.href = paymentUrl
      } else {
        dispatch(refreshUser()).catch(() => {})
        setSuccess({ ...result, movieTitle: screeningInfo?.movieTitle, cinemaName: screeningInfo?.cinemaName, screenName: screeningInfo?.screenName, date: screeningInfo?.date, time: screeningInfo?.time })
      }
    } catch (e) {
      toast.error(e.response?.data?.message || S.failMsg)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-green-500 px-6 py-8 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-9 h-9 text-white" strokeWidth={2}/>
            </div>
            <h1 className="text-white font-black text-2xl tracking-wide">{S.successTitle}</h1>
            <p className="text-green-100 text-sm">{S.successSub}</p>
          </div>
          <div className="px-6 py-4 border-b border-gray-100">
            <p className="text-gray-400 text-xs uppercase tracking-widest font-medium">{S.bookingCode}</p>
            <p className="text-gray-800 font-mono font-black text-2xl tracking-widest mt-1">{success.bookingCode}</p>
          </div>
          <div className="px-6 py-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{S.movieLabel}</span><span className="font-semibold text-gray-800 max-w-[55%] text-right">{success.movieTitle}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{S.cinemaShort}</span><span className="font-semibold text-gray-800">{success.cinemaName} {S.dot} {success.screenName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{S.screenDateShort}</span><span className="font-semibold text-gray-800">{success.date} {success.time}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{S.seatsShort}</span><span className="font-semibold text-gray-800">{seats.map(s=>`${s.seatRow}${s.seatNumber}`).join(', ')}</span></div>
          </div>
          {success.pointsEarned > 0 && (
            <div className="mx-5 mb-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 stroke-none shrink-0"/>
              <p className="text-sm text-amber-700">{S.pointsRec} <strong className="text-amber-600">{success.pointsEarned} {S.pointsLabel}</strong></p>
            </div>
          )}
          <div className="px-6 py-3 flex justify-between border-t border-gray-100">
            <span className="text-gray-600 font-medium">{S.totalLabel}</span>
            <span className="text-green-600 font-black text-xl">{grandTotal.toLocaleString('vi-VN')} {S.vnDong}</span>
          </div>
          <div className="mx-5 mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-600 leading-relaxed">{S.noteContent} <strong>{success.bookingCode}</strong>.</p>
          </div>
          <div className="px-5 pb-6 flex flex-col gap-2.5">
            <button onClick={() => navigate('/profile')} className="w-full py-3 bg-[#1d3461] hover:bg-[#162a4e] text-white font-black rounded-xl tracking-wide transition-colors">{S.viewHistory}</button>
            <button onClick={() => navigate('/')} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl tracking-wide transition-colors">{S.homeBtn}</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Poster URL helper ──────────────────────────────────────────────────────
  const posterSrc = screeningInfo?.posterUrl
    ? (screeningInfo.posterUrl.startsWith('/api') ? screeningInfo.posterUrl : `/api${screeningInfo.posterUrl}`)
    : null

  const seatIdentifiers = seats.map(s => `${s.seatRow}${s.seatNumber}`).join(', ')
  const ageRating = screeningInfo?.ageRating
  const showAgeWarning = ageRating && /\d/.test(ageRating)

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      {/* ── Top breadcrumb bar ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-1.5 text-sm flex-wrap">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <Link to="/" className="text-[#1a6bdd] hover:underline">{S.home}</Link>
          <ChevronRight className="w-3 h-3 text-gray-400"/>
          <Link to="/" className="text-[#1a6bdd] hover:underline">{S.bookingBread}</Link>
          <ChevronRight className="w-3 h-3 text-gray-400"/>
          <span className="text-gray-600 truncate max-w-xs">{screeningInfo?.movieTitle}</span>
        </div>
      </div>

      {/* ── Page body ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-5">

        {/* Age warning */}
        {showAgeWarning && (
          <div className="mb-4 bg-amber-50 border border-amber-300 rounded-xl px-5 py-3 text-center">
            <p className="text-red-500 font-semibold text-sm">{S.ageWarnText}</p>
          </div>
        )}

        <div className="flex gap-5 items-start">

          {/* ────────── LEFT COLUMN ──────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ── Payment info card ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHead Icon={User} label={S.payInfo} />

              {user && (
                <div className="grid grid-cols-3 gap-x-6 gap-y-1 px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-gray-400 text-xs">{S.fullNameLabel}</p>
                    <p className="text-gray-700 font-semibold text-sm mt-0.5">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">{S.phoneLabel}</p>
                    <p className="text-gray-700 font-semibold text-sm mt-0.5">{user.phoneNumber || S.dash}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">{S.emailLabel}</p>
                    <p className="text-gray-700 font-semibold text-sm mt-0.5 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Seat rows grouped by type */}
              {seatGroups.map(({ type, count, price }) => (
                <div key={type} className="flex items-center px-5 py-3 border-b border-gray-100 last:border-0">
                  <span className="flex-1 font-bold text-gray-700 text-sm">{S[SEAT_KEY[type]] || S.seatRegular}</span>
                  <span className="text-gray-500 text-sm text-right">
                    {count} x {price.toLocaleString('vi-VN')}
                  </span>
                  <span className="ml-8 font-bold text-gray-800 text-sm text-right w-32 shrink-0">
                    {'= '}{(count * price).toLocaleString('vi-VN')} {S.vnDong}
                  </span>
                </div>
              ))}

              {/* Seat subtotal */}
              <div className="flex justify-between items-center px-5 py-3 bg-gray-50">
                <span className="text-gray-500 text-sm">{S.seatSubtotal} ({seats.length} {S.tickets})</span>
                <span className="font-bold text-gray-800 text-sm">{seatTotal.toLocaleString('vi-VN')} {S.vnDong}</span>
              </div>
            </div>

            {/* ── Combo card ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHead Icon={ShoppingBag} label={S.comboSection} />

              {combos.length === 0 ? (
                <div className="py-10 text-center text-gray-400">{S.noCombo}</div>
              ) : (
                <>
                  {/* Table header */}
                  <div className="hidden md:grid md:grid-cols-[90px_1fr_2fr_130px] items-center px-5 py-2 bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500 tracking-wider">
                    <div />
                    <div>{S.comboNameCol}</div>
                    <div>{S.comboDescCol}</div>
                    <div className="text-center">{S.comboQtyCol}</div>
                  </div>

                  {combos.map((combo, idx) => {
                    const qty = selectedCombos[combo.id] || 0
                    return (
                      <div
                        key={combo.id}
                        className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 last:border-0 ${idx % 2 === 1 ? 'bg-gray-50/40' : ''}`}
                      >
                        {/* Image */}
                        <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center text-2xl">
                          {combo.imageUrl
                            ? <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover"/>
                            : '\uD83C\uDF7F'
                          }
                        </div>

                        {/* Name + price */}
                        <div className="w-36 shrink-0">
                          <p className="font-bold text-gray-800 text-sm leading-tight">{combo.name}</p>
                          <p className="text-red-500 font-bold text-sm mt-1">{combo.price.toLocaleString('vi-VN')} {S.vnDong}</p>
                        </div>

                        {/* Description */}
                        <div className="flex-1 hidden md:block">
                          <p className="text-amber-600 text-sm leading-relaxed line-clamp-3">{combo.description}</p>
                        </div>

                        {/* Qty controls: [count] [+] [—] */}
                        <div className="shrink-0 flex items-center gap-1.5 ml-auto">
                          <span className="w-8 text-center font-bold text-gray-700 text-sm">{qty}</span>
                          <button
                            onClick={() => changeComboQty(combo.id, 1)}
                            className="w-8 h-8 bg-[#1d3461] hover:bg-[#162a4e] text-white rounded flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-4 h-4"/>
                          </button>
                          <button
                            onClick={() => changeComboQty(combo.id, -1)}
                            disabled={qty === 0}
                            className="w-8 h-8 border border-gray-300 text-gray-500 hover:bg-gray-100 disabled:opacity-30 rounded flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-4 h-4"/>
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {comboTotal > 0 && (
                    <div className="flex justify-between items-center px-5 py-3 bg-orange-50 border-t border-orange-100">
                      <span className="text-orange-600 text-sm font-medium">{S.comboSubtotal}</span>
                      <span className="text-orange-600 font-bold text-sm">{comboTotal.toLocaleString('vi-VN')} {S.vnDong}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Payment method card ─────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <SectionHead Icon={CreditCard} label={S.payMethodSec} />
              <div className="px-5 py-4 grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((pm) => {
                  const active = paymentMethod === pm.value
                  return (
                    <button
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                        active ? 'border-[#1d3461] bg-[#1d3461]/5' : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <pm.Logo size={40}/>
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${active ? 'text-[#1d3461]' : 'text-gray-700'}`}>{pm.label}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{S[pm.descKey]}</p>
                      </div>
                      {active && <CheckCircle className="w-5 h-5 text-[#1d3461] shrink-0"/>}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>

          {/* ────────── RIGHT SIDEBAR ────────────────────────────────── */}
          <div className="w-72 shrink-0 hidden lg:block">
            <div className="sticky top-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Movie poster */}
                <div className="w-full overflow-hidden bg-gray-200" style={{aspectRatio:'16/9'}}>
                  {posterSrc
                    ? <img src={posterSrc} alt={screeningInfo?.movieTitle} className="w-full h-full object-cover"/>
                    : <div className="w-full h-full flex items-center justify-center bg-gray-200"><Film className="w-12 h-12 text-gray-400"/></div>
                  }
                </div>

                {/* Movie title + format */}
                <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                  <h3 className="font-black text-[#1d3461] text-base leading-tight">{screeningInfo?.movieTitle}</h3>
                  {screeningInfo?.format && <p className="text-gray-500 text-sm mt-1">{screeningInfo.format}</p>}
                </div>

                {/* Genre + Duration */}
                {(screeningInfo?.genres || screeningInfo?.duration) && (
                  <div className="px-4 py-3 border-b border-gray-100 space-y-1">
                    <SideRow Icon={Tag}   label={S.genreLabel}    value={screeningInfo?.genres} />
                    <SideRow Icon={Clock} label={S.durationLabel} value={screeningInfo?.duration ? `${screeningInfo.duration} ${S.minuteUnit}` : null} />
                  </div>
                )}

                {/* Screening info */}
                <div className="px-4 py-3 border-b border-gray-100 space-y-1">
                  <SideRow Icon={Building2} label={S.cinemaLabel} value={screeningInfo?.cinemaName} />
                  <SideRow Icon={Calendar}  label={S.dateLabel}   value={screeningInfo?.date} />
                  <SideRow Icon={Clock}     label={S.timeLabel}   value={screeningInfo?.time} />
                  <SideRow Icon={Ticket}    label={S.seatLabel}   value={seatIdentifiers} />
                </div>

                {/* Total + action buttons */}
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-gray-500 text-sm font-medium">{S.totalLabel}</span>
                  <span className="text-[#1d3461] font-black text-lg">{grandTotal.toLocaleString('vi-VN')}{'\u0111'}</span>
                </div>

                <div className="px-4 py-4 flex gap-2">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex-1 py-2.5 border-2 border-gray-300 text-gray-600 font-black text-xs rounded-lg hover:bg-gray-100 transition-colors tracking-wider"
                  >
                    {S.backBtn}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-[2] py-2.5 bg-[#1d3461] hover:bg-[#162a4e] disabled:bg-gray-400 text-white font-black text-xs rounded-lg transition-colors tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {submitting
                      ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{' '}{S.processing}</>
                      : S.continueBtn
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Mobile bottom bar ────────────────────────────────────────── */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex gap-3 z-30">
          <button onClick={() => navigate(-1)} className="flex-1 py-3 border-2 border-gray-300 text-gray-600 font-black text-sm rounded-xl hover:bg-gray-100 transition-colors tracking-wider">
            {S.backBtn}
          </button>
          <button onClick={handleConfirm} disabled={submitting}
            className="flex-[2] py-3 bg-[#1d3461] hover:bg-[#162a4e] disabled:bg-gray-400 text-white font-black text-sm rounded-xl transition-colors tracking-wider flex items-center justify-center gap-2">
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>{' '}{S.processing}</>
              : S.continueBtn
            }
          </button>
        </div>

      </div>
    </div>
  )
}

export default BookingConfirmPage