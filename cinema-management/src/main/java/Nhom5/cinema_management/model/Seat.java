package Nhom5.cinema_management.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "seats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Seat {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;
    
    @Column(nullable = false)
    private String seatRow;
    
    @Column(nullable = false)
    private Integer seatNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatType seatType = SeatType.REGULAR;
    
    @Column(nullable = false)
    private Boolean available = true;
    
    @OneToMany(mappedBy = "seat", cascade = CascadeType.ALL)
    private List<BookingSeat> bookingSeats;
    
    public enum SeatType {
        REGULAR, VIP, COUPLE
    }
}
