package Nhom5.cinema_management.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
    
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;
    
    @Column(unique = true)
    private String transactionId;
    
    private String paymentGatewayResponse;
    
    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    private LocalDateTime completedAt;
    
    public enum PaymentMethod {
        CASH,           // Tiền mặt (tại quầy)
        BANK_TRANSFER,  // Chuyển khoản ngân hàng
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
