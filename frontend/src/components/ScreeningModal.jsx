import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin } from 'lucide-react';
import screeningService from '../services/screeningService';

const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const fmtTime = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const BRAND_COLORS = {
  CGV: 'bg-red-600',
  Lotte: 'bg-red-500',
  Galaxy: 'bg-blue-500',
  Beta: 'bg-blue-700',
};

const getBrand = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('cgv')) return 'CGV';
  if (n.includes('lotte')) return 'Lotte';
  if (n.includes('galaxy')) return 'Galaxy';
  if (n.includes('beta')) return 'Beta';
  return null;
};

const ScreeningModal = ({
  movieId, movieTitle, movieDuration,
  moviePosterUrl, movieGenres, movieRating,
  onClose,
}) => {
  const navigate = useNavigate();

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState('Tất cả');
  const [confirmScreening, setConfirmScreening] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await screeningService.getScreeningsByMovie(movieId, selectedDate);
        setScreenings(Array.isArray(data) ? data : (data.content || []));
      } catch {
        setScreenings([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [movieId, selectedDate]);

  // Group screenings by cinema
  const cinemaGroups = React.useMemo(() => {
    const map = {};
    screenings.forEach(s => {
      const key = s.cinemaId ?? s.cinemaName;
      if (!map[key]) {
        map[key] = {
          cinemaId: s.cinemaId,
          cinemaName: s.cinemaName,
          cinemaAddress: s.cinemaAddress ?? '',
          screenings: [],
        };
      }
      map[key].screenings.push(s);
    });
    return Object.values(map);
  }, [screenings]);

  const brands = React.useMemo(() => {
    const set = new Set();
    cinemaGroups.forEach(c => {
      const b = getBrand(c.cinemaName);
      if (b) set.add(b);
    });
    return ['Tất cả', ...set];
  }, [cinemaGroups]);

  const filteredCinemas = selectedBrand === 'Tất cả'
    ? cinemaGroups
    : cinemaGroups.filter(c => getBrand(c.cinemaName) === selectedBrand);

  const handleConfirm = () => {
    if (!confirmScreening) return;
    onClose();
    navigate(`/booking/${confirmScreening.id}`, {
      state: {
        movieId, movieTitle, movieDuration,
        moviePosterUrl, movieGenres, movieRating,
        cinemaName: confirmScreening.cinemaName,
        screenName: confirmScreening.screenName,
        date: new Date(confirmScreening.startTime).toLocaleDateString('vi-VN'),
        time: fmtTime(confirmScreening.startTime),
        basePrice: confirmScreening.basePrice,
      },
    });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm"
        onClick={handleBackdrop}
      >
        <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[86vh] flex flex-col bg-cinema-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Lịch chiếu</p>
              <h2 className="text-white font-black text-lg leading-tight truncate">{movieTitle}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Date tabs */}
          <div
            className="flex border-b border-white/10 shrink-0 overflow-x-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {dates.map((date, idx) => {
              const d = new Date(date);
              const day = DAY_SHORT[d.getDay()];
              const dd = String(d.getDate()).padStart(2, '0');
              const mm = String(d.getMonth() + 1).padStart(2, '0');
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

          {/* Brand filters */}
          {brands.length > 1 && (
            <div
              className="flex gap-5 px-5 py-3 border-b border-white/10 shrink-0 overflow-x-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {brands.map(brand => {
                const active = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`flex flex-col items-center gap-1 shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-45 hover:opacity-75'}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm
                      ${brand === 'Tất cả' ? 'bg-yellow-500' : (BRAND_COLORS[brand] || 'bg-gray-600')}`}
                    >
                      {brand === 'Tất cả' ? '≡' : brand.slice(0, 3)}
                    </div>
                    <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-gray-500'}`}>{brand}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cinema list with screenings */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-2 border-cinema-red border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">Đang tải lịch chiếu...</p>
              </div>
            ) : filteredCinemas.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-base font-medium">Không có suất chiếu</p>
                <p className="text-sm mt-1">Vui lòng chọn ngày khác</p>
              </div>
            ) : (
              filteredCinemas.map(group => (
                <div key={group.cinemaId ?? group.cinemaName}>
                  {/* Cinema header */}
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-cinema-red mt-0.5 shrink-0" />
                    <div>
                      <p className="text-white font-bold text-sm">{group.cinemaName}</p>
                      {group.cinemaAddress && (
                        <p className="text-gray-500 text-xs mt-0.5">{group.cinemaAddress}</p>
                      )}
                    </div>
                  </div>
                  {/* Format label */}
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3 ml-6">
                    2D • PHỤ ĐỀ / LỒNG TIẾNG
                  </p>
                  {/* Time slots */}
                  <div className="flex flex-wrap gap-3 ml-6">
                    {group.screenings
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(s => {
                        const noSeats = s.availableSeats === 0;
                        const seatWarn = !noSeats && s.availableSeats <= 20;
                        return (
                          <button
                            key={s.id}
                            disabled={noSeats}
                            onClick={() => !noSeats && setConfirmScreening(s)}
                            className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-lg border-2 min-w-[88px] transition-all active:scale-95 ${
                              noSeats
                                ? 'border-white/5 bg-white/5 text-gray-600 cursor-not-allowed'
                                : 'border-white/15 bg-white/5 hover:border-cinema-red hover:bg-cinema-red/10 text-white'
                            }`}
                          >
                            <span className="text-base font-black">{fmtTime(s.startTime)}</span>
                            <span className={`text-[10px] mt-0.5 font-medium ${
                              noSeats ? 'text-red-500/60' : seatWarn ? 'text-yellow-400' : 'text-gray-400'
                            }`}>
                              {noSeats ? 'Hết vé' : `${s.availableSeats} ghế trống`}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation popup */}
      {confirmScreening && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Bạn đang đặt vé xem phim</h3>
              <button onClick={() => setConfirmScreening(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            {/* Movie title */}
            <div className="px-5 pt-5 pb-3 text-center">
              <h2 className="text-2xl font-black text-blue-700 tracking-wide uppercase">{movieTitle}</h2>
            </div>
            {/* Info table */}
            <div className="px-5 pb-4">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-3 text-gray-600 font-semibold text-center border-r border-gray-200">Rạp chiếu</th>
                    <th className="py-2 px-3 text-gray-600 font-semibold text-center border-r border-gray-200">Ngày chiếu</th>
                    <th className="py-2 px-3 text-gray-600 font-semibold text-center">Giờ chiếu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 px-3 text-gray-800 font-medium text-center border-r border-t border-gray-200">{confirmScreening.cinemaName}</td>
                    <td className="py-3 px-3 text-gray-800 font-medium text-center border-r border-t border-gray-200">
                      {new Date(confirmScreening.startTime).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-3 text-gray-800 font-bold text-center border-t border-gray-200">
                      {fmtTime(confirmScreening.startTime)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Confirm button */}
            <div className="px-5 pb-5">
              <button
                onClick={handleConfirm}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl text-base tracking-wide transition-colors"
              >
                ĐỒNG Ý
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScreeningModal;

