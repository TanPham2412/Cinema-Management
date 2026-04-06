package Nhom5.cinema_management.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "cinemas")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cinema {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;
    
    @Column(nullable = false)
    private String address;
    
    private String city;
    
    private String phoneNumber;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @OneToMany(mappedBy = "cinema", cascade = CascadeType.ALL)
    private List<Screen> screens;

    @PrePersist
    protected void onCreate() {
        if (slug == null || slug.isBlank()) {
            slug = generateSlug(name);
        }
    }

    public static String generateSlug(String name) {
        if (name == null) return "";
        String s = java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[đĐ]", "d");
        return s.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
