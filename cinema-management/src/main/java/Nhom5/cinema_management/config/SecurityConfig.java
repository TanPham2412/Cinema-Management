package Nhom5.cinema_management.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import Nhom5.cinema_management.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsService userDetailsService;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // Security Headers
            .headers(headers -> headers
                .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                .contentTypeOptions(opt -> {})
                .frameOptions(frame -> frame.deny())
                .cacheControl(cache -> {})
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                )
            )
            .authorizeHttpRequests(auth -> auth
                // Public GET endpoints (read-only data)
                .requestMatchers(HttpMethod.GET, "/auth/**", "/movies/**", "/cinemas/**", "/screenings/**", "/genres/**", "/reviews/**").permitAll()
                // Public POST for login/register, password reset, and AI Chat
                .requestMatchers(HttpMethod.POST, "/auth/login", "/auth/register", "/auth/2fa/verify", "/auth/forgot-password", "/auth/reset-password", "/auth/resend-verification", "/v1/chat").permitAll()
                // Email verification
                .requestMatchers(HttpMethod.GET, "/auth/verify-email").permitAll()
                // Combo public GET only
                .requestMatchers(HttpMethod.GET, "/combos").permitAll()
                // VNPay endpoints - return, callback & IPN must be public (server-to-server)
                .requestMatchers("/payment/vnpay/return", "/payment/vnpay/callback", "/payment/vnpay/ipn").permitAll()
                // MoMo endpoints - return & notify must be public (server-to-server)
                .requestMatchers("/payment/momo/return", "/payment/momo/notify").permitAll()
                // Payment creation requires auth
                .requestMatchers("/payment/**").authenticated()
                // Reviews POST/PUT/DELETE require authentication
                .requestMatchers("/reviews/**").authenticated()
                // WebSocket and uploads
                .requestMatchers("/ws/**", "/ws-sockjs/**", "/uploads/**").permitAll()
                // OAuth2
                .requestMatchers("/login/oauth2/**", "/oauth2/**").permitAll()
                // Admin routes require ADMIN role
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // Staff routes require STAFF or ADMIN role
                .requestMatchers("/staff/**").hasAnyRole("STAFF", "ADMIN")
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            // Thêm OAuth2 Login
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oAuth2LoginSuccessHandler)
                .failureUrl("https://plvcinema.xyz/login?error=oauth_failed")
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
            "https://plvcinema.xyz",
            "https://www.plvcinema.xyz",
            "http://localhost:3000",
            "http://localhost:5173"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
