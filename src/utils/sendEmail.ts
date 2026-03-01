import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'test_key');

export const accountEmail: string = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  try {
    const result = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'EOTCOpenSource'} <${accountEmail}>`,
      to: [to],
      subject,
      html,
    });
    console.log('✅ Email sent successfully:', result.data?.id);
    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to send email:', message);
    throw new Error('Email sending failed.');
  }
}
