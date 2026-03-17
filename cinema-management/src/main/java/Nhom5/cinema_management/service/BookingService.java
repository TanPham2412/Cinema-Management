package Nhom5.cinema_management.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Nhom5.cinema_management.dto.BookingRequestDTO;
import Nhom5.cinema_management.dto.BookingResponseDTO;
import Nhom5.cinema_management.model.Booking;
import Nhom5.cinema_management.model.BookingSeat;
import Nhom5.cinema_management.model.Payment;
import Nhom5.cinema_management.model.Screening;
import Nhom5.cinema_management.model.Seat;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.BookingRepository;
import Nhom5.cinema_management.repository.PaymentRepository;
import Nhom5.cinema_management.repository.ScreeningRepository;
import Nhom5.cinema_management.repository.SeatRepository;
import Nhom5.cinema_management.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ScreeningRepository screeningRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userEmail));

        Screening screening = screeningRepository.findById(request.getScreeningId())
                .orElseThrow(() -> new EntityNotFoundException("Screening not found: " + request.getScreeningId()));

        if (request.getSeatIds() == null || request.getSeatIds().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 ghế");
        }

        // Load seats and validate availability
        List<Seat> seats = seatRepository.findAllById(request.getSeatIds());
        if (seats.size() != request.getSeatIds().size()) {
            throw new IllegalArgumentException("Một số ghế không tồn tại");
        }

        // Check seats belong to this screening's screen
        for (Seat seat : seats) {
            if (!seat.getScreen().getId().equals(screening.getScreen().getId())) {
                throw new IllegalArgumentException("Ghế không thuộc phòng chiếu này");
            }
        }

        // Check seats are not already booked in this screening
        List<Long> bookedSeatIds = screening.getBookings() == null ? List.of() :
                screening.getBookings().stream()
                        .filter(b -> b.getStatus() != Booking.BookingStatus.CANCELLED
                                  && b.getStatus() != Booking.BookingStatus.EXPIRED)
                        .flatMap(b -> b.getBookingSeats() == null ? java.util.stream.Stream.empty()
                                : b.getBookingSeats().stream())
                        .map(bs -> bs.getSeat().getId())
                        .collect(Collectors.toList());

        for (Seat seat : seats) {
            if (bookedSeatIds.contains(seat.getId())) {
                throw new IllegalStateException("Ghế " + seat.getSeatRow() + seat.getSeatNumber() + " đã được đặt");
            }
        }

        // Calculate total amount
        double total = seats.stream().mapToDouble(seat -> {
            double price = screening.getBasePrice();
            if (seat.getSeatType() == Seat.SeatType.VIP) price += 30000;
            else if (seat.getSeatType() == Seat.SeatType.COUPLE) price += 50000;
            return price;
        }).sum();

        int pointsUsed = request.getPointsUsed() != null ? request.getPointsUsed() : 0;
        if (pointsUsed > 0) {
            if (user.getLoyaltyPoints() < pointsUsed) {
                throw new IllegalArgumentException("Không đủ điểm tích lũy");
            }
            total -= pointsUsed * 100; // 100đ per point
            if (total < 0) total = 0;
        }

        int pointsEarned = (int) (total / 10000); // 1 point per 10,000đ

        // Determine if this is a VNPay payment (will stay PENDING until IPN confirms)
        boolean isVNPay = "VNPAY".equalsIgnoreCase(request.getPaymentMethod());

        // Create booking
        Booking booking = Booking.builder()
                .bookingCode(generateBookingCode())
                .user(user)
                .screening(screening)
                .bookingTime(LocalDateTime.now())
                .totalAmount(total)
                .pointsEarned(pointsEarned)
                .pointsUsed(pointsUsed)
                .status(isVNPay ? Booking.BookingStatus.PENDING : Booking.BookingStatus.CONFIRMED)
                .expiryTime(LocalDateTime.now().plusMinutes(15))
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // Create booking seats
        List<BookingSeat> bookingSeats = new ArrayList<>();
        for (Seat seat : seats) {
            double price = screening.getBasePrice();
            if (seat.getSeatType() == Seat.SeatType.VIP) price += 30000;
            else if (seat.getSeatType() == Seat.SeatType.COUPLE) price += 50000;

            BookingSeat bs = BookingSeat.builder()
                    .booking(savedBooking)
                    .seat(seat)
                    .price(price)
                    .build();
            bookingSeats.add(bs);
        }
        savedBooking.setBookingSeats(bookingSeats);

        // Create payment record (PENDING for VNPay, COMPLETED for others)
        Payment payment = Payment.builder()
                .booking(savedBooking)
                .amount(total)
                .paymentMethod(parsePaymentMethod(request.getPaymentMethod()))
                .status(isVNPay ? Payment.PaymentStatus.PENDING : Payment.PaymentStatus.COMPLETED)
                .transactionId(isVNPay ? null : UUID.randomUUID().toString())
                .createdAt(LocalDateTime.now())
                .completedAt(isVNPay ? null : LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        // For non-VNPay payments, update user loyalty points immediately
        // For VNPay, loyalty points are updated in VNPayService.confirmPayment()
        if (!isVNPay) {
            user.setLoyaltyPoints(user.getLoyaltyPoints() - pointsUsed + pointsEarned);
            userRepository.save(user);
        }

        // Update available seats
        screening.setAvailableSeats(screening.getAvailableSeats() - seats.size());
        screeningRepository.save(screening);

        return BookingResponseDTO.fromEntity(bookingRepository.save(savedBooking));
    }

    public List<BookingResponseDTO> getUserBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return bookingRepository.findByUserId(user.getId()).stream()
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public BookingResponseDTO getBookingByCode(String code) {
        Booking booking = bookingRepository.findByBookingCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + code));
        return BookingResponseDTO.fromEntity(booking);
    }

    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, String userEmail) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found"));

        // Only the owner can cancel
        if (!booking.getUser().getEmail().equals(userEmail)) {
            throw new IllegalStateException("Bạn không có quyền hủy vé này");
        }
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new IllegalStateException("Vé đã được hủy trước đó");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);

        // Restore available seats
        Screening screening = booking.getScreening();
        int seatCount = booking.getBookingSeats() == null ? 0 : booking.getBookingSeats().size();
        screening.setAvailableSeats(screening.getAvailableSeats() + seatCount);
        screeningRepository.save(screening);

        // Restore loyalty points used
        User user = booking.getUser();
        user.setLoyaltyPoints(user.getLoyaltyPoints() + booking.getPointsUsed() - booking.getPointsEarned());
        userRepository.save(user);

        return BookingResponseDTO.fromEntity(bookingRepository.save(booking));
    }

    private String generateBookingCode() {
        return "BK" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private Payment.PaymentMethod parsePaymentMethod(String method) {
        if (method == null) return Payment.PaymentMethod.CASH;
        try {
            return Payment.PaymentMethod.valueOf(method.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Payment.PaymentMethod.CASH;
        }
    }
}
