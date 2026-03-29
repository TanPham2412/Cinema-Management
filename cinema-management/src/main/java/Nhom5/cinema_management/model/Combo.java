package Nhom5.cinema_management.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "combos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Combo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private Double price;
    
    private String imageUrl;
    
    @Column(nullable = false)
    private Boolean available = true;

    @Column(length = 20)
    private String category; // COMBO, POPCORN, DRINK

    @OneToMany(mappedBy = "combo", cascade = CascadeType.ALL)
    private List<BookingCombo> bookingCombos;
}
