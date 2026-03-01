import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'test_key');
const fromEmail = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';
const fromName = process.env.EMAIL_FROM_NAME || 'EOTCOpenSource';

function getFrom(): string {
    return `${fromName} <${fromEmail}>`;
}

// Send OTP email
async function sendOTPEmail(email: string, otp: string, userName: string): Promise<void> {
    try {
        await resend.emails.send({
            from: getFrom(),
            to: [email],
            subject: 'Verify Your Email - OTP Code',
            html: generateOTPEmailHTML(otp, userName),
            text: generateOTPEmailText(otp, userName),
        });
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw new Error('Failed to send OTP email');
    }
}

// Send password reset email
async function sendPasswordResetEmail(email: string, resetUrl: string, userName: string): Promise<void> {
    try {
        await resend.emails.send({
            from: getFrom(),
            to: [email],
            subject: 'Reset Your Password - EOTCOpenSource',
            html: generatePasswordResetEmailHTML(resetUrl, userName),
            text: generatePasswordResetEmailText(resetUrl, userName),
        });
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
}

// Send generic email
async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    try {
        await resend.emails.send({
            from: getFrom(),
            to: [to],
            subject,
            html,
            ...(text ? { text } : {}),
        });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw new Error('Failed to send email');
    }
}

// Verify email configuration
async function verifyConnection(): Promise<boolean> {
    if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️  RESEND_API_KEY not set. Email service unavailable.');
        return false;
    }
    console.log('✅ Email service (Resend) configured successfully');
    return true;
}

// Get configuration type for debugging
function getConfigType(): string {
    return 'Resend';
}

// --- HTML Templates ---

function generateOTPEmailHTML(otp: string, userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - EOTCOpenSource</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; }
        .header { background: #621b1f; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; background: white; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .otp-code { background: white; color: #621b1f; padding: 25px; text-align: center; font-size: 36px; font-weight: bold; border: 3px dotted #621b1f; border-radius: 12px; margin: 25px 0; letter-spacing: 4px; box-shadow: 0 2px 8px rgba(98,27,31,0.1); }
        .important-note { background: #f8f9fa; border-left: 4px solid #621b1f; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .important-note h3 { color: #621b1f; margin-top: 0; font-size: 16px; }
        .important-note ul { margin: 10px 0; padding-left: 20px; }
        .important-note li { margin: 8px 0; color: #555; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f8f9fa; border-top: 1px solid #e9ecef; }
        .brand-name { color: #621b1f; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🔐 Email Verification</h1></div>
        <div class="content">
          <div class="greeting"><p>Hello <strong>${userName}</strong>,</p></div>
          <p>Welcome to <span class="brand-name">EOTCOpenSource</span>! To complete your registration, use the following OTP code:</p>
          <div style="text-align:center"><div class="otp-code">${otp}</div></div>
          <div class="important-note">
            <h3>⚠️ Important Information</h3>
            <ul>
              <li>This OTP code will expire in <strong>10 minutes</strong></li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this code, please ignore this email</li>
              <li>This code can only be used once</li>
            </ul>
          </div>
          <p>Once verified, you'll have full access to all features.</p>
          <p>Best regards,<br><strong>The EOTCOpenSource Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email from <span class="brand-name">EOTCOpenSource</span>.</p>
          <p>© 2025 EOTCOpenSource. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOTPEmailText(otp: string, userName: string): string {
    return `Email Verification - EOTCOpenSource\n\nHello ${userName},\n\nYour OTP code: ${otp}\n\nThis code expires in 10 minutes. Do not share it.\n\nBest regards,\nThe EOTCOpenSource Team`;
}

function generatePasswordResetEmailHTML(resetUrl: string, userName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - EOTCOpenSource</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; }
        .header { background: #621b1f; color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; background: white; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .reset-button { display: inline-block; background: #621b1f; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
        .reset-link { word-break: break-all; color: #621b1f; font-size: 14px; background: #f8f9fa; padding: 10px; border-radius: 6px; display: block; margin: 15px 0; }
        .important-note { background: #f8f9fa; border-left: 4px solid #621b1f; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0; }
        .important-note h3 { color: #621b1f; margin-top: 0; font-size: 16px; }
        .important-note ul { margin: 10px 0; padding-left: 20px; }
        .important-note li { margin: 8px 0; color: #555; }
        .security-warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0; }
        .security-warning h3 { color: #856404; margin-top: 0; font-size: 16px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f8f9fa; border-top: 1px solid #e9ecef; }
        .brand-name { color: #621b1f; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>🔒 Password Reset Request</h1></div>
        <div class="content">
          <div class="greeting"><p>Hello <strong>${userName}</strong>,</p></div>
          <p>We received a request to reset your password. Click below to reset it:</p>
          <div style="text-align:center"><a href="${resetUrl}" class="reset-button">Reset My Password</a></div>
          <p>Or copy this link: <a href="${resetUrl}" class="reset-link">${resetUrl}</a></p>
          <div class="important-note">
            <h3>⚠️ Important</h3>
            <ul>
              <li>This link expires in <strong>15 minutes</strong></li>
              <li>Can only be used once</li>
            </ul>
          </div>
          <div class="security-warning">
            <h3>🛡️ Security Notice</h3>
            <p>If you did not request this, ignore this email. Your password will remain unchanged.</p>
          </div>
          <p>Best regards,<br><strong>The EOTCOpenSource Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email from <span class="brand-name">EOTCOpenSource</span>.</p>
          <p>© 2025 EOTCOpenSource. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePasswordResetEmailText(resetUrl: string, userName: string): string {
    return `Password Reset - EOTCOpenSource\n\nHello ${userName},\n\nReset your password: ${resetUrl}\n\nThis link expires in 15 minutes.\n\nBest regards,\nThe EOTCOpenSource Team`;
}

// Export as object to maintain backward compatibility with controllers
export const emailService = {
    sendOTPEmail,
    sendPasswordResetEmail,
    sendEmail,
    verifyConnection,
    getConfigType,
};

export default emailService;