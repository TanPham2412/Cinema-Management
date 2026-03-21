import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout, refreshUser } from '../redux/slices/authSlice'
import {
  Mail, Phone, Award, Ticket, LogOut, Crown, Clock,
  MapPin, CheckCircle, XCircle, AlertCircle, ChevronRight,
  Copy, Check, Star, ShoppingBag, X, ArrowLeft,
} from 'lucide-react'
import bookingService from '../services/bookingService'

const tierConfig = {
  BRONZE:   { label: 'Bronze',   color: 'text-amber-500',   bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   glow: 'shadow-amber-500/20',   icon: 'bronze', next: 'Silver',   nextPoints: 300,   prev: 0     },
  SILVER:   { label: 'Silver',   color: 'text-slate-300',   bg: 'bg-slate-300/15',   border: 'border-slate-300/40',   glow: 'shadow-slate-300/20',   icon: 'silver', next: 'Gold',     nextPoints: 1000,  prev: 300   },
  GOLD:     { label: 'Gold',     color: 'text-yellow-400',  bg: 'bg-yellow-400/15',  border: 'border-yellow-400/40',  glow: 'shadow-yellow-400/20',  icon: 'gold',   next: 'Platinum', nextPoints: 3000,  prev: 1000  },
  PLATINUM: { label: 'Platinum', color: 'text-cyan-400',    bg: 'bg-cyan-400/15',    border: 'border-cyan-400/40',    glow: 'shadow-cyan-400/20',    icon: 'plat',   next: 'Diamond',  nextPoints: 10000, prev: 3000  },
  DIAMOND:  { label: 'Diamond',  color: 'text-violet-400',  bg: 'bg-violet-400/15',  border: 'border-violet-400/40',  glow: 'shadow-violet-400/20',  icon: 'dia',    next: null,       nextPoints: null,  prev: 10000 },
}

const TIER_ICONS = { bronze: '\u{1F949}', silver: '\u{1F948}', gold: '\u{1F947}', plat: '\u{1F48E}', dia: '\u{1F451}' }

const statusConfig = {
  CONFIRMED: { label: '\u0110\u00e3 x\u00e1c nh\u1eadn',    icon: CheckCircle,  color: 'text-emerald-400', dot: 'bg-emerald-400' },
  PENDING:   { label: 'Ch\u1edd thanh to\u00e1n', icon: AlertCircle,  color: 'text-amber-400',   dot: 'bg-amber-400'   },
  CANCELLED: { label: '\u0110\u00e3 h\u1ee7y',         icon: XCircle,      color: 'text-red-400',     dot: 'bg-red-400'     },
  COMPLETED: { label: '\u0110\u00e3 check-in',    icon: CheckCircle,  color: 'text-blue-400',    dot: 'bg-blue-400'    },
  EXPIRED:   { label: 'H\u1ebft h\u1ea1n',        icon: XCircle,      color: 'text-gray-500',    dot: 'bg-gray-500'    },
}

const seatTypeLabel = { REGULAR: 'Th\u01b0\u1eddng', VIP: 'VIP', COUPLE: '\u0110\u00f4i' }
const seatTypeColor  = { REGULAR: 'text-gray-300', VIP: 'text-yellow-400', COUPLE: 'text-pink-400' }

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={handle} className="p-1 text-gray-500 hover:text-cinema-gold transition-colors rounded">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

function BookingListModal({ bookings, loading, onClose, onSelect }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f0f1a] rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div>
            <h2 className="text-white font-bold text-base">L\u1ecbch s\u1eed \u0111\u1eb7t v\u00e9</h2>
            <p className="text-gray-500 text-xs mt-0.5">{bookings.length} v\u00e9 \u0111\u00e3 \u0111\u1eb7t</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3">
              <div className="w-5 h-5 border-2 border-cinema-red border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500 text-sm">\u0110ang t\u1ea3i...</span>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Ticket className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">Ch\u01b0a c\u00f3 \u0111\u01a1n \u0111\u1eb7t v\u00e9 n\u00e0o</p>
            </div>
          ) : (
            <div className="py-1">
              {bookings.map(b => {
                const st = statusConfig[b.status] || statusConfig.PENDING
                return (
                  <button
                    key={b.id}
                    onClick={() => onSelect(b)}
                    className="w-full text-left px-5 py-3.5 flex items-center gap-4 hover:bg-white/4 transition-colors border-b border-white/4 last:border-0"
                  >
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{b.movieTitle}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-gray-500 text-xs">{b.date} \u00b7 {b.time}</span>
                        <span className="text-gray-700 text-[10px]">\u00b7</span>
                        <span className="text-gray-500 text-xs truncate">{b.cinemaName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-gray-600 text-xs">{b.seats?.length || 0} gh\u1ebf</span>
                        {b.pointsEarned > 0 && <span className="text-amber-500 text-xs font-medium">+{b.pointsEarned} \u0111i\u1ec3m</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-cinema-gold font-bold text-sm">{b.totalAmount?.toLocaleString('vi-VN')}\u0111</p>
                      <p className={`text-[11px] font-medium mt-0.5 ${st.color}`}>{st.label}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-700 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BookingDetailModal({ b, onClose, onBack }) {
  const st = statusConfig[b.status] || statusConfig.PENDING
  const StatusIcon = st.icon
  const hasCombos = b.combos && b.combos.length > 0

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f0f1a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8 shrink-0">
          <button onClick={onBack} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-bold text-base truncate">{b.movieTitle}</h2>
            <div className={`flex items-center gap-1.5 mt-0.5 text-xs font-medium ${st.color}`}>
              <StatusIcon className="w-3 h-3" />{st.label}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-center justify-between bg-white/4 rounded-2xl px-4 py-3.5 border border-white/8">
            <div>
              <p className="text-gray-500 text-[11px] uppercase tracking-wider font-medium">M\u00e3 \u0111\u1eb7t v\u00e9</p>
              <p className="text-cinema-gold font-mono font-black text-lg tracking-widest mt-0.5">{b.bookingCode}</p>
            </div>
            <CopyButton text={b.bookingCode} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/4 rounded-2xl p-4 border border-white/8">
              <p className="text-gray-600 text-[10px] uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />R\u1ea1p chi\u1ebfu
              </p>
              <p className="text-white font-bold text-sm">{b.cinemaName}</p>
              <p className="text-gray-500 text-xs mt-0.5">{b.screenName}</p>
            </div>
            <div className="bg-white/4 rounded-2xl p-4 border border-white/8">
              <p className="text-gray-600 text-[10px] uppercase tracking-wider font-medium mb-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />Su\u1ea5t chi\u1ebfu
              </p>
              <p className="text-white font-bold text-sm">{b.date}</p>
              <p className="text-gray-500 text-xs mt-0.5">{b.time}</p>
            </div>
          </div>
          <div className="bg-white/4 rounded-2xl p-4 border border-white/8">
            <p className="text-gray-600 text-[10px] uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
              <Ticket className="w-3 h-3" />Gh\u1ebf ng\u1ed3i \u00b7 {b.seats?.length || 0} v\u00e9
            </p>
            <div className="flex flex-wrap gap-2">
              {b.seats?.map(s => (
                <div key={s.seatId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/6 border border-white/10">
                  <span className="text-white font-black text-sm">{s.seatRow}{s.seatNumber}</span>
                  <span className={`text-[10px] font-semibold ${seatTypeColor[s.seatType] || 'text-gray-400'}`}>{seatTypeLabel[s.seatType] || s.seatType}</span>
                  <span className="text-gray-600 text-[10px]">\u00b7</span>
                  <span className="text-gray-400 text-[11px]">{s.price?.toLocaleString('vi-VN')}\u0111</span>
                </div>
              ))}
            </div>
          </div>
          {hasCombos && (
            <div className="bg-white/4 rounded-2xl p-4 border border-white/8">
              <p className="text-gray-600 text-[10px] uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
                <ShoppingBag className="w-3 h-3" />Combo
              </p>
              <div className="space-y-2">
                {b.combos.map((c, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">{c.comboName} <span className="text-gray-600">\u00d7{c.quantity}</span></span>
                    <span className="text-gray-400 font-medium">{(c.price * c.quantity)?.toLocaleString('vi-VN')}\u0111</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(b.pointsEarned > 0 || b.pointsUsed > 0) && (
            <div className="bg-amber-400/6 rounded-2xl p-4 border border-amber-400/15 flex items-center gap-6">
              {b.pointsEarned > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 stroke-none" />
                  <div>
                    <p className="text-amber-400 font-black text-xl leading-none">+{b.pointsEarned}</p>
                    <p className="text-gray-500 text-[11px] mt-0.5">\u0111i\u1ec3m nh\u1eadn \u0111\u01b0\u1ee3c</p>
                  </div>
                </div>
              )}
              {b.pointsUsed > 0 && (
                <div>
                  <p className="text-red-400 font-black text-xl leading-none">-{b.pointsUsed}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">\u0111i\u1ec3m \u0111\u00e3 d\u00f9ng</p>
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-gray-400 font-medium">T\u1ed5ng thanh to\u00e1n</span>
            <span className="text-cinema-gold font-black text-2xl">{b.totalAmount?.toLocaleString('vi-VN')}\u0111</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProfilePage = () => {
  const { user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)

  const handleLogout = () => { dispatch(logout()); navigate('/') }

  useEffect(() => { dispatch(refreshUser()).catch(() => {}) }, []) // eslint-disable-line
  useEffect(() => { if (!user) navigate('/login') }, [user]) // eslint-disable-line

  const openModal = () => {
    setShowModal(true)
    if (bookings.length === 0) {
      setLoadingBookings(true)
      bookingService.getUserBookings()
        .then(data => setBookings(Array.isArray(data) ? data : []))
        .catch(() => setBookings([]))
        .finally(() => setLoadingBookings(false))
    }
  }

  if (!user) return null

  const tier = tierConfig[user.membershipTier] || tierConfig.BRONZE
  const tierIcon = TIER_ICONS[tier.icon]
  const points = user.loyaltyPoints || 0
  const prevPoints = tier.prev || 0
  const progressPercent = tier.nextPoints
    ? Math.min(100, Math.round(((points - prevPoints) / (tier.nextPoints - prevPoints)) * 100))
    : 100
  const totalSpent = bookings.reduce((s, b) => s + (b.totalAmount || 0), 0)

  return (
    <div className="min-h-screen bg-[#0d0d15]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a1e] via-[#0d0d20] to-[#0d0d15]" />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(229,9,20,0.3), transparent)' }} />
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cinema-red to-[#8b0000] flex items-center justify-center shadow-2xl shadow-cinema-red/30 ring-4 ring-white/10">
                <span className="text-white text-4xl font-black select-none">{user.fullName?.charAt(0)?.toUpperCase()}</span>
              </div>
              <div className={`absolute -bottom-2 -right-2 text-xl w-8 h-8 rounded-lg flex items-center justify-center ${tier.bg} border ${tier.border} shadow-lg`}>
                {tierIcon}
              </div>
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-black text-white tracking-wide">{user.fullName}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${tier.bg} ${tier.color} ${tier.border}`}>
                  {tierIcon} {tier.label}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                  user.role === 'STAFF' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                  'bg-gray-500/20 text-gray-400 border-gray-500/40'
                }`}>
                  <Crown className="w-3 h-3" />
                  {user.role === 'ADMIN' ? 'Qu\u1ea3n tr\u1ecb vi\u00ean' : user.role === 'STAFF' ? 'Nh\u00e2n vi\u00ean' : 'Th\u00e0nh vi\u00ean'}
                </span>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <div className="text-center px-4 py-3 rounded-2xl bg-white/5 border border-white/8 min-w-[80px]">
                <p className="text-cinema-gold font-black text-2xl leading-tight">{points.toLocaleString()}</p>
                <p className="text-gray-500 text-[11px] mt-0.5 uppercase tracking-wider">\u0110i\u1ec3m t\u00edch l\u0169y</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-4">
            <div className="rounded-2xl bg-[#141420] border border-white/8 p-5 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Th\u00f4ng tin li\u00ean h\u1ec7</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-gray-300 text-sm break-all">{user.email}</span>
              </div>
              {user.phoneNumber ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{user.phoneNumber}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 opacity-40">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-gray-500 text-sm italic">Ch\u01b0a c\u1eadp nh\u1eadt S\u0110T</span>
                </div>
              )}
            </div>

            <button
              onClick={openModal}
              className="w-full rounded-2xl bg-[#141420] border border-white/8 p-5 text-left hover:border-cinema-red/40 hover:bg-cinema-red/5 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cinema-red/10 border border-cinema-red/20 flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-cinema-red" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">L\u1ecbch s\u1eed \u0111\u1eb7t v\u00e9</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {bookings.length > 0
                        ? `${bookings.length} v\u00e9 \u00b7 ${totalSpent >= 1000000 ? `${(totalSpent / 1000000).toFixed(1)}M` : totalSpent.toLocaleString('vi-VN')}\u0111`
                        : 'Xem t\u1ea5t c\u1ea3 v\u00e9 \u0111\u00e3 \u0111\u1eb7t'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cinema-red group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#141420] border border-white/8 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40 transition-all text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" /> \u0110\u0103ng xu\u1ea5t
            </button>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl bg-[#141420] border border-white/8 p-5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5 blur-3xl"
                style={{ background: 'radial-gradient(circle, #e5c100, transparent)', transform: 'translate(30%, -30%)' }} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4 text-cinema-gold" /> \u0110i\u1ec3m th\u00e0nh vi\u00ean
                </h3>
                {tier.nextPoints && (
                  <span className="text-xs text-gray-500">
                    C\u1ea7n <span className="text-white font-bold">{(tier.nextPoints - points).toLocaleString()}</span> \u0111i\u1ec3m \u2192 {tier.next}
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-black text-cinema-gold leading-none">{points.toLocaleString()}</span>
                <span className="text-gray-500 text-sm">\u0111i\u1ec3m</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-cinema-red via-orange-500 to-cinema-gold rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.entries(tierConfig).map(([key, t]) => {
                  const isActive = user.membershipTier === key
                  const isPast = Object.keys(tierConfig).indexOf(key) < Object.keys(tierConfig).indexOf(user.membershipTier)
                  const icon = TIER_ICONS[t.icon]
                  return (
                    <div key={key} className={`rounded-xl p-2 text-center border transition-all ${
                      isActive ? `${t.bg} ${t.border} shadow-lg ${t.glow}` :
                      isPast   ? 'bg-white/5 border-white/10 opacity-60' :
                                 'bg-white/3 border-white/5 opacity-40'
                    }`}>
                      <div className="text-base mb-0.5">{icon}</div>
                      <div className={`text-[10px] font-bold ${isActive ? t.color : isPast ? 'text-gray-400' : 'text-gray-600'}`}>{t.label}</div>
                      <div className="text-[9px] text-gray-600 mt-0.5">
                        {key === 'BRONZE' ? '0' : key === 'SILVER' ? '300' : key === 'GOLD' ? '1K' : key === 'PLATINUM' ? '3K' : '10K'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && !selectedBooking && (
        <BookingListModal
          bookings={bookings}
          loading={loadingBookings}
          onClose={() => setShowModal(false)}
          onSelect={b => setSelectedBooking(b)}
        />
      )}

      {selectedBooking && (
        <BookingDetailModal
          b={selectedBooking}
          onClose={() => { setSelectedBooking(null); setShowModal(false) }}
          onBack={() => setSelectedBooking(null)}
        />
      )}
    </div>
  )
}

export default ProfilePage