import nodemailer from 'nodemailer';

// Email configuration interface for App Password
interface AppPasswordConfig {
    type: 'AppPassword';
    user: string;
    password: string;
}

// Email service class
class EmailService {
    private transporter: nodemailer.Transporter;
    private config: AppPasswordConfig;

    constructor() {
        // Validate App Password configuration
        if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
            const missingVars = [];
            if (!process.env.EMAIL_USER) missingVars.push('EMAIL_USER');
            if (!process.env.EMAIL_APP_PASSWORD) missingVars.push('EMAIL_APP_PASSWORD');

            throw new Error(`❌ Missing required App Password environment variables: ${missingVars.join(', ')}`);
        }

        // Use App Password configuration
        this.config = {
            type: 'AppPassword',
            user: process.env.EMAIL_USER,
            password: process.env.EMAIL_APP_PASSWORD
        };

        // Create transporter based on configuration
        this.transporter = this.createTransporter();
    }

    private createTransporter(): nodemailer.Transporter {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.config.user,
                pass: this.config.password
            }
        });
    }

    // Send OTP email
    async sendOTPEmail(email: string, otp: string, userName: string): Promise<void> {
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'EOTCOpenSource'}" <${this.config.user}>`,
            to: email,
            subject: 'Verify Your Email - OTP Code',
            html: this.generateOTPEmailHTML(otp, userName),
            text: this.generateOTPEmailText(otp, userName)
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ OTP email sent successfully to ${email}`);
        } catch (error) {
            console.error('❌ Error sending OTP email:', error);
            throw new Error('Failed to send OTP email');
        }
    }

    // Generate HTML email template
    private generateOTPEmailHTML(otp: string, userName: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification - EOTCOpenSource</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        line-height: 1.6; 
                        color: #333; 
                        margin: 0; 
                        padding: 0; 
                        background-color: #f8f9fa;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 0 auto; 
                        background-color: white;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        border-radius: 12px;
                        overflow: hidden;
                    }
                    .header { 
                        background: #621b1f; 
                        color: white; 
                        padding: 30px 20px; 
                        text-align: center; 
                    }
                    .header h1 { 
                        margin: 0; 
                        font-size: 28px; 
                        font-weight: 600;
                    }
                    .content { 
                        padding: 40px 30px; 
                        background: white;
                    }
                    .greeting {
                        font-size: 18px;
                        color: #333;
                        margin-bottom: 20px;
                    }
                    .otp-section {
                        text-align: center;
                        margin: 30px 0;
                    }
                    .otp-code { 
                        background: white; 
                        color: #621b1f; 
                        padding: 25px; 
                        text-align: center; 
                        font-size: 36px; 
                        font-weight: bold; 
                        border: 3px dotted #621b1f;
                        border-radius: 12px; 
                        margin: 25px 0; 
                        letter-spacing: 4px;
                        box-shadow: 0 2px 8px rgba(98, 27, 31, 0.1);
                    }
                    .important-note {
                        background: #f8f9fa;
                        border-left: 4px solid #621b1f;
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 0 8px 8px 0;
                    }
                    .important-note h3 {
                        color: #621b1f;
                        margin-top: 0;
                        font-size: 16px;
                    }
                    .important-note ul {
                        margin: 10px 0;
                        padding-left: 20px;
                    }
                    .important-note li {
                        margin: 8px 0;
                        color: #555;
                    }
                    .footer { 
                        text-align: center; 
                        padding: 20px; 
                        color: #666; 
                        font-size: 12px; 
                        background: #f8f9fa;
                        border-top: 1px solid #e9ecef;
                    }
                    .brand-name {
                        color: #621b1f;
                        font-weight: 600;
                    }
                    @media only screen and (max-width: 600px) {
                        .container { margin: 10px; }
                        .content { padding: 25px 20px; }
                        .otp-code { font-size: 28px; padding: 20px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Email Verification</h1>
                    </div>
                    <div class="content">
                        <div class="greeting">
                            <p>Hello <strong>${userName}</strong>,</p>
                        </div>
                        
                        <p>Welcome to <span class="brand-name">EOTCOpenSource</span>! We're excited to have you on board. To complete your registration and verify your email address, please use the following OTP code:</p>
                        
                        <div class="otp-section">
                            <div class="otp-code">${otp}</div>
                        </div>
                        
                        <div class="important-note">
                            <h3>⚠️ Important Information</h3>
                            <ul>
                                <li>This OTP code will expire in <strong>10 minutes</strong></li>
                                <li>Do not share this code with anyone - keep it secure</li>
                                <li>If you didn't request this code, please ignore this email</li>
                                <li>For security reasons, this code can only be used once</li>
                            </ul>
                        </div>
                        
                        <p>Once verified, you'll have full access to all our features and resources.</p>
                        
                        <p>Best regards,<br><strong>The EOTCOpenSource Team</strong></p>
                    </div>
                    
                    <div class="footer">
                        <p>This is an automated email from <span class="brand-name">EOTCOpenSource</span>. Please do not reply to this message.</p>
                        <p>© 2025 EOTCOpenSource. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // Generate plain text email template
    private generateOTPEmailText(otp: string, userName: string): string {
        return `
Email Verification - EOTCOpenSource

Hello ${userName},

Welcome to EOTCOpenSource! We're excited to have you on board. To complete your registration and verify your email address, please use the following OTP code:

${otp}

Important Information:
- This OTP code will expire in 10 minutes
- Do not share this code with anyone - keep it secure
- If you didn't request this code, please ignore this email
- For security reasons, this code can only be used once

Once verified, you'll have full access to all our features and resources.

Best regards,
The EOTCOpenSource Team

---
This is an automated email from EOTCOpenSource. Please do not reply to this message.
© 2025 EOTCOpenSource. All rights reserved.
        `;
    }

    // Verify email configuration
    async verifyConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('✅ Email service connection verified successfully');
            return true;
        } catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    }

    // Get configuration type for debugging
    getConfigType(): string {
        return this.config.type;
    }
}

// Create and export singleton instance
export const emailService = new EmailService();
export default emailService;
