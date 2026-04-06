package Nhom5.cinema_management.service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import Nhom5.cinema_management.dto.chat.ChatRequestDTO;
import Nhom5.cinema_management.dto.chat.GeminiChatRequest;
import Nhom5.cinema_management.dto.chat.GeminiChatResponse;
import Nhom5.cinema_management.model.Movie;
import Nhom5.cinema_management.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final MovieRepository movieRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    public String generateResponse(ChatRequestDTO request) {
        try {
            // Lấy danh sách phim để làm ngữ cảnh
            List<Movie> allMovies = movieRepository.findAll();
            
            String movieContext = allMovies.stream()
                .map(m -> {
                    String statusText = "";
                    switch(m.getStatus()) {
                        case NOW_SHOWING: statusText = "ĐANG CHIẾU"; break;
                        case COMING_SOON: statusText = "SẮP CHIẾU"; break;
                        case ENDED: statusText = "ĐÃ NGỪNG CHIẾU"; break;
                    }
                    return String.format("- Tên: %s | Trạng thái: %s | Thể loại: %s", 
                        m.getTitle(), 
                        statusText,
                        m.getGenres().stream().map(g -> g.getName()).collect(Collectors.joining(", "))
                    );
                })
                .collect(Collectors.joining("\n"));

            String systemPromptText = "Bạn là trợ lý ảo chuyên tư vấn phim của rạp phim PLVCinema, bạn giao tiếp thân thiện, ngắn gọn và hay dùng emoji. " +
                "Nhiệm vụ của bạn là dựa vào DANH SÁCH KHO PHIM CỦA RẠP dưới đây để trả lời khách hàng:\n\n" +
                "--- DANH SÁCH TẤT CẢ CÁC PHIM ---\n" + 
                movieContext + 
                "\n----------------------------------\n\n" +
                "QUAN TRỌNG: Nếu người dùng gửi MỘT BỨC ẢNH (Ví dụ: poster phim, cảnh phim), hãy dùng khả năng thị giác máy tính của bạn để nhận diện đó là phim CHÍNH XÁC tên là gì. Sau đó, " +
                "ĐỐI CHIẾU tên phim vừa nhận diện được với DANH SÁCH TẤT CẢ CÁC PHIM ở trên. Nếu có trong danh sách, hãy báo cho họ biết phim đó Đang chiếu, Sắp chiếu hay Đã ngừng chiếu (kết hợp tư vấn nhẹ nhàng). Nếu không có trong danh sách, hãy phản hồi rạp hiện không sở hữu bản quyền phim này.";

            String userText = request.getMessage() != null && !request.getMessage().trim().isEmpty() 
                    ? request.getMessage() 
                    : "Bạn hãy phân tích bức ảnh tôi vừa gửi và cho tôi biết tình trạng chiếu rạp của bộ phim này.";

            String combinedMessage = systemPromptText + 
                "\n\nĐây là yêu cầu của khách hàng: \"" + userText + "\"";

            // Construct Request Parts
            java.util.List<GeminiChatRequest.Part> parts = new java.util.ArrayList<>();
            parts.add(GeminiChatRequest.Part.builder().text(combinedMessage).build());

            // Add Image Part if exists
            if (request.getImageBase64() != null && !request.getImageBase64().isEmpty()) {
                String mimeType = request.getImageMimeType() != null ? request.getImageMimeType() : "image/jpeg";
                parts.add(GeminiChatRequest.Part.builder()
                        .inlineData(GeminiChatRequest.InlineData.builder()
                                .mimeType(mimeType)
                                .data(request.getImageBase64())
                                .build())
                        .build());
            }

            GeminiChatRequest.Content content = GeminiChatRequest.Content.builder()
                    .parts(parts)
                    .build();

            GeminiChatRequest geminiRequest = GeminiChatRequest.builder()
                    .contents(Collections.singletonList(content))
                    .build();

            String url = geminiApiUrl + "?key=" + geminiApiKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<GeminiChatRequest> entity = new HttpEntity<>(geminiRequest, headers);

            // Retry once for transient rate limits (RPM), not for exhausted quota (limit=0)
            for (int attempt = 0; attempt < 2; attempt++) {
                try {
                    GeminiChatResponse response = restTemplate.postForObject(url, entity, GeminiChatResponse.class);
                    if (response != null) {
                        return response.getFirstTextResponse();
                    }
                    break;
                } catch (HttpClientErrorException.TooManyRequests e) {
                    log.warn("Gemini API rate limited (429), attempt {}/2", attempt + 1);
                    if (attempt == 0) {
                        try { Thread.sleep(3000); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }
                    } else {
                        log.error("Gemini API vẫn bị rate limit sau 2 lần thử, dùng fallback DB");
                        return buildDbFallbackResponse(request.getMessage(), allMovies);
                    }
                }
            }

        } catch (Exception e) {
            log.error("Lỗi giao tiếp với Gemini API", e);
            List<Movie> allMovies = movieRepository.findAll();
            return buildDbFallbackResponse(request.getMessage(), allMovies);
        }

        return "Rất tiếc bộ phận Tư vấn ảo gặp chút lỗi xử lý.";
    }

    private String buildDbFallbackResponse(String userMessage, List<Movie> allMovies) {
        String msg = userMessage != null ? userMessage.toLowerCase() : "";

        // Check for keywords about currently showing movies
        if (msg.contains("đang chiếu") || msg.contains("xem gì") || msg.contains("phim hay") || msg.contains("hôm nay")) {
            List<Movie> nowShowing = allMovies.stream()
                .filter(m -> m.getStatus() != null && m.getStatus().name().equals("NOW_SHOWING"))
                .collect(Collectors.toList());
            if (!nowShowing.isEmpty()) {
                String list = nowShowing.stream()
                    .map(m -> "🎬 *" + m.getTitle() + "* (" + m.getGenres().stream().map(g -> g.getName()).collect(Collectors.joining(", ")) + ")")
                    .collect(Collectors.joining("\n"));
                return "Hiện tại rạp PLVCinema đang chiếu các phim sau:\n\n" + list + "\n\nBạn hãy ghé trang web để đặt vé nhé! 🎟️";
            }
            return "Hiện tại chưa có phim đang chiếu. Hãy check lại sau nhé! 🎬";
        }

        // Check for keywords about coming soon
        if (msg.contains("sắp chiếu") || msg.contains("sắp ra") || msg.contains("sắp")) {
            List<Movie> comingSoon = allMovies.stream()
                .filter(m -> m.getStatus() != null && m.getStatus().name().equals("COMING_SOON"))
                .collect(Collectors.toList());
            if (!comingSoon.isEmpty()) {
                String list = comingSoon.stream()
                    .map(m -> "🍿 *" + m.getTitle() + "*")
                    .collect(Collectors.joining("\n"));
                return "Những phim sắp ra mắt tại PLVCinema:\n\n" + list + "\n\nHãy đón chờ nhé! 🌟";
            }
            return "Chưa có thông tin phim sắp chiếu. Bạn hãy theo dõi web để cập nhật sớm nhất nhé! 📢";
        }

        // Search movie by name keyword
        if (msg.length() > 2) {
            List<Movie> matched = allMovies.stream()
                .filter(m -> m.getTitle().toLowerCase().contains(msg) ||
                             m.getGenres().stream().anyMatch(g -> g.getName().toLowerCase().contains(msg)))
                .collect(Collectors.toList());
            if (!matched.isEmpty()) {
                Movie m = matched.get(0);
                String status = "";
                switch (m.getStatus()) {
                    case NOW_SHOWING: status = "🟢 Đang chiếu"; break;
                    case COMING_SOON: status = "🔜 Sắp chiếu"; break;
                    case ENDED: status = "🔴 Đã ngừng chiếu"; break;
                }
                return "Rạp PLVCinema có phim **" + m.getTitle() + "** — " + status + ". Truy cập web để đặt vé nhé! 🎟️";
            }
        }

        // Default fallback
        return "Xin chào! 👋 Hệ thống AI đang tạm thời bảo trì. Bạn có thể:\n\n" +
               "📋 Xem danh sách phim đang chiếu tại trang **Phim**\n" +
               "🎟️ Đặt vé trực tiếp trên web\n" +
               "📞 Liên hệ hỗ trợ nếu cần thêm thông tin\n\n" +
               "BOT sẽ sớm hoạt động trở lại, xin lỗi vì sự bất tiện này! 🙏";
    }
}
