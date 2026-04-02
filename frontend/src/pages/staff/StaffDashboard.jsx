import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, QrCode, Search, Film, Clock, Users, CheckCircle, XCircle } from 'lucide-react'
import api from '../../services/api'
import movieService from '../../services/movieService'

const formatTime = (isoOrTime) => {
  if (!isoOrTime) return ''
  if (isoOrTime.includes('T')) {
    return isoOrTime.substring(11, 16)
  }
  return isoOrTime
}

const StaffDashboard = () => {
  const [activeTab, setActiveTab] = useState('sell') // sell | checkin | stats
  const [movies, setMovies] = useState([])
  const [todayScreenings, setTodayScreenings] = useState([])
  const [movieScreenings, setMovieScreenings] = useState([])
  const [movieScreeningsLoading, setMovieScreeningsLoading] = useState(false)
  const [searchMovie, setSearchMovie] = useState('')
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [qrInput, setQrInput] = useState('')
  const [qrResult, setQrResult] = useState(null)
  const [checking, setChecking] = useState(false)
  const [todayStats, setTodayStats] = useState({ sold: 0, checkedIn: 0, revenue: 0, upcoming: 0 })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    fetchMovies()
    fetchTodayScreenings()
    fetchTodayStats()
  }, [])

  useEffect(() => {
    if (selectedMovie) {
      fetchMovieScreenings(selectedMovie.id)
    } else {
      setMovieScreenings([])
    }
  }, [selectedMovie])

  const fetchMovies = async () => {
    try {
      const data = await movieService.getNowShowing()
      setMovies(Array.isArray(data) ? data : [])
    } catch {
      setMovies([])
    }
  }

  const fetchTodayScreenings = async () => {
    try {
      const res = await api.get('/screenings/today')
      setTodayScreenings(res.data || [])
    } catch {
      setTodayScreenings([])
    }
  }

  const fetchMovieScreenings = async (movieId) => {
    setMovieScreeningsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const res = await api.get(`/screenings/movie/${movieId}`, { params: { date: today } })
      setMovieScreenings(res.data || [])
    } catch {
      setMovieScreenings([])
    } finally {
      setMovieScreeningsLoading(false)
    }
  }

  const fetchTodayStats = async () => {
    setStatsLoading(true)
    try {
      const res = await api.get('/staff/stats/today')
      setTodayStats(res.data)
    } catch {
      setTodayStats({ sold: 0, checkedIn: 0, revenue: 0, upcoming: 0 })
    } finally {
      setStatsLoading(false)
    }
  }

  const handleQrCheck = async () => {
    if (!qrInput.trim()) return
    setChecking(true)
    setQrResult(null)
    try {
      const res = await api.post(`/bookings/${qrInput}/check-in`)
      setQrResult({ success: true, data: res.data })
    } catch (e) {
      const msg = e.response?.data?.message
      setQrResult({ success: false, message: msg || 'Không tìm thấy vé hoặc vé không hợp lệ' })
    } finally {
      setChecking(false)
    }
  }

  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchMovie.toLowerCase()))


  return (
    <div className="min-h-screen bg-cinema-darker">
      {/* Header */}
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-white">Staff Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { k: 'sell', l: '🎟 Bán vé tại quầy', icon: Ticket },
              { k: 'checkin', l: '📱 Soát vé / QR', icon: QrCode },
              { k: 'stats', l: '📊 Thống kê hôm nay', icon: Film },
            ].map(t => (
              <button key={t.k} onClick={() => setActiveTab(t.k)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === t.k ? 'bg-cinema-red text-white' : 'bg-cinema-gray-light text-gray-300 hover:bg-cinema-gray-lighter'}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tab: Bán vé */}
        {activeTab === 'sell' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Chọn phim */}
            <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Film className="w-4 h-4 text-cinema-red" /> 1. Chọn phim
              </h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Tìm phim..." value={searchMovie} onChange={e => setSearchMovie(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm" />
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredMovies.length === 0 && (
                  <div className="text-center py-6 text-gray-500 text-sm">Không có phim đang chiếu</div>
                )}
                {filteredMovies.map(m => (
                  <button key={m.id} onClick={() => setSelectedMovie(m)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm border ${selectedMovie?.id === m.id ? 'bg-cinema-red/20 border-cinema-red text-white' : 'bg-cinema-gray-light border-cinema-gray-lighter text-gray-300 hover:border-cinema-red/50'}`}>
                    <div className="font-medium">{m.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{m.duration} phút</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Chọn suất chiếu */}
            <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cinema-gold" /> 2. Chọn suất chiếu
              </h2>
              {!selectedMovie ? (
                <div className="text-center py-10 text-gray-500 text-sm">Chọn phim trước</div>
              ) : movieScreeningsLoading ? (
                <div className="text-center py-10 text-gray-500 text-sm">Đang tải...</div>
              ) : (
                <div className="space-y-2">
                  {movieScreenings.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-sm">Không có suất chiếu hôm nay</div>
                  ) : (
                    movieScreenings.map(s => (
                      <Link key={s.id} to={`/d73/booking/${s.id}`}
                        className="block w-full text-left px-3 py-3 rounded-lg bg-cinema-gray-light border border-cinema-gray-lighter hover:border-cinema-gold transition-colors">
                        <div className="flex justify-between">
                          <span className="text-white font-semibold text-lg">{formatTime(s.startTime)}</span>
                          <span className="text-cinema-gold font-semibold">{s.basePrice?.toLocaleString()}đ</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-xs mt-1">
                          <span>{s.cinemaName} — {s.screenName}</span>
                          <span>•</span>
                          <span className={s.availableSeats > 20 ? 'text-green-400' : s.availableSeats > 0 ? 'text-yellow-400' : 'text-red-400'}>
                            {s.availableSeats} ghế trống
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" /> Hướng dẫn bán vé
              </h2>
              <ol className="space-y-3 text-sm text-gray-400">
                {['Chọn phim đang chiếu trong danh sách', 'Chọn suất chiếu phù hợp với khách', 'Chọn ghế trên sơ đồ phòng chiếu', 'Thêm combo nếu khách muốn', 'Xác nhận thanh toán và in vé'].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cinema-red/20 text-cinema-red flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Tab: Soát vé */}
        {activeTab === 'checkin' && (
          <div className="max-w-lg mx-auto">
            <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cinema-red" /> Kiểm tra vé / Soát vé
              </h2>

              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">Nhập mã vé hoặc quét QR</label>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="VD: BK001234"
                    value={qrInput} onChange={e => setQrInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleQrCheck()}
                    className="flex-1 px-4 py-3 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-xl focus:outline-none focus:border-cinema-red font-mono"
                  />
                  <button onClick={handleQrCheck} disabled={checking || !qrInput.trim()}
                    className="px-5 py-3 bg-cinema-red hover:bg-cinema-red-dark disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors">
                    {checking ? '...' : 'Kiểm tra'}
                  </button>
                </div>
              </div>

              {/* QR Result */}
              {qrResult && (
                <div className={`rounded-xl p-5 border-2 ${qrResult.success ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    {qrResult.success
                      ? <CheckCircle className="w-8 h-8 text-green-400" />
                      : <XCircle className="w-8 h-8 text-red-400" />}
                    <div>
                      <div className={`text-lg font-bold ${qrResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {qrResult.success ? 'Vé hợp lệ ✓' : 'Vé không hợp lệ ✗'}
                      </div>
                      {!qrResult.success && <div className="text-red-300 text-sm">{qrResult.message}</div>}
                    </div>
                  </div>
                  {qrResult.success && qrResult.data && (
                    <div className="space-y-2 text-sm">
                      {[
                        ['Mã vé', qrResult.data.bookingCode],
                        ['Khách hàng', qrResult.data.customerName],
                        ['Phim', qrResult.data.movieTitle],
                        ['Suất chiếu', qrResult.data.screeningTime],
                        ['Ghế', (qrResult.data.seats || []).join(', ')],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-gray-400">{k}</span>
                          <span className="text-white font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {qrResult.success && (
                    <button onClick={() => { setQrInput(''); setQrResult(null) }}
                      className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm">
                      ✓ Xác nhận soát vé — Vé tiếp theo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Thống kê */}
        {activeTab === 'stats' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Vé đã bán', value: statsLoading ? '...' : todayStats.sold, icon: Ticket, color: 'text-cinema-red', bg: 'bg-cinema-red/10' },
                { label: 'Lượt soát vé', value: statsLoading ? '...' : todayStats.checkedIn, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
                { label: 'Doanh thu', value: statsLoading ? '...' : (Number(todayStats.revenue) || 0).toLocaleString() + 'đ', icon: Film, color: 'text-cinema-gold', bg: 'bg-cinema-gold/10' },
                { label: 'Suất sắp chiếu', value: statsLoading ? '...' : todayStats.upcoming, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
                    <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-gray-400 text-sm mt-1">{s.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Today's screenings */}
            <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cinema-gold" /> Suất chiếu hôm nay
              </h3>
              {todayScreenings.length === 0 ? (
                <div className="text-center py-6 text-gray-500 text-sm">Không có suất chiếu hôm nay</div>
              ) : (
                <div className="space-y-2">
                  {todayScreenings.map(s => (
                    <div key={s.id} className="flex items-center gap-4 p-3 bg-cinema-gray-light rounded-lg">
                      <span className="text-cinema-gold font-bold w-14">{formatTime(s.startTime)}</span>
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium">{s.movieTitle}</div>
                        <div className="text-gray-500 text-xs">{s.cinemaName} — {s.screenName}</div>
                      </div>
                      <span className={`text-sm font-semibold ${s.availableSeats > 20 ? 'text-green-400' : s.availableSeats > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {s.availableSeats} ghế
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffDashboard

