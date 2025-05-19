import { FaSave, FaShieldAlt, FaLock } from 'react-icons/fa';
import { SecurityData, SecuritySettingsProps } from '../types';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function SecuritySettings({
  securityData,
  setSecurityData,
  securitySuccess,
  setSecuritySuccess,
  isSubmitting,
  setIsSubmitting
}: SecuritySettingsProps) {
  const { data: session, status } = useSession();

  // Show loading state while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading security settings...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state if not admin
  if (!session || !session.user || !session.user.isAdmin) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">Unauthorized Access</h2>
          <p className="text-sm opacity-75">You don't have permission to access security settings.</p>
        </div>
      </div>
    );
  }

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSecurityData({
      ...securityData,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
    });
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSecuritySuccess(false);

    try {
      const response = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(securityData),
      });

      const data = await response.json();

      if (response.ok) {
        setSecuritySuccess(true);
        toast.success('Security settings saved successfully');
        setTimeout(() => setSecuritySuccess(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to update security settings');
      }
    } catch (error: any) {
      console.error('Error updating security settings:', error);
      toast.error(error.message || 'Could not update security settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Security Settings</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/50">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            securityData.twoFactorEnabled
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {securityData.twoFactorEnabled ? 'Enhanced Security' : 'Standard Security'}
          </span>
        </div>
      </div>
      
      {securitySuccess && (
        <div className="bg-green-500/20 border border-green-500 text-white px-4 py-3 rounded-lg mb-6">
          Security settings saved!
        </div>
      )}

      <form onSubmit={handleSecuritySubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Session Timeout */}
          <div>
            <label htmlFor="sessionTimeout" className="label">Session Timeout (minutes)</label>
            <input
              type="number"
              id="sessionTimeout"
              name="sessionTimeout"
              value={securityData.sessionTimeout}
              onChange={handleSecurityChange}
              className="input-field"
              min="5"
              max="1440"
              required
            />
            <p className="text-xs text-white/50 mt-1">Time before user session expires (5-1440 minutes)</p>
          </div>

          {/* Max Login Attempts */}
          <div>
            <label htmlFor="loginAttempts" className="label">Max Login Attempts</label>
            <input
              type="number"
              id="loginAttempts"
              name="loginAttempts"
              value={securityData.loginAttempts}
              onChange={handleSecurityChange}
              className="input-field"
              min="3"
              max="10"
              required
            />
            <p className="text-xs text-white/50 mt-1">Number of failed attempts before lockout (3-10)</p>
          </div>

          {/* Lockout Duration */}
          <div>
            <label htmlFor="lockoutDuration" className="label">Lockout Duration (minutes)</label>
            <input
              type="number"
              id="lockoutDuration"
              name="lockoutDuration"
              value={securityData.lockoutDuration}
              onChange={handleSecurityChange}
              className="input-field"
              min="5"
              max="60"
              required
            />
            <p className="text-xs text-white/50 mt-1">Time account remains locked after max attempts (5-60 minutes)</p>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="pt-4 border-t border-primary/20">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="twoFactorEnabled"
              name="twoFactorEnabled"
              checked={securityData.twoFactorEnabled}
              onChange={handleSecurityChange}
              className="w-4 h-4 mr-2 accent-primary"
            />
            <label htmlFor="twoFactorEnabled" className="text-white/90 font-medium flex items-center">
              <FaShieldAlt className="mr-2" />
              Enable Two-Factor Authentication
            </label>
          </div>
          <p className="text-xs text-white/50 mt-1 ml-6">
            When enabled, users will be required to set up 2FA for their accounts.
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
} 