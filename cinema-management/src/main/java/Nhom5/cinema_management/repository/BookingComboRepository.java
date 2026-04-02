package Nhom5.cinema_management.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import Nhom5.cinema_management.model.BookingCombo;

@Repository
public interface BookingComboRepository extends JpaRepository<BookingCombo, Long> {
    List<BookingCombo> findByBookingId(Long bookingId);
    List<BookingCombo> findByComboId(Long comboId);
}
