package Nhom5.cinema_management.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Nhom5.cinema_management.dto.BookingRequestDTO;
import Nhom5.cinema_management.dto.BookingResponseDTO;
import Nhom5.cinema_management.model.Booking;
import Nhom5.cinema_management.model.BookingCombo;
import Nhom5.cinema_management.model.BookingSeat;
import Nhom5.cinema_management.model.Combo;
import Nhom5.cinema_management.model.Payment;
import Nhom5.cinema_management.model.Screening;
import Nhom5.cinema_management.model.Seat;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.BookingComboRepository;
import Nhom5.cinema_management.repository.BookingRepository;
import Nhom5.cinema_management.repository.ComboRepository;
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
    private final SimpMessagingTemplate messagingTemplate;
    private final SeatHoldStore seatHoldStore;
    private final ComboRepository comboRepository;
    private final BookingComboRepository bookingComboRepository;

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
        LocalDateTime now = LocalDateTime.now();
        List<Long> bookedSeatIds = screening.getBookings() == null ? List.of() :
                screening.getBookings().stream()
                        .filter(b -> b.getStatus() != Booking.BookingStatus.CANCELLED
                                  && b.getStatus() != Booking.BookingStatus.EXPIRED
                                  && !(b.getStatus() == Booking.BookingStatus.PENDING
                                       && b.getExpiryTime() != null
                                       && b.getExpiryTime().isBefore(now)))
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

        int pointsUsed = request.getPointsUsed() == null ? 0 : request.getPointsUsed();
        if (pointsUsed > 0) {
            if (user.getLoyaltyPoints() < pointsUsed) {
                throw new IllegalArgumentException("Không đủ điểm tích lũy");
            }
            total -= pointsUsed * 100; // 100đ per point
            if (total < 0) total = 0;
        }

        // Process food & drink combos with membership tier discount
        double foodDiscount = getFoodDiscount(user.getMembershipTier());
        double comboTotal = 0;
        List<BookingCombo> pendingCombos = new ArrayList<>();

        if (request.getCombos() != null) {
            boolean platinumWaterGranted = false;
            boolean diamondComboGranted = false;
            for (BookingRequestDTO.ComboOrderItem item : request.getCombos()) {
                if (item.getId() == null || item.getQuantity() == null || item.getQuantity() <= 0) continue;
                Combo combo = comboRepository.findById(item.getId())
                        .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Combo not found: " + item.getId()));
                double unitPrice = combo.getPrice() * (1.0 - foodDiscount);
                // PLATINUM: first Nước suối is free
                if (user.getMembershipTier() == User.MembershipTier.PLATINUM
                        && !platinumWaterGranted && combo.getName().contains("Nước suối")) {
                    unitPrice = 0;
                    platinumWaterGranted = true;
                }
                // DIAMOND: first Combo 1 người is free
                if (user.getMembershipTier() == User.MembershipTier.DIAMOND
                        && !diamondComboGranted && combo.getName().contains("Combo 1")) {
                    unitPrice = 0;
                    diamondComboGranted = true;
                }
                comboTotal += unitPrice * item.getQuantity();
                final double finalUnitPrice = unitPrice;
                // Store temporarily — will link to savedBooking after it is persisted
                pendingCombos.add(BookingCombo.builder()
                        .combo(combo).quantity(item.getQuantity()).price(finalUnitPrice).build());
            }
        }
        total += comboTotal;

        int pointsEarned = (int) (total / 10000); // 1 point per 10,000đ

        // Gateway payments (VNPay, MoMo) stay PENDING until IPN/notify confirms
        String pm = request.getPaymentMethod();
        boolean isGatewayPayment = "VNPAY".equalsIgnoreCase(pm) || "MOMO".equalsIgnoreCase(pm);

        // Create booking
        Booking booking = Booking.builder()
                .bookingCode(generateBookingCode())
                .user(user)
                .screening(screening)
                .bookingTime(LocalDateTime.now())
                .totalAmount(total)
                .pointsEarned(pointsEarned)
                .pointsUsed(pointsUsed)
                .status(isGatewayPayment ? Booking.BookingStatus.PENDING : Booking.BookingStatus.CONFIRMED)
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

        // Link BookingCombo records to the saved booking
        if (!pendingCombos.isEmpty()) {
            List<BookingCombo> bookingCombos = pendingCombos.stream().map(bc -> {
                bc.setBooking(savedBooking);
                return bc;
            }).toList();
            bookingComboRepository.saveAll(bookingCombos);
        }

        // Create payment record (PENDING for gateway payments, COMPLETED for others)
        Payment payment = Payment.builder()
                .booking(savedBooking)
                .amount(total)
                .paymentMethod(parsePaymentMethod(request.getPaymentMethod()))
                .status(isGatewayPayment ? Payment.PaymentStatus.PENDING : Payment.PaymentStatus.COMPLETED)
                .transactionId(isGatewayPayment ? null : UUID.randomUUID().toString())
                .createdAt(LocalDateTime.now())
                .completedAt(isGatewayPayment ? null : LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        // For non-gateway payments, update user loyalty points immediately
        // For gateway payments, loyalty points are updated after confirmation
        if (!isGatewayPayment) {
            int newPoints = user.getLoyaltyPoints() - pointsUsed + pointsEarned;
            user.setLoyaltyPoints(newPoints);
            user.setMembershipTier(calculateTier(newPoints));
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
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED
                          || b.getStatus() == Booking.BookingStatus.COMPLETED)
                .map(BookingResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponseDTO checkIn(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vé: " + bookingCode));
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED
                || booking.getStatus() == Booking.BookingStatus.EXPIRED) {
            throw new IllegalStateException("Vé đã bị hủy hoặc hết hạn");
        }
        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalStateException("Vé này đã được soát rồi");
        }
        if (booking.getStatus() == Booking.BookingStatus.PENDING) {
            throw new IllegalStateException("Vé chưa được thanh toán");
        }
        booking.setStatus(Booking.BookingStatus.COMPLETED);
        return BookingResponseDTO.fromEntity(bookingRepository.save(booking));
    }

    public BookingResponseDTO getBookingByCode(String code) {
        Booking booking = bookingRepository.findByBookingCode(code)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + code));
        return BookingResponseDTO.fromEntity(booking);
    }

    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, String userEmail) {
        // JOIN FETCH to avoid LazyInitializationException when broadcasting WS events
        Booking booking = bookingRepository.findByIdWithSeats(bookingId)
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

        BookingResponseDTO result = BookingResponseDTO.fromEntity(bookingRepository.save(booking));

        // Broadcast WS RELEASE — wrapped in try-catch so WS failures don't roll back DB
        try {
            if (booking.getBookingSeats() != null) {
                Long screeningId = screening.getId();
                for (BookingSeat bs : booking.getBookingSeats()) {
                    String seatId = String.valueOf(bs.getSeat().getId());
                    seatHoldStore.release(screeningId, seatId);
                    java.util.Map<String, Object> wsMsg = new java.util.HashMap<>();
                    wsMsg.put("screeningId", screeningId);
                    wsMsg.put("seatId", bs.getSeat().getId());
                    wsMsg.put("action", "RELEASE");
                    wsMsg.put("userId", null);
                    messagingTemplate.convertAndSend("/topic/seats/" + screeningId, (Object) wsMsg);
                }
            }
        } catch (Exception wsErr) {
            // Log but don't propagate — DB cancel must succeed even if WS fails
        }

        return result;
    }

    /**
     * Runs every 60 seconds. Finds PENDING bookings whose expiryTime has passed,
     * marks them EXPIRED, and restores available seat counts.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void expireStaleBookings() {
        // JOIN FETCH to avoid LazyInitializationException when broadcasting WS events
        List<Booking> expired = bookingRepository
                .findExpiredWithSeats(Booking.BookingStatus.PENDING, LocalDateTime.now());
        for (Booking booking : expired) {
            booking.setStatus(Booking.BookingStatus.EXPIRED);
            int seatCount = booking.getBookingSeats() == null ? 0 : booking.getBookingSeats().size();
            if (seatCount > 0) {
                Screening screening = booking.getScreening();
                screening.setAvailableSeats(screening.getAvailableSeats() + seatCount);
                screeningRepository.save(screening);

                // Broadcast WS RELEASE — wrapped in try-catch so expiry commit succeeds
                try {
                    Long screeningId = screening.getId();
                    for (BookingSeat bs : booking.getBookingSeats()) {
                        String seatId = String.valueOf(bs.getSeat().getId());
                        seatHoldStore.release(screeningId, seatId);
                        java.util.Map<String, Object> wsMsg = new java.util.HashMap<>();
                        wsMsg.put("screeningId", screeningId);
                        wsMsg.put("seatId", bs.getSeat().getId());
                        wsMsg.put("action", "RELEASE");
                        wsMsg.put("userId", null);
                        messagingTemplate.convertAndSend("/topic/seats/" + screeningId, (Object) wsMsg);
                    }
                } catch (Exception wsErr) {
                    // Log but don't propagate — DB expiry must succeed even if WS fails
                }
            }
            bookingRepository.save(booking);
        }
    }

    private User.MembershipTier calculateTier(int points) {
        if (points >= 10000) return User.MembershipTier.DIAMOND;
        if (points >= 3000)  return User.MembershipTier.PLATINUM;
        if (points >= 1000)  return User.MembershipTier.GOLD;
        if (points >= 300)   return User.MembershipTier.SILVER;
        return User.MembershipTier.BRONZE;
    }

    /** Food/drink discount rate by membership tier */
    private double getFoodDiscount(User.MembershipTier tier) {
        if (tier == null) return 0;
        return switch (tier) {
            case SILVER   -> 0.05;
            case GOLD     -> 0.10;
            case PLATINUM -> 0.15;
            case DIAMOND  -> 0.20;
            default       -> 0;
        };
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
