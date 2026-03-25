package Nhom5.cinema_management.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native WebSocket endpoint (for production via Cloudflare Tunnel)
        registry.addEndpoint("/ws")
                .setAllowedOrigins("https://plvcinema.xyz", "https://www.plvcinema.xyz",
                                   "http://localhost:3000", "http://localhost:5173");
        // SockJS fallback endpoint (for local development)
        registry.addEndpoint("/ws-sockjs")
                .setAllowedOrigins("https://plvcinema.xyz", "https://www.plvcinema.xyz",
                                   "http://localhost:3000", "http://localhost:5173")
                .withSockJS();
    }
}
