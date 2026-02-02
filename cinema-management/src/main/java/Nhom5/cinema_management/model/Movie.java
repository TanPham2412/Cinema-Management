package Nhom5.cinema_management.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "movies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Movie {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String director;
    
    private String cast;
    
    private Integer duration; // in minutes
    
    private String genre;
    
    private String language;
    
    private String country;
    
    @Column(nullable = false)
    private LocalDate releaseDate;
    
    private String posterUrl;
    
    private String trailerUrl;
    
    private Double rating;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MovieStatus status = MovieStatus.COMING_SOON;
    
    @OneToMany(mappedBy = "movie", cascade = CascadeType.ALL)
    private List<Screening> screenings;
    
    public enum MovieStatus {
        NOW_SHOWING, COMING_SOON, ENDED
    }
}
