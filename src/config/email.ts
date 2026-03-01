import { Resend } from 'resend';

export const accountEmail: string = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';

const resend = new Resend(process.env.RESEND_API_KEY || 'test_key');

// Resend-compatible transporter wrapper for backward compatibility
const transporter = {
  sendMail: async (mailOptions: { from?: string; to: string; subject: string; html?: string; text?: string }) => {
    const result = await resend.emails.send({
      from: mailOptions.from || `${process.env.EMAIL_FROM_NAME || 'EOTCOpenSource'} <${accountEmail}>`,
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html || '',
    });
    return { messageId: result.data?.id || 'resend-message' };
  }
};

export default transporter;
