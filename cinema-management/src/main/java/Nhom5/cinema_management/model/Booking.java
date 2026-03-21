package Nhom5.cinema_management.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String bookingCode;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "screening_id", nullable = false)
    private Screening screening;

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime bookingTime = LocalDateTime.now();
    
    @Column(nullable = false)
    private Double totalAmount;

    @Builder.Default
    private Integer pointsEarned = 0;

    @Builder.Default
    private Integer pointsUsed = 0;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;
    
    @Column(nullable = false)
    private LocalDateTime expiryTime; // For seat holding
    
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    private List<BookingSeat> bookingSeats;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    private List<BookingCombo> bookingCombos;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    private Payment payment;
    
    private String qrCode; // For check-in
    
    public enum BookingStatus {
        PENDING,        // Đang giữ ghế
        CONFIRMED,      // Đã thanh toán
        CANCELLED,      // Đã hủy
        COMPLETED,      // Đã check-in
        EXPIRED         // Hết hạn giữ ghế
    }
}
