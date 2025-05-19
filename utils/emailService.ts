import nodemailer from 'nodemailer';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Define attachment structure matching the API route
interface NodemailerAttachment {
    filename: string;
    content: Buffer;
    contentType: string;
}

interface EmailOptions {
  to?: string; // Make 'to' optional as BCC might be used primarily
  bcc?: string | string[]; // Add BCC field
  subject: string;
  html: string;
  attachments?: NodemailerAttachment[]; // Add attachments field
}

export const sendEmail = async ({ to, bcc, subject, html, attachments }: EmailOptions) => {
  try {
    if (!to && !bcc) {
        throw new Error('Email requires at least one recipient in \'to\' or \'bcc\'.');
    }

    const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: to,       // Pass 'to' if provided
        bcc: bcc,     // Pass 'bcc' if provided
        subject: subject,
        html: html,
        attachments: attachments, // Pass attachments if provided
    };

    // Remove undefined fields to avoid Nodemailer issues
    Object.keys(mailOptions).forEach(key => {
        if (mailOptions[key as keyof typeof mailOptions] === undefined) {
            delete mailOptions[key as keyof typeof mailOptions];
        }
    });

    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully to: ${to || 'BCC recipients'}, Message ID: ${info.messageId}`); // Log success
    return { success: true, messageId: info.messageId };

  } catch (error: any) { // Catch any type of error
    console.error('Email sending failed:', error);
    // Try to return a more specific error message if possible
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: { message: errorMessage, originalError: error } };
  }
};

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to TheFreeFireIndia!',
    html: `
      <h1>Welcome to TheFreeFireIndia, ${name}!</h1>
      <p>Thank you for joining our community. We're excited to have you on board!</p>
      <p>You can now:</p>
      <ul>
        <li>Download exclusive wallpapers</li>
        <li>Participate in giveaways</li>
        <li>Join our community discussions</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    `,
  }),

  verifyEmail: (name: string, token: string) => ({
    subject: 'Verify Your Email Address',
    html: `
      <h1>Hello ${name},</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}">
        Verify Email Address
      </a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this verification, please ignore this email.</p>
    `,
  }),

  resetPassword: (name: string, token: string) => ({
    subject: 'Reset Your Password',
    html: `
      <h1>Hello ${name},</h1>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}">
        Reset Password
      </a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this reset, please ignore this email.</p>
    `,
  }),

  twoFactorCode: (name: string, code: string) => ({
    subject: 'Your Two-Factor Authentication Code',
    html: `
      <h1>Hello ${name},</h1>
      <p>Your two-factor authentication code is:</p>
      <h2 style="font-size: 24px; letter-spacing: 5px; text-align: center;">${code}</h2>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please secure your account immediately.</p>
    `,
  }),

  securityAlert: (name: string, activity: string) => ({
    subject: 'Security Alert - New Login Detected',
    html: `
      <h1>Security Alert</h1>
      <p>Hello ${name},</p>
      <p>We detected a new login to your account:</p>
      <p><strong>${activity}</strong></p>
      <p>If this was you, you can ignore this email. If not, please secure your account immediately.</p>
    `,
  }),
}; 