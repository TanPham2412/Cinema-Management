import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, DollarSign, Ticket, Users, Film, BarChart3, Calendar } from 'lucide-react'
import api from '../../services/api'

const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12']

// Simple bar chart via div widths
const BarChart = ({ data, maxValue, color = 'bg-cinema-red' }) => (
  <div className="flex items-end gap-1 h-32">
    {data.map((val, i) => {
      const pct = maxValue > 0 ? (val / maxValue) * 100 : 0
      return (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t" style={{ height: `${pct}%`, backgroundColor: undefined }}
            title={val?.toLocaleString() + 'đ'}>
            <div className={`w-full h-full ${color} rounded-t opacity-80 hover:opacity-100 transition-opacity`} style={{ minHeight: val > 0 ? '4px' : '0' }} />
          </div>
          <span className="text-gray-500 text-xs">{MONTHS[i]}</span>
        </div>
      )
    })}
  </div>
)

const RevenueManagement = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month') // month, week, year
  const [error, setError] = useState('')

  useEffect(() => { fetchStats() }, [period])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/revenue', { params: { period } })
      setStats(res.data)
    } catch {
      setError('Không thể tải dữ liệu doanh thu — hiển thị dữ liệu mô phỏng')
      // Mock data
      setStats({
        totalRevenue: 158_500_000,
        totalBookings: 1842,
        totalCustomers: 943,
        totalMovies: 24,
        revenueGrowth: 12.5,
        bookingGrowth: 8.3,
        monthlyRevenue: [12_000_000, 15_500_000, 11_000_000, 18_200_000, 22_000_000, 19_800_000, 14_500_000, 16_000_000, 21_000_000, 24_500_000, 13_000_000, 11_000_000],
        monthlyBookings: [120, 155, 110, 182, 220, 198, 145, 160, 210, 245, 130, 110],
        topMovies: [
          { title: 'Avengers: Endgame', revenue: 28_500_000, bookings: 285 },
          { title: 'Spider-Man: NWH', revenue: 22_000_000, bookings: 220 },
          { title: 'The Batman', revenue: 18_700_000, bookings: 187 },
          { title: 'Dune: Part Two', revenue: 15_400_000, bookings: 154 },
          { title: 'Oppenheimer', revenue: 12_800_000, bookings: 128 },
        ],
        revenueByType: [
          { type: 'Ghế Thường', pct: 55, amount: 87_175_000 },
          { type: 'Ghế VIP', pct: 30, amount: 47_550_000 },
          { type: 'Ghế Đôi', pct: 10, amount: 15_850_000 },
          { type: 'Combo', pct: 5, amount: 7_925_000 },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n?.toLocaleString()
  const maxRev = stats ? Math.max(...(stats.monthlyRevenue || [1])) : 1
  const maxBook = stats ? Math.max(...(stats.monthlyBookings || [1])) : 1

  const STAT_CARDS = stats ? [
    { label: 'Tổng doanh thu', value: fmt(stats.totalRevenue) + 'đ', icon: DollarSign, color: 'text-cinema-gold', bg: 'bg-cinema-gold/10', growth: stats.revenueGrowth },
    { label: 'Tổng đơn hàng', value: stats.totalBookings?.toLocaleString(), icon: Ticket, color: 'text-cinema-red', bg: 'bg-cinema-red/10', growth: stats.bookingGrowth },
    { label: 'Khách hàng', value: stats.totalCustomers?.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', growth: null },
    { label: 'Phim đang chiếu', value: stats.totalMovies, icon: Film, color: 'text-green-400', bg: 'bg-green-400/10', growth: null },
  ] : []

  return (
    <div className="min-h-screen bg-cinema-darker">
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/d57" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
            <TrendingUp className="w-6 h-6 text-cinema-gold" />
            <h1 className="text-2xl font-bold text-white">Doanh thu & Thống kê</h1>
          </div>
          <div className="flex gap-1 bg-cinema-gray-light rounded-lg p-1">
            {[{ k: 'week', l: 'Tuần' }, { k: 'month', l: 'Tháng' }, { k: 'year', l: 'Năm' }].map(p => (
              <button key={p.k} onClick={() => setPeriod(p.k)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p.k ? 'bg-cinema-red text-white' : 'text-gray-400 hover:text-white'}`}>
                {p.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-cinema-gray rounded-xl border border-cinema-gray-light h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {STAT_CARDS.map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
                    <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-gray-400 text-sm mt-1">{s.label}</div>
                    {s.growth !== null && s.growth !== undefined && (
                      <div className={`text-xs mt-1 ${s.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {s.growth >= 0 ? '↑' : '↓'} {Math.abs(s.growth)}% so với kỳ trước
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Chart */}
              <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cinema-gold" /> Doanh thu theo tháng
                </h3>
                <BarChart data={stats.monthlyRevenue || []} maxValue={maxRev} color="bg-cinema-gold" />
                <div className="mt-2 text-right text-xs text-gray-500">Đơn vị: triệu đồng</div>
              </div>

              {/* Booking Chart */}
              <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-cinema-red" /> Số đơn hàng theo tháng
                </h3>
                <BarChart data={stats.monthlyBookings || []} maxValue={maxBook} color="bg-cinema-red" />
                <div className="mt-2 text-right text-xs text-gray-500">Đơn vị: đơn</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Movies */}
              <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Film className="w-4 h-4 text-blue-400" /> Top phim doanh thu cao
                </h3>
                <div className="space-y-3">
                  {(stats.topMovies || []).map((mv, i) => (
                    <div key={mv.title} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-cinema-gold text-cinema-darker' : i === 1 ? 'bg-gray-300 text-cinema-darker' : i === 2 ? 'bg-amber-700 text-white' : 'bg-cinema-gray-light text-gray-400'}`}>{i + 1}</span>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{mv.title}</div>
                        <div className="mt-1 h-1.5 bg-cinema-gray-light rounded-full">
                          <div className="h-full bg-cinema-red rounded-full" style={{ width: `${(mv.revenue / (stats.topMovies[0]?.revenue || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-cinema-gold text-sm font-semibold">{fmt(mv.revenue)}đ</div>
                        <div className="text-gray-500 text-xs">{mv.bookings} vé</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue by Type */}
              <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" /> Phân bổ doanh thu
                </h3>
                <div className="space-y-4">
                  {(stats.revenueByType || []).map(t => (
                    <div key={t.type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{t.type}</span>
                        <span className="text-white">{fmt(t.amount)}đ <span className="text-gray-500">({t.pct}%)</span></span>
                      </div>
                      <div className="h-2 bg-cinema-gray-light rounded-full">
                        <div className="h-full bg-gradient-to-r from-cinema-red to-cinema-gold rounded-full transition-all" style={{ width: `${t.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RevenueManagement
