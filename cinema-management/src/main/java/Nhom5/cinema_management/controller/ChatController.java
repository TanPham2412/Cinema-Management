package Nhom5.cinema_management.controller;

import Nhom5.cinema_management.dto.chat.ChatRequestDTO;
import Nhom5.cinema_management.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/v1/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<?> processChatMessage(@RequestBody ChatRequestDTO request) {
        String botResponse = chatService.generateResponse(request);
        return ResponseEntity.ok(Collections.singletonMap("response", botResponse));
    }
}
