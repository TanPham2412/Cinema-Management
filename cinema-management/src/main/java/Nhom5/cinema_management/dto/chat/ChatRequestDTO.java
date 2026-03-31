package Nhom5.cinema_management.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatRequestDTO {
    private String message;
    private String imageBase64; // Chuỗi base64 của ảnh (bỏ "data:image/jpeg;base64,")
    private String imageMimeType; // Loại ảnh ví dụ: "image/jpeg"
}
