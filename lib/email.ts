import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import crypto from 'crypto';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { Queue, Job } from 'bull';
import Setting from '@/models/Setting';
import dbConnect from '@/lib/dbConnect';
import { getTransporter } from './nodemailer';

// Rate limiter: 100 emails per minute
const rateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

// Email queue
const emailQueue = new Queue('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

// Encryption key and IV
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

// Encryption functions
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  await dbConnect();
  const emailSetting = await Setting.findOne({ key: 'emailConfig' });
  
  if (!emailSetting?.value) {
    throw new Error('Email configuration not found');
  }

  const { host, port, user, password, secure } = emailSetting.value;
  
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: secure || port === 465,
    auth: {
      user,
      pass: decrypt(password), // Decrypt password before use
    },
  });

  return transporter;
}

type TemplateFunction<T extends any[]> = (...args: T) => { subject: string; html: string };

interface EmailTemplates {
  welcome: TemplateFunction<[string]>;
  verifyEmail: TemplateFunction<[string, string]>;
  resetPassword: TemplateFunction<[string, string]>;
  passwordChanged: TemplateFunction<[string]>;
  accountBlocked: TemplateFunction<[string, string]>;
  quizResult: TemplateFunction<[string, number, number]>;
  twoFactorCode: TemplateFunction<[string, string]>;
  securityAlert: TemplateFunction<[string, string]>;
}

// Email templates
const templates: EmailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Free Fire India!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4B2B;">Welcome to Free Fire India!</h1>
        <p>Hello ${name},</p>
        <p>Thank you for joining Free Fire India! We're excited to have you on board.</p>
        <p>Here's what you can do with your account:</p>
        <ul>
          <li>Participate in daily quizzes</li>
          <li>Earn coins and rewards</li>
          <li>Access exclusive wallpapers</li>
          <li>Join the community</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Free Fire India Team</p>
      </div>
    `,
  }),

  verifyEmail: (name: string, token: string) => ({
    subject: 'Verify Your Email Address - Free Fire India',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4B2B;">Verify Your Email Address</h1>
        <p>Hello ${name},</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}" 
           style="background-color: #FF4B2B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Verify Email Address
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <p>Best regards,<br>The Free Fire India Team</p>
      </div>
    `,
  }),

  resetPassword: (name: string, resetUrl: string) => ({
    subject: 'Reset Your Password - Free Fire India',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4B2B;">Reset Your Password</h1>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${resetUrl}" 
           style="background-color: #FF4B2B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Best regards,<br>The Free Fire India Team</p>
      </div>
    `,
  }),

  passwordChanged: (name: string) => ({
    subject: 'Password Changed - Free Fire India',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4B2B;">Password Changed</h1>
        <p>Hello ${name},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The Free Fire India Team</p>
      </div>
    `,
  }),

  accountBlocked: (name: string, reason: string) => ({
    subject: 'Account Blocked - Free Fire India',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4B2B;">Account Blocked</h1>
        <p>Hello ${name},</p>
        <p>Your account has been blocked for the following reason:</p>
        <p style="color: #FF4B2B;">${reason}</p>
        <p>If you believe this is a mistake, please contact our support team.</p>
        <p>Best regards,<br>The Free Fire India Team</p>
      </div>
    `,
  }),

  quizResult: (name: string, score: number, coinsEarned: number) => ({
    subject: 'Quiz Results - Free Fire India',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4B2B;">Quiz Results</h1>
        <p>Hello ${name},</p>
        <p>Here are your quiz results:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <p><strong>Score:</strong> ${score}%</p>
          <p><strong>Coins Earned:</strong> ${coinsEarned}</p>
        </div>
        <p>Keep participating in quizzes to earn more coins!</p>
        <p>Best regards,<br>The Free Fire India Team</p>
      </div>
    `,
  }),

  twoFactorCode: (name: string, code: string) => ({
    subject: 'Your Two-Factor Authentication Code - Free Fire India',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4B2B;">Two-Factor Authentication Code</h1>
        <p>Hello ${name},</p>
        <p>Your two-factor authentication code is:</p>
        <h2 style="font-size: 24px; letter-spacing: 5px; text-align: center; background-color: #f5f5f5; padding: 20px; border-radius: 4px;">${code}</h2>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please secure your account immediately.</p>
        <p>Best regards,<br>The Free Fire India Team</p>
      </div>
    `,
  }),

  securityAlert: (name: string, activity: string) => ({
    subject: 'Security Alert - Free Fire India',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF4B2B;">Security Alert</h1>
        <p>Hello ${name},</p>
        <p>We detected a new login to your account:</p>
        <p style="background-color: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
          <strong>${activity}</strong>
        </p>
        <p>If this was you, you can ignore this email. If not, please secure your account immediately.</p>
        <p>Best regards,<br>The Free Fire India Team</p>
      </div>
    `,
  }),
};

interface EmailJobData {
  to: string;
  subject: string;
  html?: string;
  template?: keyof EmailTemplates;
  data?: Parameters<EmailTemplates[keyof EmailTemplates]>;
}

// Process email queue
emailQueue.process(async (job: Job<EmailJobData>) => {
  const { to, subject, html, template, data } = job.data;
  
  try {
    // Apply rate limiting
    await rateLimiter.removeTokens(1);
    
    const transporter = await getTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: template && data ? templates[template](...(data as any[])).html : html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
});

// Email sending function
export async function sendEmail<T extends keyof EmailTemplates>(
  to: string,
  template: T,
  ...data: Parameters<EmailTemplates[T]>
) {
  try {
    const { subject, html } = templates[template](...data);
    
    // Add to queue with data as array
    const job = await emailQueue.add({
      to,
      subject,
      template,
      data: data as any[], // Convert tuple to array for storage
    });

    return { success: true, jobId: job.id };
  } catch (error) {
    console.error('Email queue error:', error);
    throw error;
  }
}

// Verify email configuration
export async function verifyEmailConfig() {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}

// Update email settings
export async function updateEmailSettings(settings: {
  host: string;
  port: number;
  user: string;
  password: string;
  secure?: boolean;
}) {
  await dbConnect();
  
  // Encrypt password before storing
  const encryptedPassword = encrypt(settings.password);
  
  await Setting.findOneAndUpdate(
    { key: 'emailConfig' },
    { 
      $set: { 
        key: 'emailConfig',
        value: {
          ...settings,
          password: encryptedPassword,
        }
      }
    },
    { upsert: true }
  );
  
  // Reset transporter to use new settings
  transporter = null;
}

export { templates }; 