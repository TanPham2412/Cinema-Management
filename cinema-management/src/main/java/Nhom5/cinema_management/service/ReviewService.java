package Nhom5.cinema_management.service;

import Nhom5.cinema_management.dto.ReviewRequestDTO;
import Nhom5.cinema_management.dto.ReviewResponseDTO;
import Nhom5.cinema_management.model.Movie;
import Nhom5.cinema_management.model.Review;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.MovieRepository;
import Nhom5.cinema_management.repository.ReviewRepository;
import Nhom5.cinema_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewService {
    
    private final ReviewRepository reviewRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;
    
    @Transactional
    public ReviewResponseDTO createReview(Long movieId, Long userId, ReviewRequestDTO requestDTO) {
        // Check if movie exists
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim với ID: " + movieId));
        
        // Check if user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        
        // Check if user already reviewed this movie
        if (reviewRepository.existsByUserIdAndMovieId(userId, movieId)) {
            throw new RuntimeException("Bạn đã đánh giá phim này rồi. Vui lòng cập nhật đánh giá cũ.");
        }
        
        // Create review
        Review review = Review.builder()
                .user(user)
                .movie(movie)
                .rating(requestDTO.getRating())
                .comment(requestDTO.getComment())
                .build();
        
        Review savedReview = reviewRepository.save(review);
        
        // Update movie rating
        updateMovieRating(movieId);
        
        return convertToResponseDTO(savedReview);
    }
    
    @Transactional
    public ReviewResponseDTO updateReview(Long reviewId, Long userId, ReviewRequestDTO requestDTO) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
        
        // Check if user owns this review
        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền sửa đánh giá này");
        }
        
        review.setRating(requestDTO.getRating());
        review.setComment(requestDTO.getComment());
        
        Review updatedReview = reviewRepository.save(review);
        
        // Update movie rating
        updateMovieRating(review.getMovie().getId());
        
        return convertToResponseDTO(updatedReview);
    }
    
    @Transactional
    public void deleteReview(Long reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đánh giá"));
        
        // Check if user owns this review
        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa đánh giá này");
        }
        
        Long movieId = review.getMovie().getId();
        reviewRepository.delete(review);
        
        // Update movie rating
        updateMovieRating(movieId);
    }
    
    @Transactional(readOnly = true)
    public List<ReviewResponseDTO> getMovieReviews(Long movieId) {
        return reviewRepository.findByMovieIdOrderByCreatedAtDesc(movieId).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ReviewResponseDTO getUserReviewForMovie(Long movieId, Long userId) {
        return reviewRepository.findByUserIdAndMovieId(userId, movieId)
                .map(this::convertToResponseDTO)
                .orElse(null);
    }
    
    @Transactional(readOnly = true)
    public List<ReviewResponseDTO> getUserReviews(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }
    
    private void updateMovieRating(Long movieId) {
        Double averageRating = reviewRepository.calculateAverageRating(movieId);
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phim"));
        
        // Round to 1 decimal place
        if (averageRating != null) {
            movie.setRating(Math.round(averageRating * 10.0) / 10.0);
        } else {
            movie.setRating(null);
        }
        
        movieRepository.save(movie);
    }
    
    private ReviewResponseDTO convertToResponseDTO(Review review) {
        return ReviewResponseDTO.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .movieId(review.getMovie().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
