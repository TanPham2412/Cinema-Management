package Nhom5.cinema_management.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

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
    
    @Column(nullable = false)
    private LocalDateTime bookingTime = LocalDateTime.now();
    
    @Column(nullable = false)
    private Double totalAmount;
    
    private Integer pointsEarned = 0;
    
    private Integer pointsUsed = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;
    
    @Column(nullable = false)
    private LocalDateTime expiryTime; // For seat holding
    
    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    private List<BookingSeat> bookingSeats;
    
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
