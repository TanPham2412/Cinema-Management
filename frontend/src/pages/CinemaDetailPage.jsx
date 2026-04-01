import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Building2, MapPin, Phone, Monitor, Clock, Film, ChevronRight } from 'lucide-react'
import cinemaService from '../services/cinemaService'
import screeningService from '../services/screeningService'

const PRICE_LABELS = {
  EARLY_BIRD: { label: 'Suất sớm', color: 'text-blue-400' },
  NORMAL: { label: 'Bình thường', color: 'text-gray-400' },
  PRIME_TIME: { label: 'Giờ vàng', color: 'text-yellow-400' },
  HOLIDAY: { label: 'Ngày lễ', color: 'text-red-400' },
}

const CinemaDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cinema, setCinema] = useState(null)
  const [screens, setScreens] = useState([])
  const [screenings, setScreenings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

  // 7-day date slider
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000)
    return d.toISOString().slice(0, 10)
  })
  const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  useEffect(() => {
    const load = async () => {
      try {
        const [cinemaData, screensData, screeningsData] = await Promise.all([
          cinemaService.getCinemaById(id),
          cinemaService.getScreensByCinema(id),
          screeningService.getScreeningsByCinema(id),
        ])
        setCinema(cinemaData)
        setScreens(screensData)
        setScreenings(screeningsData)
      } catch {
        navigate('/cinemas')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const fmt = (isoStr) => {
    const d = new Date(isoStr)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const dayScreenings = screenings.filter(s => s.startTime?.startsWith(selectedDate))

  // Group by screen
  const byScreen = dayScreenings.reduce((acc, s) => {
    const key = s.screenName || `Phòng ${s.screenId}`
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-cinema-darker flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cinema-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!cinema) return null

  return (
    <div className="min-h-screen bg-cinema-darker">
      {/* Header */}
      <div className="bg-cinema-gray border-b border-cinema-gray-light">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-1">
            <button onClick={() => navigate('/cinemas')} className="text-gray-400 hover:text-white mt-1 sm:mt-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Building2 className="w-5 h-5 text-blue-400 shrink-0 mt-1 sm:mt-0" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">{cinema.name}</h1>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 ml-7 sm:ml-8 mt-2 text-sm text-gray-400">
            {cinema.address && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{cinema.address}{cinema.city ? `, ${cinema.city}` : ''}</span>
              </div>
            )}
            {cinema.phoneNumber && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>{cinema.phoneNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Monitor className="w-4 h-4" />
              <span>{screens.length} phòng chiếu</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Screens info */}
        {screens.length > 0 && (
          <div className="mb-8">
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-blue-400" />
              Phòng chiếu
            </h2>
            <div className="flex flex-wrap gap-2">
              {screens.map(s => (
                <div key={s.id} className="px-3 py-1.5 bg-cinema-gray border border-cinema-gray-light rounded-lg text-sm text-gray-300">
                  {s.name} <span className="text-gray-500">({s.totalSeats} ghế)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screenings */}
        <div>
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Film className="w-4 h-4 text-cinema-red" />
            Lịch chiếu phim
          </h2>

          {/* Date slider */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {dates.map(date => {
              const d = new Date(date)
              const isToday = date === new Date().toISOString().slice(0, 10)
              const count = screenings.filter(s => s.startTime?.startsWith(date)).length
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex flex-col items-center px-4 py-2.5 rounded-xl shrink-0 transition-all border ${
                    selectedDate === date
                      ? 'bg-cinema-red border-cinema-red text-white'
                      : 'bg-cinema-gray border-cinema-gray-light text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  <span className="text-xs font-medium">{isToday ? 'Hôm nay' : DAY_NAMES[d.getDay()]}</span>
                  <span className="text-sm font-bold mt-0.5">
                    {String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}
                  </span>
                  {count > 0 && (
                    <span className={`text-[10px] mt-0.5 ${selectedDate === date ? 'text-red-200' : 'text-gray-500'}`}>
                      {count} suất
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {dayScreenings.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Không có suất chiếu nào vào ngày này</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(byScreen).map(([screenName, times]) => (
                <div key={screenName}>
                  <div className="text-gray-400 text-sm mb-2 flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    {screenName}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {times.map(s => {
                      const priceMeta = PRICE_LABELS[s.priceCategory] || PRICE_LABELS.NORMAL
                      return (
                        <button
                          key={s.id}
                          onClick={() => navigate(`/booking/${s.id}`, {
                            state: {
                              movieTitle: s.movieTitle,
                              moviePosterUrl: s.moviePosterUrl,
                              cinemaName: cinema.name,
                              screenName: s.screenName,
                              date: selectedDate,
                              time: fmt(s.startTime),
                              basePrice: s.basePrice,
                              movieDuration: s.movieDuration,
                            }
                          })}
                          className="group bg-cinema-gray border border-cinema-gray-light hover:border-cinema-red rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all text-left min-w-0"
                        >
                          <div className="text-white font-bold text-sm sm:text-base group-hover:text-cinema-red transition-colors">
                            {fmt(s.startTime)}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[140px]" title={s.movieTitle}>
                            {s.movieTitle}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`text-[10px] ${priceMeta.color}`}>{priceMeta.label}</span>
                            <span className="text-[10px] text-gray-500">·</span>
                            <span className="text-[10px] text-cinema-gold">{s.basePrice?.toLocaleString()}đ</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CinemaDetailPage
