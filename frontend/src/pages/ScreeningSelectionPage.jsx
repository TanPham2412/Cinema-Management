import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock } from 'lucide-react';
import movieService from '../services/movieService';

// Inline SVG / styled logos for each cinema chain
const ChainLogo = ({ chain, size = 'md' }) => {
  const s = size === 'sm' ? 'w-7 h-7 text-[9px]' : 'w-9 h-9 text-[10px]';
  const configs = {
    CGV: {
      bg: 'bg-[#e60012]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="font-black tracking-tight text-white" style={{ fontSize: size === 'sm' ? 9 : 11 }}>CGV</span>
          <span className="text-white" style={{ fontSize: 7 }}>★</span>
        </div>
      ),
    },
    Lotte: {
      bg: 'bg-[#c8102e]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="font-black text-white tracking-tight" style={{ fontSize: size === 'sm' ? 7 : 8 }}>LOTTE</span>
          <span className="text-[#ffd700] font-bold" style={{ fontSize: size === 'sm' ? 6 : 7 }}>CINEMA</span>
        </div>
      ),
    },
    Galaxy: {
      bg: 'bg-[#1a2a6c]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="text-white font-bold tracking-tight" style={{ fontSize: size === 'sm' ? 7 : 8 }}>Galaxy</span>
          <span className="text-[#f5c518] font-bold" style={{ fontSize: size === 'sm' ? 6 : 7 }}>Cinema</span>
        </div>
      ),
    },
    BHD: {
      bg: 'bg-[#1a1a1a] border border-[#f5c518]/60',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="text-[#f5c518] font-black" style={{ fontSize: size === 'sm' ? 10 : 12 }}>BHD</span>
          <span className="text-[#f5c518]" style={{ fontSize: 7 }}>★ Star</span>
        </div>
      ),
    },
    Beta: {
      bg: 'bg-[#0057a8]',
      content: (
        <div className="flex flex-col items-center leading-none">
          <span className="text-white font-black italic" style={{ fontSize: size === 'sm' ? 10 : 12 }}>beta</span>
          <span className="text-white/80" style={{ fontSize: size === 'sm' ? 6 : 7 }}>cinemas</span>
        </div>
      ),
    },
    Cinestar: {
      bg: 'bg-[#6a0dad]',
      content: (
        <div className="text-white font-bold text-center leading-none" style={{ fontSize: size === 'sm' ? 7 : 8 }}>
          <div>Cine</div>
          <div className="text-yellow-300">star</div>
        </div>
      ),
    },
  };
  const cfg = configs[chain];
  if (!cfg) {
    return (
      <div className={`${s} rounded-lg bg-cinema-gray-light flex items-center justify-center text-gray-400 font-bold shrink-0`}>
        {chain?.slice(0, 2)}
      </div>
    );
  }
  return (
    <div className={`${s} rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
      {cfg.content}
    </div>
  );
};

const TIME_RANGES = [
  { label: 'Tất cả', from: 0, to: 24 },
  { label: '9:00 - 12:00', from: 9, to: 12 },
  { label: '12:00 - 15:00', from: 12, to: 15 },
  { label: '15:00 - 18:00', from: 15, to: 18 },
  { label: '18:00 - 21:00', from: 18, to: 21 },
  { label: '21:00 - 24:00', from: 21, to: 24 },
];

const generateMockScreenings = (duration = 101) => {
  const cinemas = [
    { name: 'CGV Vincom Center', chain: 'CGV', address: 'Vincom Center, Quận 1, TP.HCM' },
    { name: 'CGV Aeon Mall Tân Phú', chain: 'CGV', address: 'Aeon Mall, Quận Tân Phú, TP.HCM' },
    { name: 'Lotte Cinema Cantavil', chain: 'Lotte', address: 'Cantavil, Quận 2, TP.HCM' },
    { name: 'Lotte Cinema Gò Vấp', chain: 'Lotte', address: '199 Nguyễn Oanh, Gò Vấp' },
    { name: 'Galaxy Nguyễn Du', chain: 'Galaxy', address: '116 Nguyễn Du, Quận 1' },
    { name: 'BHD Star Phạm Hùng', chain: 'BHD', address: 'Phạm Hùng, Quận 8, TP.HCM' },
    { name: 'Beta Cinema Mỹ Đình', chain: 'Beta', address: 'Mỹ Đình, Nam Từ Liêm, Hà Nội' },
  ];
  const timeSlots = [
    { time: '09:00', cat: 'NORMAL', price: 75000 },
    { time: '11:00', cat: 'NORMAL', price: 75000 },
    { time: '13:30', cat: 'NORMAL', price: 85000 },
    { time: '15:30', cat: 'NORMAL', price: 85000 },
    { time: '18:00', cat: 'PRIME_TIME', price: 110000 },
    { time: '20:15', cat: 'PRIME_TIME', price: 110000 },
    { time: '22:30', cat: 'PRIME_TIME', price: 120000 },
  ];

  const screenings = [];
  let id = 1;
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(Date.now() + dayOffset * 86400000).toISOString().slice(0, 10);
    cinemas.forEach((cinema, ci) => {
      // Each cinema gets 3-5 time slots per day
      const count = 3 + ((ci + dayOffset) % 3);
      timeSlots.slice(0, count).forEach((slot, ti) => {
        const startDt = new Date(`${date}T${slot.time}:00`);
        const endDt = new Date(startDt.getTime() + duration * 60000);
        screenings.push({
          id: id++,
          cinemaName: cinema.name,
          cinemaChain: cinema.chain,
          cinemaAddress: cinema.address,
          startTime: startDt.toISOString(),
          endTime: endDt.toISOString(),
          basePrice: slot.price,
          priceCategory: slot.cat,
          availableSeats: Math.floor(Math.random() * 100) + 10,
          screenName: `Phòng ${ti + 1}`,
        });
      });
    });
  }
  return screenings;
};

const DAY_NAMES = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

const ScreeningSelectionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState(0);
  const [selectedChain, setSelectedChain] = useState('all');

  // Build 7-day date list from today
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 86400000);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    setSelectedDate(dates[0]);
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const movieData = await movieService.getMovieById(id);
      setMovie(movieData);
      try {
        const data = await movieService.getScreenings(id);
        const list = Array.isArray(data) ? data : (data.content || []);
        setScreenings(list.length > 0 ? list : generateMockScreenings(movieData.duration));
      } catch {
        setScreenings(generateMockScreenings(movieData.duration));
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().slice(0, 10);
    return {
      dayLabel: dateStr === today ? 'H.nay' : DAY_NAMES[d.getDay()],
      dateLabel: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
      isToday: dateStr === today,
    };
  };

  const fmt = (isoStr) => {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Apply filters
  const timeRange = TIME_RANGES[selectedTimeRange];
  const dayScreenings = screenings.filter(s => {
    if (!s.startTime?.startsWith(selectedDate)) return false;
    const hour = new Date(s.startTime).getHours();
    if (selectedTimeRange !== 0 && (hour < timeRange.from || hour >= timeRange.to)) return false;
    if (selectedChain !== 'all' && s.cinemaChain !== selectedChain) return false;
    return true;
  });

  // Group by cinema
  const grouped = dayScreenings.reduce((acc, s) => {
    const key = s.cinemaName;
    if (!acc[key]) acc[key] = { chain: s.cinemaChain, address: s.cinemaAddress, times: [] };
    acc[key].times.push(s);
    return acc;
  }, {});

  // Available chains for selected date
  const availableChains = [...new Set(
    screenings
      .filter(s => s.startTime?.startsWith(selectedDate))
      .map(s => s.cinemaChain)
      .filter(Boolean)
  )];

  return (
    <div className="min-h-screen bg-cinema-darker">
      {/* Header */}
      <div className="bg-cinema-dark sticky top-0 z-30 border-b border-cinema-gray-light">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-cinema-gray-light transition-colors text-white shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          {loading ? (
            <div className="h-5 w-36 bg-cinema-gray-light rounded animate-pulse" />
          ) : movie ? (
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg leading-tight truncate">{movie.title}</h1>
              <p className="text-gray-400 text-xs">
                {movie.duration} phút
                {movie.ageRating && ` • ${movie.ageRating}`}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-w-3xl mx-auto pb-8">

        {/* Date Tabs */}
        <div className="bg-cinema-dark border-b border-cinema-gray-light">
          <div className="flex overflow-x-auto px-4 py-3 gap-2" style={{ scrollbarWidth: 'none' }}>
            {dates.map(date => {
              const { dayLabel, dateLabel, isToday } = formatDate(date);
              const active = date === selectedDate;
              return (
                <button
                  key={date}
                  onClick={() => { setSelectedDate(date); setSelectedChain('all'); setSelectedTimeRange(0); }}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl min-w-[60px] border-2 transition-all ${
                    active
                      ? 'bg-cinema-red border-cinema-red text-white'
                      : 'border-cinema-gray-light text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <span className={`text-sm font-bold ${!active && isToday ? 'text-cinema-red' : ''}`}>
                    {dateLabel}
                  </span>
                  <span className="text-xs mt-0.5">{dayLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="bg-cinema-dark border-b border-cinema-gray-light">
          <div className="flex overflow-x-auto px-4 py-2.5 gap-2" style={{ scrollbarWidth: 'none' }}>
            {TIME_RANGES.map((r, i) => (
              <button
                key={i}
                onClick={() => setSelectedTimeRange(i)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedTimeRange === i
                    ? 'bg-cinema-red border-cinema-red text-white'
                    : 'border-cinema-gray-light text-gray-400 hover:border-gray-500'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cinema Chain Filter */}
        {availableChains.length > 1 && (
          <div className="bg-cinema-dark border-b border-cinema-gray-light">
            <div className="flex overflow-x-auto px-4 py-2.5 gap-2" style={{ scrollbarWidth: 'none' }}>
              {/* All button */}
              <button
                onClick={() => setSelectedChain('all')}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                  selectedChain === 'all'
                    ? 'bg-cinema-red border-cinema-red text-white'
                    : 'border-cinema-gray-light text-gray-400 hover:border-gray-500'
                }`}
              >
                Tất cả
              </button>
              {availableChains.map(chain => (
                <button
                  key={chain}
                  onClick={() => setSelectedChain(chain)}
                  className={`flex-shrink-0 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-sm font-medium border-2 transition-all ${
                    selectedChain === chain
                      ? 'border-cinema-red bg-cinema-red/10 text-white'
                      : 'border-cinema-gray-light text-gray-300 hover:border-gray-400 bg-cinema-gray-light/30'
                  }`}
                >
                  <ChainLogo chain={chain} size="sm" />
                  <span>{chain}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cinema List */}
        <div className="px-4 pt-4 space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-cinema-dark rounded-xl p-4 border border-cinema-gray-light animate-pulse">
                <div className="h-5 w-48 bg-cinema-gray-light rounded mb-2" />
                <div className="h-3 w-32 bg-cinema-gray-light rounded mb-4" />
                <div className="flex gap-2">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-14 w-[72px] bg-cinema-gray-light rounded-lg" />
                  ))}
                </div>
              </div>
            ))
          ) : Object.keys(grouped).length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Clock className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Không có suất chiếu phù hợp</p>
              <p className="text-sm mt-1 text-gray-600">Thử chọn ngày hoặc khung giờ khác</p>
              <button
                onClick={() => { setSelectedTimeRange(0); setSelectedChain('all'); }}
                className="mt-5 px-5 py-2 bg-cinema-red text-white rounded-full text-sm"
              >
                Xem tất cả suất chiếu
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([cinemaName, info]) => (
              <div key={cinemaName} className="bg-cinema-dark rounded-xl overflow-hidden border border-cinema-gray-light">
                {/* Cinema header */}
                <div className="px-4 pt-4 pb-3 border-b border-cinema-gray-light/50">
                  <div className="flex items-start gap-3">
                    <ChainLogo chain={info.chain} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white font-bold text-base leading-tight">{cinemaName}</h3>
                      {info.address && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-gray-500 text-xs truncate">{info.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Time slots - 2D Phụ đề label */}
                <div className="px-4 pt-2 pb-1">
                  <span className="text-xs text-gray-500">2D • Phụ đề / Lồng tiếng</span>
                </div>
                <div className="px-4 pb-4 flex flex-wrap gap-2">
                  {info.times
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(s => {
                      const noSeats = s.availableSeats === 0;
                      const isPrime = s.priceCategory === 'PRIME_TIME' || s.priceCategory === 'HOLIDAY';
                      const seatWarning = !noSeats && s.availableSeats <= 15;
                      return (
                        <button
                          key={s.id}
                          disabled={noSeats}
                          onClick={() => !noSeats && navigate(`/booking/${s.id}`)}
                          className={`flex flex-col items-center px-3.5 py-2.5 rounded-xl border-2 transition-all active:scale-95 ${
                            noSeats
                              ? 'border-gray-700/60 bg-gray-800/30 text-gray-600 cursor-not-allowed'
                              : isPrime
                              ? 'border-cinema-gold/50 bg-cinema-gold/10 text-white hover:bg-cinema-gold/20 hover:border-cinema-gold'
                              : 'border-cinema-gray-lighter bg-cinema-gray-light text-white hover:border-cinema-red/60 hover:bg-cinema-red/10'
                          }`}
                        >
                          {/* Start time */}
                          <span className="text-base font-bold leading-none">{fmt(s.startTime)}</span>
                          {/* End time */}
                          <span className="text-xs text-gray-500 mt-0.5">
                            ~{fmt(s.endTime)}
                          </span>
                          {/* Price or seat warning */}
                          {noSeats ? (
                            <span className="text-xs text-red-500/80 mt-0.5">Hết vé</span>
                          ) : seatWarning ? (
                            <span className="text-xs text-yellow-400 mt-0.5">Còn {s.availableSeats}</span>
                          ) : (
                            <span className={`text-xs mt-0.5 ${isPrime ? 'text-cinema-gold' : 'text-gray-500'}`}>
                              {(s.basePrice / 1000).toFixed(0)}K{isPrime ? ' ★' : ''}
                            </span>
                          )}
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
  );
};

export default ScreeningSelectionPage;
