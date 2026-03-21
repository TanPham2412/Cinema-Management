package Nhom5.cinema_management.dto;

import Nhom5.cinema_management.model.Combo;
import lombok.Data;

@Data
public class ComboDTO {
    private Long id;
    private String name;
    private String description;
    private Double price;
    private String imageUrl;
    private Boolean available;

    public static ComboDTO fromEntity(Combo c) {
        ComboDTO dto = new ComboDTO();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setDescription(c.getDescription());
        dto.setPrice(c.getPrice());
        dto.setImageUrl(c.getImageUrl());
        dto.setAvailable(c.getAvailable());
        return dto;
    }
}
