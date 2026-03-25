package Nhom5.cinema_management.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/payment/vnpay")
@RequiredArgsConstructor
@Slf4j
public class VNPayController {

    private final VNPayService vnPayService;

    // Frontend base URL for redirects
    private static final String FRONTEND_URL = "https://plvcinema.xyz";

    /**
     * Create VNPay payment URL for an existing (PENDING) booking.
     * Called by frontend after createBooking() returns bookingCode.
     */
    @GetMapping("/create")
    public ResponseEntity<Map<String, String>> createPaymentUrl(
            @RequestParam String bookingCode,
            HttpServletRequest request,
            Authentication authentication) {

        String ipAddress = vnPayService.getClientIp(request);
        String paymentUrl = vnPayService.createPaymentUrl(bookingCode, ipAddress);

        Map<String, String> response = new HashMap<>();
        response.put("paymentUrl", paymentUrl);
        return ResponseEntity.ok(response);
    }

    /**
     * VNPay redirects the user's browser here after payment (browser GET request).
     * Verifies signature, confirms booking, then redirects to frontend result page.
     */
    @GetMapping("/return")
    public void handleReturn(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Map<String, String> params = vnPayService.extractParams(request);

        String bookingCode = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.getOrDefault("vnp_TransactionNo", "");
        String bankCode = params.getOrDefault("vnp_BankCode", "");

        boolean validSignature = vnPayService.verifySignature(params);
        if (validSignature) {
            try {
                vnPayService.confirmPayment(bookingCode, transactionNo, bankCode, responseCode);
            } catch (Exception e) {
                log.error("Error confirming VNPay payment for booking {}: {}", bookingCode, e.getMessage());
            }
        } else {
            log.warn("Invalid VNPay signature on return for booking {}", bookingCode);
            responseCode = "97";
        }

        boolean success = "00".equals(responseCode);
        String redirectUrl = FRONTEND_URL + "/payment/vnpay/result"
                + "?success=" + success
                + "&bookingCode=" + bookingCode
                + "&responseCode=" + responseCode;
        response.sendRedirect(redirectUrl);
    }

    /**
     * Frontend can also call this POST endpoint directly (fallback verify).
     */
    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> handleCallback(@RequestBody Map<String, String> params) {
        Map<String, Object> result = new HashMap<>();

        String bookingCode = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.getOrDefault("vnp_TransactionNo", "");
        String bankCode = params.getOrDefault("vnp_BankCode", "");

        boolean validSignature = vnPayService.verifySignature(params);
        if (!validSignature) {
            result.put("success", false);
            result.put("bookingCode", bookingCode);
            result.put("responseCode", "97");
            return ResponseEntity.ok(result);
        }

        try {
            vnPayService.confirmPayment(bookingCode, transactionNo, bankCode, responseCode);
        } catch (Exception e) {
            log.error("Error confirming VNPay payment for booking {}: {}", bookingCode, e.getMessage());
        }

        result.put("success", "00".equals(responseCode));
        result.put("bookingCode", bookingCode);
        result.put("responseCode", responseCode);
        return ResponseEntity.ok(result);
    }

    /**
     * VNPay IPN (Instant Payment Notification) - server-to-server callback.
     * This is the authoritative payment confirmation. Must return JSON quickly.
     */
    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> handleIPN(HttpServletRequest request) {
        Map<String, String> params = vnPayService.extractParams(request);
        Map<String, String> result = new HashMap<>();

        String bookingCode = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.getOrDefault("vnp_TransactionNo", "");
        String bankCode = params.getOrDefault("vnp_BankCode", "");

        boolean validSignature = vnPayService.verifySignature(params);
        if (!validSignature) {
            result.put("RspCode", "97");
            result.put("Message", "Checksum failed");
            return ResponseEntity.ok(result);
        }

        try {
            vnPayService.confirmPayment(bookingCode, transactionNo, bankCode, responseCode);
            result.put("RspCode", "00");
            result.put("Message", "Confirm Success");
        } catch (Exception e) {
            log.error("IPN processing error for booking {}: {}", bookingCode, e.getMessage());
            result.put("RspCode", "99");
            result.put("Message", "Unknown error");
        }

        return ResponseEntity.ok(result);
    }
}
