package Nhom5.cinema_management.dto;

import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieRequestDTO {
    
    @NotBlank(message = "Tên phim không được để trống")
    @Size(max = 255, message = "Tên phim không được vượt quá 255 ký tự")
    private String title;
    
    @NotBlank(message = "Mô tả không được để trống")
    private String description;
    
    @NotBlank(message = "Đạo diễn không được để trống")
    private String director;
    
    @NotBlank(message = "Diễn viên không được để trống")
    private String cast;
    
    @NotNull(message = "Thời lượng không được để trống")
    @Min(value = 1, message = "Thời lượng phải lớn hơn 0")
    @Max(value = 500, message = "Thời lượng không được vượt quá 500 phút")
    private Integer duration;
    
    @NotNull(message = "Thể loại không được để trống")
    @Size(min = 1, message = "Phim phải có ít nhất 1 thể loại")
    private Set<Long> genreIds;
    
    @NotBlank(message = "Ngôn ngữ không được để trống")
    private String language;
    
    @NotBlank(message = "Quốc gia không được để trống")
    private String country;
    
    @NotNull(message = "Ngày phát hành không được để trống")
    private LocalDate releaseDate;
    
    private String posterUrl;
    
    private String trailerUrl;
    
    private String bannerUrl;
    
    // Rating is calculated from user reviews, not input by admin
    
    private String ageRating; // P, K, T13, T16, T18, C
    
    @NotBlank(message = "Trạng thái không được để trống")
    private String status; // NOW_SHOWING, COMING_SOON, ENDED
}
