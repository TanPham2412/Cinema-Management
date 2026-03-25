package Nhom5.cinema_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import Nhom5.cinema_management.model.BookingCombo;

public interface BookingComboRepository extends JpaRepository<BookingCombo, Long> {
    List<BookingCombo> findByBookingId(Long bookingId);
}
