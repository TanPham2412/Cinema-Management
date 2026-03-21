import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Clock, Menu } from 'lucide-react';
import cinemaService from '../services/cinemaService';
import screeningService from '../services/screeningService';

const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const BRANDS = [
  { id: 'all', name: 'Tất cả' },
  { id: 'cgv', name: 'CGV' },
  { id: 'lotte', name: 'Lotte' },
  { id: 'galaxy', name: 'Galaxy' },
  { id: 'beta', name: 'Beta' }
];

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

  const [cinemas, setCinemas] = useState([]);
  const [loadingCinemas, setLoadingCinemas] = useState(true);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const [screenings, setScreenings] = useState([]);
  const [loadingScreenings, setLoadingScreenings] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedBrand, setSelectedBrand] = useState('Tất cả');

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
    if (!selectedDate) return;
    const load = async () => {
      setLoadingScreenings(true);
      try {
        const data = await screeningService.getScreeningsByMovie(movieId, selectedDate);
        const list = Array.isArray(data) ? data : (data.content || []);
        setScreenings(list);
      } catch {
        setScreenings([]);
      } finally {
        setLoadingScreenings(false);
      }
    };
    load();
  }, [selectedDate, movieId]);

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

  // Group screenings by cinema
  const screeningsByCinema = {};
  screenings.forEach(s => {
    if (!screeningsByCinema[s.cinemaId]) screeningsByCinema[s.cinemaId] = [];
    screeningsByCinema[s.cinemaId].push(s);
  });

  // Filter cinemas that have screenings AND match brand
  const filteredCinemas = cinemas.filter(cinema => {
    const hasScreenings = screeningsByCinema[cinema.id] && screeningsByCinema[cinema.id].length > 0;
    if (!hasScreenings) return false;
    if (selectedBrand !== 'Tất cả') {
      return cinema.name.toLowerCase().includes(selectedBrand.toLowerCase());
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[86vh] flex flex-col bg-[#111111] sm:rounded-xl shadow-2xl overflow-hidden border border-white/5">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/5 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
              LỊCH CHIẾU
            </p>
            <h2 className="text-white font-black text-xl leading-tight truncate uppercase mt-1">
              {movieTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Date tabs */}
        <div
          className="flex gap-0 border-b border-white/5 shrink-0 overflow-x-auto"
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
                className={`flex-shrink-0 flex flex-col items-center pt-3 pb-2.5 px-6 border-b-[3px] transition-colors ${
                  active
                    ? 'border-cinema-red text-cinema-red'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className={`text-[22px] font-black leading-none mb-1 ${active ? 'text-cinema-red' : 'text-white'}`}>
                  {dd}
                </span>
                <span className="text-[11px] font-medium">
                  /{mm} - {idx === 0 ? 'H.nay' : day}
                </span>
              </button>
            );
          })}
        </div>

        {/* Brand Filters */}
        <div className="flex items-start gap-4 px-6 py-4 border-b border-white/5 shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {BRANDS.map(brand => {
            const active = selectedBrand === brand.name;
            return (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(brand.name)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group w-[52px]"
              >
                <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all ${
                  brand.id === 'all' ? (active ? 'bg-yellow-400 border-yellow-400 font-bold' : 'bg-transparent border border-gray-600') : 
                  brand.id === 'cgv' ? 'bg-[#E71A0F] text-white p-2 font-black' :
                  brand.id === 'lotte' ? 'bg-[#ED1C24] text-white p-2 font-black italic' :
                  brand.id === 'galaxy' ? 'bg-[#F26A21] text-white p-2 font-black italic' :
                  'bg-[#00ADC6] text-white p-2 font-black italic'
                } ${active && brand.id !== 'all' ? 'ring-[3px] ring-[#333] ring-offset-1 ring-offset-transparent' : ''}`}>
                  {brand.id === 'all' ? (
                    <Menu className={`w-5 h-5 ${active ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                  ) : (
                    <span className="text-[9px] leading-tight text-center">{brand.name}</span>
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-colors text-center ${active ? 'text-cinema-red' : 'text-gray-500 group-hover:text-gray-300'}`}>
                  {brand.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Cinema & Screening slots */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loadingCinemas || loadingScreenings ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-cinema-red border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Đang tải suất chiếu...</p>
            </div>
          ) : filteredCinemas.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">Không có suất chiếu</p>
              <p className="text-sm mt-1">Vui lòng chọn ngày hoặc rạp khác</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredCinemas.map(cinema => {
                const cinemaScreenings = screeningsByCinema[cinema.id].sort((a, b) => a.startTime.localeCompare(b.startTime));
                
                // Determine logo color based on brand roughly
                let dotColor = 'text-[#E71A0F]';
                if (cinema.name.toLowerCase().includes('lotte')) dotColor = 'text-[#ED1C24]';
                else if (cinema.name.toLowerCase().includes('galaxy')) dotColor = 'text-[#F26A21]';
                else if (cinema.name.toLowerCase().includes('beta')) dotColor = 'text-[#00ADC6]';
                
                return (
                  <div key={cinema.id} className="border-b border-white/5 pb-8 last:border-0 last:pb-0">
                    <div className="flex items-start gap-2.5 mb-3">
                      <div className={`mt-1 flex-shrink-0 flex items-center justify-center border border-current rounded-full w-4 h-4 p-0.5 ${dotColor}`}>
                         <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-bold text-base leading-tight">
                          {cinema.name}
                        </h3>
                        {cinema.address && (
                          <p className="text-gray-500 text-xs mt-1">
                            {cinema.address}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mt-2.5">
                          2D • PHỤ ĐỀ / LỒNG TIẾNG
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3">
                      {cinemaScreenings.map(s => {
                        const noSeats  = s.availableSeats === 0;
                        const seatWarn = !noSeats && s.availableSeats <= 20;
                        return (
                          <button
                            key={s.id}
                            disabled={noSeats}
                            onClick={() => !noSeats && handleSelectScreening(s)}
                            className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-md transition-all min-w-[85px] border ${
                              noSeats
                                ? 'bg-[#222] border-transparent text-gray-600 cursor-not-allowed hidden' // Usually hide sold-out or dim, will just dim for now
                                : 'bg-[#222] border-transparent hover:border-gray-500 text-white'
                            }`}
                            style={{ display: noSeats ? 'none' : 'flex' }} // Optional: hiding sold out ones or keeping them dimmed. I will dim them just in case.
                          >
                            <span className="text-lg font-bold leading-none mb-1 text-gray-100">
                              {fmtTime(s.startTime)}
                            </span>
                            <span className={`text-[10px] font-medium ${
                              noSeats ? 'text-red-500/60'
                              : seatWarn ? 'text-yellow-400'
                              : 'text-gray-400'
                            }`}>
                              {noSeats ? 'Hết vé' : `${s.availableSeats} ghế trống`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScreeningModal;
