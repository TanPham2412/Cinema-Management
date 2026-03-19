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
    List<Booking> findByUserId(Long userId);
    List<Booking> findByStatusAndExpiryTimeBefore(Booking.BookingStatus status, LocalDateTime expiryTime);

    /** Eagerly loads bookingSeats + seat to avoid LazyInitializationException in WS broadcasts. */
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.bookingSeats bs LEFT JOIN FETCH bs.seat WHERE b.bookingCode = :code")
    Optional<Booking> findByBookingCodeWithSeats(@Param("code") String code);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.bookingSeats bs LEFT JOIN FETCH bs.seat WHERE b.id = :id")
    Optional<Booking> findByIdWithSeats(@Param("id") Long id);

    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.bookingSeats bs LEFT JOIN FETCH bs.seat WHERE b.status = :status AND b.expiryTime < :expiryTime")
    List<Booking> findExpiredWithSeats(@Param("status") Booking.BookingStatus status, @Param("expiryTime") LocalDateTime expiryTime);
}
