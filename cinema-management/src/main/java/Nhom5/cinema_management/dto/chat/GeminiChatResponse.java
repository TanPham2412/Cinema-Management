package Nhom5.cinema_management.dto.chat;

import lombok.Data;
import java.util.List;

@Data
public class GeminiChatResponse {
    private List<Candidate> candidates;

    @Data
    public static class Candidate {
        private Content content;
    }

    @Data
    public static class Content {
        private List<Part> parts;
        private String role;
    }

    @Data
    public static class Part {
        private String text;
    }
    
    public String getFirstTextResponse() {
        if (candidates != null && !candidates.isEmpty() 
            && candidates.get(0).getContent() != null
            && candidates.get(0).getContent().getParts() != null
            && !candidates.get(0).getContent().getParts().isEmpty()) {
            return candidates.get(0).getContent().getParts().get(0).getText();
        }
        return "Xin lỗi, hiện tại tôi đang quá tải, không thể trả lời lúc này.";
    }
}
