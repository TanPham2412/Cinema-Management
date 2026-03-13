package Nhom5.cinema_management.repository;

import Nhom5.cinema_management.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingCode(String bookingCode);
    List<Booking> findByUserId(Long userId);
    List<Booking> findByStatusAndExpiryTimeBefore(Booking.BookingStatus status, LocalDateTime expiryTime);
}
