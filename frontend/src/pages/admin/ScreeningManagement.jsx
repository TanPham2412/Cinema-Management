import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, Clock, Monitor, Film, Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import screeningService from '../../services/screeningService'
import movieService from '../../services/movieService'
import cinemaService from '../../services/cinemaService'

const PRICE_CATEGORIES = [
  { value: 'EARLY_BIRD', label: 'Suất sớm', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'NORMAL', label: 'Bình thường', color: 'bg-green-500/20 text-green-400' },
  { value: 'PRIME_TIME', label: 'Giờ vàng', color: 'bg-cinema-gold/20 text-cinema-gold' },
  { value: 'HOLIDAY', label: 'Ngày lễ', color: 'bg-cinema-red/20 text-cinema-red' },
]

const EMPTY_FORM = {
  movieId: '', cinemaId: '', screenId: '', startTime: '', basePrice: 90000,
  priceCategory: 'NORMAL', subtitleLanguage: '', audioLanguage: 'Tiếng Việt',
}

const ScreeningManagement = () => {
  const [screenings, setScreenings] = useState([])
  const [movies, setMovies] = useState([])
  const [cinemas, setCinemas] = useState([])
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10))
  const [page, setPage] = useState(0)
  const pageSize = 10

  useEffect(() => {
    fetchAll()
  }, [])

  // Load screens when cinema changes
  useEffect(() => {
    if (form.cinemaId) {
      cinemaService.getScreensByCinema(form.cinemaId)
        .then(setScreens)
        .catch(() => setScreens([]))
    } else {
      setScreens([])
    }
  }, [form.cinemaId])

  const fetchAll = async () => {
    setLoading(true)
    const [moviesRes, cinemasRes, screeningsRes] = await Promise.allSettled([
      movieService.searchMovies({ size: 100 }),
      cinemaService.getAdminCinemas(),
      screeningService.getAllScreenings(),
    ])
    if (moviesRes.status === 'fulfilled') setMovies(moviesRes.value?.content || [])
    if (cinemasRes.status === 'fulfilled') setCinemas(cinemasRes.value || [])
    if (screeningsRes.status === 'fulfilled') {
      setScreenings(screeningsRes.value || [])
    } else {
      setError('API suất chiếu chưa sẵn sàng — hiển thị giao diện demo')
      setScreenings([
        { id: 1, movieTitle: 'Avengers: Endgame', cinemaName: 'CGV Vincom', screenName: 'Screen 1', startTime: `${filterDate}T10:00:00`, basePrice: 90000, priceCategory: 'NORMAL', availableSeats: 120 },
        { id: 2, movieTitle: 'Spider-Man: No Way Home', cinemaName: 'CGV Aeon Mall', screenName: 'Screen 2', startTime: `${filterDate}T13:30:00`, basePrice: 100000, priceCategory: 'PRIME_TIME', availableSeats: 80 },
        { id: 3, movieTitle: 'The Batman', cinemaName: 'CGV Vincom', screenName: 'Screen 3', startTime: `${filterDate}T16:00:00`, basePrice: 110000, priceCategory: 'PRIME_TIME', availableSeats: 95 },
      ])
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.movieId || !form.startTime) return
    setSaving(true)
    try {
      const payload = {
        movieId: form.movieId,
        screenId: form.screenId,
        startTime: form.startTime,
        basePrice: form.basePrice,
        priceCategory: form.priceCategory,
      }
      await screeningService.createScreening(payload)
      // Switch the filter date to the date of the newly added screening
      setFilterDate(form.startTime.slice(0, 10))
      setPage(0)
      await fetchAll()
      setShowModal(false); setForm(EMPTY_FORM)
    } catch (err) {
      alert(err?.response?.data?.message || 'Thêm suất chiếu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Hủy suất chiếu này?')) return
    try {
      await screeningService.deleteScreening(id)
      setScreenings(prev => prev.filter(s => s.id !== id))
    } catch {
      alert('Hủy suất chiếu thất bại')
    }
  }

  const filtered = screenings.filter(s => s.startTime?.startsWith(filterDate))
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  const getPriceBadge = (cat) => PRICE_CATEGORIES.find(p => p.value === cat) || PRICE_CATEGORIES[1]

  const formatTime = (isoStr) => {
    if (!isoStr) return '—'
    return new Date(isoStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-cinema-darker">
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
            <Calendar className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Quản lý Suất chiếu</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red-dark text-white rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" /> Thêm suất chiếu
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">{error}</div>
        )}

        {/* Date filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 bg-cinema-gray border border-cinema-gray-light rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date" value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setPage(0) }}
              className="bg-transparent text-white text-sm focus:outline-none"
            />
          </div>
          <span className="text-gray-400 text-sm">{filtered.length} suất chiếu</span>
        </div>

        {/* Table */}
        <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-cinema-gray-light">
              <tr className="text-gray-400">
                <th className="text-left px-4 py-3">Phim</th>
                <th className="text-left px-4 py-3">Rạp / Phòng</th>
                <th className="text-left px-4 py-3">Giờ chiếu</th>
                <th className="text-left px-4 py-3">Loại</th>
                <th className="text-left px-4 py-3">Giá vé</th>
                <th className="text-left px-4 py-3">Ghế còn</th>
                <th className="text-right px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-gray-light">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-cinema-gray-light rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    Không có suất chiếu nào vào ngày này
                  </td>
                </tr>
              ) : (
                paged.map(s => {
                  const badge = getPriceBadge(s.priceCategory)
                  return (
                    <tr key={s.id} className="hover:bg-cinema-gray-lighter/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-gray-500" />
                          <span className="text-white font-medium">{s.movieTitle}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        <div>{s.cinemaName}</div>
                        <div className="text-xs text-gray-500">{s.screenName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-white">
                          <Clock className="w-3 h-3" />
                          {formatTime(s.startTime)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3 text-cinema-gold font-semibold">
                        {s.basePrice?.toLocaleString()}đ
                      </td>
                      <td className="px-4 py-3 text-gray-300">{s.availableSeats ?? '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-cinema-gray-light rounded-lg transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 py-4 border-t border-cinema-gray-light">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="p-1 text-gray-400 hover:text-white disabled:opacity-40">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-gray-400 text-sm">Trang {page + 1} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 text-gray-400 hover:text-white disabled:opacity-40">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cinema-gray rounded-2xl border border-cinema-gray-light w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-cinema-gray-light">
              <h2 className="text-xl font-bold text-white">Thêm suất chiếu mới</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Phim *</label>
                <select value={form.movieId} onChange={e => setForm(p => ({ ...p, movieId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm">
                  <option value="">-- Chọn phim --</option>
                  {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Rạp *</label>
                <select value={form.cinemaId} onChange={e => setForm(p => ({ ...p, cinemaId: e.target.value, screenId: '' }))}
                  className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm">
                  <option value="">-- Chọn rạp --</option>
                  {cinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Phòng chiếu *</label>
                <select value={form.screenId} onChange={e => setForm(p => ({ ...p, screenId: e.target.value }))}
                  disabled={!form.cinemaId}
                  className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm disabled:opacity-50">
                  <option value="">-- Chọn phòng --</option>
                  {screens.map(s => <option key={s.id} value={s.id}>{s.name} ({s.totalSeats} ghế)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Thời gian chiếu *</label>
                <input type="datetime-local" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Giá vé cơ bản (đ)</label>
                  <input type="number" value={form.basePrice} onChange={e => setForm(p => ({ ...p, basePrice: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Loại giờ</label>
                  <select value={form.priceCategory} onChange={e => setForm(p => ({ ...p, priceCategory: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm">
                    {PRICE_CATEGORIES.map(pc => <option key={pc.value} value={pc.value}>{pc.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Ngôn ngữ âm thanh</label>
                <select value={form.audioLanguage} onChange={e => setForm(p => ({ ...p, audioLanguage: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm">
                  <option>Tiếng Việt</option><option>Tiếng Anh</option><option>Tiếng Hàn</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-cinema-gray-lighter text-gray-300 rounded-xl hover:bg-cinema-gray-light transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving || !form.movieId || !form.startTime} className="flex-1 py-2.5 bg-cinema-red hover:bg-cinema-red-dark disabled:bg-gray-700 text-white rounded-xl font-semibold transition-colors">
                {saving ? 'Đang lưu...' : 'Thêm suất chiếu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScreeningManagement
