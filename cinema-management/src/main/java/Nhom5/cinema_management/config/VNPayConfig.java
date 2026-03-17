package Nhom5.cinema_management.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Data;

@Data
@Configuration
@ConfigurationProperties(prefix = "vnpay")
public class VNPayConfig {

    private String tmnCode;
    private String hashSecret;
    private String url;
    private String returnUrl;
    private String apiUrl;
}
