import { Session } from 'next-auth';

export interface ProfileData {
  name: string;
  email: string;
  avatar: string;
  referralCode: string;
  avatarLastUpdatedAt: Date | null;
}

export interface GeneralData {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  maintenance: {
    enabled: boolean;
    message: string;
  };
}

export interface User {
  id: string;
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'subscriber';
  isAdmin: boolean;
  permissions: string[];
  coins: number;
  avatar?: string;
  referralCode?: string;
  emailVerified?: boolean;
  isActive: boolean;
  password?: string;
}

export interface ExtendedSession extends Session {
  user: User;
}

// Define the minimum required properties for admin access
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'subscriber';
  isAdmin: boolean;
  permissions?: string[];
  coins?: number;
  avatar?: string;
  referralCode?: string;
  emailVerified?: boolean;
  isActive?: boolean;
}

// Define the session type for admin pages
export interface AdminSession extends Session {
  user: AdminUser;
}

export interface EmailConfig {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export interface TurnstileConfig {
  siteKey: string;
  secretKey: string;
  enabled: boolean;
}

export interface SecurityData {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordExpiry: number;
}

export interface ProfileSettingsProps {
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  profileSuccess: boolean;
  setProfileSuccess: (success: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

export interface GeneralSettingsProps {
  generalData: GeneralData;
  setGeneralData: (data: GeneralData) => void;
  onSuccess: (message: string) => void;
}

export interface EmailSettingsProps {
  emailConfig: EmailConfig;
  setEmailConfig: React.Dispatch<React.SetStateAction<EmailConfig>>;
  onSuccess: (message: string) => void;
}

export interface TurnstileSettingsProps {
  turnstileData: TurnstileConfig;
  setTurnstileData: (config: TurnstileConfig) => void;
  turnstileSuccess: boolean;
  setTurnstileSuccess: (success: boolean) => void;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
}

export interface SecuritySettingsProps {
  securityData: SecurityData;
  setSecurityData: React.Dispatch<React.SetStateAction<SecurityData>>;
  onSuccess: (message: string) => void;
}