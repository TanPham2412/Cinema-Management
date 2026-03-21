import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, ShoppingBag, ChevronLeft, Check, X, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import comboService from '../../services/comboService'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  available: true,
}

const ComboManagement = () => {
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCombo, setEditingCombo] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchCombos = async () => {
    setLoading(true)
    try {
      const data = await comboService.getAllCombos()
      setCombos(data)
    } catch {
      toast.error('Không thể tải danh sách combo')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCombos()
  }, [])

  const openCreate = () => {
    setEditingCombo(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (combo) => {
    setEditingCombo(combo)
    setForm({
      name: combo.name,
      description: combo.description || '',
      price: combo.price,
      imageUrl: combo.imageUrl || '',
      available: combo.available,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCombo(null)
    setForm(EMPTY_FORM)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên combo')
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) return toast.error('Giá combo phải lớn hơn 0')

    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
      }
      if (editingCombo) {
        await comboService.updateCombo(editingCombo.id, payload)
        toast.success('Cập nhật combo thành công!')
      } else {
        await comboService.createCombo(payload)
        toast.success('Thêm combo mới thành công!')
      }
      closeModal()
      fetchCombos()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAvailable = async (combo) => {
    try {
      await comboService.updateCombo(combo.id, { ...combo, available: !combo.available })
      toast.success(combo.available ? 'Đã ẩn combo' : 'Đã hiển thị combo')
      fetchCombos()
    } catch {
      toast.error('Không thể cập nhật trạng thái')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await comboService.deleteCombo(deleteId)
      toast.success('Đã xóa combo')
      setDeleteId(null)
      fetchCombos()
    } catch {
      toast.error('Không thể xóa combo. Combo có thể đang được sử dụng trong đơn đặt vé.')
    }
  }

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

  return (
    <div className="min-h-screen bg-gradient-to-b from-cinema-darker via-cinema-dark to-cinema-darker p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 text-gray-400 hover:text-white hover:bg-cinema-gray-light rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-pink-400" />
                Quản lý Combo
              </h1>
              <p className="text-gray-400 mt-1">Thêm, sửa, xóa combo bắp nước</p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all shadow-lg shadow-pink-500/30"
          >
            <Plus className="w-5 h-5" />
            Thêm Combo
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Chưa có combo nào</p>
            <button onClick={openCreate} className="mt-4 text-pink-400 hover:text-pink-300 underline text-sm">
              Thêm combo đầu tiên
            </button>
          </div>
        ) : (
          <div className="bg-cinema-gray border border-cinema-gray-light rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cinema-gray-light bg-cinema-darker/50">
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Tên Combo</th>
                  <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Mô tả</th>
                  <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm">Giá</th>
                  <th className="text-center px-6 py-4 text-gray-400 font-medium text-sm">Trạng thái</th>
                  <th className="text-center px-6 py-4 text-gray-400 font-medium text-sm">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {combos.map((combo, idx) => (
                  <tr
                    key={combo.id}
                    className={`border-b border-cinema-gray-light/40 hover:bg-cinema-gray-light/20 transition-colors ${
                      idx % 2 === 0 ? '' : 'bg-white/[0.02]'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center shrink-0">
                          <ShoppingBag className="w-5 h-5 text-pink-400" />
                        </div>
                        <span className="text-white font-semibold">{combo.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm max-w-xs">
                      <span className="line-clamp-2">{combo.description || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-cinema-gold font-bold">{formatPrice(combo.price)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleAvailable(combo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          combo.available
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                      >
                        {combo.available ? (
                          <>
                            <ToggleRight className="w-3.5 h-3.5" />
                            Hiển thị
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5" />
                            Đã ẩn
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(combo)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(combo.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-cinema-darker border border-cinema-gray-light rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-cinema-gray-light">
              <h2 className="text-xl font-bold text-white">
                {editingCombo ? 'Cập nhật Combo' : 'Thêm Combo mới'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Tên Combo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="VD: Combo Bắp + Nước"
                  className="w-full bg-cinema-gray border border-cinema-gray-light text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 placeholder-gray-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Mô tả</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="VD: TIẾT KIỆM 28K!!! Gồm: 1 Bắp (69oz) + 1 Nước có gas (22oz)"
                  className="w-full bg-cinema-gray border border-cinema-gray-light text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 placeholder-gray-500 resize-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Giá (VNĐ) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  min={1000}
                  step={1000}
                  placeholder="VD: 79000"
                  className="w-full bg-cinema-gray border border-cinema-gray-light text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 placeholder-gray-500"
                />
                {form.price > 0 && (
                  <p className="text-xs text-pink-300 mt-1">
                    ≈ {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(form.price))}
                  </p>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">URL hình ảnh</label>
                <input
                  type="text"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleChange}
                  placeholder="https://... (tùy chọn)"
                  className="w-full bg-cinema-gray border border-cinema-gray-light text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-400 placeholder-gray-500"
                />
              </div>

              {/* Available */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="available"
                  name="available"
                  checked={form.available}
                  onChange={handleChange}
                  className="w-4 h-4 accent-pink-500 cursor-pointer"
                />
                <label htmlFor="available" className="text-sm text-gray-300 cursor-pointer select-none">
                  Hiển thị combo này cho khách hàng
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-cinema-gray-light text-gray-300 hover:text-white hover:border-gray-400 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingCombo ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-cinema-darker border border-cinema-gray-light rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Xóa Combo?</h3>
                <p className="text-gray-400 text-sm">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-cinema-gray-light text-gray-300 hover:text-white rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComboManagement
