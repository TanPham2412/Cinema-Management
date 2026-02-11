import { useState, useEffect } from 'react'
import { Tag, Plus, Pencil, Trash2, X } from 'lucide-react'
import { genreService } from '../../services/genreService'

const GenreManagement = () => {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGenre, setEditingGenre] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    try {
      setLoading(true)
      const data = await genreService.getAllGenres()
      setGenres(data)
    } catch (error) {
      console.error('Error fetching genres:', error)
      alert('Không thể tải danh sách thể loại')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingGenre) {
        await genreService.updateGenre(editingGenre.id, formData)
        alert('Cập nhật thể loại thành công!')
      } else {
        await genreService.createGenre(formData)
        alert('Thêm thể loại thành công!')
      }
      
      setShowModal(false)
      resetForm()
      fetchGenres()
    } catch (error) {
      console.error('Error saving genre:', error)
      alert('Lỗi: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEdit = (genre) => {
    setEditingGenre(genre)
    setFormData({
      name: genre.name,
      description: genre.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thể loại này?')) return
    
    try {
      await genreService.deleteGenre(id)
      alert('Xóa thể loại thành công!')
      fetchGenres()
    } catch (error) {
      console.error('Error deleting genre:', error)
      alert('Xóa thể loại thất bại: ' + (error.response?.data?.message || error.message))
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setEditingGenre(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cinema-darker via-cinema-dark to-cinema-darker p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
              <Tag className="w-10 h-10 text-cinema-gold" />
              <span>Quản lý Thể loại</span>
            </h1>
            <p className="text-gray-400">Thêm, sửa, xóa thể loại phim</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="px-6 py-3 bg-gradient-to-r from-cinema-gold to-cinema-gold-dark text-cinema-darker font-semibold rounded-lg hover:from-cinema-gold-dark hover:to-cinema-gold transition-all duration-300 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm thể loại</span>
          </button>
        </div>

        {/* Genres Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Đang tải...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {genres.map((genre) => (
              <div
                key={genre.id}
                className="bg-cinema-gray-light/50 backdrop-blur-sm rounded-xl p-6 border border-cinema-gray-light hover:border-cinema-gold transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-5 h-5 text-cinema-gold" />
                    <h3 className="text-xl font-bold text-white">{genre.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(genre)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Sửa"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(genre.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-2">
                  {genre.description || 'Không có mô tả'}
                </p>
                <div className="text-xs text-gray-500">
                  Slug: {genre.slug}
                </div>
              </div>
            ))}
          </div>
        )}

        {genres.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            Chưa có thể loại nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-cinema-gray-light rounded-xl max-w-md w-full border border-cinema-gray-light">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-cinema-gray-light">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Tag className="w-6 h-6 text-cinema-gold" />
                <span>{editingGenre ? 'Sửa thể loại' : 'Thêm thể loại mới'}</span>
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tên thể loại <span className="text-cinema-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-gold"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Hành động, Tình cảm..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mô tả
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-gold"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về thể loại..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="px-6 py-2 bg-cinema-gray text-white rounded-lg hover:bg-cinema-gray-light transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-cinema-gold to-cinema-gold-dark text-cinema-darker font-semibold rounded-lg hover:from-cinema-gold-dark hover:to-cinema-gold transition-all duration-300"
                >
                  {editingGenre ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GenreManagement
