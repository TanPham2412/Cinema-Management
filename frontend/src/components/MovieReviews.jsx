import React, { useState, useEffect } from 'react';
import { Star, Send, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { getMovieReviews, getMyReviewForMovie, createReview, updateReview, deleteReview } from '../services/reviewService';

const MovieReviews = ({ movieId }) => {
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetchReviews();
    checkLoginAndFetchMyReview();
  }, [movieId]);

  const checkLoginAndFetchMyReview = async () => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    if (token) {
      try {
        const myReviewData = await getMyReviewForMovie(movieId);
        if (myReviewData) {
          setMyReview(myReviewData);
          setRating(myReviewData.rating);
          setComment(myReviewData.comment || '');
        }
      } catch (error) {
        console.error('Error fetching my review:', error);
      }
    }
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getMovieReviews(movieId);
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError('Bạn cần đăng nhập để đánh giá phim');
      return;
    }

    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const reviewData = {
        rating,
        comment: comment.trim() || null,
      };

      if (myReview) {
        // Update existing review
        await updateReview(myReview.id, reviewData);
        setMyReview({ ...myReview, ...reviewData });
        setIsEditing(false);
      } else {
        // Create new review
        const newReview = await createReview(movieId, reviewData);
        setMyReview(newReview);
      }

      // Refresh reviews list
      await fetchReviews();
      
      // Reset form if creating new
      if (!myReview) {
        setRating(0);
        setComment('');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setRating(myReview.rating);
    setComment(myReview.comment || '');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setRating(myReview.rating);
    setComment(myReview.comment || '');
  };

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      return;
    }

    try {
      await deleteReview(myReview.id);
      setMyReview(null);
      setRating(0);
      setComment('');
      setIsEditing(false);
      await fetchReviews();
    } catch (error) {
      setError('Có lỗi xảy ra khi xóa đánh giá');
    }
  };

  const renderStars = (value, interactive = false) => {
    return (
      <div className="flex flex-wrap gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <Star
            key={star}
            size={interactive ? 20 : 16}
            className={`cursor-${interactive ? 'pointer' : 'default'} transition-colors sm:w-6 sm:h-6 ${interactive ? '' : 'sm:w-4 sm:h-4'} ${
              star <= (interactive ? (hoverRating || rating) : value)
                ? 'fill-[#d4af37] text-[#d4af37]'
                : 'text-gray-600'
            }`}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-black/50 rounded-lg p-4 sm:p-6 space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Đánh giá phim</h2>

      {/* Review Form */}
      {isLoggedIn && (!myReview || isEditing) && (
        <form onSubmit={handleSubmit} className="bg-black/30 rounded-lg p-4 space-y-4">
          <div>
            <label className="text-white mb-2 block">
              {myReview ? 'Sửa đánh giá của bạn' : 'Đánh giá của bạn'}
            </label>
            {renderStars(rating, true)}
            <p className="text-sm text-gray-400 mt-1">{rating}/10 sao</p>
          </div>

          <div>
            <label className="text-white mb-2 block">Nhận xét (tùy chọn)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
              className="w-full px-4 py-3 bg-black/50 text-white border border-gray-700 rounded-lg 
                       focus:outline-none focus:border-[#e50914] resize-none"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length}/1000 ký tự</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[#e50914] text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex items-center gap-2 px-6 py-2 bg-[#e50914] text-white rounded-lg
                       hover:bg-[#f40612] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
              {submitting ? 'Đang gửi...' : myReview ? 'Cập nhật' : 'Gửi đánh giá'}
            </button>
            
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      )}

      {/* My Review Display */}
      {isLoggedIn && myReview && !isEditing && (
        <div className="bg-[#1a1a2e] rounded-lg p-4 border-l-4 border-[#d4af37]">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-white font-semibold mb-1">Đánh giá của bạn</h3>
              {renderStars(myReview.rating)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="p-2 text-[#d4af37] hover:bg-black/30 rounded transition-colors"
                title="Chỉnh sửa"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-[#e50914] hover:bg-black/30 rounded transition-colors"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          {myReview.comment && (
            <p className="text-gray-300 text-sm mt-2">{myReview.comment}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {formatDate(myReview.updatedAt || myReview.createdAt)}
          </p>
        </div>
      )}

      {!isLoggedIn && (
        <div className="bg-black/30 rounded-lg p-4 text-center">
          <AlertCircle className="mx-auto mb-2 text-gray-400" size={32} />
          <p className="text-gray-400">
            Vui lòng <a href="/login" className="text-[#e50914] hover:underline">đăng nhập</a> để đánh giá phim
          </p>
        </div>
      )}

      {/* All Reviews */}
      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold text-white">
          Tất cả đánh giá ({reviews.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Đang tải...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Chưa có đánh giá nào. Hãy là người đầu tiên!
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-black/30 rounded-lg p-4 hover:bg-black/40 transition-colors"
              >
                <div className="flex justify-between items-start mb-2 flex-col sm:flex-row gap-1">
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">{review.userName}</h4>
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-gray-300 text-sm mt-2">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieReviews;
