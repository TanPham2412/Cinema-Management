package Nhom5.cinema_management.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import Nhom5.cinema_management.model.Screening;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningDTO {
    private Long id;
    private String slug;
    private Long movieId;
    private String movieTitle;
    private String moviePosterUrl;
    private Integer movieDuration;
    private Long screenId;
    private String screenName;
    private Long cinemaId;
    private String cinemaName;
    private String cinemaAddress;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endTime;

    private Double basePrice;
    private Screening.PriceCategory priceCategory;
    private Integer availableSeats;
    private Integer totalSeats;
    private Boolean active;

    public static ScreeningDTO fromEntity(Screening s) {
        return ScreeningDTO.builder()
                .id(s.getId())
                .slug(s.getSlug())
                .movieId(s.getMovie().getId())
                .movieTitle(s.getMovie().getTitle())
                .moviePosterUrl(s.getMovie().getPosterUrl())
                .movieDuration(s.getMovie().getDuration())
                .screenId(s.getScreen().getId())
                .screenName(s.getScreen().getName())
                .cinemaId(s.getScreen().getCinema().getId())
                .cinemaName(s.getScreen().getCinema().getName())
                .cinemaAddress(s.getScreen().getCinema().getAddress())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .basePrice(s.getBasePrice())
                .priceCategory(s.getPriceCategory())
                .availableSeats(s.getAvailableSeats())
                .totalSeats(s.getScreen().getTotalSeats())
                .active(s.getActive())
                .build();
    }
}
