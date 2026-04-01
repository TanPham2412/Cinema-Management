package Nhom5.cinema_management.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Nhom5.cinema_management.config.VNPayConfig;
import Nhom5.cinema_management.model.Booking;
import Nhom5.cinema_management.model.BookingSeat;
import Nhom5.cinema_management.model.Payment;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.BookingRepository;
import Nhom5.cinema_management.repository.PaymentRepository;
import Nhom5.cinema_management.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayService {

    private final VNPayConfig vnPayConfig;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SeatHoldStore seatHoldStore;
    private final EmailService emailService;

    /**
     * Generate VNPay payment URL for a booking
     */
    public String createPaymentUrl(String bookingCode, String ipAddress) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingCode));

        String txnRef = bookingCode;

        TimeZone vnTimeZone = TimeZone.getTimeZone("Asia/Ho_Chi_Minh");
        Calendar cal = Calendar.getInstance(vnTimeZone);
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        formatter.setTimeZone(vnTimeZone);
        String createDate = formatter.format(cal.getTime());

        // Amount in VND * 100 (VNPay requires amount * 100)
        long amount = (long) (booking.getTotalAmount() * 100);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", txnRef);
        vnpParams.put("vnp_OrderInfo", "Thanh toan ve xem phim ma GD:" + txnRef);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Amount", String.valueOf(amount));
        vnpParams.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        vnpParams.put("vnp_IpAddr", ipAddress);
        vnpParams.put("vnp_CreateDate", createDate);

        // Sort params alphabetically
        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        boolean firstField = true;

        for (String fieldName : fieldNames) {
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!firstField) {
                    hashData.append('&');
                    query.append('&');
                }
                // Build hash data with URL-encoded values (VNPay 2.1.0 spec)
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                // Build query string
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII))
                     .append('=')
                     .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                firstField = false;
            }
        }

        String secureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        query.append("&vnp_SecureHash=").append(secureHash);

        String paymentUrl = vnPayConfig.getUrl() + "?" + query;
        log.info("[VNPay] TmnCode={} | BookingCode={} | Amount={} | IpAddr={} | ReturnUrl={}",
                vnPayConfig.getTmnCode(), bookingCode, amount, ipAddress, vnPayConfig.getReturnUrl());
        log.debug("[VNPay] Generated payment URL: {}", paymentUrl);
        return paymentUrl;
    }

    /**
     * Verify VNPay return / IPN signature
     * Returns true if valid signature
     */
    public boolean verifySignature(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) return false;

        // Remove hash fields before verification
        Map<String, String> vnpParams = new HashMap<>(params);
        vnpParams.remove("vnp_SecureHash");
        vnpParams.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        boolean firstField = true;
        for (String fieldName : fieldNames) {
            String fieldValue = vnpParams.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                if (!firstField) {
                    hashData.append('&');
                }
                hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                firstField = false;
            }
        }

        String calculatedHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData.toString());
        return calculatedHash.equalsIgnoreCase(receivedHash);
    }

    /**
     * Confirm booking after successful VNPay payment.
     * Broadcasts WS CONFIRM (success) or RELEASE (failure) for each seat in real-time.
     */
    @Transactional
    public void confirmPayment(String bookingCode, String vnpTransactionNo, String vnpBankCode, String responseCode) {
        // Use JOIN FETCH to eager-load bookingSeats + seat so WS broadcast doesn't hit LazyInitializationException
        Booking booking = bookingRepository.findByBookingCodeWithSeats(bookingCode)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingCode));

        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new EntityNotFoundException("Payment not found for booking: " + bookingCode));

        boolean success = "00".equals(responseCode);
        if (success) {
            // Payment successful
            booking.setStatus(Booking.BookingStatus.CONFIRMED);
            payment.setStatus(Payment.PaymentStatus.COMPLETED);
            payment.setTransactionId(vnpTransactionNo);
            payment.setPaymentGatewayResponse("VNPay - Bank: " + vnpBankCode + " - ResponseCode: " + responseCode);
            payment.setCompletedAt(LocalDateTime.now());

            // Update user loyalty points now that payment is confirmed
            User user = booking.getUser();
            int pointsUsed = booking.getPointsUsed() != null ? booking.getPointsUsed() : 0;
            int pointsEarned = booking.getPointsEarned() != null ? booking.getPointsEarned() : 0;
            int newPoints = user.getLoyaltyPoints() - pointsUsed + pointsEarned;
            user.setLoyaltyPoints(newPoints);
            user.setMembershipTier(calculateTier(newPoints));
            userRepository.save(user);
        } else {
            // Payment failed
            booking.setStatus(Booking.BookingStatus.CANCELLED);
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setPaymentGatewayResponse("VNPay failed - ResponseCode: " + responseCode);
        }

        bookingRepository.save(booking);
        paymentRepository.save(payment);
        log.info("VNPay payment processed for booking {} - responseCode: {}", bookingCode, responseCode);

        // Broadcast real-time seat status — wrapped in try-catch so WS failures
        // never roll back the critical DB changes above
        try {
            broadcastSeatUpdate(booking, success ? "CONFIRM" : "RELEASE");
        } catch (Exception wsErr) {
            log.error("WS broadcast failed for booking {}: {}", bookingCode, wsErr.getMessage(), wsErr);
        }

        // Send booking confirmation email asynchronously
        if (success) {
            try {
                emailService.sendBookingConfirmationEmail(booking);
            } catch (Exception e) {
                log.error("Failed to send confirmation email for booking {}: {}", bookingCode, e.getMessage());
            }
        }
    }

    /** Broadcast WS action for every seat that belongs to the given booking. */
    private void broadcastSeatUpdate(Booking booking, String action) {
        if (booking.getBookingSeats() == null) return;
        Long screeningId = booking.getScreening().getId();
        for (BookingSeat bs : booking.getBookingSeats()) {
            String seatId = String.valueOf(bs.getSeat().getId());
            seatHoldStore.release(screeningId, seatId);
            Map<String, Object> wsMsg = new HashMap<>();
            wsMsg.put("screeningId", screeningId);
            wsMsg.put("seatId", bs.getSeat().getId());
            wsMsg.put("action", action);
            wsMsg.put("userId", null);
            messagingTemplate.convertAndSend("/topic/seats/" + screeningId, (Object) wsMsg);
        }
    }

    private User.MembershipTier calculateTier(int points) {
        if (points >= 10000) return User.MembershipTier.DIAMOND;
        if (points >= 3000)  return User.MembershipTier.PLATINUM;
        if (points >= 1000)  return User.MembershipTier.GOLD;
        if (points >= 300)   return User.MembershipTier.SILVER;
        return User.MembershipTier.BRONZE;
    }

    /**
     * Extract all query params from HttpServletRequest into a Map
     */
    public Map<String, String> extractParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return params;
    }

    /**
     * Get client IP address from request (IPv4 only — VNPay requires IPv4)
     */
    public String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For may have multiple IPs, take the first one
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        // Convert IPv6 loopback (::1 or 0:0:...:1) to IPv4 loopback for VNPay compatibility
        if (ip == null || ip.isEmpty() || "::1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) {
            ip = "127.0.0.1";
        }
        return ip;
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC-SHA512", e);
        }
    }
}
