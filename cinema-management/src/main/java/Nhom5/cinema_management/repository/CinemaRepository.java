package Nhom5.cinema_management.repository;

import Nhom5.cinema_management.model.Cinema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CinemaRepository extends JpaRepository<Cinema, Long> {
    List<Cinema> findByActiveTrue();
    List<Cinema> findByCity(String city);

    Optional<Cinema> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
