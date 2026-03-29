package Nhom5.cinema_management.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import Nhom5.cinema_management.model.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingCode(String bookingCode);
    @Query("SELECT b FROM Booking b WHERE b.user.id = :userId ORDER BY b.bookingTime DESC")
    List<Booking> findByUserIdOrderByBookingTimeDesc(@Param("userId") Long userId);
    List<Booking> findByStatusAndExpiryTimeBefore(Booking.BookingStatus status, LocalDateTime expiryTime);

    /** Eagerly loads bookingSeats + seat to avoid LazyInitializationException in WS broadcasts. */
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.bookingSeats bs LEFT JOIN FETCH bs.seat WHERE b.bookingCode = :code")
    Optional<Booking> findByBookingCodeWithSeats(@Param("code") String code);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.bookingSeats bs LEFT JOIN FETCH bs.seat WHERE b.id = :id")
    Optional<Booking> findByIdWithSeats(@Param("id") Long id);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.bookingSeats bs LEFT JOIN FETCH bs.seat WHERE b.status = :status AND b.expiryTime < :expiryTime")
    List<Booking> findExpiredWithSeats(@Param("status") Booking.BookingStatus status, @Param("expiryTime") LocalDateTime expiryTime);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.status IN ('CONFIRMED', 'COMPLETED')")
    Double sumTotalRevenue();

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status IN ('CONFIRMED', 'COMPLETED') AND b.bookingTime >= :startOfDay AND b.bookingTime < :endOfDay")
    Long countTodaySold(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = 'COMPLETED' AND b.bookingTime >= :startOfDay AND b.bookingTime < :endOfDay")
    Long countTodayCheckedIn(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.status IN ('CONFIRMED', 'COMPLETED') AND b.bookingTime >= :startOfDay AND b.bookingTime < :endOfDay")
    Double sumTodayRevenue(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status IN ('CONFIRMED', 'COMPLETED')")
    Long countConfirmedAndCompleted();

    @Query("SELECT COUNT(DISTINCT b.user.id) FROM Booking b WHERE b.status IN ('CONFIRMED', 'COMPLETED')")
    Long countDistinctCustomers();

    @Query("SELECT b FROM Booking b " +
           "JOIN b.screening s JOIN s.movie m JOIN s.screen sc JOIN sc.cinema c " +
           "WHERE (:status IS NULL OR b.status = :status) " +
           "AND (:cinemaId IS NULL OR c.id = :cinemaId) " +
           "AND (:movieId IS NULL OR m.id = :movieId) " +
           "AND (:keyword IS NULL OR " +
           "     LOWER(b.bookingCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(b.user.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(b.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "     LOWER(m.title) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY b.bookingTime DESC")
    org.springframework.data.domain.Page<Booking> findForAdmin(
           @Param("status") Booking.BookingStatus status,
           @Param("cinemaId") Long cinemaId,
           @Param("movieId") Long movieId,
           @Param("keyword") String keyword,
           org.springframework.data.domain.Pageable pageable);

    @Query("SELECT FUNCTION('MONTH', b.bookingTime), " +
           "COALESCE(SUM(b.totalAmount), 0), COUNT(b) " +
           "FROM Booking b " +
           "WHERE FUNCTION('YEAR', b.bookingTime) = :year " +
           "AND b.status IN ('CONFIRMED', 'COMPLETED') " +
           "GROUP BY FUNCTION('MONTH', b.bookingTime)")
    java.util.List<Object[]> getMonthlyStats(@Param("year") int year);

    @Query("SELECT s.movie.title, COALESCE(SUM(b.totalAmount), 0), COUNT(b) " +
           "FROM Booking b JOIN b.screening s " +
           "WHERE b.status IN ('CONFIRMED', 'COMPLETED') " +
           "GROUP BY s.movie.id, s.movie.title " +
           "ORDER BY SUM(b.totalAmount) DESC")
    java.util.List<Object[]> getTopMoviesByRevenue(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT bs.seat.seatType, COALESCE(SUM(bs.price), 0) " +
           "FROM BookingSeat bs " +
           "WHERE bs.booking.status IN ('CONFIRMED', 'COMPLETED') " +
           "GROUP BY bs.seat.seatType")
    java.util.List<Object[]> getRevenueBySeatType();
}

