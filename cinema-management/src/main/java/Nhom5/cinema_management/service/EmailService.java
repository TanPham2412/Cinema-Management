package Nhom5.cinema_management.service;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import Nhom5.cinema_management.model.Booking;
import Nhom5.cinema_management.model.BookingSeat;
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

    @Async
    public void sendBookingConfirmationEmail(Booking booking) {
        try {
            String toEmail = booking.getUser().getEmail();
            String fullName = booking.getUser().getFullName();

            // Seat list
            List<BookingSeat> seats = booking.getBookingSeats();
            String seatList = (seats == null || seats.isEmpty()) ? "—" :
                seats.stream()
                    .map(bs -> bs.getSeat().getSeatRow() + bs.getSeat().getSeatNumber())
                    .collect(Collectors.joining(", "));

            // Screening info
            String movieTitle = booking.getScreening().getMovie().getTitle();
            String cinemaName = booking.getScreening().getScreen().getCinema().getName();
            String screenName = booking.getScreening().getScreen().getName();
            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm - dd/MM/yyyy");
            String showTime = booking.getScreening().getStartTime().format(dtf);

            // Amount
            NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
            String totalAmount = nf.format(booking.getTotalAmount().longValue()) + " đ";

            int pointsEarned = booking.getPointsEarned() != null ? booking.getPointsEarned() : 0;

            // Build optional points badge separately to avoid escaping issues in text block
            String pointsBadge = "";
            if (pointsEarned > 0) {
                pointsBadge = "<div style='margin-top:12px; background:#1a1a0a; border:1px solid #4a3800;"
                    + " border-radius:8px; padding:10px 14px;'>"
                    + "<span style='font-size:16px;'>⭐</span>"
                    + " <span style='color:#f5c518; font-size:13px;'>Bạn nhận được <strong>"
                    + pointsEarned + " điểm</strong> tích lũy từ đơn này!</span></div>";
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, "PLV Cinema");
            helper.setTo(toEmail);
            helper.setSubject("🎬 Đặt vé thành công - " + movieTitle + " | PLV Cinema");

            String html = "<div style='font-family:Arial,sans-serif;max-width:620px;margin:0 auto;"
                + "background:#0a0a0f;color:#fff;border-radius:16px;overflow:hidden;'>"

                // Header
                + "<div style='background:linear-gradient(135deg,#e50914 0%,#b20710 100%);"
                + "padding:32px 24px;text-align:center;'>"
                + "<div style='font-size:40px;margin-bottom:8px;'>🎬</div>"
                + "<h1 style='margin:0;font-size:22px;font-weight:900;letter-spacing:1px;'>PLV CINEMA</h1>"
                + "<p style='margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;'>Cảm ơn bạn đã đặt vé!</p>"
                + "</div>"

                // Booking code
                + "<div style='background:#13131a;border-bottom:2px dashed #2a2a3a;padding:20px 24px;text-align:center;'>"
                + "<p style='margin:0 0 4px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;'>Mã đặt vé</p>"
                + "<p style='margin:0;font-family:monospace;font-size:26px;font-weight:900;color:#f5c518;letter-spacing:4px;'>"
                + booking.getBookingCode() + "</p>"
                + "</div>"

                // Details
                + "<div style='background:#13131a;padding:24px;'>"
                + "<table style='width:100%;border-collapse:collapse;'>"
                + "<tr><td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#888;font-size:13px;width:40%;'>🎥 Phim</td>"
                + "<td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#fff;font-size:13px;font-weight:700;'>" + movieTitle + "</td></tr>"
                + "<tr><td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#888;font-size:13px;'>🏛️ Rạp</td>"
                + "<td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#fff;font-size:13px;'>" + cinemaName + "</td></tr>"
                + "<tr><td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#888;font-size:13px;'>🎞️ Phòng chiếu</td>"
                + "<td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#fff;font-size:13px;'>" + screenName + "</td></tr>"
                + "<tr><td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#888;font-size:13px;'>🕐 Suất chiếu</td>"
                + "<td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#fff;font-size:13px;'>" + showTime + "</td></tr>"
                + "<tr><td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#888;font-size:13px;'>💺 Ghế</td>"
                + "<td style='padding:10px 0;border-bottom:1px solid #1e1e2e;color:#f5c518;font-size:13px;font-weight:700;font-family:monospace;'>" + seatList + "</td></tr>"
                + "<tr><td style='padding:10px 0;color:#888;font-size:13px;'>💰 Tổng tiền</td>"
                + "<td style='padding:10px 0;color:#4ade80;font-size:15px;font-weight:900;'>" + totalAmount + "</td></tr>"
                + "</table>"
                + pointsBadge

                // Note
                + "<div style='margin-top:20px;background:#1e1e2e;border-radius:10px;padding:14px 16px;border-left:3px solid #e50914;'>"
                + "<p style='margin:0;color:#ccc;font-size:12px;line-height:1.7;'>"
                + "📌 Vui lòng đến trước giờ chiếu <strong style='color:#fff;'>15 phút</strong> để nhân viên check-in.<br/>"
                + "Mang theo mã đặt vé <strong style='color:#f5c518;'>" + booking.getBookingCode() + "</strong>"
                + " hoặc xem trong mục <strong style='color:#fff;'>Lịch sử đặt vé</strong>.</p></div>"
                + "</div>"

                // Footer
                + "<div style='background:#0d0d14;padding:24px;text-align:center;border-top:1px solid #1e1e2e;'>"
                + "<p style='margin:0 0 8px;color:#fff;font-size:15px;font-weight:700;'>Cảm ơn bạn đã ủng hộ PLV Cinema! 🍿</p>"
                + "<p style='margin:0;color:#666;font-size:12px;'>Chúc bạn có buổi xem phim thật tuyệt vời.</p>"
                + "<p style='margin:16px 0 0;color:#444;font-size:11px;'>&#169; 2026 PLV Cinema. Mọi quyền được bảo lưu.</p>"
                + "</div>"
                + "</div>";

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Booking confirmation email sent to {} for booking {}", toEmail, booking.getBookingCode());
        } catch (MessagingException e) {
            log.error("Failed to send booking confirmation email for {}: {}", booking.getBookingCode(), e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending booking confirmation email for {}: {}", booking.getBookingCode(), e.getMessage());
        }
    }
}
