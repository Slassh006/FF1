import { FaSave, FaLock } from 'react-icons/fa';
import { ProfileData, ProfileSettingsProps } from '../types';
import AvatarUpload from '@/app/components/AvatarUpload';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';

export default function ProfileSettings({
  profileData,
  setProfileData,
  profileSuccess,
  setProfileSuccess,
  isSubmitting,
  setIsSubmitting
}: ProfileSettingsProps) {
  const { update } = useSession();

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfileData({
      ...profileData,
      avatar: newAvatarUrl
    });
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Profile updated successfully');
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
        
        // Update session with new profile data
        await update({
          ...profileData,
          user: {
            ...profileData,
            name: profileData.name,
            avatar: profileData.avatar,
          },
        });
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Could not update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/settings/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password updated successfully');
        form.reset();
      } else {
        throw new Error(data.error || 'Failed to update password');
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Could not update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="section-title">Profile Settings</h2>
      
      {profileSuccess && (
        <div className="bg-green-500/20 border border-green-500 text-white px-4 py-3 rounded-lg mb-6">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="col-span-full flex justify-center mb-4">
          <AvatarUpload
            currentAvatar={profileData.avatar}
            onAvatarUpdate={handleAvatarUpdate}
            userName={profileData.name || 'Admin'}
            avatarLastUpdatedAt={profileData.avatarLastUpdatedAt}
          />
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={profileData.name}
            onChange={handleProfileChange}
            className="input-field"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={profileData.email}
            onChange={handleProfileChange}
            className="input-field"
            required
          />
        </div>

        {/* Referral Code */}
        <div>
          <label htmlFor="referralCode" className="label">Referral Code</label>
          <input
            type="text"
            id="referralCode"
            name="referralCode"
            value={profileData.referralCode}
            onChange={handleProfileChange}
            className="input-field"
          />
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            <FaSave className="mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <div className="mt-8 pt-8 border-t border-primary/20">
        <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
        <form onSubmit={handlePasswordSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full md:col-span-1">
              <label htmlFor="currentPassword" className="block mb-2 text-white/90">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                required
                className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="col-span-full md:col-span-1">
              <label htmlFor="newPassword" className="block mb-2 text-white/90">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                required
                className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="col-span-full md:col-span-1">
              <label htmlFor="confirmPassword" className="block mb-2 text-white/90">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                required
                className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-primary hover:bg-primary/80 text-dark font-medium flex items-center disabled:opacity-70"
            >
              <FaLock className="mr-2" />
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 