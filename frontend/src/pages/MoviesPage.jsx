import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Film, Star, ChevronLeft, ChevronRight, X, Ticket } from 'lucide-react'
import movieService from '../services/movieService'
import { genreService } from '../services/genreService'
import ScreeningModal from '../components/ScreeningModal'

const MovieCard = ({ movie, onBuyTicket }) => {
  const isNowShowing = movie.status === 'NOW_SHOWING'
  const isComingSoon = movie.status === 'COMING_SOON'

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden bg-cinema-dark border border-cinema-gray-light hover:border-cinema-red/40 transition-all hover:shadow-xl hover:shadow-cinema-red/10">
      {/* Poster */}
      <Link to={`/movies/${movie.id}`} className="block relative overflow-hidden aspect-[2/3]">
        {movie.posterUrl ? (
          <img
            src={`/api${movie.posterUrl}`}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-cinema-gray-light">
            <Film className="w-16 h-16 text-gray-600" />
          </div>
        )}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* HOT ribbon - top right */}
        {isNowShowing && (
          <div className="absolute top-0 right-0">
            <div className="bg-cinema-red text-white text-[10px] font-black px-2 py-0.5 rounded-bl-lg tracking-widest">
              HOT
            </div>
          </div>
        )}

        {/* Age rating - top left */}
        {movie.ageRating && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-white ${
            movie.ageRating === 'T18' ? 'bg-red-600' :
            movie.ageRating === 'T16' ? 'bg-orange-500' :
            movie.ageRating === 'T13' ? 'bg-yellow-500 text-black' :
            'bg-green-600'
          }`}>
            {movie.ageRating}
          </div>
        )}

        {/* Rating */}
        {movie.rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-cinema-gold fill-cinema-gold" />
            <span className="text-white text-xs font-bold">{movie.rating.toFixed(1)}</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3">
        <Link to={`/movies/${movie.id}`}>
          <h3 className={`font-bold text-sm sm:text-base mb-1.5 sm:mb-2 line-clamp-2 leading-snug group-hover:text-cinema-gold transition-colors ${
            isNowShowing ? 'text-white' : 'text-gray-300'
          }`}>
            {movie.title}
          </h3>
        </Link>

        {movie.genres?.length > 0 && (
          <p className="text-gray-400 text-[11px] sm:text-xs mb-1 line-clamp-1">
            <span className="text-gray-500">Thể loại: </span>
            {movie.genres.map(g => g.name).join(', ')}
          </p>
        )}

        <p className="text-gray-400 text-[11px] sm:text-xs mb-2 sm:mb-3">
          <span className="text-gray-500">Thời lượng: </span>
          {movie.duration} phút
        </p>

        {/* MUA VÉ button */}
        {isNowShowing ? (
          <button
            onClick={() => onBuyTicket(movie)}
            className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 bg-cinema-red hover:bg-red-700 active:scale-[0.97] text-white text-sm font-bold rounded-xl transition-all"
          >
            <Ticket className="w-4 h-4" />
            MUA VÉ
          </button>
        ) : isComingSoon ? (
          <div className="mt-auto flex items-center justify-center w-full py-2 bg-cinema-gray-light text-gray-500 text-xs font-medium rounded-xl">
            {movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : 'Sắp chiếu'}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const MoviesPage = () => {
  const [searchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all')
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [buyTicketMovie, setBuyTicketMovie] = useState(null)

  useEffect(() => {
    genreService.getAllGenres().then(setGenres).catch(console.error)
  }, [])

  useEffect(() => {
    fetchMovies()
  }, [activeTab, keyword, selectedGenre, selectedLanguage, page])

  const fetchMovies = async () => {
    setLoading(true)
    try {
      if (activeTab === 'now-showing') {
        const data = await movieService.getNowShowing()
        setMovies(data); setTotalPages(1); setTotalElements(data.length)
      } else if (activeTab === 'coming-soon') {
        const data = await movieService.getComingSoon()
        setMovies(data); setTotalPages(1); setTotalElements(data.length)
      } else {
        const res = await movieService.searchMovies({
          keyword: keyword || undefined,
          genreId: selectedGenre || undefined,
          language: selectedLanguage || undefined,
          excludeEnded: true,
          page, size: 12, sortBy: 'releaseDate', sortDirection: 'DESC',
        })
        setMovies(res.content || [])
        setTotalPages(res.totalPages || 0)
        setTotalElements(res.totalElements || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setKeyword(searchInput)
    setPage(0)
  }

  const clearFilters = () => {
    setKeyword(''); setSearchInput(''); setSelectedGenre(''); setSelectedLanguage(''); setPage(0)
  }

  const hasFilters = keyword || selectedGenre || selectedLanguage

  return (
    <div className="min-h-screen bg-cinema-darker">
      {/* Top Bar */}
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-5">Danh sách phim</h1>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm phim, đạo diễn, diễn viên..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-cinema-gray-light border border-cinema-gray-lighter text-white rounded-lg focus:outline-none focus:border-cinema-red placeholder-gray-500"
              />
            </div>
            <button type="submit" className="px-6 py-3 bg-cinema-red hover:bg-cinema-red-dark text-white rounded-lg font-medium transition-colors">
              Tìm
            </button>
          </form>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Tất cả' },
              { key: 'now-showing', label: '🔥 Đang chiếu' },
              { key: 'coming-soon', label: '📅 Sắp chiếu' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(0) }}
                className={`px-5 py-2 rounded-full font-medium transition-colors text-sm ${
                  activeTab === tab.key
                    ? 'bg-cinema-red text-white'
                    : 'bg-cinema-gray-light text-gray-300 hover:bg-cinema-gray-lighter'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Filters */}
        <div className="flex gap-2 sm:gap-3 mb-6 flex-wrap items-center">
          <select
            value={selectedGenre}
            onChange={e => { setSelectedGenre(e.target.value); setPage(0) }}
            className="flex-1 min-w-[120px] sm:flex-none px-3 sm:px-4 py-2 bg-cinema-gray-light border border-cinema-gray-lighter text-gray-300 rounded-lg focus:outline-none focus:border-cinema-red text-sm"
          >
            <option value="">Tất cả thể loại</option>
            {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <select
            value={selectedLanguage}
            onChange={e => { setSelectedLanguage(e.target.value); setPage(0) }}
            className="flex-1 min-w-[120px] sm:flex-none px-3 sm:px-4 py-2 bg-cinema-gray-light border border-cinema-gray-lighter text-gray-300 rounded-lg focus:outline-none focus:border-cinema-red text-sm"
          >
            <option value="">Tất cả ngôn ngữ</option>
            {['Tiếng Việt', 'Tiếng Anh', 'Tiếng Hàn', 'Tiếng Nhật', 'Tiếng Trung'].map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 bg-cinema-gray-light text-gray-300 hover:bg-cinema-gray-lighter rounded-lg text-sm">
              <X className="w-4 h-4" /> Xóa lọc
            </button>
          )}

          <span className="w-full sm:w-auto sm:ml-auto text-gray-400 text-sm text-right">{totalElements} phim</span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[2/3] bg-cinema-gray-light rounded-xl mb-3" />
                <div className="h-4 bg-cinema-gray-light rounded mb-2" />
                <div className="h-3 bg-cinema-gray-light rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-24">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Không tìm thấy phim nào</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 px-5 py-2 bg-cinema-red text-white rounded-lg hover:bg-cinema-red-dark">
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {movies.map(movie => <MovieCard key={movie.id} movie={movie} onBuyTicket={setBuyTicketMovie} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg bg-cinema-gray-light text-white disabled:opacity-40 hover:bg-cinema-gray-lighter transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-9 h-9 rounded-lg font-medium text-sm transition-colors ${
                  page === i ? 'bg-cinema-red text-white' : 'bg-cinema-gray-light text-gray-300 hover:bg-cinema-gray-lighter'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg bg-cinema-gray-light text-white disabled:opacity-40 hover:bg-cinema-gray-lighter transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Screening Modal */}
      {buyTicketMovie && (
        <ScreeningModal
          movieId={buyTicketMovie.id}
          movieTitle={buyTicketMovie.title}
          movieDuration={buyTicketMovie.duration}
          moviePosterUrl={buyTicketMovie.posterUrl}
          movieGenres={buyTicketMovie.genres?.map(g => g.name || g).join(', ')}
          movieRating={buyTicketMovie.ageRating}
          onClose={() => setBuyTicketMovie(null)}
        />
      )}
    </div>
  )
}

export default MoviesPage
