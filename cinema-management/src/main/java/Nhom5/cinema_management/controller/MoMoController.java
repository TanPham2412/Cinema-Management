package Nhom5.cinema_management.controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.config.MoMoConfig;
import Nhom5.cinema_management.service.MoMoService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/payment/momo")
@RequiredArgsConstructor
@Slf4j
public class MoMoController {

    private final MoMoService moMoService;
    private final MoMoConfig moMoConfig;

    /**
     * Create MoMo payment URL for an existing (PENDING) booking.
     * Frontend calls this after createBooking() returns bookingCode.
     */
    @GetMapping("/create")
    public ResponseEntity<Map<String, String>> createPaymentUrl(@RequestParam String bookingCode) {
        String paymentUrl = moMoService.createPaymentUrl(bookingCode);
        Map<String, String> response = new HashMap<>();
        response.put("paymentUrl", paymentUrl);
        return ResponseEntity.ok(response);
    }

    /**
     * MoMo redirects user's browser here after payment (browser GET).
     * Verifies signature, confirms booking, then redirects to frontend result page.
     */
    @GetMapping("/return")
    public void handleReturn(
            @RequestParam Map<String, String> params,
            HttpServletResponse response) throws IOException {

        String orderId = params.getOrDefault("orderId", "");
        String resultCode = params.getOrDefault("resultCode", "-1");
        String transId = params.getOrDefault("transId", "");
        String message = params.getOrDefault("message", "");

        boolean validSignature = moMoService.verifySignature(params);
        boolean dbSuccess = false;
        if (validSignature) {
            try {
                moMoService.confirmPayment(orderId, transId, resultCode, message);
                dbSuccess = true;
            } catch (Exception e) {
                log.error("[MoMo] Error confirming payment for booking {}: {}", orderId, e.getMessage());
            }
        } else {
            log.warn("[MoMo] Invalid signature on return for booking {}", orderId);
            resultCode = "-1";
        }

        boolean success = "0".equals(resultCode) && dbSuccess;
        String redirectUrl = moMoConfig.getFrontendResultUrl()
                + "?success=" + success
                + "&bookingCode=" + orderId
                + "&resultCode=" + resultCode
                + "&message=" + java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8);
        response.sendRedirect(redirectUrl);
    }

    /**
     * Sandbox test-confirm: frontend calls this to confirm payment locally
     * when MoMo IPN can't reach localhost.
     */
    @GetMapping("/test-confirm")
    public ResponseEntity<Map<String, Object>> testConfirm(@RequestParam String bookingCode) {
        Map<String, Object> result = new HashMap<>();
        try {
            moMoService.confirmPayment(bookingCode, "test-txn-" + System.currentTimeMillis(), "0", "Sandbox test confirm");
            result.put("success", true);
            result.put("bookingCode", bookingCode);
        } catch (Exception e) {
            log.error("[MoMo] test-confirm error for {}: {}", bookingCode, e.getMessage());
            result.put("success", false);
            result.put("message", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * MoMo IPN (server-to-server) notification.
     * Must respond quickly with 200.
     */
    @PostMapping("/notify")
    public ResponseEntity<Map<String, Object>> handleNotify(@RequestBody Map<String, String> params) {
        Map<String, Object> result = new HashMap<>();

        String orderId = params.getOrDefault("orderId", "");
        String resultCode = params.getOrDefault("resultCode", "-1");
        String transId = params.getOrDefault("transId", "");
        String message = params.getOrDefault("message", "");

        boolean validSignature = moMoService.verifySignature(params);
        if (!validSignature) {
            log.warn("[MoMo] Invalid IPN signature for booking {}", orderId);
            result.put("status", 400);
            result.put("message", "Invalid signature");
            return ResponseEntity.ok(result);
        }

        try {
            moMoService.confirmPayment(orderId, transId, resultCode, message);
            result.put("status", 200);
            result.put("message", "Success");
        } catch (Exception e) {
            log.error("[MoMo] IPN processing error for booking {}: {}", orderId, e.getMessage());
            result.put("status", 500);
            result.put("message", e.getMessage());
        }

        return ResponseEntity.ok(result);
    }
}
