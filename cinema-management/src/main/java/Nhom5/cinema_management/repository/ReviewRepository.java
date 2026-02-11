package Nhom5.cinema_management.repository;

import Nhom5.cinema_management.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    // Find all reviews for a movie
    List<Review> findByMovieIdOrderByCreatedAtDesc(Long movieId);
    
    // Check if user already reviewed a movie
    Optional<Review> findByUserIdAndMovieId(Long userId, Long movieId);
    
    // Check if review exists
    boolean existsByUserIdAndMovieId(Long userId, Long movieId);
    
    // Calculate average rating for a movie
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.movie.id = :movieId")
    Double calculateAverageRating(@Param("movieId") Long movieId);
    
    // Count reviews for a movie
    long countByMovieId(Long movieId);
    
    // Get user's reviews
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
}
