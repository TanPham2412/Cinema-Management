package Nhom5.cinema_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import Nhom5.cinema_management.model.Screen;

@Repository
public interface ScreenRepository extends JpaRepository<Screen, Long> {
    List<Screen> findByCinemaId(Long cinemaId);
}
