package Nhom5.cinema_management.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    
    @Column(nullable = false)
    private Double amount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;
    
    @Column(unique = true)
    private String transactionId;
    
    private String paymentGatewayResponse;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime completedAt;
    
    public enum PaymentMethod {
        CASH,           // Tiền mặt (tại quầy)
        VNPAY,          // VNPAY
        MOMO,           // MoMo
        CREDIT_CARD,    // Thẻ tín dụng
        POINTS          // Điểm tích lũy
    }
    
    public enum PaymentStatus {
        PENDING,        // Chờ thanh toán
        PROCESSING,     // Đang xử lý
        COMPLETED,      // Thành công
        FAILED,         // Thất bại
        REFUNDED        // Đã hoàn tiền
    }
}
