package Nhom5.cinema_management.repository;

import Nhom5.cinema_management.model.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GenreRepository extends JpaRepository<Genre, Long> {
    Optional<Genre> findByName(String name);
    Optional<Genre> findBySlug(String slug);
    boolean existsByName(String name);
}
