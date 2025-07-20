import { Resend } from 'resend';
import { storage } from '../storage';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable must be set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  // Send a single email using Resend
  static async sendEmail(to: string, subject: string, htmlContent: string, fromEmail: string = 'FireKyt <noreply@firekyt.com>', fromName: string = 'FireKyt Team') {
    try {
      const response = await resend.emails.send({
        from: fromEmail,
        to: to,
        subject: subject,
        html: htmlContent,
      });

      return {
        success: true,
        messageId: response.data?.id,
        data: response.data
      };
    } catch (error: any) {
      console.error('Resend email error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email'
      };
    }
  }

  // Send test email
  static async sendTestEmail(template: string, subject: string, testEmail: string, fromName: string = 'FireKyt Team', fromEmail: string = 'FireKyt <noreply@firekyt.com>') {
    try {
      // Process template variables
      const processedTemplate = template
        .replace(/{{user_name}}/g, 'Test User')
        .replace(/{{first_name}}/g, 'Test')
        .replace(/{{last_name}}/g, 'User')
        .replace(/{{company_name}}/g, 'FireKyt')
        .replace(/{{unsubscribe_url}}/g, '#')
        .replace(/{{date}}/g, new Date().toLocaleDateString());

      return await this.sendEmail(testEmail, `[TEST] ${subject}`, processedTemplate, fromEmail, fromName);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send test email'
      };
    }
  }

  // Send email campaign
  static async sendCampaign(campaignId: number) {
    try {
      const campaign = await storage.getEmailCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update campaign status to sending
      await storage.updateEmailCampaign(campaignId, { status: 'sending' });

      // Get target users based on campaign criteria
      const users = await storage.getUsersByFilter(campaign.targetAudience, campaign.customFilters);
      
      const results = {
        campaignId,
        totalRecipients: users.length,
        successfulSends: 0,
        failedSends: 0,
        errors: [] as string[]
      };

      // Send emails to all users
      for (const user of users) {
        try {
          // Get template content
          const template = await storage.getEmailTemplateByName(campaign.emailTemplate);
          if (!template) {
            throw new Error(`Template ${campaign.emailTemplate} not found`);
          }
          
          // Process template variables  
          const personalizedContent = template.htmlContent
            .replace(/{{user_name}}/g, user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username)
            .replace(/{{first_name}}/g, user.firstName || user.username)
            .replace(/{{last_name}}/g, user.lastName || '')
            .replace(/{{email}}/g, user.email)
            .replace(/{{company_name}}/g, 'FireKyt')
            .replace(/{{unsubscribe_url}}/g, `${process.env.FRONTEND_URL || 'https://firekyt.com'}/unsubscribe?email=${encodeURIComponent(user.email)}`)
            .replace(/{{date}}/g, new Date().toLocaleDateString());

          const result = await this.sendEmail(
            user.email,
            campaign.subject,
            personalizedContent,
            campaign.fromEmail,
            campaign.fromName
          );

          if (result.success) {
            results.successfulSends++;
            
            // Create recipient record
            await storage.createEmailCampaignRecipients([{
              campaignId,
              userId: user.id,
              email: user.email,
              status: 'sent',
              sentAt: new Date(),
              deliveryId: result.messageId
            }]);
          } else {
            results.failedSends++;
            results.errors.push(`${user.email}: ${result.error}`);
            
            // Create failed recipient record  
            await storage.createEmailCampaignRecipients([{
              campaignId,
              userId: user.id,
              email: user.email,
              status: 'failed',
              errorMessage: result.error
            }]);
          }
        } catch (error: any) {
          results.failedSends++;
          results.errors.push(`${user.email}: ${error.message}`);
          
          // Create failed recipient record
          await storage.createEmailCampaignRecipients([{
            campaignId,
            userId: user.id,
            email: user.email,
            status: 'failed',
            errorMessage: error.message
          }]);
        }
      }

      // Update campaign with results
      const finalStatus = results.failedSends === results.totalRecipients ? 'failed' : 'sent';
      await storage.updateEmailCampaign(campaignId, {
        status: finalStatus,
        sentAt: new Date(),
        totalRecipients: results.totalRecipients,
        successfulSends: results.successfulSends,
        failedSends: results.failedSends
      });

      return results;
    } catch (error: any) {
      // Update campaign status to failed
      await storage.updateEmailCampaign(campaignId, { 
        status: 'failed',
        failedSends: 1
      });
      
      throw error;
    }
  }

  // Get campaign analytics
  static async getCampaignAnalytics(campaignId: number) {
    try {
      const campaign = await storage.getEmailCampaign(campaignId);
      const recipients = await storage.getEmailCampaignRecipients(campaignId);

      return {
        campaignId,
        totalRecipients: recipients.length,
        successfulSends: recipients.filter(r => r.status === 'sent').length,
        failedSends: recipients.filter(r => r.status === 'failed').length,
        openRate: 0, // Not implemented yet
        clickRate: 0, // Not implemented yet
        bounceRate: recipients.filter(r => r.status === 'bounced').length / Math.max(recipients.length, 1),
        deliveryRate: recipients.filter(r => r.status === 'sent').length / Math.max(recipients.length, 1),
        campaign
      };
    } catch (error: any) {
      throw new Error(`Failed to get campaign analytics: ${error.message}`);
    }
  }

  // Create default email templates
  static async createDefaultTemplates(createdById: number) {
    const defaultTemplates = [
      {
        name: 'Welcome Email',
        subject: 'Welcome to FireKyt - Your Affiliate Marketing Journey Begins!',
        htmlContent: `
          <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <div style="font-family: 'Lexend Deca', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
              <div style="height: 40px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: 700; color: white;">🔥 FireKyt</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to FireKyt!</h1>
              <p style="color: white; margin: 20px 0 0 0; font-size: 16px; opacity: 0.9;">Your AI-powered affiliate marketing platform</p>
            </div>
            <div style="padding: 40px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi {{first_name}},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                Welcome to FireKyt! We're excited to have you on board. Our AI-powered platform will help you create compelling affiliate content, manage your campaigns, and maximize your earnings.
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Here's what you can do to get started:
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <ul style="color: #4b5563; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Connect your first website or blog</li>
                  <li style="margin-bottom: 10px;">Generate your first AI-powered content</li>
                  <li style="margin-bottom: 10px;">Set up intelligent link management</li>
                  <li>Explore our affiliate widget system</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{company_url}}/dashboard" style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; display: inline-block;">Get Started</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                If you have any questions, our support team is here to help. Just reply to this email!
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © {{date}} {{company_name}}. All rights reserved.
                <br><a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
        category: 'onboarding',
        isActive: true,
        createdById
      },
      {
        name: 'Feature Update',
        subject: 'New Feature Alert: Enhanced AI Content Generation',
        htmlContent: `
          <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <div style="font-family: 'Lexend Deca', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
              <div style="height: 40px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: 700; color: white;">🔥 FireKyt</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🚀 New Feature Update</h1>
              <p style="color: white; margin: 20px 0 0 0; font-size: 16px; opacity: 0.9;">Exciting improvements to your FireKyt experience</p>
            </div>
            <div style="padding: 40px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi {{first_name}},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                We've just launched some amazing new features that will supercharge your affiliate marketing efforts!
              </p>
              <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 30px 0;">
                <h3 style="color: #ea580c; margin: 0 0 15px 0; font-size: 18px;">✨ What's New:</h3>
                <ul style="color: #ea580c; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 10px;">Enhanced AI content generation with better SEO optimization</li>
                  <li style="margin-bottom: 10px;">New affiliate widget templates</li>
                  <li>Improved analytics dashboard with real-time insights</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{company_url}}/content" style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; display: inline-block;">Try New Features</a>
              </div>
              <p style="color: #4b5563; line-height: 1.6; margin: 30px 0 0 0;">
                As always, we're here to help you succeed. If you have any questions about these new features, don't hesitate to reach out!
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © {{date}} {{company_name}}. All rights reserved.
                <br><a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
        category: 'product_update',
        isActive: true,
        createdById
      },
      {
        name: 'Newsletter',
        subject: 'FireKyt Weekly: Affiliate Marketing Tips & Insights',
        htmlContent: `
          <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <div style="font-family: 'Lexend Deca', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
              <div style="height: 40px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: 700; color: white;">🔥 FireKyt</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">📬 FireKyt Weekly</h1>
              <p style="color: white; margin: 20px 0 0 0; font-size: 16px; opacity: 0.9;">Your weekly dose of affiliate marketing insights</p>
            </div>
            <div style="padding: 40px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi {{first_name}},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Here are this week's top affiliate marketing tips and insights to help you grow your business:
              </p>
              
              <div style="border: 1px solid #fed7aa; border-radius: 8px; padding: 25px; margin: 0 0 25px 0; background: #fff7ed;">
                <h3 style="color: #ea580c; margin: 0 0 15px 0; font-size: 20px;">💡 Tip of the Week</h3>
                <p style="color: #4b5563; line-height: 1.6; margin: 0;">
                  Focus on building trust with your audience through authentic product reviews and transparent affiliate disclosures. Trust leads to higher conversion rates and long-term success.
                </p>
              </div>

              <div style="border: 1px solid #fed7aa; border-radius: 8px; padding: 25px; margin: 0 0 25px 0; background: #fff7ed;">
                <h3 style="color: #ea580c; margin: 0 0 15px 0; font-size: 20px;">📊 Industry Insight</h3>
                <p style="color: #4b5563; line-height: 1.6; margin: 0;">
                  Mobile commerce continues to grow, with 54% of affiliate clicks now coming from mobile devices. Make sure your content and links are mobile-optimized for maximum impact.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="{{company_url}}/research" style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; display: inline-block;">Explore Research Tools</a>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6; margin: 30px 0 0 0;">
                Keep building, keep growing, and remember – we're here to support your affiliate marketing journey every step of the way.
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © {{date}} {{company_name}}. All rights reserved.
                <br><a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
              </p>
            </div>
          </div>
        `,
        category: 'newsletter',
        isActive: true,
        createdById
      },
      {
        name: 'Password Reset',
        subject: 'Reset Your FireKyt Password',
        htmlContent: `
          <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <div style="font-family: 'Lexend Deca', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
              <div style="height: 40px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: 700; color: white;">🔥 FireKyt</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🔐 Password Reset</h1>
              <p style="color: white; margin: 20px 0 0 0; font-size: 16px; opacity: 0.9;">Secure your FireKyt account</p>
            </div>
            <div style="padding: 40px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi {{first_name}},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your FireKyt account password. If you didn't make this request, you can safely ignore this email.
              </p>
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="color: #ea580c; line-height: 1.6; margin: 0; font-weight: 500;">
                  🔒 Click the button below to reset your password. This link expires in 24 hours for security.
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                If the button doesn't work, copy and paste this link: {{reset_url}}
              </p>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © {{date}} {{company_name}}. All rights reserved.
                <br>This email was sent because you requested a password reset.
              </p>
            </div>
          </div>
        `,
        category: 'security',
        isActive: true,
        createdById
      },
      {
        name: 'Account Verification',
        subject: 'Verify Your FireKyt Account',
        htmlContent: `
          <link href="https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <div style="font-family: 'Lexend Deca', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); padding: 40px 20px; text-align: center;">
              <div style="height: 40px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: 700; color: white;">🔥 FireKyt</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">✨ Verify Your Account</h1>
              <p style="color: white; margin: 20px 0 0 0; font-size: 16px; opacity: 0.9;">Just one more step to get started</p>
            </div>
            <div style="padding: 40px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi {{first_name}},</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                Thanks for signing up for FireKyt! To complete your registration and start generating AI-powered affiliate content, please verify your email address.
              </p>
              <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="color: #ea580c; line-height: 1.6; margin: 0; font-weight: 500; text-align: center;">
                  🎯 Click below to verify your account and unlock all FireKyt features
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{verification_url}}" style="background: linear-gradient(135deg, #f97316 0%, #ec4899 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a>
              </div>
              <p style="color: #4b5563; line-height: 1.6; margin: 30px 0 0 0;">
                Once verified, you'll have access to:
              </p>
              <ul style="color: #4b5563; line-height: 1.6; margin: 10px 0 0 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">AI-powered content generation</li>
                <li style="margin-bottom: 8px;">Intelligent link management</li>
                <li style="margin-bottom: 8px;">Performance analytics dashboard</li>
                <li>Affiliate widget creator</li>
              </ul>
            </div>
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                © {{date}} {{company_name}}. All rights reserved.
                <br>This verification link expires in 7 days.
              </p>
            </div>
          </div>
        `,
        category: 'verification',
        isActive: true,
        createdById
      }
    ];

    const createdTemplates = [];
    for (const template of defaultTemplates) {
      try {
        const created = await storage.createEmailTemplate(template);
        createdTemplates.push(created);
      } catch (error) {
        console.error(`Failed to create template ${template.name}:`, error);
      }
    }

    return createdTemplates;
  }
}