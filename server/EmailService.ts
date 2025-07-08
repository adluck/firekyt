import { Resend } from 'resend';
import { logger } from './Logger';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static instance: EmailService;
  private resend: Resend | null = null;
  private isConfigured = false;

  private constructor() {
    this.initializeService();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeService(): void {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      logger.warn('Resend API key not found. Email functionality will be disabled.');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      this.isConfigured = true;
      logger.info('Resend email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Resend service', error as Error);
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      logger.error('Email service not configured - cannot send password reset email');
      return false;
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
    
    const template = this.getPasswordResetTemplate(username, resetUrl);

    try {
      const result = await this.resend.emails.send({
        to: [email],
        from: process.env.FROM_EMAIL || 'noreply@firekyt.com',
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      logger.info('Password reset email sent successfully', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        messageId: result.data?.id 
      });
      return true;
    } catch (error: any) {
      logger.error('Failed to send password reset email via Resend', error as Error, { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        errorMessage: error.message 
      });
      
      // For development/testing, log the reset URL so it can be used manually
      if (process.env.NODE_ENV === 'development') {
        logger.info('Development mode: Password reset URL', { 
          email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
          resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`
        });
        // Return true in development mode so the flow continues
        return true;
      }
      
      return false;
    }
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    if (!this.isConfigured || !this.resend) {
      logger.warn('Email service not configured - skipping welcome email');
      return false;
    }

    const template = this.getWelcomeTemplate(username);

    try {
      const result = await this.resend.emails.send({
        to: [email],
        from: process.env.FROM_EMAIL || 'noreply@firekyt.com',
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      logger.info('Welcome email sent successfully', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        messageId: result.data?.id 
      });
      return true;
    } catch (error: any) {
      logger.error('Failed to send welcome email via Resend', error as Error, { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        errorMessage: error.message 
      });
      return false;
    }
  }

  private getPasswordResetTemplate(username: string, resetUrl: string): EmailTemplate {
    const subject = 'Reset Your FireKyt Password';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;600;700&display=swap');
    body { font-family: 'Lexend Deca', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25); }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    .warning { background: #fef3c7; border-left: 4px solid #fcd34d; padding: 15px; margin: 20px 0; border-radius: 4px; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="font-weight: 700; font-size: 32px; margin: 0;">🔥 FireKyt</h1>
      <h2 style="font-weight: 600; margin: 10px 0 0 0;">Password Reset Request</h2>
    </div>
    <div class="content">
      <p>Hello ${username},</p>
      
      <p>We received a request to reset your password for your FireKyt account. If you made this request, click the button below to reset your password:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset My Password</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace;">${resetUrl}</p>
      
      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul>
          <li>This link will expire in 1 hour for security reasons</li>
          <li>If you didn't request this password reset, please ignore this email</li>
          <li>Your account remains secure and no changes have been made</li>
        </ul>
      </div>
      
      <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
      
      <p>Best regards,<br><strong>The FireKyt Team</strong></p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
      <p>If you need help, contact our support team.</p>
    </div>
  </div>
</body>
</html>`;

    const text = `
Hello ${username},

We received a request to reset your password for your FireKyt account.

To reset your password, please visit the following link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your account remains secure and no changes have been made.

Best regards,
The FireKyt Team

---
This is an automated message. Please do not reply to this email.
`;

    return { subject, html, text };
  }

  private getWelcomeTemplate(username: string): EmailTemplate {
    const subject = 'Welcome to FireKyt! 🔥';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FireKyt</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;600;700&display=swap');
    body { font-family: 'Lexend Deca', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .feature { display: flex; align-items: center; margin: 15px 0; }
    .feature-icon { font-size: 20px; margin-right: 15px; }
    .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="font-weight: 700; font-size: 32px; margin: 0;">🔥 Welcome to FireKyt!</h1>
    </div>
    <div class="content">
      <p>Hello ${username},</p>
      
      <p>Welcome to FireKyt! We're excited to help you create amazing affiliate content that converts.</p>
      
      <h3>Here's what you can do with FireKyt:</h3>
      
      <div class="feature">
        <span class="feature-icon">✨</span>
        <span>Generate AI-powered affiliate content in seconds</span>
      </div>
      
      <div class="feature">
        <span class="feature-icon">🎯</span>
        <span>Create SEO-optimized blog posts and product reviews</span>
      </div>
      
      <div class="feature">
        <span class="feature-icon">📊</span>
        <span>Track performance with detailed analytics</span>
      </div>
      
      <div class="feature">
        <span class="feature-icon">🔗</span>
        <span>Manage multiple affiliate sites from one dashboard</span>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard" class="button">Get Started Now</a>
      </div>
      
      <p>If you have any questions, don't hesitate to reach out to our support team.</p>
      
      <p>Happy content creating!<br><strong>The FireKyt Team</strong></p>
    </div>
  </div>
</body>
</html>`;

    const text = `
Hello ${username},

Welcome to FireKyt! We're excited to help you create amazing affiliate content that converts.

Here's what you can do with FireKyt:
- Generate AI-powered affiliate content in seconds
- Create SEO-optimized blog posts and product reviews  
- Track performance with detailed analytics
- Manage multiple affiliate sites from one dashboard

Get started: ${process.env.FRONTEND_URL || 'http://localhost:5000'}/dashboard

If you have any questions, don't hesitate to reach out to our support team.

Happy content creating!
The FireKyt Team
`;

    return { subject, html, text };
  }
}

export const emailService = EmailService.getInstance();