package Nhom5.cinema_management.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "booking_combos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingCombo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;
    
    @ManyToOne
    @JoinColumn(name = "combo_id", nullable = false)
    private Combo combo;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private Double price; // Giá tại thời điểm đặt
}
