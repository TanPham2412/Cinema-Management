package Nhom5.cinema_management.dto;

import Nhom5.cinema_management.model.Cinema;
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
public class CinemaDTO {
    private Long id;
    private String slug;
    private String name;
    private String address;
    private String city;
    private String phoneNumber;
    private String description;
    private Boolean active;
    private Integer totalScreens;

    public static CinemaDTO fromEntity(Cinema cinema) {
        return CinemaDTO.builder()
                .id(cinema.getId())
                .slug(cinema.getSlug())
                .name(cinema.getName())
                .address(cinema.getAddress())
                .city(cinema.getCity())
                .phoneNumber(cinema.getPhoneNumber())
                .description(cinema.getDescription())
                .active(cinema.getActive())
                .totalScreens(cinema.getScreens() != null ? cinema.getScreens().size() : 0)
                .build();
    }
}
