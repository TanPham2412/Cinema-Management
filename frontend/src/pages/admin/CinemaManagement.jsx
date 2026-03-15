import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Building2, MapPin, Phone, Search, X, Monitor, ChevronDown, ChevronUp } from 'lucide-react'
import cinemaService from '../../services/cinemaService'

const EMPTY_FORM = { name: '', address: '', phoneNumber: '', city: '', description: '' }
const EMPTY_SCREEN = { name: '', rowCount: 8, seatsPerRow: 10, vipRows: 0 }

const CinemaManagement = () => {
  const [cinemas, setCinemas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [screenCinema, setScreenCinema] = useState(null)
  const [screens, setScreens] = useState([])
  const [loadingScreens, setLoadingScreens] = useState(false)
  const [showScreenModal, setShowScreenModal] = useState(false)
  const [screenForm, setScreenForm] = useState(EMPTY_SCREEN)
  const [savingScreen, setSavingScreen] = useState(false)

  useEffect(() => { fetchCinemas() }, [])

  const fetchCinemas = async () => {
    try {
      setLoading(true)
      const data = await cinemaService.getAdminCinemas()
      setCinemas(data)
    } catch {
      setError('API chưa sẵn sàng — hiển thị dữ liệu mẫu')
      setCinemas([
        { id: 1, name: 'CGV Vincom Center', address: '191 Bà Triệu, Hà Nội', phoneNumber: '1900 6017', city: 'Hà Nội', totalScreens: 8 },
        { id: 2, name: 'CGV Aeon Mall', address: '27 Cổ Linh, Long Biên, Hà Nội', phoneNumber: '1900 6017', city: 'Hà Nội', totalScreens: 6 },
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
      const payload = { name: form.name, address: form.address, city: form.city, phoneNumber: form.phoneNumber, description: form.description }
      if (editing) await cinemaService.updateCinema(editing, payload)
      else await cinemaService.createCinema(payload)
      await fetchCinemas()
      closeModal()
    } catch {
      alert('Lưu rạp thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa rạp này?')) return
    try {
      await cinemaService.deleteCinema(id)
      setCinemas(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Xóa rạp thất bại')
    }
  }

  const openScreenManage = async (cinema) => {
    setScreenCinema(cinema)
    setLoadingScreens(true)
    try {
      const data = await cinemaService.getScreensByCinema(cinema.id)
      setScreens(data)
    } catch {
      setScreens([])
    } finally {
      setLoadingScreens(false)
    }
  }

  const closeScreenPanel = () => { setScreenCinema(null); setScreens([]) }

  const handleAddScreen = async () => {
    if (!screenForm.name.trim()) return
    setSavingScreen(true)
    try {
      const payload = {
        name: screenForm.name,
        rowCount: parseInt(screenForm.rowCount) || 8,
        seatsPerRow: parseInt(screenForm.seatsPerRow) || 10,
        vipRows: parseInt(screenForm.vipRows) || 0,
      }
      const newScreen = await cinemaService.addScreen(screenCinema.id, payload)
      setScreens(prev => [...prev, newScreen])
      setScreenForm(EMPTY_SCREEN)
      setShowScreenModal(false)
      fetchCinemas()
    } catch (err) {
      alert(err?.response?.data?.message || 'Thêm phòng thất bại')
    } finally {
      setSavingScreen(false)
    }
  }

  const filtered = cinemas.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  )

  const totalSeatsPreview = parseInt(screenForm.rowCount || 0) * parseInt(screenForm.seatsPerRow || 0)

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

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text" placeholder="Tìm rạp theo tên, thành phố..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-cinema-red text-sm"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(4)].map((_, i) => <div key={i} className="animate-pulse bg-cinema-gray rounded-xl h-48 border border-cinema-gray-light" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(cinema => (
              <div key={cinema.id} className="bg-cinema-gray rounded-xl border border-cinema-gray-light overflow-hidden hover:border-blue-500/50 transition-colors">
                <div className="p-5">
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
                      <button onClick={() => openEdit(cinema)} className="p-1.5 text-gray-400 hover:text-cinema-gold hover:bg-cinema-gray-light rounded-lg transition-colors" title="Sửa rạp">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cinema.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-cinema-gray-light rounded-lg transition-colors" title="Xóa rạp">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-start gap-2 text-gray-400">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cinema.address}</span>
                    </div>
                    {cinema.phoneNumber && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="w-4 h-4" />
                        <span>{cinema.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-cinema-gray-light">
                  <button
                    onClick={() => screenCinema?.id === cinema.id ? closeScreenPanel() : openScreenManage(cinema)}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-cinema-gray-light transition-colors"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Monitor className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Phòng chiếu</span>
                      <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                        {cinema.totalScreens || 0}
                      </span>
                    </div>
                    {screenCinema?.id === cinema.id
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {screenCinema?.id === cinema.id && (
                    <div className="px-5 pb-4 space-y-2">
                      {loadingScreens ? (
                        <div className="text-gray-500 text-xs py-2">Đang tải...</div>
                      ) : screens.length === 0 ? (
                        <div className="text-gray-500 text-xs py-1">Chưa có phòng chiếu nào</div>
                      ) : (
                        screens.map(s => (
                          <div key={s.id} className="flex items-center justify-between bg-cinema-gray-light rounded-lg px-3 py-2 text-sm">
                            <span className="text-white font-medium">{s.name}</span>
                            <span className="text-gray-400 text-xs">{s.totalSeats} ghế</span>
                          </div>
                        ))
                      )}
                      <button
                        onClick={() => { setShowScreenModal(true); setScreenForm(EMPTY_SCREEN) }}
                        className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 border border-dashed border-blue-500/40 text-blue-400 hover:bg-blue-500/10 rounded-lg text-sm transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm phòng chiếu
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                { key: 'phoneNumber', label: 'Điện thoại', placeholder: '1900 xxxx' },
                { key: 'description', label: 'Mô tả', placeholder: 'Mô tả rạp...' },
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
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-cinema-gray-lighter text-gray-300 rounded-xl hover:bg-cinema-gray-light transition-colors">Hủy</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 py-2.5 bg-cinema-red hover:bg-cinema-red-dark disabled:bg-gray-700 text-white rounded-xl font-semibold transition-colors">
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showScreenModal && screenCinema && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cinema-gray rounded-2xl border border-cinema-gray-light w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-cinema-gray-light">
              <div>
                <h2 className="text-xl font-bold text-white">Thêm phòng chiếu</h2>
                <p className="text-gray-400 text-sm mt-0.5">{screenCinema.name}</p>
              </div>
              <button onClick={() => setShowScreenModal(false)}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Tên phòng *</label>
                <input
                  type="text" placeholder="Phòng 1, Phòng IMAX..."
                  value={screenForm.name} onChange={e => setScreenForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Số hàng</label>
                  <input
                    type="number" min={1} max={26}
                    value={screenForm.rowCount} onChange={e => setScreenForm(p => ({ ...p, rowCount: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <p className="text-gray-500 text-xs mt-1">Tối đa 26 hàng (A–Z)</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Ghế mỗi hàng</label>
                  <input
                    type="number" min={1} max={30}
                    value={screenForm.seatsPerRow} onChange={e => setScreenForm(p => ({ ...p, seatsPerRow: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Số hàng VIP <span className="text-gray-500">(tính từ hàng A)</span></label>
                <input
                  type="number" min={0} max={screenForm.rowCount}
                  value={screenForm.vipRows} onChange={e => setScreenForm(p => ({ ...p, vipRows: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Tổng ghế:</span>
                  <span className="font-semibold text-white">{totalSeatsPreview} ghế</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs mt-1">
                  <span>Ghế VIP:</span>
                  <span>{parseInt(screenForm.vipRows || 0) * parseInt(screenForm.seatsPerRow || 0)} ghế</span>
                </div>
                <div className="flex justify-between text-gray-400 text-xs">
                  <span>Ghế thường:</span>
                  <span>{(parseInt(screenForm.rowCount || 0) - parseInt(screenForm.vipRows || 0)) * parseInt(screenForm.seatsPerRow || 0)} ghế</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowScreenModal(false)} className="flex-1 py-2.5 border border-cinema-gray-lighter text-gray-300 rounded-xl hover:bg-cinema-gray-light transition-colors">Hủy</button>
              <button onClick={handleAddScreen} disabled={savingScreen || !screenForm.name.trim()} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-xl font-semibold transition-colors">
                {savingScreen ? 'Đang tạo...' : 'Tạo phòng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CinemaManagement