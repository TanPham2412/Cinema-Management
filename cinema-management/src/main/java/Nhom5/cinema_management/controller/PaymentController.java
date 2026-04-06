package Nhom5.cinema_management.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import Nhom5.cinema_management.model.Payment;
import Nhom5.cinema_management.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class PaymentController {

    private final PaymentRepository paymentRepository;

    /** GET /admin/payments/booking/{bookingId} — get payment record for a booking */
    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentDTO> getByBooking(@PathVariable Long bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .map(p -> ResponseEntity.ok(PaymentDTO.from(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** GET /admin/payments/{id} — get a single payment */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentDTO> getById(@PathVariable Long id) {
        return paymentRepository.findById(id)
                .map(p -> ResponseEntity.ok(PaymentDTO.from(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    /** PUT /admin/payments/{id} — update payment status and/or method */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentDTO> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Payment not found: " + id));

        if (body.containsKey("status")) {
            try {
                payment.setStatus(Payment.PaymentStatus.valueOf(body.get("status").toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        if (body.containsKey("paymentMethod")) {
            try {
                payment.setPaymentMethod(Payment.PaymentMethod.valueOf(body.get("paymentMethod").toUpperCase()));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }
        if (body.containsKey("transactionId")) {
            payment.setTransactionId(body.get("transactionId"));
        }

        return ResponseEntity.ok(PaymentDTO.from(paymentRepository.save(payment)));
    }

    /** DELETE /admin/payments/{id} — remove payment record */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!paymentRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        paymentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── DTO ───────────────────────────────────────────────────────────────
    public record PaymentDTO(
            Long id,
            Long bookingId,
            Double amount,
            String paymentMethod,
            String status,
            String transactionId,
            String createdAt,
            String completedAt) {
        static PaymentDTO from(Payment p) {
            return new PaymentDTO(
                    p.getId(),
                    p.getBooking() != null ? p.getBooking().getId() : null,
                    p.getAmount(),
                    p.getPaymentMethod() != null ? p.getPaymentMethod().name() : null,
                    p.getStatus() != null ? p.getStatus().name() : null,
                    p.getTransactionId(),
                    p.getCreatedAt() != null ? p.getCreatedAt().toString() : null,
                    p.getCompletedAt() != null ? p.getCompletedAt().toString() : null);
        }
    }
}
