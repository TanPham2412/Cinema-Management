package Nhom5.cinema_management.repository;

import Nhom5.cinema_management.model.Screening;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScreeningRepository extends JpaRepository<Screening, Long> {
    List<Screening> findByMovieIdAndActiveTrue(Long movieId);
    
    @Query("SELECT s FROM Screening s WHERE s.screen.id = :screenId " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Screening> findConflictingScreenings(
        @Param("screenId") Long screenId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
}
