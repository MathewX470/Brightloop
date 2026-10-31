import nodemailer from "nodemailer";

// Configure SMTP transport (e.g., Gmail, Outlook, SendGrid, etc.)
export function getEmailTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  // If credentials are provided (e.g. Gmail App Password), use live SMTP
  if (user && pass) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || "gmail",
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === "true" || true,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to dev stream transporter if app password is not configured yet
  return nodemailer.createTransport({
    streamTransport: true,
    newline: "windows",
    buffer: true,
  });
}

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
  const transporter = getEmailTransporter();
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || '"Brightloop" <noreply@brightloop.local>';

  const mailOptions = {
    from: fromEmail,
    to,
    subject: "Reset your Brightloop password",
    text: `Hello ${name},\n\nPlease use the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nBest regards,\nBrightloop Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h2 style="color: #4f46e5; margin-bottom: 16px;">Brightloop</h2>
        <h3 style="margin-bottom: 12px; color: #0f172a;">Password Reset Request</h3>
        <p>Hello ${name},</p>
        <p>You recently requested to reset your password. Click the button below to proceed:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 13px; word-break: break-all;"><a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a></p>
        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Brightloop &bull; Unified Subscription & Recurring Billing</p>
      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  // In development / demo mode, print the reset link clearly to console
  console.log("==========================================");
  console.log("📧 [NODEMAILER] Password Reset Email Sent:");
  console.log(`To: ${to}`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log("==========================================");

  return info;
}
