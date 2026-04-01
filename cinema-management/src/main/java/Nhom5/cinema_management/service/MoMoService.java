package Nhom5.cinema_management.service;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Scanner;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import Nhom5.cinema_management.config.MoMoConfig;
import Nhom5.cinema_management.model.Booking;
import Nhom5.cinema_management.model.BookingSeat;
import Nhom5.cinema_management.model.Payment;
import Nhom5.cinema_management.model.User;
import Nhom5.cinema_management.repository.BookingRepository;
import Nhom5.cinema_management.repository.PaymentRepository;
import Nhom5.cinema_management.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MoMoService {

    private final MoMoConfig moMoConfig;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final SeatHoldStore seatHoldStore;
    private final EmailService emailService;

    public String createPaymentUrl(String bookingCode) {
        Booking booking = bookingRepository.findByBookingCode(bookingCode)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + bookingCode));

        String requestId = UUID.randomUUID().toString();
        String orderId = bookingCode;
        long amount = Math.round(booking.getTotalAmount());
        String orderInfo = "Thanh toan ve xem phim - " + bookingCode;
        String requestType = "payWithMethod";
        String extraData = "";

        String rawSignature = "accessKey=" + moMoConfig.getAccessKey()
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + moMoConfig.getNotifyUrl()
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + moMoConfig.getPartnerCode()
                + "&redirectUrl=" + moMoConfig.getReturnUrl()
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        String signature = hmacSHA256(moMoConfig.getSecretKey(), rawSignature);

        String requestBody = "{"
                + "\"partnerCode\":\"" + moMoConfig.getPartnerCode() + "\","
                + "\"accessKey\":\"" + moMoConfig.getAccessKey() + "\","
                + "\"requestId\":\"" + requestId + "\","
                + "\"amount\":" + amount + ","
                + "\"orderId\":\"" + orderId + "\","
                + "\"orderInfo\":\"" + orderInfo + "\","
                + "\"redirectUrl\":\"" + moMoConfig.getReturnUrl() + "\","
                + "\"ipnUrl\":\"" + moMoConfig.getNotifyUrl() + "\","
                + "\"lang\":\"vi\","
                + "\"extraData\":\"" + extraData + "\","
                + "\"requestType\":\"" + requestType + "\","
                + "\"signature\":\"" + signature + "\""
                + "}";

        try {
            URL url = URI.create(moMoConfig.getEndpoint()).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(requestBody.getBytes(StandardCharsets.UTF_8));
            }

            String responseBody;
            try (Scanner sc = new Scanner(conn.getInputStream(), StandardCharsets.UTF_8)) {
                responseBody = sc.useDelimiter("\\A").next();
            }

            log.info("[MoMo] Create payment response for booking {}: {}", bookingCode, responseBody);

            String payUrl = extractJsonValue(responseBody, "payUrl");
            String resultCodeStr = extractJsonValue(responseBody, "resultCode");
            int resultCode = resultCodeStr != null ? Integer.parseInt(resultCodeStr) : -1;

            if (resultCode == 0 && payUrl != null) {
                return payUrl;
            } else {
                String msg = extractJsonValue(responseBody, "message");
                throw new RuntimeException("MoMo tao thanh toan that bai: " + msg);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("[MoMo] Error creating payment for booking {}: {}", bookingCode, e.getMessage());
            throw new RuntimeException("Khong the tao thanh toan MoMo: " + e.getMessage(), e);
        }
    }

    public boolean verifySignature(Map<String, String> params) {
        String receivedSignature = params.get("signature");
        if (receivedSignature == null) return false;

        String rawSignature = "accessKey=" + moMoConfig.getAccessKey()
                + "&amount=" + params.getOrDefault("amount", "")
                + "&extraData=" + params.getOrDefault("extraData", "")
                + "&message=" + params.getOrDefault("message", "")
                + "&orderId=" + params.getOrDefault("orderId", "")
                + "&orderInfo=" + params.getOrDefault("orderInfo", "")
                + "&orderType=" + params.getOrDefault("orderType", "")
                + "&partnerCode=" + params.getOrDefault("partnerCode", "")
                + "&payType=" + params.getOrDefault("payType", "")
                + "&requestId=" + params.getOrDefault("requestId", "")
                + "&responseTime=" + params.getOrDefault("responseTime", "")
                + "&resultCode=" + params.getOrDefault("resultCode", "")
                + "&transId=" + params.getOrDefault("transId", "");

        String calculated = hmacSHA256(moMoConfig.getSecretKey(), rawSignature);
        return calculated.equalsIgnoreCase(receivedSignature);
    }

    @Transactional
    public void confirmPayment(String orderId, String transId, String resultCode, String message) {
        // Use JOIN FETCH to eager-load bookingSeats + seat so WS broadcast doesn't hit LazyInitializationException
        Booking booking = bookingRepository.findByBookingCodeWithSeats(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Booking not found: " + orderId));

        Payment payment = paymentRepository.findByBookingId(booking.getId())
                .orElseThrow(() -> new EntityNotFoundException("Payment not found for booking: " + orderId));

        boolean success = "0".equals(resultCode);
        if (success) {
            booking.setStatus(Booking.BookingStatus.CONFIRMED);
            payment.setStatus(Payment.PaymentStatus.COMPLETED);
            payment.setTransactionId(transId);
            payment.setPaymentGatewayResponse("MoMo - transId: " + transId + " - resultCode: " + resultCode);
            payment.setCompletedAt(LocalDateTime.now());

            User user = booking.getUser();
            int pointsUsed = booking.getPointsUsed() == null ? 0 : booking.getPointsUsed();
            int pointsEarned = booking.getPointsEarned() == null ? 0 : booking.getPointsEarned();
            int newPoints = user.getLoyaltyPoints() - pointsUsed + pointsEarned;
            user.setLoyaltyPoints(newPoints);
            user.setMembershipTier(calculateTier(newPoints));
            userRepository.save(user);
        } else {
            booking.setStatus(Booking.BookingStatus.CANCELLED);
            payment.setStatus(Payment.PaymentStatus.FAILED);
            payment.setPaymentGatewayResponse("MoMo failed - resultCode: " + resultCode + " - " + message);
        }

        bookingRepository.save(booking);
        paymentRepository.save(payment);
        log.info("[MoMo] Payment processed for booking {} - resultCode: {}", orderId, resultCode);

        // Broadcast real-time seat status — wrapped in try-catch so WS failures
        // never roll back the critical DB changes above
        try {
            broadcastSeatUpdate(booking, success ? "CONFIRM" : "RELEASE");
        } catch (Exception wsErr) {
            log.error("[MoMo] WS broadcast failed for booking {}: {}", orderId, wsErr.getMessage(), wsErr);
        }

        // Send booking confirmation email asynchronously
        if (success) {
            try {
                emailService.sendBookingConfirmationEmail(booking);
            } catch (Exception e) {
                log.error("[MoMo] Failed to send confirmation email for booking {}: {}", orderId, e.getMessage());
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
            java.util.Map<String, Object> wsMsg = new java.util.HashMap<>();
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

    /** Simple JSON value extractor for string/number fields. */
    private String extractJsonValue(String json, String key) {
        String searchKey = "\"" + key + "\"";
        int keyIdx = json.indexOf(searchKey);
        if (keyIdx < 0) return null;
        int colonIdx = json.indexOf(':', keyIdx);
        if (colonIdx < 0) return null;
        int start = colonIdx + 1;
        while (start < json.length() && json.charAt(start) == ' ') start++;
        if (start >= json.length()) return null;
        if (json.charAt(start) == '"') {
            int end = json.indexOf('"', start + 1);
            return end > start ? json.substring(start + 1, end) : null;
        } else {
            int end = start;
            while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') end++;
            return json.substring(start, end).trim();
        }
    }

    private String hmacSHA256(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to compute HMAC-SHA256", e);
        }
    }
}
