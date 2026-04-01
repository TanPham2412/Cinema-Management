import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout, setCredentials } from '../redux/slices/authSlice'
import { User, Mail, Phone, Star, Award, Ticket, LogOut, Crown, Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, X, Copy, Edit2, ShieldCheck, ShieldOff, QrCode } from 'lucide-react'
import bookingService from '../services/bookingService'
import api from '../services/api'
import toast from 'react-hot-toast'

const tierConfig = {
  BRONZE:   { label: 'Bronze',   color: 'text-amber-600',  bg: 'bg-amber-600/20',  border: 'border-amber-600',  icon: '🥉', next: 'Silver',   nextPoints: 300   },
  SILVER:   { label: 'Silver',   color: 'text-gray-300',   bg: 'bg-gray-300/20',   border: 'border-gray-300',   icon: '🥈', next: 'Gold',     nextPoints: 1000  },
  GOLD:     { label: 'Gold',     color: 'text-yellow-400', bg: 'bg-yellow-400/20', border: 'border-yellow-400', icon: '🥇', next: 'Platinum', nextPoints: 3000  },
  PLATINUM: { label: 'Platinum', color: 'text-cyan-400',   bg: 'bg-cyan-400/20',   border: 'border-cyan-400',   icon: '💎', next: 'Diamond',  nextPoints: 10000 },
  DIAMOND:  { label: 'Diamond',  color: 'text-purple-400', bg: 'bg-purple-400/20', border: 'border-purple-400', icon: '👑', next: null,       nextPoints: null  },
}

const statusConfig = {
  CONFIRMED: { label: 'Đã xác nhận', icon: CheckCircle, color: 'text-green-400' },
  PENDING:   { label: 'Chờ thanh toán', icon: AlertCircle, color: 'text-yellow-400' },
  CANCELLED: { label: 'Đã hủy',     icon: XCircle,     color: 'text-red-400'   },
  COMPLETED: { label: 'Đã check-in',icon: CheckCircle, color: 'text-blue-400'  },
  EXPIRED:   { label: 'Hết hạn',    icon: XCircle,     color: 'text-gray-500'  },
}

const ProfilePage = () => {
  const { user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [copied, setCopied] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [freshUser, setFreshUser] = useState(null)
  const PAGE_SIZE = 5

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', phoneNumber: '' })
  const [editSaving, setEditSaving] = useState(false)

  // 2FA state
  const [twoFaSetupOpen, setTwoFaSetupOpen] = useState(false)
  const [twoFaQr, setTwoFaQr] = useState(null)    // { qrUri, secret }
  const [twoFaCode, setTwoFaCode] = useState('')
  const [twoFaLoading, setTwoFaLoading] = useState(false)
  const [twoFaStep, setTwoFaStep] = useState('scan')  // 'scan' | 'verify'
  const [disableTwoFaOpen, setDisableTwoFaOpen] = useState(false)
  const [disableCode, setDisableCode] = useState('')

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    bookingService.getUserBookings()
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false))
    // Fetch fresh user profile — also syncs role if it was changed by admin
    api.get('/auth/me').then(async res => {
      const fresh = res.data
      setFreshUser(fresh)
      // If role differs (e.g. admin changed role since last login), refresh token
      if (user.role && fresh.role && fresh.role !== user.role) {
        try {
          const refreshRes = await api.post('/auth/refresh')
          dispatch(setCredentials({ user: refreshRes.data.user, token: refreshRes.data.token }))
          // Redirect to correct dashboard
          if (fresh.role === 'ADMIN') navigate('/admin')
          else if (fresh.role === 'STAFF') navigate('/staff')
        } catch {}
      }
    }).catch(() => {})
  }, [user])

  if (!user) return null

  const displayUser = freshUser || user
  const tier = tierConfig[displayUser.membershipTier] || tierConfig.BRONZE
  const points = displayUser.loyaltyPoints || 0
  const progressPercent = tier.nextPoints
    ? Math.min(100, Math.round((points / tier.nextPoints) * 100))
    : 100

  // Edit profile handlers
  const openEdit = () => {
    setEditForm({ fullName: displayUser.fullName || '', phoneNumber: displayUser.phoneNumber || '' })
    setEditOpen(true)
  }
  const saveEdit = async () => {
    if (!editForm.fullName.trim()) { toast.error('Họ tên không được để trống'); return }
    setEditSaving(true)
    try {
      const res = await api.put('/auth/me', editForm)
      setFreshUser(prev => ({ ...prev, ...res.data }))
      setEditOpen(false)
      toast.success('Cập nhật thông tin thành công!')
    } catch {
      toast.error('Cập nhật thất bại. Vui lòng thử lại.')
    } finally {
      setEditSaving(false)
    }
  }

  // 2FA handlers
  const startTwoFaSetup = async () => {
    setTwoFaLoading(true)
    try {
      const res = await api.post('/auth/2fa/setup')
      setTwoFaQr(res.data)
      setTwoFaStep('scan')
      setTwoFaCode('')
      setTwoFaSetupOpen(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể khởi tạo 2FA')
    } finally {
      setTwoFaLoading(false)
    }
  }
  const enableTwoFa = async () => {
    if (twoFaCode.length !== 6) { toast.error('Nhập đủ 6 chữ số'); return }
    setTwoFaLoading(true)
    try {
      await api.post('/auth/2fa/enable', { code: twoFaCode })
      setFreshUser(prev => ({ ...prev, twoFactorEnabled: true }))
      setTwoFaSetupOpen(false)
      toast.success('Xác thực 2 lớp đã được kích hoạt!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã không đúng')
    } finally {
      setTwoFaLoading(false)
    }
  }
  const disableTwoFa = async () => {
    if (disableCode.length !== 6) { toast.error('Nhập đủ 6 chữ số'); return }
    setTwoFaLoading(true)
    try {
      await api.post('/auth/2fa/disable', { code: disableCode })
      setFreshUser(prev => ({ ...prev, twoFactorEnabled: false }))
      setDisableTwoFaOpen(false)
      setDisableCode('')
      toast.success('Xác thực 2 lớp đã được tắt')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã không đúng')
    } finally {
      setTwoFaLoading(false)
    }
  }
  const twoFactorEnabled = displayUser.twoFactorEnabled === true

  return (
    <>
    <div className="min-h-screen bg-cinema-darker py-6 sm:py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Trang cá nhân</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: User Info */}
          <div className="space-y-4">
            <div className="bg-cinema-gray rounded-xl p-6 border border-cinema-gray-light text-center">
              <div className="w-20 h-20 bg-cinema-red rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">
                  {displayUser.fullName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{displayUser.fullName}</h2>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${tier.bg} ${tier.color} border ${tier.border}`}>
                {tier.icon} {tier.label}
              </span>
              <div className={`inline-flex items-center gap-1 ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                displayUser.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500' :
                displayUser.role === 'STAFF' ? 'bg-blue-500/20 text-blue-400 border border-blue-500' :
                'bg-gray-500/20 text-gray-400 border border-gray-500'
              }`}>
                <Crown className="w-3 h-3" />
                {displayUser.role === 'ADMIN' ? 'Quản trị viên' : displayUser.role === 'STAFF' ? 'Nhân viên' : 'Thành viên'}
              </div>
            </div>

            <div className="bg-cinema-gray rounded-xl p-5 border border-cinema-gray-light space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-cinema-red" /> Thông tin liên hệ
                </h3>
                <button onClick={openEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-cinema-gray-light transition-colors" title="Chỉnh sửa">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-300 text-sm">{displayUser.email}</span>
              </div>
              {displayUser.phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-300 text-sm">{displayUser.phoneNumber}</span>
                </div>
              )}
            </div>

            {/* 2FA Section */}
            <div className="bg-cinema-gray rounded-xl p-5 border border-cinema-gray-light space-y-3">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cinema-red" /> Bảo mật
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-300">Xác thực 2 lớp</div>
                  <div className={`text-xs mt-0.5 ${twoFactorEnabled ? 'text-green-400' : 'text-gray-500'}`}>
                    {twoFactorEnabled ? '✓ Đã kích hoạt' : 'Chưa kích hoạt'}
                  </div>
                </div>
                {twoFactorEnabled ? (
                  <button onClick={() => { setDisableCode(''); setDisableTwoFaOpen(true) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors">
                    Tắt 2FA
                  </button>
                ) : (
                  <button onClick={startTwoFaSetup} disabled={twoFaLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50">
                    {twoFaLoading ? '...' : 'Bật 2FA'}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-cinema-gray border border-cinema-gray-light text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>

          {/* Right: Loyalty + Bookings */}
          <div className="lg:col-span-2 space-y-4">
            {/* Loyalty Points */}
            <div className="bg-cinema-gray rounded-xl p-6 border border-cinema-gray-light">
              <h3 className="font-semibold text-white flex items-center gap-2 mb-5">
                <Award className="w-5 h-5 text-cinema-gold" /> Điểm thành viên
              </h3>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <span className="text-4xl font-bold text-cinema-gold">{points.toLocaleString()}</span>
                  <span className="text-gray-400 ml-2">điểm</span>
                </div>
                {tier.nextPoints && (
                  <span className="text-gray-400 text-sm">Cần thêm <strong className="text-white">{(tier.nextPoints - points).toLocaleString()}</strong> điểm để lên {tier.next}</span>
                )}
              </div>
              <div className="w-full bg-cinema-gray-lighter rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cinema-red to-cinema-gold rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-5">
                {Object.entries(tierConfig).map(([key, t]) => (
                  <div key={key} className={`text-center p-2 rounded-lg border ${displayUser.membershipTier === key ? `${t.bg} ${t.border}` : 'border-cinema-gray-light'}`}>
                    <div className="text-lg">{t.icon}</div>
                    <div className={`text-[10px] font-semibold ${displayUser.membershipTier === key ? t.color : 'text-gray-500'}`}>{t.label}</div>
                    <div className="text-[9px] text-gray-600">{key === 'BRONZE' ? '0' : key === 'SILVER' ? '300' : key === 'GOLD' ? '1K' : key === 'PLATINUM' ? '3K' : '10K'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking History */}
            <div className="bg-cinema-gray rounded-xl p-6 border border-cinema-gray-light">
              <h3 className="font-semibold text-white flex items-center gap-2 mb-5">
                <Ticket className="w-5 h-5 text-cinema-red" /> Lịch sử đặt vé
              </h3>

              {loadingBookings ? (
                <div className="text-center py-8 text-gray-400">Đang tải...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-cinema-gray-light rounded-xl">
                  <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-1">Chưa có đơn đặt vé nào</p>
                  <p className="text-gray-500 text-sm">Đặt vé ngay để xem lịch sử tại đây</p>
                </div>
              ) : (() => {
                const totalPages = Math.ceil(bookings.length / PAGE_SIZE)
                const paginated = bookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                return (
                  <>
                    <div className="space-y-3">
                      {paginated.map(b => {
                        const st = statusConfig[b.status] || statusConfig.PENDING
                        const StatusIcon = st.icon
                        const seatLabel = b.seats?.map(s => `${s.seatRow}${s.seatNumber}`).join(', ') || '—'
                        return (
                          <div key={b.id} onClick={() => setSelectedBooking(b)} className="bg-cinema-darker rounded-xl p-4 border border-cinema-gray-light hover:border-cinema-red/40 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white font-semibold truncate">{b.movieTitle}</span>
                                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${st.color} shrink-0`}>
                                    <StatusIcon className="w-3 h-3" /> {st.label}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-1">
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.cinemaName} · {b.screenName}</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.date}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.time}</span>
                                  <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />Ghế: {seatLabel}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="text-cinema-gold font-bold">{b.totalAmount?.toLocaleString('vi-VN')}đ</div>
                                <div className="text-xs text-gray-500 mt-0.5">{b.bookingCode}</div>
                                {b.pointsEarned > 0 && (
                                  <div className="text-xs text-yellow-500 mt-0.5">+{b.pointsEarned} điểm</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-5">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cinema-darker border border-cinema-gray-light text-gray-400 hover:text-white hover:border-cinema-red disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          ‹
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-cinema-red text-white'
                                : 'bg-cinema-darker border border-cinema-gray-light text-gray-400 hover:text-white hover:border-cinema-red'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-cinema-darker border border-cinema-gray-light text-gray-400 hover:text-white hover:border-cinema-red disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          ›
                        </button>
                        <span className="text-xs text-gray-500 ml-2">{bookings.length} vé tổng cộng</span>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Edit Profile Modal */}
    {editOpen && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-cinema-gray-light">
            <h3 className="text-lg font-semibold text-white">Chỉnh sửa thông tin</h3>
            <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Họ và tên</label>
              <input type="text" value={editForm.fullName}
                onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full px-3 py-2 bg-cinema-darker border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
                placeholder="Nhập họ và tên" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Số điện thoại</label>
              <input type="text" value={editForm.phoneNumber}
                onChange={e => setEditForm(f => ({ ...f, phoneNumber: e.target.value }))}
                className="w-full px-3 py-2 bg-cinema-darker border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
                placeholder="Nhập số điện thoại" />
            </div>
          </div>
          <div className="flex gap-3 p-5 border-t border-cinema-gray-light">
            <button onClick={() => setEditOpen(false)} className="flex-1 px-4 py-2 bg-cinema-gray-light text-gray-300 rounded-lg hover:bg-cinema-gray-lighter text-sm">Hủy</button>
            <button onClick={saveEdit} disabled={editSaving}
              className="flex-1 px-4 py-2 bg-cinema-red text-white rounded-lg hover:bg-cinema-red-dark text-sm disabled:opacity-50">
              {editSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 2FA Setup Modal */}
    {twoFaSetupOpen && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light w-full max-w-md">
          <div className="flex items-center justify-between p-5 border-b border-cinema-gray-light">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" /> Kích hoạt xác thực 2 lớp
            </h3>
            <button onClick={() => setTwoFaSetupOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div className="text-sm text-gray-300 space-y-2">
              <p><strong className="text-white">Bước 1:</strong> Tải ứng dụng <strong className="text-white">Google Authenticator</strong> trên điện thoại</p>
              <p><strong className="text-white">Bước 2:</strong> Mở ứng dụng, nhấn <strong className="text-white">+</strong> → <strong className="text-white">Quét mã QR</strong></p>
            </div>
            {/* QR Code using img */}
            {twoFaQr?.qrUri && (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFaQr.qrUri)}`}
                    alt="QR Code 2FA" width={180} height={180} className="rounded" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Hoặc nhập thủ công mã secret:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-cinema-gold font-mono bg-cinema-darker px-2 py-1 rounded break-all">{twoFaQr.secret}</code>
                    <button onClick={() => { navigator.clipboard.writeText(twoFaQr.secret); toast.success('Đã sao chép!') }}
                      className="p-1 text-gray-400 hover:text-white"><Copy className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-300 mb-2"><strong className="text-white">Bước 3:</strong> Nhập mã 6 chữ số từ ứng dụng để xác nhận</p>
              <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoFocus
                className="w-full px-4 py-3 bg-cinema-darker border border-cinema-gray-light text-white text-center text-xl tracking-[0.4em] font-mono rounded-lg focus:outline-none focus:border-cinema-red"
                placeholder="000000" value={twoFaCode}
                onChange={e => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
          </div>
          <div className="flex gap-3 p-5 border-t border-cinema-gray-light">
            <button onClick={() => setTwoFaSetupOpen(false)} className="flex-1 px-4 py-2 bg-cinema-gray-light text-gray-300 rounded-lg text-sm">Hủy</button>
            <button onClick={enableTwoFa} disabled={twoFaLoading || twoFaCode.length !== 6}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">
              {twoFaLoading ? 'Đang xác nhận...' : 'Kích hoạt 2FA'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Disable 2FA Modal */}
    {disableTwoFaOpen && (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light w-full max-w-sm">
          <div className="flex items-center justify-between p-5 border-b border-cinema-gray-light">
            <h3 className="text-lg font-semibold text-white">Tắt xác thực 2 lớp</h3>
            <button onClick={() => setDisableTwoFaOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-300">Nhập mã từ Google Authenticator để xác nhận tắt 2FA:</p>
            <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoFocus
              className="w-full px-4 py-3 bg-cinema-darker border border-cinema-gray-light text-white text-center text-xl tracking-[0.4em] font-mono rounded-lg focus:outline-none focus:border-cinema-red"
              placeholder="000000" value={disableCode}
              onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          </div>
          <div className="flex gap-3 p-5 border-t border-cinema-gray-light">
            <button onClick={() => setDisableTwoFaOpen(false)} className="flex-1 px-4 py-2 bg-cinema-gray-light text-gray-300 rounded-lg text-sm">Hủy</button>
            <button onClick={disableTwoFa} disabled={twoFaLoading || disableCode.length !== 6}
              className="flex-1 px-4 py-2 bg-cinema-red text-white rounded-lg hover:bg-cinema-red-dark text-sm disabled:opacity-50">
              {twoFaLoading ? '...' : 'Xác nhận tắt'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Booking Detail Modal */}
    {selectedBooking && (() => {      const b = selectedBooking
      const st = statusConfig[b.status] || statusConfig.PENDING
      const StatusIcon = st.icon
      const seatLabel = b.seats?.map(s => `${s.seatRow}${s.seatNumber}`).join(', ') || '—'
      return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-cinema-gray rounded-2xl w-full max-w-md border border-cinema-gray-light shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-cinema-gray-light">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-cinema-red" /> Chi tiết vé
              </h3>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Movie title */}
              <div>
                <p className="text-gray-400 text-xs mb-1">Phim</p>
                <p className="text-white font-bold text-lg">{b.movieTitle}</p>
              </div>

              {/* Booking code - prominent */}
              <div className="bg-cinema-darker rounded-xl p-4 border border-cinema-gold/30 text-center">
                <p className="text-gray-400 text-xs mb-2">Mã vé (đưa cho nhân viên soát)</p>
                <p className="text-cinema-gold font-mono font-bold text-xl tracking-wider">{b.bookingCode}</p>
                <button
                  onClick={() => handleCopyCode(b.bookingCode)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? 'Đã sao chép!' : 'Sao chép mã'}
                </button>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Rạp</p>
                  <p className="text-gray-200">{b.cinemaName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Phòng chiếu</p>
                  <p className="text-gray-200">{b.screenName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Ngày chiếu</p>
                  <p className="text-gray-200">{b.date}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Giờ chiếu</p>
                  <p className="text-gray-200">{b.time}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 text-xs">Ghế ngồi</p>
                  <p className="text-gray-200">{seatLabel}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-cinema-gray-light">
                <span className={`inline-flex items-center gap-1 text-sm font-medium ${st.color}`}>
                  <StatusIcon className="w-4 h-4" /> {st.label}
                </span>
                <div className="text-right">
                  <p className="text-cinema-gold font-bold text-lg">{b.totalAmount?.toLocaleString('vi-VN')}đ</p>
                  {b.pointsEarned > 0 && (
                    <p className="text-yellow-500 text-xs">+{b.pointsEarned} điểm tích lũy</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    })()}
    </>
  )
}

export default ProfilePage

