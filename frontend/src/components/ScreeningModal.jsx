import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin } from 'lucide-react';
import movieService from '../services/movieService';

// Branded logo icon for each cinema chain
const ChainIcon = ({ chain, active }) => {
  const CONFIGS = {
    'Tất cả': {
      bg: active ? 'bg-yellow-400' : 'bg-cinema-gray-light',
      content: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? '#1a1a1a' : '#aaa'}>
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    CGV: {
      bg: 'bg-[#e60012]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="font-black tracking-tight text-white" style={{ fontSize: 11 }}>CGV</span>
          <span className="text-white" style={{ fontSize: 7 }}>★</span>
        </div>
      ),
    },
    Lotte: {
      bg: 'bg-[#c8102e]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="font-black text-white tracking-tight" style={{ fontSize: 8 }}>LOTTE</span>
          <span className="text-[#ffd700] font-bold" style={{ fontSize: 7 }}>CINEMA</span>
        </div>
      ),
    },
    Galaxy: {
      bg: 'bg-[#1a2a6c]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="text-white font-bold" style={{ fontSize: 8 }}>Galaxy</span>
          <span className="text-[#f5c518] font-bold" style={{ fontSize: 7 }}>Cinema</span>
        </div>
      ),
    },
    BHD: {
      bg: 'bg-[#111] border border-[#f5c518]/60',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="text-[#f5c518] font-black" style={{ fontSize: 12 }}>BHD</span>
          <span className="text-[#f5c518]" style={{ fontSize: 7 }}>★ Star</span>
        </div>
      ),
    },
    Beta: {
      bg: 'bg-[#0057a8]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="text-white font-black italic" style={{ fontSize: 11 }}>beta</span>
          <span className="text-white/80" style={{ fontSize: 7 }}>cinemas</span>
        </div>
      ),
    },
    Cinestar: {
      bg: 'bg-[#6a0dad]',
      content: (
        <div className="text-white font-bold text-center leading-none" style={{ fontSize: 8 }}>
          <div>Cine</div><div className="text-yellow-300">star</div>
        </div>
      ),
    },
    'Mega GS': {
      bg: 'bg-[#e5002b]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="text-white font-black" style={{ fontSize: 9 }}>MEGA</span>
          <span className="text-yellow-300 font-bold" style={{ fontSize: 8 }}>GS</span>
        </div>
      ),
    },
    Dcine: {
      bg: 'bg-[#0d0d0d] border border-gray-600',
      content: (
        <span className="text-white font-black" style={{ fontSize: 9 }}>DCINE</span>
      ),
    },
  };

  const cfg = CONFIGS[chain];
  const ring = active ? 'ring-2 ring-cinema-red ring-offset-2 ring-offset-cinema-dark' : '';

  if (!cfg) {
    return (
      <div className={`w-12 h-12 rounded-full bg-cinema-gray-light flex items-center justify-center shrink-0 ${ring}`}>
        <span className="text-gray-300 font-bold text-xs">{chain?.slice(0, 3)}</span>
      </div>
    );
  }
  return (
    <div className={`w-12 h-12 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 ${ring}`}>
      {cfg.content}
    </div>
  );
};

const DAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const generateMockScreenings = (duration = 101) => {
  const cinemas = [
    { name: 'CGV Vincom Center',      chain: 'CGV',    address: 'Vincom Center, Quận 1, TP.HCM' },
    { name: 'CGV Aeon Mall Tân Phú',  chain: 'CGV',    address: 'Aeon Mall, Quận Tân Phú, TP.HCM' },
    { name: 'Lotte Cinema Cantavil',  chain: 'Lotte',  address: 'Cantavil, Quận 2, TP.HCM' },
    { name: 'Galaxy Nguyễn Du',       chain: 'Galaxy', address: '116 Nguyễn Du, Quận 1, TP.HCM' },
    { name: 'Beta Cinema Mỹ Đình',    chain: 'Beta',   address: 'Mỹ Đình, Nam Từ Liêm, Hà Nội' },
  ];
  const slots = [
    { time: '08:30', cat: 'NORMAL',     price: 75000  },
    { time: '11:00', cat: 'NORMAL',     price: 75000  },
    { time: '13:30', cat: 'NORMAL',     price: 85000  },
    { time: '15:30', cat: 'NORMAL',     price: 85000  },
    { time: '18:00', cat: 'PRIME_TIME', price: 110000 },
    { time: '20:15', cat: 'PRIME_TIME', price: 110000 },
    { time: '22:30', cat: 'PRIME_TIME', price: 120000 },
  ];
  const list = [];
  let id = 1;
  for (let day = 0; day < 7; day++) {
    const date = new Date(Date.now() + day * 86400000).toISOString().slice(0, 10);
    cinemas.forEach((cinema, ci) => {
      const count = 3 + ((ci + day) % 3);
      slots.slice(0, count).forEach((slot, ti) => {
        const start = new Date(`${date}T${slot.time}:00`);
        const end   = new Date(start.getTime() + duration * 60000);
        list.push({
          id: id++, cinemaName: cinema.name, cinemaChain: cinema.chain,
          cinemaAddress: cinema.address,
          startTime: start.toISOString(), endTime: end.toISOString(),
          basePrice: slot.price, priceCategory: slot.cat,
          availableSeats: 30 + Math.floor(Math.random() * 80),
          screenName: `Phòng ${ti + 1}`,
        });
      });
    });
  }
  return list;
};

const fmtTime = (iso) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
};

const ScreeningModal = ({ movieId, movieTitle, movieDuration, moviePosterUrl, movieGenres, movieRating, onClose }) => {
  const navigate = useNavigate();
  const [screenings, setScreenings]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedChain, setSelectedChain] = useState('Tất cả');
  const [confirmScreening, setConfirmScreening] = useState(null); // screening to confirm

  // Build 7-day date list
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    setSelectedDate(dates[0]);
    loadScreenings();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [movieId]);

  const loadScreenings = async () => {
    setLoading(true);
    try {
      const data = await movieService.getScreenings(movieId);
      const list = Array.isArray(data) ? data : (data.content || []);
      setScreenings(list.length > 0 ? list : generateMockScreenings(movieDuration));
    } catch {
      setScreenings(generateMockScreenings(movieDuration));
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) {
      if (confirmScreening) setConfirmScreening(null);
      else onClose();
    }
  }, [onClose, confirmScreening]);

  const handleSelectTime = (screening) => {
    setConfirmScreening(screening);
  };

  const handleConfirm = () => {
    onClose();
    navigate(`/booking/${confirmScreening.id}`, {
      state: {
        movieId,
        movieTitle,
        movieDuration,
        moviePosterUrl,
        movieGenres,
        movieRating,
        cinemaName: confirmScreening.cinemaName,
        screenName: confirmScreening.screenName,
        date: new Date(confirmScreening.startTime).toLocaleDateString('vi-VN'),
        time: `${String(new Date(confirmScreening.startTime).getHours()).padStart(2,'0')}:${String(new Date(confirmScreening.startTime).getMinutes()).padStart(2,'0')}`,
        basePrice: confirmScreening.basePrice,
      },
    });
  };

  // Filter screenings for selected date
  const dayScreenings = screenings.filter(s => s.startTime?.startsWith(selectedDate));

  // All unique chains for the selected date
  const chains = ['Tất cả', ...Array.from(new Set(dayScreenings.map(s => s.cinemaChain).filter(Boolean)))];

  // Reset chain filter when date changes
  useEffect(() => { setSelectedChain('Tất cả'); }, [selectedDate]);

  // Group by cinema (filtered by chain)
  const filteredScreenings = selectedChain === 'Tất cả'
    ? dayScreenings
    : dayScreenings.filter(s => s.cinemaChain === selectedChain);

  const grouped = filteredScreenings.reduce((acc, s) => {
    const k = s.cinemaName;
    if (!acc[k]) acc[k] = { address: s.cinemaAddress, times: [] };
    acc[k].times.push(s);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col bg-cinema-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cinema-gray-light shrink-0">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">LỊCH CHIẾU</p>
            <h2 className="text-white font-black text-xl uppercase tracking-wide leading-tight mt-0.5">
              {movieTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-cinema-gray-light text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Date Tabs */}
        <div className="flex gap-0 border-b border-cinema-gray-light shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {dates.map(date => {
            const d   = new Date(date);
            const day = DAY_SHORT[d.getDay()];
            const dd  = String(d.getDate()).padStart(2, '0');
            const mm  = String(d.getMonth() + 1).padStart(2, '0');
            const active  = date === selectedDate;
            const isToday = date === dates[0];
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
                <span className="text-xs font-medium mt-0.5">/{mm} - {isToday ? 'H.nay' : day}</span>
              </button>
            );
          })}
        </div>

        {/* Chain Filter Icons */}
        {!loading && chains.length > 2 && (
          <div className="flex gap-4 px-5 pt-4 pb-3 overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
            {chains.map(chain => {
              const active = selectedChain === chain;
              const shortLabel = chain === 'Tất cả' ? 'Tất cả'
                : chain.length > 7 ? chain.slice(0, 7) + '...' : chain;
              return (
                <button
                  key={chain}
                  onClick={() => setSelectedChain(chain)}
                  className="flex flex-col items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90"
                >
                  <ChainIcon chain={chain} active={active} />
                  <span className={`text-[10px] font-semibold leading-none ${
                    active ? 'text-cinema-red' : 'text-gray-400'
                  }`}>{shortLabel}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-48 bg-cinema-gray-light rounded mb-3" />
                  <div className="flex gap-3">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="h-16 w-[72px] bg-cinema-gray-light rounded-xl" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium">Không có suất chiếu</p>
              <p className="text-sm mt-1">Vui lòng chọn ngày khác</p>
            </div>
          ) : (
            Object.entries(grouped).map(([cinemaName, info]) => (
              <div key={cinemaName}>
                {/* Cinema name */}
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-cinema-red shrink-0" />
                  <span className="text-white font-bold text-base">{cinemaName}</span>
                </div>
                {info.address && (
                  <p className="text-gray-500 text-xs ml-6 mb-3">{info.address}</p>
                )}

                {/* Format label */}
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest ml-6 mb-2">
                  2D • Phụ đề / Lồng tiếng
                </p>

                {/* Time slot grid */}
                <div className="ml-6 flex flex-wrap gap-3">
                  {info.times
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(s => {
                      const noSeats  = s.availableSeats === 0;
                      const seatWarn = !noSeats && s.availableSeats <= 20;
                      return (
                        <button
                          key={s.id}
                          disabled={noSeats}
                          onClick={() => !noSeats && handleSelectTime(s)}
                          className={`flex flex-col items-center justify-center px-5 py-3 rounded-xl border-2 min-w-[80px] transition-all active:scale-95 ${
                            noSeats
                              ? 'border-gray-700/50 bg-cinema-gray/30 text-gray-600 cursor-not-allowed'
                              : 'border-cinema-gray-lighter bg-cinema-gray-light hover:border-cinema-red hover:bg-cinema-red/10 text-white'
                          }`}
                        >
                          <span className="text-lg font-black leading-none">
                            {fmtTime(s.startTime)}
                          </span>
                          <span className={`text-xs mt-1.5 font-medium ${
                            noSeats
                              ? 'text-red-500/70'
                              : seatWarn
                              ? 'text-yellow-400'
                              : 'text-gray-400'
                          }`}>
                            {noSeats
                              ? 'Hết vé'
                              : `${s.availableSeats} ghế trống`}
                          </span>
                        </button>
                      );
                    })}
                </div>

                <div className="border-b border-cinema-gray-light mt-5" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Confirmation overlay */}
      {confirmScreening && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 rounded-t-2xl sm:rounded-2xl">
          <div className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden">
            {/* Confirm header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-gray-900 font-black text-sm uppercase tracking-widest">
                Bạn đang đặt vé xem phim
              </h3>
              <button
                onClick={() => setConfirmScreening(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            {/* Movie title */}
            <div className="px-6 pt-5 pb-4 text-center">
              <h2 className="text-2xl font-black text-[#1a3a6c]">{movieTitle}</h2>
            </div>

            {/* Info table */}
            <div className="mx-6 mb-6 border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
                <div className="px-4 py-3 text-center text-sm font-bold text-gray-700">Rạp chiếu</div>
                <div className="px-4 py-3 text-center text-sm font-bold text-gray-700 border-x border-gray-200">Ngày chiếu</div>
                <div className="px-4 py-3 text-center text-sm font-bold text-gray-700">Giờ chiếu</div>
              </div>
              <div className="grid grid-cols-3 bg-white">
                <div className="px-4 py-4 text-center text-sm font-bold text-gray-900">
                  {confirmScreening.cinemaName}
                </div>
                <div className="px-4 py-4 text-center text-sm font-bold text-gray-900 border-x border-gray-200">
                  {new Date(confirmScreening.startTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
                <div className="px-4 py-4 text-center text-sm font-bold text-gray-900">
                  {fmtTime(confirmScreening.startTime)}
                </div>
              </div>
            </div>

            {/* Confirm button */}
            <div className="px-6 pb-6 flex justify-center">
              <button
                onClick={handleConfirm}
                className="px-12 py-3 bg-[#1a3a6c] hover:bg-[#15306b] text-white font-black text-base rounded-xl transition-all active:scale-95 tracking-widest"
              >
                ĐỔNG Ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreeningModal;
