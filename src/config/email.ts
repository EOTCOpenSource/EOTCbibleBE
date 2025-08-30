import dotenv from "dotenv";
dotenv.config(); // Load .env variables at the very top

import nodemailer, { Transporter, SendMailOptions } from "nodemailer";

export const accountEmail: string = process.env.EMAIL_USER || "support@eotc.com";

// Mock transporter interface
interface MockTransporter {
  sendMail: (mailOptions: SendMailOptions) => Promise<{ messageId: string }>;
}

type EmailTransporter = Transporter | MockTransporter;

// Type guard to detect real transporter
function isRealTransporter(obj: EmailTransporter): obj is Transporter {
  return (obj as Transporter).verify !== undefined;
}

let transporter: EmailTransporter;

// Debug print to check env
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASSWORD:",
  process.env.EMAIL_PASSWORD ? "✅ set" : "❌ missing"
);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn(
    "⚠️ Email credentials not set. Using mock transporter (emails will only be logged)."
  );

  transporter = {
    sendMail: async (mailOptions: SendMailOptions) => {
      console.log("📧 [MOCK MODE] Email simulated:", {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from,
      });
      console.log("📧 [MOCK MODE] Email content:", mailOptions.html);
      return { messageId: "mock-mode-id" };
    },
  };
} else {
  // Create real Gmail transporter
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: { rejectUnauthorized: false },
    debug: true, // optional SMTP debug logs
  });

  if (isRealTransporter(transporter)) {
    transporter.verify((err: Error | null) => {
      if (err) {
        console.error("❌ Nodemailer SMTP connection failed:", err.message);
        console.error("💡 Check Gmail App Password and credentials.");
        // fallback to mock transporter
        transporter = {
          sendMail: async (mailOptions: SendMailOptions) => {
            console.log("📧 [MOCK MODE] Email simulated:", {
              to: mailOptions.to,
              subject: mailOptions.subject,
              from: mailOptions.from,
            });
            console.log("📧 [MOCK MODE] Email content:", mailOptions.html);
            return { messageId: "mock-mode-id" };
          },
        };
      } else {
        console.log("✅ Nodemailer transporter is ready");
      }
    });
  }
}

export default transporter;
