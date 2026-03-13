import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Building2, MapPin, Phone, Search, X } from 'lucide-react'
import cinemaService from '../../services/cinemaService'
import api from '../../services/api'

const EMPTY_FORM = { name: '', address: '', phone: '', city: '', totalScreens: 1, description: '' }

const CinemaManagement = () => {
  const [cinemas, setCinemas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchCinemas() }, [])

  const fetchCinemas = async () => {
    try {
      setLoading(true)
      const data = await cinemaService.getCinemas()
      setCinemas(data)
    } catch {
      setError('API chưa sẵn sàng — hiển thị dữ liệu mẫu')
      setCinemas([
        { id: 1, name: 'CGV Vincom Center', address: '191 Bà Triệu, Hà Nội', phone: '1900 6017', city: 'Hà Nội', totalScreens: 8 },
        { id: 2, name: 'CGV Aeon Mall', address: '27 Cổ Linh, Long Biên, Hà Nội', phone: '1900 6017', city: 'Hà Nội', totalScreens: 6 },
        { id: 3, name: 'Lotte Cinema', address: '54 Liễu Giai, Ba Đình, Hà Nội', phone: '1900 1545', city: 'Hà Nội', totalScreens: 5 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setShowModal(true) }
  const openEdit = (c) => { setForm({ ...c }); setEditing(c.id); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setForm(EMPTY_FORM); setEditing(null) }

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await api.put(`/cinemas/${editing}`, form)
      } else {
        await api.post('/cinemas', form)
      }
      await fetchCinemas()
      closeModal()
    } catch {
      alert('API chưa sẵn sàng — thao tác mô phỏng thành công')
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa rạp này?')) return
    try {
      await api.delete(`/cinemas/${id}`)
      setCinemas(prev => prev.filter(c => c.id !== id))
    } catch {
      setCinemas(prev => prev.filter(c => c.id !== id))
    }
  }

  const filtered = cinemas.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-cinema-darker">
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/admin" className="text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
              <Building2 className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">Quản lý Rạp chiếu</h1>
            </div>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-cinema-red hover:bg-cinema-red-dark text-white rounded-lg font-medium transition-colors">
              <Plus className="w-4 h-4" /> Thêm rạp
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">{error}</div>
        )}

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text" placeholder="Tìm rạp theo tên, thành phố..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-cinema-gray rounded-xl h-48 border border-cinema-gray-light" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(cinema => (
              <div key={cinema.id} className="bg-cinema-gray rounded-xl border border-cinema-gray-light p-5 hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{cinema.name}</h3>
                      <span className="text-xs text-blue-400">{cinema.city}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cinema)} className="p-1.5 text-gray-400 hover:text-cinema-gold hover:bg-cinema-gray-light rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cinema.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-cinema-gray-light rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-start gap-2 text-gray-400">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{cinema.address}</span>
                  </div>
                  {cinema.phone && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span>{cinema.phone}</span>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-cinema-gray-light flex justify-between">
                    <span className="text-gray-400 text-xs">Số phòng chiếu</span>
                    <span className="text-white font-semibold">{cinema.totalScreens || cinema.screens?.length || '—'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cinema-gray rounded-2xl border border-cinema-gray-light w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-cinema-gray-light">
              <h2 className="text-xl font-bold text-white">{editing ? 'Sửa rạp' : 'Thêm rạp mới'}</h2>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'name', label: 'Tên rạp *', placeholder: 'CGV Vincom...' },
                { key: 'address', label: 'Địa chỉ *', placeholder: '19 xxx, Quận xxx...' },
                { key: 'city', label: 'Thành phố', placeholder: 'Hà Nội' },
                { key: 'phone', label: 'Điện thoại', placeholder: '1900 xxxx' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-gray-400 text-sm mb-1">{f.label}</label>
                  <input
                    type="text" placeholder={f.placeholder}
                    value={form[f.key] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Số phòng chiếu</label>
                <input
                  type="number" min={1} max={20}
                  value={form.totalScreens || 1} onChange={e => setForm(prev => ({ ...prev, totalScreens: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-cinema-gray-lighter text-gray-300 rounded-xl hover:bg-cinema-gray-light transition-colors">
                Hủy
              </button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 bg-cinema-red hover:bg-cinema-red-dark disabled:bg-gray-700 text-white rounded-xl font-semibold transition-colors">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CinemaManagement
