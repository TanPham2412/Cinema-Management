package Nhom5.cinema_management.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendPasswordResetEmail(String toEmail, String fullName, String resetToken, String frontendBaseUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "PLV Cinema");
            helper.setTo(toEmail);
            helper.setSubject("Đặt lại mật khẩu - LLMCinema");

            String resetUrl = frontendBaseUrl + "/reset-password?token=" + resetToken;
            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 32px; border-radius: 12px;">
                  <div style="text-align: center; margin-bottom: 32px;">
                    <div style="background: #e50914; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">🎬</div>
                    <h1 style="color: #fff; margin: 16px 0 4px; font-size: 24px;">LLMCinema</h1>
                    <p style="color: #888; margin: 0;">Trải nghiệm điện ảnh đỉnh cao</p>
                  </div>
                  <h2 style="color: #fff; margin-bottom: 8px;">Đặt lại mật khẩu</h2>
                  <p style="color: #ccc; line-height: 1.6;">Xin chào <strong style="color:#fff;">%s</strong>,</p>
                  <p style="color: #ccc; line-height: 1.6;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="%s" style="background: #e50914; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
                      Đặt lại mật khẩu
                    </a>
                  </div>
                  <p style="color: #888; font-size: 13px; line-height: 1.6;">Link này sẽ hết hạn sau <strong>15 phút</strong>. Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.</p>
                  <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
                  <p style="color: #555; font-size: 12px; text-align: center;">© 2026 LLMCinema. Mọi quyền được bảo lưu.</p>
                </div>
                """.formatted(fullName, resetUrl);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", toEmail, e.getMessage());
        }
    }
}
