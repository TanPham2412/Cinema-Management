import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, ChevronLeft, Clock, Ticket, Users } from 'lucide-react';
import cinemaService from '../services/cinemaService';
import screeningService from '../services/screeningService';

const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const fmtTime = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const fmtPrice = (price) =>
  price ? new Intl.NumberFormat('vi-VN').format(price) + 'đ' : '';

const ScreeningModal = ({
  movieId, movieTitle, movieDuration,
  moviePosterUrl, movieGenres, movieRating,
  onClose,
}) => {
  const navigate = useNavigate();

  // Step 1 state
  const [cinemas, setCinemas]           = useState([]);
  const [loadingCinemas, setLoadingCinemas] = useState(true);

  // Step 2 state
  const [selectedCinema, setSelectedCinema] = useState(null);
  const [screenings, setScreenings]         = useState([]);
  const [loadingScreenings, setLoadingScreenings] = useState(false);
  const [selectedDate, setSelectedDate]     = useState('');

  // 7-day date list
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoadingCinemas(true);
      try {
        const data = await cinemaService.getCinemas();
        setCinemas(Array.isArray(data) ? data : (data.content || []));
      } catch {
        setCinemas([]);
      } finally {
        setLoadingCinemas(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCinema) return;
    const load = async () => {
      setLoadingScreenings(true);
      try {
        const data = await screeningService.getScreeningsByMovie(movieId, selectedDate);
        const list = Array.isArray(data) ? data : (data.content || []);
        setScreenings(list.filter(s => s.cinemaId === selectedCinema.id));
      } catch {
        setScreenings([]);
      } finally {
        setLoadingScreenings(false);
      }
    };
    load();
  }, [selectedCinema, selectedDate, movieId]);

  const handleSelectCinema = (cinema) => {
    setSelectedCinema(cinema);
    setSelectedDate(dates[0]);
    setScreenings([]);
  };

  const handleSelectScreening = (s) => {
    onClose();
    navigate(`/booking/${s.id}`, {
      state: {
        movieId, movieTitle, movieDuration,
        moviePosterUrl, movieGenres, movieRating,
        cinemaName: s.cinemaName,
        screenName: s.screenName,
        date: new Date(s.startTime).toLocaleDateString('vi-VN'),
        time: fmtTime(s.startTime),
        basePrice: s.basePrice,
      },
    });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[86vh] flex flex-col bg-cinema-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {selectedCinema && (
              <button
                onClick={() => { setSelectedCinema(null); setScreenings([]); }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                {selectedCinema ? 'Chọn suất chiếu' : 'Chọn rạp'}
              </p>
              <h2 className="text-white font-black text-lg leading-tight truncate">
                {selectedCinema ? selectedCinema.name : movieTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-5 pt-3 pb-2 shrink-0">
          {['Phim', 'Rạp', 'Suất chiếu'].map((label, i) => {
            const step = i; // 0=phim(done), 1=rap, 2=suat
            const done    = step === 0 || (step === 1 && selectedCinema);
            const active  = (step === 1 && !selectedCinema) || (step === 2 && selectedCinema);
            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    done ? 'bg-cinema-red text-white'
                    : active ? 'bg-cinema-red text-white'
                    : 'bg-white/10 text-gray-500'
                  }`}>
                    {done && !active ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${active ? 'text-white' : done ? 'text-cinema-red' : 'text-gray-600'}`}>
                    {label}
                  </span>
                </div>
                {i < 2 && <div className={`flex-1 h-px mx-2 ${i === 0 ? 'bg-cinema-red' : 'bg-white/10'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {/* STEP 1: CINEMA LIST */}
        {!selectedCinema && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {loadingCinemas ? (
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex gap-4 p-4 bg-white/5 rounded-xl">
                    <div className="w-12 h-12 rounded-lg bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : cinemas.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg font-medium">Không tìm thấy rạp nào</p>
              </div>
            ) : (
              cinemas.map(cinema => (
                <button
                  key={cinema.id}
                  onClick={() => handleSelectCinema(cinema)}
                  className="w-full text-left flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-cinema-red/10 border border-white/5 hover:border-cinema-red/40 transition-all group"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-cinema-red/20 flex items-center justify-center shrink-0 group-hover:bg-cinema-red/30 transition-colors">
                    <Ticket className="w-6 h-6 text-cinema-red" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate group-hover:text-cinema-red transition-colors">
                      {cinema.name}
                    </p>
                    {cinema.address && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {cinema.address}
                      </p>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-600 group-hover:text-cinema-red rotate-180 transition-all" />
                </button>
              ))
            )}
          </div>
        )}

        {/* STEP 2: SCREENINGS */}
        {selectedCinema && (
          <>
            {/* Date tabs */}
            <div
              className="flex gap-0 border-b border-white/10 shrink-0 overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {dates.map((date, idx) => {
                const d      = new Date(date);
                const day    = DAY_SHORT[d.getDay()];
                const dd     = String(d.getDate()).padStart(2, '0');
                const mm     = String(d.getMonth() + 1).padStart(2, '0');
                const active = date === selectedDate;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 flex flex-col items-center pt-3 pb-2.5 px-5 border-b-[3px] transition-colors ${
                      active
                        ? 'border-cinema-red text-cinema-red'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <span className={`text-2xl font-black leading-none ${active ? 'text-cinema-red' : 'text-white'}`}>
                      {dd}
                    </span>
                    <span className="text-xs font-medium mt-0.5">
                      /{mm} · {idx === 0 ? 'H.nay' : day}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Screening slots */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loadingScreenings ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="w-8 h-8 border-3 border-cinema-red border-t-transparent rounded-full animate-spin" />
                  <p className="text-gray-500 text-sm">Đang tải suất chiếu...</p>
                </div>
              ) : screenings.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-base font-medium">Không có suất chiếu</p>
                  <p className="text-sm mt-1">Vui lòng chọn ngày khác</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    {screenings.length} suất chiếu
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {screenings
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(s => {
                        const noSeats  = s.availableSeats === 0;
                        const seatWarn = !noSeats && s.availableSeats <= 20;
                        return (
                          <button
                            key={s.id}
                            disabled={noSeats}
                            onClick={() => !noSeats && handleSelectScreening(s)}
                            className={`flex flex-col items-center justify-center px-5 py-3 rounded-xl border-2 min-w-[88px] transition-all active:scale-95 ${
                              noSeats
                                ? 'border-white/5 bg-white/5 text-gray-600 cursor-not-allowed'
                                : 'border-white/10 bg-white/5 hover:border-cinema-red hover:bg-cinema-red/10 text-white'
                            }`}
                          >
                            <span className="text-xl font-black leading-none">
                              {fmtTime(s.startTime)}
                            </span>
                            <span className={`text-[10px] mt-1 font-semibold ${
                              noSeats ? 'text-red-500/60'
                              : seatWarn ? 'text-yellow-400'
                              : 'text-gray-500'
                            }`}>
                              {noSeats ? 'Hết vé' : `${s.availableSeats} ghế`}
                            </span>
                            {!noSeats && s.basePrice && (
                              <span className="text-[10px] text-cinema-red font-bold mt-0.5">
                                {fmtPrice(s.basePrice)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ScreeningModal;
