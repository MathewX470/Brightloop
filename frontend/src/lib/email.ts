import nodemailer from "nodemailer";

// In development, we can log the email details or use test transporter
const isDev = process.env.NODE_ENV !== "production";

export const transporter = isDev
  ? nodemailer.createTransport({
      streamTransport: true,
      newline: "windows",
      buffer: true,
    })
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.sendgrid.net",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
      },
    });

export interface SendPasswordResetEmailParams {
  to: string;
  name: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailParams) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Brightloop Software" <noreply@brightloop.local>',
    to,
    subject: "Reset your Brightloop Software password",
    text: `Hello ${name},\n\nPlease use the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nBest regards,\nBrightloop Software Team`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>You recently requested to reset your password for Brightloop Software.</p>
        <p>
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
        <p style="font-size: 12px; color: #888;">Brightloop Software Subscription Platform</p>
      </div>
    `,
  };

  if (isDev) {
    console.log("==========================================");
    console.log("📧 [DEV EMAIL] Password Reset Sent:");
    console.log(`To: ${to}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("==========================================");
  }

  return transporter.sendMail(mailOptions);
}

