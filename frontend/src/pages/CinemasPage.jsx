import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, MapPin, Phone, Monitor, Search, ChevronRight } from 'lucide-react'
import cinemaService from '../services/cinemaService'

const CinemasPage = () => {
  const navigate = useNavigate()
  const [cinemas, setCinemas] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')

  useEffect(() => { fetchCinemas() }, [])

  const fetchCinemas = async () => {
    try {
      const data = await cinemaService.getCinemas()
      setCinemas(data)
    } catch {
      setCinemas([])
    } finally {
      setLoading(false)
    }
  }

  const cities = ['all', ...new Set(cinemas.map(c => c.city).filter(Boolean))]

  const filtered = cinemas.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address?.toLowerCase().includes(search.toLowerCase())
    const matchCity = selectedCity === 'all' || c.city === selectedCity
    return matchSearch && matchCity
  })

  return (
    <div className="min-h-screen bg-cinema-darker">
      {/* Hero */}
      <div className="bg-gradient-to-b from-cinema-dark to-cinema-darker py-14 border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Hệ thống rạp chiếu phim</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Rạp chiếu phim</h1>
          <p className="text-gray-400 max-w-md mx-auto">Tìm rạp gần bạn và đặt vé ngay hôm nay</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text" placeholder="Tìm rạp theo tên, địa chỉ..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-cinema-gray border border-cinema-gray-light text-white rounded-lg focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {cities.map(city => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCity === city
                    ? 'bg-blue-600 text-white'
                    : 'bg-cinema-gray border border-cinema-gray-light text-gray-400 hover:text-white'
                }`}
              >
                {city === 'all' ? 'Tất cả' : city}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-cinema-gray rounded-2xl h-52 border border-cinema-gray-light" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Không tìm thấy rạp</p>
            <p className="text-gray-600 text-sm mt-1">Thử thay đổi từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(cinema => (
              <div
                key={cinema.id}
                className="group bg-cinema-gray rounded-2xl border border-cinema-gray-light hover:border-blue-500/50 transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => navigate(`/cinemas/${cinema.id}`)}
              >
                {/* Color top bar */}
                <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-700" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors leading-tight">
                          {cinema.name}
                        </h3>
                        {cinema.city && (
                          <span className="text-xs text-blue-400 font-medium">{cinema.city}</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2 text-gray-400">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cinema.address}</span>
                    </div>
                    {cinema.phoneNumber && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{cinema.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-cinema-gray-light flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                      <Monitor className="w-4 h-4" />
                      <span>{cinema.totalScreens || 0} phòng chiếu</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      cinema.active !== false
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {cinema.active !== false ? 'Đang hoạt động' : 'Tạm đóng'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CinemasPage
