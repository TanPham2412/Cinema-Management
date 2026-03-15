import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Calendar, Globe, Star, 
  Film, Users, Award, Play
} from 'lucide-react';
import movieService from '../services/movieService';
import MovieReviews from '../components/MovieReviews';
import ScreeningModal from '../components/ScreeningModal';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookModal, setShowBookModal] = useState(false);

  useEffect(() => {
    fetchMovieDetail();
  }, [id]);

  const fetchMovieDetail = async () => {
    try {
      setLoading(true);
      const data = await movieService.getMovieById(id);
      setMovie(data);
    } catch (err) {
      console.error('Error fetching movie:', err);
      setError('Không thể tải thông tin phim');
    } finally {
      setLoading(false);
    }
  };

  const getAgeRatingLabel = (ageRating) => {
    const labels = {
      'P': 'P - Phổ biến',
      'K': 'K - Dưới 13 tuổi có cha mẹ',
      'T13': 'T13 - Từ 13 tuổi',
      'T16': 'T16 - Từ 16 tuổi',
      'T18': 'T18 - Từ 18 tuổi',
      'C': 'C - Cấm chiếu'
    };
    return labels[ageRating] || ageRating;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'NOW_SHOWING': { text: 'Đang chiếu', color: 'bg-green-500' },
      'COMING_SOON': { text: 'Sắp chiếu', color: 'bg-yellow-500' },
      'ENDED': { text: 'Đã kết thúc', color: 'bg-gray-500' }
    };
    const badge = badges[status] || { text: status, color: 'bg-gray-500' };
    return (
      <span className={`px-3 py-1 ${badge.color} text-white rounded-full text-sm font-semibold`}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cinema-darker via-cinema-dark to-cinema-darker flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-cinema-red border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 mt-4">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cinema-darker via-cinema-dark to-cinema-darker flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">{error || 'Không tìm thấy phim'}</p>
          <button
            onClick={() => navigate('/movies')}
            className="px-6 py-2 bg-cinema-red text-white rounded-lg hover:bg-cinema-red-dark transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cinema-darker via-cinema-dark to-cinema-darker pb-28">
      {/* Banner */}
      {movie.bannerUrl && (
        <div className="relative h-96 overflow-hidden">
          <img 
            src={`/api${movie.bannerUrl}`}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-darker via-cinema-darker/50 to-transparent"></div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pb-12 -mt-32 relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white mb-6 hover:text-cinema-gold transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Poster */}
          <div className="lg:col-span-1">
            <div className="bg-black/50 rounded-lg overflow-hidden shadow-2xl sticky top-6">
              {movie.posterUrl ? (
                <img 
                  src={`/api${movie.posterUrl}`}
                  alt={movie.title}
                  className="w-full object-cover"
                />
              ) : (
                <div className="aspect-[2/3] bg-cinema-gray flex items-center justify-center">
                  <Film className="w-24 h-24 text-gray-600" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Rating */}
            <div className="bg-black/50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-4xl font-bold text-white">{movie.title}</h1>
                {getStatusBadge(movie.status)}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
                  <span className="text-xl font-semibold text-white">
                    {movie.rating ? movie.rating.toFixed(1) : 'Chưa có đánh giá'}
                  </span>
                  <span className="text-sm text-gray-400">/10</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{movie.duration} phút</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(movie.releaseDate).toLocaleDateString('vi-VN')}</span>
                </div>

                {movie.ageRating && (
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    <span>{getAgeRatingLabel(movie.ageRating)}</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-4">
                {movie.genres.map(genre => (
                  <span 
                    key={genre.id}
                    className="px-3 py-1 bg-cinema-red/20 text-cinema-gold rounded-full text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-black/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Tóm tắt</h2>
              <p className="text-gray-300 leading-relaxed">{movie.description}</p>
            </div>

            {/* Details */}
            <div className="bg-black/50 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Film className="w-5 h-5" />
                  <span className="font-semibold">Đạo diễn</span>
                </div>
                <p className="text-white ml-7">{movie.director}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">Diễn viên</span>
                </div>
                <p className="text-white ml-7">{movie.cast}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">Ngôn ngữ</span>
                </div>
                <p className="text-white ml-7">{movie.language}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Globe className="w-5 h-5" />
                  <span className="font-semibold">Quốc gia</span>
                </div>
                <p className="text-white ml-7">{movie.country}</p>
              </div>
            </div>

            {movie.status === 'COMING_SOON' && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-5 text-center">
                <p className="text-amber-400 font-semibold text-lg">🎬 Phim sắp ra mắt</p>
                <p className="text-gray-400 text-sm mt-1">
                  Khởi chiếu: {new Date(movie.releaseDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            )}

            {/* Trailer */}
            {movie.trailerUrl && (
              <div className="bg-black/50 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Play className="w-6 h-6 text-cinema-red" />
                  Trailer
                </h2>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe
                    className="w-full h-full"
                    src={movie.trailerUrl.replace('watch?v=', 'embed/')}
                    title="Movie Trailer"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {/* Reviews */}
            <MovieReviews movieId={movie.id} />
          </div>
        </div>
      </div>

      {/* Sticky Mua vé Button */}
      {movie.status === 'NOW_SHOWING' && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="bg-gradient-to-t from-cinema-darker via-cinema-darker/95 to-transparent pt-8 pb-5 px-4">
            <button
              onClick={() => setShowBookModal(true)}
              className="w-full max-w-2xl mx-auto flex items-center justify-center py-4 bg-cinema-red hover:bg-red-700 active:scale-95 text-white text-xl font-bold rounded-xl transition-all shadow-2xl pointer-events-auto"
            >
              Mua vé
            </button>
          </div>
        </div>
      )}

      {/* Screening Modal */}
      {showBookModal && (
        <ScreeningModal
          movieId={id}
          movieTitle={movie.title}
          movieDuration={movie.duration}
          moviePosterUrl={movie.posterUrl}
          movieGenres={movie.genres?.map(g => g.name || g).join(', ')}
          movieRating={movie.ageRating}
          onClose={() => setShowBookModal(false)}
        />
      )}
    </div>
  );
};

export default MovieDetail;
