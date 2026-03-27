package Nhom5.cinema_management.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import Nhom5.cinema_management.model.Movie;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long>, JpaSpecificationExecutor<Movie> {
    
    // Find by status
    Page<Movie> findByStatus(Movie.MovieStatus status, Pageable pageable);
    List<Movie> findByStatus(Movie.MovieStatus status);
    
    // Search by title
    Page<Movie> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    
    // Find by genre
    @Query("SELECT DISTINCT m FROM Movie m JOIN m.genres g WHERE g.id = :genreId")
    Page<Movie> findByGenreId(@Param("genreId") Long genreId, Pageable pageable);
    
    // Find movies with multiple genres
    @Query("SELECT DISTINCT m FROM Movie m JOIN m.genres g WHERE g.id IN :genreIds")
    Page<Movie> findByGenreIdIn(@Param("genreIds") List<Long> genreIds, Pageable pageable);
    
    // Find by release date range
    Page<Movie> findByReleaseDateBetween(LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    // Search with multiple criteria
    @Query("SELECT DISTINCT m FROM Movie m " +
           "LEFT JOIN m.genres g " +
           "WHERE (:keyword IS NULL OR " +
           "       LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "       LOWER(m.director) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "       LOWER(m.cast) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:genreId IS NULL OR g.id = :genreId) " +
           "AND (:minRating IS NULL OR m.rating >= :minRating)")
    Page<Movie> searchMovies(
        @Param("keyword") String keyword,
        @Param("status") Movie.MovieStatus status,
        @Param("genreId") Long genreId,
        @Param("minRating") Double minRating,
        Pageable pageable
    );
    
    // Get top rated movies
    @Query("SELECT m FROM Movie m WHERE m.rating IS NOT NULL ORDER BY m.rating DESC")
    Page<Movie> findTopRatedMovies(Pageable pageable);
    
    // Get upcoming movies
    @Query("SELECT m FROM Movie m WHERE m.releaseDate > :today AND m.status = 'COMING_SOON' ORDER BY m.releaseDate ASC")
    List<Movie> findUpcomingMovies(@Param("today") LocalDate today);
    
    // Get now showing movies
    @Query("SELECT m FROM Movie m WHERE m.status = 'NOW_SHOWING' ORDER BY m.releaseDate DESC")
    List<Movie> findNowShowingMovies();

    Long countByStatus(Movie.MovieStatus status);
}

