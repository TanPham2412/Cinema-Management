package Nhom5.cinema_management.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import Nhom5.cinema_management.model.Screening;

@Repository
public interface ScreeningRepository extends JpaRepository<Screening, Long> {
    List<Screening> findByMovieIdAndActiveTrue(Long movieId);

    Optional<Screening> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query("SELECT s FROM Screening s WHERE s.startTime >= :startOfDay AND s.startTime < :endOfDay AND s.active = true ORDER BY s.startTime")
    List<Screening> findTodayScreenings(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(s) FROM Screening s WHERE s.startTime >= :now AND s.startTime < :endOfDay AND s.active = true")
    Long countUpcomingToday(@Param("now") LocalDateTime now, @Param("endOfDay") LocalDateTime endOfDay);
    
    @Query("SELECT s FROM Screening s WHERE s.screen.id = :screenId " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Screening> findConflictingScreenings(
        @Param("screenId") Long screenId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    @Query("SELECT s FROM Screening s WHERE s.screen.id = :screenId " +
           "AND s.id != :excludeId " +
           "AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Screening> findConflictingScreeningsExcluding(
        @Param("screenId") Long screenId,
        @Param("excludeId") Long excludeId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );
}
