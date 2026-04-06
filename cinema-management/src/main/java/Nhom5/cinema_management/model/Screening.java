package Nhom5.cinema_management.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "screenings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Screening {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 12)
    private String slug;
    
    @ManyToOne
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;
    
    @ManyToOne
    @JoinColumn(name = "screen_id", nullable = false)
    private Screen screen;
    
    @Column(nullable = false)
    private LocalDateTime startTime;
    
    @Column(nullable = false)
    private LocalDateTime endTime;
    
    @Column(nullable = false)
    private Double basePrice;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PriceCategory priceCategory = PriceCategory.NORMAL;
    
    @Column(nullable = false)
    private Integer availableSeats;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @OneToMany(mappedBy = "screening", cascade = CascadeType.ALL)
    private List<Booking> bookings;

    @PrePersist
    protected void onCreate() {
        if (slug == null || slug.isBlank()) {
            slug = generateSlug();
        }
    }

    public static String generateSlug() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
    
    public enum PriceCategory {
        EARLY_BIRD,     // Suất chiếu sớm
        NORMAL,         // Giờ bình thường
        PRIME_TIME,     // Giờ vàng (tối, cuối tuần)
        HOLIDAY         // Ngày lễ
    }
}
