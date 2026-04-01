import { useState, useEffect } from 'react'
import { Film, Ticket, Star, TrendingUp, Clock, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import movieService from '../services/movieService'

const MovieCard = ({ movie }) => {
  const badge = movie.status === 'NOW_SHOWING'
    ? { text: 'Đang chiếu', color: 'bg-green-500' }
    : { text: 'Sắp chiếu', color: 'bg-cinema-gold text-cinema-darker' }
  return (
    <Link to={`/movies/${movie.id}`} className="group cursor-pointer">
      <div className="relative overflow-hidden rounded-xl bg-cinema-gray-light aspect-[2/3] mb-3">
        {movie.posterUrl ? (
          <img
            src={`/api${movie.posterUrl}`}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-16 h-16 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <span className={`absolute top-2 right-2 px-2 py-0.5 ${badge.color} text-white text-xs font-bold rounded`}>
          {badge.text}
        </span>
        {movie.rating && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded">
            <Star className="w-3 h-3 text-cinema-gold fill-cinema-gold" />
            <span className="text-white text-xs font-semibold">{movie.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <h3 className="text-white font-semibold text-sm mb-1 group-hover:text-cinema-gold transition-colors line-clamp-2">{movie.title}</h3>
      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <Clock className="w-3 h-3" />
        <span>{movie.duration} phút</span>
        {movie.genres?.length > 0 && (
          <span className="text-cinema-gold">• {movie.genres[0].name}</span>
        )}
      </div>
    </Link>
  )
}

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-[2/3] bg-cinema-gray-light rounded-xl mb-3"></div>
    <div className="h-4 bg-cinema-gray-light rounded mb-2"></div>
    <div className="h-3 bg-cinema-gray-light rounded w-2/3"></div>
  </div>
)

const HomePage = () => {
  const [nowShowing, setNowShowing] = useState([])
  const [comingSoon, setComingSoon] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const [nowData, soonData] = await Promise.all([
          movieService.getNowShowing(),
          movieService.getComingSoon(),
        ])
        setNowShowing(nowData.slice(0, 8))
        setComingSoon(soonData.slice(0, 8))
      } catch (err) {
        console.error('Error fetching movies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [])

  return (
    <div className="bg-gradient-to-b from-cinema-darker via-cinema-dark to-cinema-darker min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0">
          <div className="absolute w-96 h-96 -top-48 -left-48 bg-cinema-red opacity-20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute w-96 h-96 -bottom-48 -right-48 bg-cinema-gold opacity-20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 py-12 sm:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-cinema-red/20 border border-cinema-red/30 rounded-full px-6 py-2 mb-8">
              <Star className="w-4 h-4 text-cinema-gold fill-cinema-gold" />
              <span className="text-cinema-gold text-sm font-medium">Trải nghiệm điện ảnh đẳng cấp quốc tế</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6">
              <span className="bg-gradient-to-r from-white via-cinema-gold to-white bg-clip-text text-transparent">
                Chào mừng đến
              </span>
              <br />
              <span className="bg-gradient-to-r from-cinema-red via-cinema-gold to-cinema-red bg-clip-text text-transparent">
                LLMCinema
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Đặt vé xem phim online nhanh chóng và tiện lợi. Trải nghiệm hệ thống rạp hiện đại với công nghệ âm thanh hình ảnh vượt trội
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/movies" 
                className="group relative px-8 py-4 bg-gradient-to-r from-cinema-red to-cinema-red-dark hover:from-cinema-red-dark hover:to-cinema-red text-white font-semibold rounded-lg transition-all duration-300 shadow-lg shadow-cinema-red/50 hover:shadow-xl hover:shadow-cinema-red/60 flex items-center space-x-2"
              >
                <Film className="w-5 h-5" />
                <span>Xem phim ngay</span>
              </Link>
              <Link 
                to="/cinemas" 
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-cinema-gray-light text-white font-semibold rounded-lg transition-all duration-300 backdrop-blur-sm flex items-center space-x-2"
              >
                <Ticket className="w-5 h-5" />
                <span>Hệ thống rạp</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-cinema-gray-light bg-cinema-gray/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-cinema-gold mb-2">100+</div>
              <div className="text-gray-400 text-sm">Bộ phim</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-cinema-gold mb-2">50+</div>
              <div className="text-gray-400 text-sm">Rạp chiếu</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-cinema-gold mb-2">1M+</div>
              <div className="text-gray-400 text-sm">Thành viên</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-cinema-gold mb-2">500+</div>
              <div className="text-gray-400 text-sm">Suất chiếu/ngày</div>
            </div>
          </div>
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center space-x-2 sm:space-x-3">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-cinema-red" />
              <span>Phim đang chiếu</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">Những bộ phim hot nhất hiện nay</p>
          </div>
          <Link to="/movies" className="text-cinema-gold hover:text-cinema-gold-dark transition-colors flex items-center space-x-1">
            <span>Xem tất cả</span><span>→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : nowShowing.length === 0
              ? <p className="text-gray-400 col-span-full text-center py-8">Chưa có phim đang chiếu</p>
              : nowShowing.map(movie => <MovieCard key={movie.id} movie={movie} />)
          }
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="container mx-auto px-4 py-8 sm:py-16">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 flex items-center space-x-2 sm:space-x-3">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-cinema-gold" />
              <span>Phim sắp chiếu</span>
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">Những bộ phim đáng mong chờ</p>
          </div>
          <Link to="/movies" className="text-cinema-gold hover:text-cinema-gold-dark transition-colors flex items-center space-x-1">
            <span>Xem tất cả</span><span>→</span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {loading
            ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            : comingSoon.length === 0
              ? <p className="text-gray-400 col-span-full text-center py-8">Chưa có phim sắp chiếu</p>
              : comingSoon.map(movie => <MovieCard key={movie.id} movie={movie} />)
          }
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-cinema-gray/30 border-y border-cinema-gray-light">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="bg-cinema-gray-light/50 backdrop-blur-sm rounded-xl p-6 border border-cinema-gray-light hover:border-cinema-red transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-cinema-red to-cinema-red-dark rounded-lg flex items-center justify-center mb-4">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Đặt vé online</h3>
              <p className="text-gray-400">Chọn ghế, thanh toán nhanh chóng và nhận vé điện tử ngay lập tức</p>
            </div>
            <div className="bg-cinema-gray-light/50 backdrop-blur-sm rounded-xl p-6 border border-cinema-gray-light hover:border-cinema-gold transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-cinema-gold to-cinema-gold-dark rounded-lg flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-cinema-darker" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Thành viên VIP</h3>
              <p className="text-gray-400">Tích điểm, nhận uu đãi và giảm giá đặc biệt</p>
            </div>
            <div className="bg-cinema-gray-light/50 backdrop-blur-sm rounded-xl p-6 border border-cinema-gray-light hover:border-cinema-red transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-cinema-red to-cinema-red-dark rounded-lg flex items-center justify-center mb-4">
                <Film className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Chất lượng cao</h3>
              <p className="text-gray-400">Màn hình lớn, âm thanh Dolby Atmos, ghế nằm thư giãn</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
