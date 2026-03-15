import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../redux/slices/authSlice'
import { User, Mail, Phone, Star, Award, Ticket, LogOut, Crown } from 'lucide-react'

const tierConfig = {
  BRONZE:   { label: 'Bronze',   color: 'text-amber-600',  bg: 'bg-amber-600/20',  border: 'border-amber-600', icon: '🥉', next: 'Silver',   nextPoints: 1000 },
  SILVER:   { label: 'Silver',   color: 'text-gray-300',   bg: 'bg-gray-300/20',   border: 'border-gray-300',  icon: '🥈', next: 'Gold',     nextPoints: 5000 },
  GOLD:     { label: 'Gold',     color: 'text-cinema-gold',bg: 'bg-cinema-gold/20',border: 'border-cinema-gold',icon: '🥇', next: 'Platinum', nextPoints: 15000 },
  PLATINUM: { label: 'Platinum', color: 'text-cyan-400',   bg: 'bg-cyan-400/20',   border: 'border-cyan-400',  icon: '💎', next: null,       nextPoints: null },
}

const ProfilePage = () => {
  const { user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  if (!user) {
    navigate('/login')
    return null
  }

  const tier = tierConfig[user.membershipTier] || tierConfig.BRONZE
  const points = user.loyaltyPoints || 0
  const progressPercent = tier.nextPoints
    ? Math.min(100, Math.round((points / tier.nextPoints) * 100))
    : 100

  return (
    <div className="min-h-screen bg-cinema-darker py-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Trang cá nhân</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: User Info */}
          <div className="space-y-4">
            {/* Avatar & Basic Info */}
            <div className="bg-cinema-gray rounded-xl p-6 border border-cinema-gray-light text-center">
              <div className="w-20 h-20 bg-cinema-red rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-3xl font-bold">
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{user.fullName}</h2>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${tier.bg} ${tier.color} border ${tier.border}`}>
                {tier.icon} {tier.label}
              </span>
              <div className={`inline-flex items-center gap-1 ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                user.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500' :
                user.role === 'STAFF' ? 'bg-blue-500/20 text-blue-400 border border-blue-500' :
                'bg-gray-500/20 text-gray-400 border border-gray-500'
              }`}>
                <Crown className="w-3 h-3" />
                {user.role === 'ADMIN' ? 'Quản trị viên' : user.role === 'STAFF' ? 'Nhân viên' : 'Thành viên'}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-cinema-gray rounded-xl p-5 border border-cinema-gray-light space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cinema-red" /> Thông tin liên hệ
              </h3>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-300 text-sm">{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-300 text-sm">{user.phoneNumber}</span>
                </div>
              )}
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
              <div className="grid grid-cols-4 gap-2 mt-5">
                {Object.entries(tierConfig).map(([key, t]) => (
                  <div key={key} className={`text-center p-2 rounded-lg border ${user.membershipTier === key ? `${t.bg} ${t.border}` : 'border-cinema-gray-light'}`}>
                    <div className="text-xl">{t.icon}</div>
                    <div className={`text-xs font-semibold ${user.membershipTier === key ? t.color : 'text-gray-500'}`}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking History */}
            <div className="bg-cinema-gray rounded-xl p-6 border border-cinema-gray-light">
              <h3 className="font-semibold text-white flex items-center gap-2 mb-5">
                <Ticket className="w-5 h-5 text-cinema-red" /> Lịch sử đặt vé
              </h3>
              <div className="text-center py-12 border-2 border-dashed border-cinema-gray-light rounded-xl">
                <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-1">Chức năng đặt vé đang được phát triển</p>
                <p className="text-gray-500 text-sm">Lịch sử vé sẽ hiển thị ở đây sau khi có giao dịch</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
