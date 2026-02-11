package Nhom5.cinema_management.controller;

import Nhom5.cinema_management.dto.ReviewRequestDTO;
import Nhom5.cinema_management.dto.ReviewResponseDTO;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {
    
    private final ReviewService reviewService;
    
    // Public: Get all reviews for a movie
    @GetMapping("/movie/{movieId}")
    public ResponseEntity<List<ReviewResponseDTO>> getMovieReviews(@PathVariable Long movieId) {
        return ResponseEntity.ok(reviewService.getMovieReviews(movieId));
    }
    
    // Authenticated: Get current user's review for a movie
    @GetMapping("/movie/{movieId}/my-review")
    public ResponseEntity<ReviewResponseDTO> getMyReviewForMovie(@PathVariable Long movieId) {
        User user = getCurrentUser();
        ReviewResponseDTO review = reviewService.getUserReviewForMovie(movieId, user.getId());
        return ResponseEntity.ok(review);
    }
    
    // Authenticated: Get all reviews by current user
    @GetMapping("/my-reviews")
    public ResponseEntity<List<ReviewResponseDTO>> getMyReviews() {
        User user = getCurrentUser();
        return ResponseEntity.ok(reviewService.getUserReviews(user.getId()));
    }
    
    // Authenticated: Create a review
    @PostMapping("/movie/{movieId}")
    public ResponseEntity<ReviewResponseDTO> createReview(
            @PathVariable Long movieId,
            @Valid @RequestBody ReviewRequestDTO requestDTO) {
        User user = getCurrentUser();
        ReviewResponseDTO review = reviewService.createReview(movieId, user.getId(), requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(review);
    }
    
    // Authenticated: Update own review
    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponseDTO> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequestDTO requestDTO) {
        User user = getCurrentUser();
        ReviewResponseDTO review = reviewService.updateReview(reviewId, user.getId(), requestDTO);
        return ResponseEntity.ok(review);
    }
    
    // Authenticated: Delete own review
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long reviewId) {
        User user = getCurrentUser();
        reviewService.deleteReview(reviewId, user.getId());
        return ResponseEntity.noContent().build();
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Bạn cần đăng nhập để thực hiện hành động này");
        }
        return (User) authentication.getPrincipal();
    }
}
