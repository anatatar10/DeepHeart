package org.example.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    // Use your Yahoo email as the from address
    @Value("${spring.mail.username:noreply@deepheart.com}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        try {
            logger.info("📧 Attempting to send password reset email");
            logger.info("📤 From: {}", fromEmail);
            logger.info("📥 To: {}", toEmail);
            logger.info("🔗 Token: {}", resetToken);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Deep🫀️Heart - Password Reset Request");

            String resetUrl = frontendUrl + "/forgot-password?token=" + resetToken;
            logger.info("🔗 Reset URL: {}", resetUrl);

            String emailBody = buildEmailBody(resetUrl);
            message.setText(emailBody);

            logger.info("📤 Sending email via Yahoo SMTP...");
            mailSender.send(message);

            logger.info("✅ Password reset email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            logger.error("❌ Failed to send password reset email to {}", toEmail);
            logger.error("❌ Error type: {}", e.getClass().getSimpleName());
            logger.error("❌ Error message: {}", e.getMessage());

            // Log the full stack trace for debugging
            logger.error("❌ Full error:", e);

            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    private String buildEmailBody(String resetUrl) {
        return """
            Hello,
            
            You have requested to reset your password for your Deep🫀Heart account.
            
            Please click the link below to reset your password:
            %s
            
            This link will expire in 1 hour for security reasons.
            
            If you did not request this password reset, please ignore this email and your password will remain unchanged.
            
            Best regards,
            The Deep🫀Heart Team
            
            ---
            This is an automated message, please do not reply to this email.
            """.formatted(resetUrl);
    }

    public void sendPasswordResetConfirmation(String toEmail) {
        try {
            logger.info("📧 Sending password reset confirmation to: {}", toEmail);

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Deep🫀Heart - Password Successfully Reset");

            String emailBody = """
                Hello,
                
                This email confirms that your password for your Deep🫀️Heart account has been successfully reset.
                
                If you did not make this change, please contact our support team immediately.
                
                Best regards,
                The Deep🫀Heart Team
                
                ---
                This is an automated message, please do not reply to this email.
                """;

            message.setText(emailBody);
            mailSender.send(message);

            logger.info("✅ Password reset confirmation sent to: {}", toEmail);

        } catch (Exception e) {
            logger.error("❌ Failed to send confirmation email to {}: {}", toEmail, e.getMessage());
        }
    }
}