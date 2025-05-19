import nodemailer from 'nodemailer';
import Setting from '@/models/Setting';
import dbConnect from '@/lib/dbConnect';
import { decrypt } from './encryption';

const EMAIL_CONFIG_KEY = 'emailConfig';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

let transporterInstance: nodemailer.Transporter | null = null;
let configError = false;

// Initialize email configuration
async function initializeEmailConfig() {
  try {
    await dbConnect();
    const emailSetting = await Setting.findOne({ key: EMAIL_CONFIG_KEY });
    
    if (!emailSetting?.value) {
      throw new Error('Email configuration not found in database');
    }

    const emailConfig = emailSetting.value as EmailConfig;
    
    // Validate required fields
    if (!emailConfig.host || !emailConfig.port || !emailConfig.auth?.user || !emailConfig.auth?.pass || !emailConfig.from) {
      throw new Error('Incomplete email configuration');
    }

    // Create transporter
    transporterInstance = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: decrypt(emailConfig.auth.pass) // Decrypt password
      }
    });

    // Verify connection
    await transporterInstance.verify();
    console.log('Email configuration verified successfully');
    configError = false;
    return true;
  } catch (error) {
    console.error('Failed to initialize email configuration:', error);
    configError = true;
    return false;
  }
}

// Get or create transporter
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporterInstance || configError) {
    const initialized = await initializeEmailConfig();
    if (!initialized || !transporterInstance) {
      throw new Error('Failed to initialize email transporter');
    }
  }
  return transporterInstance;
}

// Send email
export async function sendMail(options: EmailOptions): Promise<void> {
  try {
    const transporter = await getTransporter();
    const emailConfig = await Setting.findOne({ key: EMAIL_CONFIG_KEY });
    
    if (!emailConfig?.value) {
      throw new Error('Email configuration not found');
    }

    const config = emailConfig.value as EmailConfig;

    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    throw new Error(error.message || 'Failed to send email');
  }
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}

// Reset email configuration
export async function resetEmailConfig(): Promise<void> {
  transporterInstance = null;
  configError = false;
  await initializeEmailConfig();
}