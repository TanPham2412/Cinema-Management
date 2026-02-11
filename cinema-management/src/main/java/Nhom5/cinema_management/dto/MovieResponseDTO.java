package Nhom5.cinema_management.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieResponseDTO {
    private Long id;
    private String title;
    private String description;
    private String director;
    private String cast;
    private Integer duration;
    private Set<GenreDTO> genres;
    private String language;
    private String country;
    private LocalDate releaseDate;
    private String posterUrl;
    private String trailerUrl;
    private String bannerUrl;
    private Double rating;
    private String ageRating;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
