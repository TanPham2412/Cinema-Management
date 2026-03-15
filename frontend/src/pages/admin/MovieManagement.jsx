import { useState, useEffect } from 'react'
import { Film, Plus, Pencil, Trash2, Search, X, Upload, Image as ImageIcon } from 'lucide-react'
import movieService from '../../services/movieService'
import { genreService } from '../../services/genreService'

const MovieManagement = () => {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMovie, setEditingMovie] = useState(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [posterPreview, setPosterPreview] = useState(null)
  const [bannerPreview, setBannerPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    director: '',
    cast: '',
    duration: '',
    genreIds: [],
    language: '',
    country: '',
    releaseDate: '',
    posterUrl: '',
    trailerUrl: '',
    bannerUrl: '',
    ageRating: '',
    status: 'COMING_SOON'
  })

  useEffect(() => {
    fetchMovies()
    fetchGenres()
  }, [])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      const response = await movieService.getMovies({ size: 100 })
      setMovies(response.content || [])
    } catch (error) {
      console.error('Error fetching movies:', error)
      alert('Không thể tải danh sách phim')
    } finally {
      setLoading(false)
    }
  }

  const fetchGenres = async () => {
    try {
      const data = await genreService.getAllGenres()
      setGenres(data)
    } catch (error) {
      console.error('Error fetching genres:', error)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const response = await movieService.searchMovies({
        keyword: searchKeyword,
        status: selectedStatus || undefined,
        size: 100
      })
      setMovies(response.content || [])
    } catch (error) {
      console.error('Error searching movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePosterUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const response = await movieService.uploadPoster(file)
      setFormData(prev => ({ ...prev, posterUrl: response.url }))
      setPosterPreview(URL.createObjectURL(file))
      alert('Upload poster thành công!')
    } catch (error) {
      console.error('Error uploading poster:', error)
      alert('Upload poster thất bại: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploading(true)
      const response = await movieService.uploadBanner(file)
      setFormData(prev => ({ ...prev, bannerUrl: response.url }))
      setBannerPreview(URL.createObjectURL(file))
      alert('Upload banner thành công!')
    } catch (error) {
      console.error('Error uploading banner:', error)
      alert('Upload banner thất bại: ' + (error.response?.data?.message || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Convert genreIds from strings to numbers
      const dataToSubmit = {
        ...formData,
        duration: parseInt(formData.duration),
        genreIds: formData.genreIds.map(id => parseInt(id))
      }

      if (editingMovie) {
        await movieService.updateMovie(editingMovie.id, dataToSubmit)
        alert('Cập nhật phim thành công!')
      } else {
        await movieService.createMovie(dataToSubmit)
        alert('Thêm phim thành công!')
      }
      
      setShowModal(false)
      resetForm()
      fetchMovies()
    } catch (error) {
      console.error('Error saving movie:', error)
      alert('Lỗi: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleEdit = (movie) => {
    setEditingMovie(movie)
    setFormData({
      title: movie.title,
      description: movie.description,
      director: movie.director,
      cast: movie.cast,
      duration: movie.duration.toString(),
      genreIds: movie.genres.map(g => g.id.toString()),
      language: movie.language,
      country: movie.country,
      releaseDate: movie.releaseDate,
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || '',
      bannerUrl: movie.bannerUrl || '',
      ageRating: movie.ageRating || '',
      status: movie.status
    })
    setPosterPreview(movie.posterUrl ? `/api${movie.posterUrl}` : null)
    setBannerPreview(movie.bannerUrl ? `/api${movie.bannerUrl}` : null)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phim này?')) return
    
    try {
      await movieService.deleteMovie(id)
      alert('Xóa phim thành công!')
      fetchMovies()
    } catch (error) {
      console.error('Error deleting movie:', error)
      alert('Xóa phim thất bại: ' + (error.response?.data?.message || error.message))
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      director: '',
      cast: '',
      duration: '',
      genreIds: [],
      language: '',
      country: '',
      releaseDate: '',
      posterUrl: '',
      trailerUrl: '',
      bannerUrl: '',
      ageRating: '',
      status: 'COMING_SOON'
    })
    setEditingMovie(null)
    setPosterPreview(null)
    setBannerPreview(null)
  }

  const handleGenreToggle = (genreId) => {
    const genreIdStr = genreId.toString()
    setFormData(prev => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreIdStr)
        ? prev.genreIds.filter(id => id !== genreIdStr)
        : [...prev.genreIds, genreIdStr]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cinema-darker via-cinema-dark to-cinema-darker p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
            <Film className="w-10 h-10 text-cinema-red" />
            <span>Quản lý Phim</span>
          </h1>
          <p className="text-gray-400">Thêm, sửa, xóa phim và cập nhật thông tin</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-cinema-gray-light/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-cinema-gray-light">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên phim, đạo diễn, diễn viên..."
                className="w-full pl-10 pr-4 py-3 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <select
              className="px-4 py-3 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="NOW_SHOWING">Đang chiếu</option>
              <option value="COMING_SOON">Sắp chiếu</option>
              <option value="ENDED">Đã kết thúc</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-cinema-red to-cinema-red-dark text-white font-semibold rounded-lg hover:from-cinema-red-dark hover:to-cinema-red transition-all duration-300"
            >
              Tìm kiếm
            </button>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-6 py-3 bg-gradient-to-r from-cinema-gold to-cinema-gold-dark text-cinema-darker font-semibold rounded-lg hover:from-cinema-gold-dark hover:to-cinema-gold transition-all duration-300 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm phim</span>
            </button>
          </div>
        </div>

        {/* Movies Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Đang tải...</p>
          </div>
        ) : (
          <div className="bg-cinema-gray-light/50 backdrop-blur-sm rounded-xl overflow-hidden border border-cinema-gray-light">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-cinema-gray border-b border-cinema-gray-light">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cinema-gold">Poster</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cinema-gold">Tên phim</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cinema-gold">Đạo diễn</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cinema-gold">Thể loại</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cinema-gold">Thời lượng</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cinema-gold">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cinema-gold">Đánh giá</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cinema-gold">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cinema-gray-light">
                  {movies.map((movie) => (
                    <tr key={movie.id} className="hover:bg-cinema-gray/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-12 h-16 bg-cinema-gray rounded overflow-hidden">
                          {movie.posterUrl ? (
                            <img 
                              src={`/api${movie.posterUrl}`} 
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">{movie.title}</div>
                        <div className="text-gray-400 text-sm">{movie.releaseDate}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{movie.director}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {movie.genres.slice(0, 2).map(genre => (
                            <span key={genre.id} className="px-2 py-1 bg-cinema-red/20 text-cinema-gold text-xs rounded">
                              {genre.name}
                            </span>
                          ))}
                          {movie.genres.length > 2 && (
                            <span className="px-2 py-1 bg-cinema-gray text-gray-400 text-xs rounded">
                              +{movie.genres.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{movie.duration} phút</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          movie.status === 'NOW_SHOWING' 
                            ? 'bg-green-500/20 text-green-400' 
                            : movie.status === 'COMING_SOON'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {movie.status === 'NOW_SHOWING' ? 'Đang chiếu' : 
                           movie.status === 'COMING_SOON' ? 'Sắp chiếu' : 'Đã kết thúc'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1" title="Đánh giá từ người dùng">
                          <span className="text-cinema-gold">★</span>
                          <span className="text-white">{movie.rating ? movie.rating.toFixed(1) : 'Chưa có'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(movie)}
                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(movie.id)}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
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
            {movies.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                Không tìm thấy phim nào
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-cinema-gray-light rounded-xl max-w-4xl w-full my-8 border border-cinema-gray-light">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-cinema-gray-light">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Film className="w-6 h-6 text-cinema-red" />
                <span>{editingMovie ? 'Sửa phim' : 'Thêm phim mới'}</span>
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
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Images Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Poster Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Poster <span className="text-cinema-red">*</span>
                  </label>
                  <div className="relative">
                    {posterPreview ? (
                      <div className="relative aspect-[2/3] bg-cinema-gray rounded-lg overflow-hidden border-2 border-cinema-gray-light">
                        <img 
                          src={posterPreview} 
                          alt="Poster preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPosterPreview(null)
                            setFormData(prev => ({ ...prev, posterUrl: '' }))
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="aspect-[2/3] bg-cinema-gray rounded-lg border-2 border-dashed border-cinema-gray-light flex flex-col items-center justify-center cursor-pointer hover:border-cinema-red transition-colors">
                        <Upload className="w-12 h-12 text-gray-500 mb-2" />
                        <span className="text-gray-400 text-sm">Upload Poster</span>
                        <span className="text-gray-500 text-xs mt-1">JPG, PNG (Max 10MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePosterUpload}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Banner (Optional)
                  </label>
                  <div className="relative">
                    {bannerPreview ? (
                      <div className="relative aspect-[16/9] bg-cinema-gray rounded-lg overflow-hidden border-2 border-cinema-gray-light">
                        <img 
                          src={bannerPreview} 
                          alt="Banner preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBannerPreview(null)
                            setFormData(prev => ({ ...prev, bannerUrl: '' }))
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="aspect-[16/9] bg-cinema-gray rounded-lg border-2 border-dashed border-cinema-gray-light flex flex-col items-center justify-center cursor-pointer hover:border-cinema-gold transition-colors">
                        <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
                        <span className="text-gray-400 text-sm">Upload Banner</span>
                        <span className="text-gray-500 text-xs mt-1">JPG, PNG (Max 10MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                          disabled={uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tên phim <span className="text-cinema-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Mô tả <span className="text-cinema-red">*</span>
                  </label>
                  <textarea
                    required
                    rows="4"
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Đạo diễn <span className="text-cinema-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.director}
                    onChange={(e) => setFormData(prev => ({ ...prev, director: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Diễn viên <span className="text-cinema-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.cast}
                    onChange={(e) => setFormData(prev => ({ ...prev, cast: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Thời lượng (phút) <span className="text-cinema-red">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ngày phát hành <span className="text-cinema-red">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ngôn ngữ <span className="text-cinema-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quốc gia <span className="text-cinema-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phân loại tuổi
                  </label>
                  <select
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.ageRating}
                    onChange={(e) => setFormData(prev => ({ ...prev, ageRating: e.target.value }))}
                  >
                    <option value="">Chọn phân loại</option>
                    <option value="P">P - Phổ biến</option>
                    <option value="K">K - Dưới 13 tuổi có cha mẹ</option>
                    <option value="T13">T13 - Từ 13 tuổi</option>
                    <option value="T16">T16 - Từ 16 tuổi</option>
                    <option value="T18">T18 - Từ 18 tuổi</option>
                    <option value="C">C - Cấm chiếu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trạng thái <span className="text-cinema-red">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="COMING_SOON">Sắp chiếu</option>
                    <option value="NOW_SHOWING">Đang chiếu</option>
                    <option value="ENDED">Đã kết thúc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Trailer URL (YouTube)
                  </label>
                  <input
                    type="url"
                    className="w-full px-4 py-2 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cinema-red"
                    value={formData.trailerUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, trailerUrl: e.target.value }))}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Thể loại <span className="text-cinema-red">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => handleGenreToggle(genre.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        formData.genreIds.includes(genre.id.toString())
                          ? 'bg-gradient-to-r from-cinema-red to-cinema-red-dark text-white'
                          : 'bg-cinema-gray text-gray-400 hover:bg-cinema-gray-light'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
                {formData.genreIds.length === 0 && (
                  <p className="text-cinema-red text-sm mt-2">Vui lòng chọn ít nhất 1 thể loại</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-4 border-t border-cinema-gray-light">
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
                  disabled={uploading || formData.genreIds.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-cinema-red to-cinema-red-dark text-white font-semibold rounded-lg hover:from-cinema-red-dark hover:to-cinema-red transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Đang upload...' : editingMovie ? 'Cập nhật' : 'Thêm phim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MovieManagement
