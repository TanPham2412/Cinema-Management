import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Ticket, Search, ChevronLeft, ChevronRight, Eye, X, CheckCircle, XCircle, Building2, Film } from 'lucide-react'
import api from '../../services/api'
import cinemaService from '../../services/cinemaService'
import movieService from '../../services/movieService'

const STATUS_BADGES = {
  CONFIRMED:  { label: 'Đã xác nhận', icon: CheckCircle, color: 'bg-green-500/20 text-green-400 border-green-400/30' },
  CANCELLED:  { label: 'Đã hủy', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-400/30' },
  COMPLETED:  { label: 'Hoàn thành', icon: CheckCircle, color: 'bg-blue-500/20 text-blue-400 border-blue-400/30' },
}

const BookingManagement = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cinemaFilter, setCinemaFilter] = useState('')
  const [movieFilter, setMovieFilter] = useState('')
  const [cinemas, setCinemas] = useState([])
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const pageSize = 15

  useEffect(() => {
    // Load cinemas and movies for filter dropdowns
    cinemaService.getCinemas().then(data => setCinemas(Array.isArray(data) ? data : [])).catch(() => {})
    movieService.searchMovies({ size: 200 }).then(data => {
      const list = Array.isArray(data) ? data : (data?.content || [])
      setMovies(list)
    }).catch(() => {})
  }, [])

  useEffect(() => { fetchBookings() }, [page, statusFilter, cinemaFilter, movieFilter])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const res = await api.get('/bookings/admin', {
        params: {
          page, size: pageSize,
          status: statusFilter || undefined,
          keyword: search || undefined,
          cinemaId: cinemaFilter || undefined,
          movieId: movieFilter || undefined,
        }
      })
      const data = res.data
      setBookings(data.content || data || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.totalElements || (Array.isArray(data) ? data.length : 0))
      setError('')
    } catch {
      setError('Không thể tải dữ liệu đơn hàng')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0)
    fetchBookings()
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Hủy đơn hàng này?')) return
    try {
      await api.put(`/bookings/${id}/cancel`)
      fetchBookings()
    } catch {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b))
    }
  }

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('')
    setCinemaFilter('')
    setMovieFilter('')
    setPage(0)
  }

  const formatMoney = (n) => n?.toLocaleString() + 'đ'
  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('vi-VN') : '—'
  const formatSeats = (seats) => (seats || []).map(s => `${s.seatRow}${s.seatNumber}`).join(', ')

  return (
    <div className="min-h-screen bg-cinema-darker">
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-5 flex items-center gap-3">
          <Link to="/admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <Ticket className="w-6 h-6 text-orange-400" />
          <h1 className="text-2xl font-bold text-white">Quản lý Đơn hàng</h1>
          <span className="ml-auto text-gray-400 text-sm">{total} đơn hàng</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">{error}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(STATUS_BADGES).map(([key, val]) => {
            const Icon = val.icon
            return (
              <div key={key} onClick={() => { setStatusFilter(key === statusFilter ? '' : key); setPage(0) }}
                className={`bg-cinema-gray rounded-xl border p-4 flex items-center gap-3 cursor-pointer transition-colors ${key === statusFilter ? 'border-cinema-red' : 'border-cinema-gray-light hover:border-cinema-gray-lighter'}`}>
                <Icon className={`w-8 h-8 ${val.color.split(' ')[1]}`} />
                <div>
                  <div className="text-2xl font-bold text-white">—</div>
                  <div className="text-gray-400 text-xs">{val.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" placeholder="Mã đơn, tên KH, email, phim..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm" />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-cinema-red text-white rounded-lg hover:bg-cinema-red-dark text-sm">Tìm</button>
          </form>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
            className="px-3 py-2.5 bg-cinema-gray border border-cinema-gray-light text-gray-300 rounded-lg focus:outline-none focus:border-cinema-red text-sm">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_BADGES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={cinemaFilter} onChange={e => { setCinemaFilter(e.target.value); setPage(0) }}
            className="px-3 py-2.5 bg-cinema-gray border border-cinema-gray-light text-gray-300 rounded-lg focus:outline-none focus:border-cinema-red text-sm">
            <option value="">Tất cả rạp</option>
            {cinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={movieFilter} onChange={e => { setMovieFilter(e.target.value); setPage(0) }}
            className="px-3 py-2.5 bg-cinema-gray border border-cinema-gray-light text-gray-300 rounded-lg focus:outline-none focus:border-cinema-red text-sm min-w-40">
            <option value="">Tất cả phim</option>
            {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
          {(statusFilter || cinemaFilter || movieFilter || search) && (
            <button onClick={resetFilters} className="px-3 py-2.5 text-gray-400 hover:text-white border border-cinema-gray-light rounded-lg text-sm transition-colors">
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-cinema-gray rounded-xl border border-cinema-gray-light overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-cinema-gray-light">
              <tr className="text-gray-400">
                <th className="text-left px-4 py-3">Mã đơn</th>
                <th className="text-left px-4 py-3">Khách hàng</th>
                <th className="text-left px-4 py-3">Phim</th>
                <th className="text-left px-4 py-3">Ghế</th>
                <th className="text-left px-4 py-3">Tổng tiền</th>
                <th className="text-left px-4 py-3">Ngày đặt</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cinema-gray-light">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-cinema-gray-light rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : bookings.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-500">
                  <Ticket className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  Không có đơn hàng nào
                </td></tr>
              ) : (
                bookings.map(b => {
                  const badge = STATUS_BADGES[b.status] || STATUS_BADGES.CONFIRMED
                  const Icon = badge.icon
                  return (
                    <tr key={b.id} className="hover:bg-cinema-gray-lighter/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-cinema-gold text-xs">{b.bookingCode}</td>
                      <td className="px-4 py-3">
                        <div className="text-white">{b.userName}</div>
                        <div className="text-gray-500 text-xs">{b.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{b.movieTitle}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(b.seats || []).map(s => (
                            <span key={`${s.seatRow}${s.seatNumber}`} className="px-1.5 py-0.5 bg-cinema-gray-light text-gray-300 rounded text-xs">{s.seatRow}{s.seatNumber}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-cinema-gold font-semibold">{formatMoney(b.totalAmount)}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(b.bookingTime)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${badge.color}`}>
                          <Icon className="w-3 h-3" /> {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelected(b)} className="p-1.5 text-gray-400 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
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

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cinema-gray rounded-2xl border border-cinema-gray-light w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-cinema-gray-light">
              <h2 className="text-xl font-bold text-white">Chi tiết đơn hàng</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {[
                ['Mã đơn', selected.bookingCode],
                ['Khách hàng', selected.userName],
                ['Email', selected.customerEmail],
                ['Phim', selected.movieTitle],
                ['Rạp', selected.cinemaName],
                ['Suất chiếu', `${selected.date || ''} ${selected.time || ''}`],
                ['Ghế', formatSeats(selected.seats)],
                ['Tổng tiền', formatMoney(selected.totalAmount)],
                ['Ngày đặt', formatDate(selected.bookingTime)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-gray-400">{k}</span>
                  <span className="text-white font-medium text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-cinema-gray-light">
              <button onClick={() => setSelected(null)} className="w-full py-2.5 bg-cinema-gray-light hover:bg-cinema-gray-lighter text-white rounded-xl transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingManagement
