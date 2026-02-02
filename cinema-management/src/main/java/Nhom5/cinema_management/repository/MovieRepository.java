package Nhom5.cinema_management.repository;

import Nhom5.cinema_management.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long> {
    List<Movie> findByStatus(Movie.MovieStatus status);
    List<Movie> findByGenreContaining(String genre);
}
