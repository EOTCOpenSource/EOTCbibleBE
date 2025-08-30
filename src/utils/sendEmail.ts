import transporter, { accountEmail } from "../config/email";
import { SendMailOptions } from "nodemailer";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const mailOptions: SendMailOptions = {
    from: accountEmail,
    to,
    subject,
    html,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", result.messageId);
    return result;
  } catch (error: any) {
    console.error("❌ Failed to send email:", error.message);
    throw new Error("Email sending failed.");
  }
}
