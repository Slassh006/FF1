import { FaSave, FaEnvelope } from 'react-icons/fa';
import { EmailConfig, EmailSettingsProps } from '../types';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function EmailSettings({
  emailConfig,
  setEmailConfig,
  onSuccess
}: EmailSettingsProps) {
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localConfig, setLocalConfig] = useState<EmailConfig>({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: ''
  });

  // Update local config when emailConfig changes
  useEffect(() => {
    if (emailConfig) {
      setLocalConfig({
        smtpHost: emailConfig.smtpHost || '',
        smtpPort: emailConfig.smtpPort || '',
        smtpUser: emailConfig.smtpUser || '',
        smtpPass: emailConfig.smtpPass || '',
        fromEmail: emailConfig.fromEmail || '',
        fromName: emailConfig.fromName || ''
      });
    }
  }, [emailConfig]);

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading email settings...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state if not authenticated or not admin
  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">Unauthorized Access</h2>
          <p className="text-sm opacity-75">You don't have permission to access email settings.</p>
        </div>
      </div>
    );
  }

  const handleEmailConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newConfig = {
      ...localConfig,
      [name]: value
    };
    setLocalConfig(newConfig);
    setEmailConfig(newConfig);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate email format
    if (!validateEmail(localConfig.fromEmail)) {
      toast.error('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(localConfig),
      });

      if (response.ok) {
        onSuccess('Email settings saved successfully');
      } else {
        throw new Error('Failed to update email settings');
      }
    } catch (error: any) {
      console.error('Error updating email settings:', error);
      onSuccess('Failed to save email settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestEmail = async () => {
    if (!validateEmail(localConfig.fromEmail)) {
      toast.error('Please configure and save valid email settings first');
      return;
    }

    try {
      const response = await fetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: localConfig.fromEmail }),
      });

      if (response.ok) {
        toast.success('Test email sent successfully');
      } else {
        throw new Error('Failed to send test email');
      }
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast.error('Could not send test email. Please check your settings.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Email Settings</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/50">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            localConfig.smtpHost && localConfig.smtpPort && localConfig.smtpUser && localConfig.smtpPass && localConfig.fromEmail
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {localConfig.smtpHost && localConfig.smtpPort && localConfig.smtpUser && localConfig.smtpPass && localConfig.fromEmail
              ? 'Configured'
              : 'Not Configured'}
          </span>
        </div>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Host */}
          <div>
            <label htmlFor="smtpHost" className="block text-sm font-medium text-white mb-2">SMTP Host</label>
            <input
              type="text"
              id="smtpHost"
              name="smtpHost"
              value={localConfig.smtpHost}
              onChange={handleEmailConfigChange}
              className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              placeholder="smtp.example.com"
            />
            <p className="text-xs text-white/50 mt-1">Your SMTP server hostname</p>
          </div>

          {/* SMTP Port */}
          <div>
            <label htmlFor="smtpPort" className="block text-sm font-medium text-white mb-2">SMTP Port</label>
            <input
              type="text"
              id="smtpPort"
              name="smtpPort"
              value={localConfig.smtpPort}
              onChange={handleEmailConfigChange}
              className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              placeholder="587"
            />
            <p className="text-xs text-white/50 mt-1">Common ports: 587 (TLS) or 465 (SSL)</p>
          </div>

          {/* SMTP Username */}
          <div>
            <label htmlFor="smtpUser" className="block text-sm font-medium text-white mb-2">SMTP Username</label>
            <input
              type="text"
              id="smtpUser"
              name="smtpUser"
              value={localConfig.smtpUser}
              onChange={handleEmailConfigChange}
              className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              placeholder="your-username"
            />
            <p className="text-xs text-white/50 mt-1">Your SMTP account username</p>
          </div>

          {/* SMTP Password */}
          <div>
            <label htmlFor="smtpPass" className="block text-sm font-medium text-white mb-2">SMTP Password</label>
            <input
              type="password"
              id="smtpPass"
              name="smtpPass"
              value={localConfig.smtpPass}
              onChange={handleEmailConfigChange}
              className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              placeholder="your-password"
            />
            <p className="text-xs text-white/50 mt-1">Your SMTP account password</p>
          </div>

          {/* From Email */}
          <div>
            <label htmlFor="fromEmail" className="block text-sm font-medium text-white mb-2">From Email</label>
            <input
              type="email"
              id="fromEmail"
              name="fromEmail"
              value={localConfig.fromEmail}
              onChange={handleEmailConfigChange}
              className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              placeholder="noreply@example.com"
            />
            <p className="text-xs text-white/50 mt-1">The email address that will appear as the sender</p>
          </div>

          {/* From Name */}
          <div>
            <label htmlFor="fromName" className="block text-sm font-medium text-white mb-2">From Name</label>
            <input
              type="text"
              id="fromName"
              name="fromName"
              value={localConfig.fromName}
              onChange={handleEmailConfigChange}
              className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
              placeholder="Your Site Name"
            />
            <p className="text-xs text-white/50 mt-1">The name that will appear as the sender</p>
          </div>
        </div>

        {/* Test Email Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={handleTestEmail}
            className="inline-flex items-center px-4 py-2 border border-primary/20 rounded-lg shadow-sm text-sm font-medium text-white bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
          >
            <FaEnvelope className="mr-2" />
            Send Test Email
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}