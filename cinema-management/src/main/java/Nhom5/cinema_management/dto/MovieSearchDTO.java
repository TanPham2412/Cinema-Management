package Nhom5.cinema_management.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieSearchDTO {
    private String keyword; // Search in title, director, cast
    private Long genreId;
    private String status; // NOW_SHOWING, COMING_SOON, ENDED
    private String language;
    private LocalDate releaseDateFrom;
    private LocalDate releaseDateTo;
    private Double minRating;
    private String ageRating;
    private Integer page = 0;
    private Integer size = 10;
    private String sortBy = "releaseDate"; // title, releaseDate, rating, createdAt
    private String sortDirection = "DESC"; // ASC, DESC
}
