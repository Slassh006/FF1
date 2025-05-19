'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { FaSave, FaUser, FaEnvelope, FaLink, FaLock, FaBell, FaEye, FaPaintBrush, FaFont, FaGift, FaCheck, FaChevronDown } from 'react-icons/fa';
import AvatarUpload from '@/app/components/AvatarUpload';
import { useTheme } from 'next-themes';
import { Listbox, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  avatarLastUpdatedAt?: string | Date | null;
  referredBy?: string | null;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  preferences: {
    language: SelectOption | null;
    timezone: SelectOption | null;
  };
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
    push: boolean;
  };
  appearance: {
    theme: 'dark' | 'light';
    fontSize: 'small' | 'medium' | 'large';
  };
}

interface ExtendedSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "subscriber";
    isAdmin: boolean;
    permissions: string[];
    avatar?: string;
  }
}

interface SelectOption {
  value: string;
  label: string;
}

const languageOptions: SelectOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
];

const timezoneOptions: SelectOption[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
];

const findOption = (options: SelectOption[], value: string | undefined | null): SelectOption | null => {
  if (value === null || value === undefined) return null;
  return options.find(opt => opt.value === value) || null;
};

const defaultLanguage = findOption(languageOptions, 'en');
const defaultTimezone = findOption(timezoneOptions, 'UTC');

export default function ProfileSettings() {
  const { data: session, status, update } = useSession() as {
    data: (ExtendedSession & { user: { emailVerified?: boolean } }) | null;
    status: "loading" | "authenticated" | "unauthenticated";
    update: any;
  };
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    avatar: session?.user?.avatar,
    avatarLastUpdatedAt: null,
    referredBy: null,
    socialLinks: { facebook: '', twitter: '', instagram: '', youtube: '' },
    preferences: { 
      language: defaultLanguage,
      timezone: defaultTimezone,
    },
    notificationPreferences: { email: true, inApp: true, push: false },
    appearance: { theme: 'dark', fontSize: 'medium' }
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [isApplyingReferral, setIsApplyingReferral] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const listboxButtonClass = "w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary relative text-left sm:text-sm";
  const listboxOptionsClass = "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-dark border border-primary/50 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm";

  useEffect(() => {
    const fetchProfileData = async () => {
      if (session?.user) {
        setIsLoadingData(true);
        setProfileError(null);
        try {
          const response = await fetch('/api/profile/settings-data');
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to load profile settings');
          }
          const data: UserProfile & { preferences: { language: string; timezone: string } } = await response.json();
          setProfile({
              name: data.name || '',
              email: data.email || '',
              avatar: data.avatar,
              avatarLastUpdatedAt: data.avatarLastUpdatedAt || null,
              referredBy: data.referredBy || null,
              socialLinks: data.socialLinks || { facebook: '', twitter: '', instagram: '', youtube: '' },
              preferences: { 
                  language: findOption(languageOptions, data.preferences?.language) || defaultLanguage,
                  timezone: findOption(timezoneOptions, data.preferences?.timezone) || defaultTimezone 
              },
              notificationPreferences: data.notificationPreferences || { email: true, inApp: true, push: false },
              appearance: data.appearance || { theme: 'dark', fontSize: 'medium' }
          });
        } catch (error: any) {
          const message = error.message || 'Failed to load profile settings';
          toast.error('Could not load your settings. Please try again.');
          setProfileError(message);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    if (status === 'authenticated') {
        fetchProfileData();
    } else if (status === 'unauthenticated') {
        setIsLoadingData(false); 
        setProfileError('Please log in to view settings.');
    }

  }, [session, status]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev!, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setProfile(prev => ({
      ...prev!,
      notificationPreferences: { ...prev!.notificationPreferences, [name]: checked }
    }));
  };

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev!,
      socialLinks: { ...prev!.socialLinks, [name]: value }
    }));
  };

  const handlePreferenceChange = (field: 'language' | 'timezone', selectedOption: SelectOption | null) => {
    setProfile(prev => ({
      ...prev!,
      preferences: { ...prev!.preferences, [field]: selectedOption }
    }));
  };

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfile(prevProfile => ({
        ...prevProfile!,
        avatar: newAvatarUrl,
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
          ...profile,
          preferences: {
              language: profile.preferences.language?.value || 'en',
              timezone: profile.preferences.timezone?.value || 'UTC',
          },
      };
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Profile updated successfully');
        await update({
          ...session,
          user: {
            ...session?.user,
            name: profile.name,
            avatar: profile.avatar,
          },
        });
        // Refetch profile overview data for consistency
        if (typeof window !== 'undefined') {
          fetch('/api/profile/overview', { cache: 'reload' });
        }
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error: any) {
      toast.error('Could not save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/profile/change-password', {
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

      if (data.success) {
        toast.success('Password changed successfully');
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error: any) {
      toast.error('Could not update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppearanceChange = (setting: string, value: string) => {
    const lowerCaseValue = value.toLowerCase();
    setProfile(prev => ({
      ...prev!,
      appearance: { ...prev!.appearance, [setting === 'Theme' ? 'theme' : 'fontSize']: lowerCaseValue as any }
    }));
    if (setting === 'Theme') {
      setTheme(lowerCaseValue);
    }
    toast.success(`${setting} changed to ${value}`);
  };

  const handleNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/profile/update-notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile.notificationPreferences),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Notification preferences updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update notification preferences');
      }
    } catch (error: any) {
      toast.error('Could not save notification settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppearanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/profile/update-appearance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile.appearance),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Appearance settings saved successfully');
      } else {
        throw new Error(data.error || 'Failed to save appearance settings');
      }
    } catch (error: any) {
      toast.error('Could not save appearance settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralCodeInput.trim()) {
        toast.error('Enter a referral code.');
        return;
    }
    setIsApplyingReferral(true);
    try {
        const response = await fetch('/api/profile/apply-referral', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referralCode: referralCodeInput.trim() }),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to apply referral code');
        }

        toast.success(data.message || 'Referral code applied successfully!');
        setProfile(prev => ({ ...prev!, referredBy: 'applied' }));
        setReferralCodeInput('');

    } catch (error: any) {
        toast.error('Could not apply referral code. Please try again.');
    } finally {
        setIsApplyingReferral(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
        const response = await fetch('/api/resend-verification', {
            method: 'POST'
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to resend verification email.');
        }
        toast.success(data.message || 'Verification email sent!');
    } catch (error: any) {
        toast.error('Could not send verification email. Please try again.');
    } finally {
        setIsResending(false);
    }
  };

  if (isLoadingData || status === 'loading') {
      return (
          <div className="p-6 flex justify-center items-center min-h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
      );
  }

  if (profileError) {
      return (
          <div className="p-6 text-center text-red-500">
              Error: {profileError}
          </div>
      );
  }

  return (
    <div className="p-6">
      {status === 'authenticated' && !session?.user?.emailVerified && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
                <p className="font-medium">Your email address is not verified.</p>
                <p className="text-sm">Please check your email for the verification link. Some features may be limited until verified.</p>
            </div>
            <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="px-4 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-medium disabled:opacity-70 flex-shrink-0"
            >
                {isResending ? 'Sending...' : 'Resend Email'}
            </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 bg-secondary rounded-lg border border-primary/20 overflow-hidden">
          <nav className="p-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                activeTab === 'profile' ? 'bg-primary text-dark' : 'text-white hover:bg-dark/50'
              }`}
            >
              <FaUser className="mr-3" /> Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                activeTab === 'security' ? 'bg-primary text-dark' : 'text-white hover:bg-dark/50'
              }`}
            >
              <FaLock className="mr-3" /> Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                activeTab === 'notifications' ? 'bg-primary text-dark' : 'text-white hover:bg-dark/50'
              }`}
            >
              <FaBell className="mr-3" /> Notifications
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center ${
                activeTab === 'appearance' ? 'bg-primary text-dark' : 'text-white hover:bg-dark/50'
              }`}
            >
              <FaPaintBrush className="mr-3" /> Appearance
            </button>
          </nav>
        </div>

        <div className="flex-grow bg-secondary rounded-lg border border-primary/20 p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold text-primary mb-6">Profile Settings</h2>
              <form onSubmit={handleProfileSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full flex justify-center mb-4">
                    <AvatarUpload
                      currentAvatar={profile.avatar}
                      onAvatarUpdate={handleAvatarUpdate}
                      userName={profile.name || session?.user?.name || 'User'}
                      avatarLastUpdatedAt={profile.avatarLastUpdatedAt}
                    />
                  </div>

                  <div className="col-span-full md:col-span-1">
                    <label htmlFor="name" className="block mb-2 text-white/90">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profile.name}
                      onChange={handleProfileChange}
                      className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="col-span-full md:col-span-1">
                    <label htmlFor="email" className="block mb-2 text-white/90">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled
                    />
                  </div>

                  <div className="col-span-full">
                    <h3 className="text-lg font-semibold text-white mb-4">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="facebook" className="block mb-2 text-white/90">
                          Facebook
                        </label>
                        <input
                          type="url"
                          id="facebook"
                          name="facebook"
                          value={profile.socialLinks.facebook || ''}
                          onChange={handleSocialLinkChange}
                          placeholder="https://facebook.com/yourprofile"
                          className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="twitter" className="block mb-2 text-white/90">
                          Twitter
                        </label>
                        <input
                          type="url"
                          id="twitter"
                          name="twitter"
                          value={profile.socialLinks.twitter || ''}
                          onChange={handleSocialLinkChange}
                          placeholder="https://twitter.com/yourprofile"
                          className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="instagram" className="block mb-2 text-white/90">
                          Instagram
                        </label>
                        <input
                          type="url"
                          id="instagram"
                          name="instagram"
                          value={profile.socialLinks.instagram || ''}
                          onChange={handleSocialLinkChange}
                          placeholder="https://instagram.com/yourprofile"
                          className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label htmlFor="youtube" className="block mb-2 text-white/90">
                          YouTube
                        </label>
                        <input
                          type="url"
                          id="youtube"
                          name="youtube"
                          value={profile.socialLinks.youtube || ''}
                          onChange={handleSocialLinkChange}
                          placeholder="https://youtube.com/yourchannel"
                          className="w-full bg-dark text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-full">
                    <h3 className="text-lg font-semibold text-white mb-4">Language & Timezone</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="language" className="block mb-2 text-white/90">
                          Language
                        </label>
                        <Listbox value={profile.preferences.language} onChange={(val) => handlePreferenceChange('language', val)}>
                          <div className="relative">
                            <Listbox.Button className={listboxButtonClass}>
                              <span className="block truncate">{profile.preferences.language?.label || 'Select Language'}</span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                              </span>
                            </Listbox.Button>
                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                              <Listbox.Options className={listboxOptionsClass}>
                                {languageOptions.map((option) => (
                                  <Listbox.Option
                                    key={option.value}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-primary/20 text-primary' : 'text-white'
                                      }`
                                    }
                                    value={option}
                                  >
                                     {({ selected }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                                        {selected ? (
                                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                            <FaCheck className="h-5 w-5" aria-hidden="true" />
                                          </span>
                                        ) : null}
                                      </>
                                    )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>
                      <div>
                        <label htmlFor="timezone" className="block mb-2 text-white/90">
                          Timezone
                        </label>
                         <Listbox value={profile.preferences.timezone} onChange={(val) => handlePreferenceChange('timezone', val)}>
                           <div className="relative">
                            <Listbox.Button className={listboxButtonClass}>
                              <span className="block truncate">{profile.preferences.timezone?.label || 'Select Timezone'}</span>
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <FaChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                              </span>
                            </Listbox.Button>
                            <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                              <Listbox.Options className={listboxOptionsClass}>
                                {timezoneOptions.map((option) => (
                                  <Listbox.Option
                                    key={option.value}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-primary/20 text-primary' : 'text-white'
                                      }`
                                    }
                                    value={option}
                                  >
                                      {({ selected }) => (
                                        <>
                                          <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>{option.label}</span>
                                          {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                              <FaCheck className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                  </Listbox.Option>
                                ))}
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-6 py-2 flex items-center"
                  >
                    <FaSave className="mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>

              {!profile.referredBy && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-medium text-white mb-4">Apply Referral Code</h3>
                  <p className="text-sm text-white/70 mb-3">Were you referred by someone? Enter their code below to get bonus coins!</p>
                  <form onSubmit={handleApplyReferral} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <FaGift className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="referralCodeInput"
                        value={referralCodeInput}
                        onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                        placeholder="Enter Referral Code"
                        className="w-full bg-dark text-white pl-10 pr-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        disabled={isApplyingReferral}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isApplyingReferral}
                      className="btn-primary px-5 py-2 flex items-center justify-center flex-shrink-0"
                    >
                      {isApplyingReferral ? 'Applying...' : 'Apply Code'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
              <form onSubmit={handlePasswordChange}>
                <div className="space-y-4">
                  <div>
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

                  <div>
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

                  <div>
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
                    className="btn-primary px-6 py-2 flex items-center"
                  >
                    <FaSave className="mr-2" />
                    {isSubmitting ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Notification Settings</h2>
              <form onSubmit={handleNotificationSubmit}>
                <div className="space-y-6">
                  <div className="bg-dark rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">Email Notifications</h3>
                        <p className="text-white/70 text-sm">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="email"
                          checked={profile.notificationPreferences.email}
                          onChange={handleNotificationChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-dark peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-dark rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">In-App Notifications</h3>
                        <p className="text-white/70 text-sm">Receive notifications within the app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="inApp"
                          checked={profile.notificationPreferences.inApp}
                          onChange={handleNotificationChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-dark peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>

                  <div className="bg-dark rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">Push Notifications</h3>
                        <p className="text-white/70 text-sm">Receive push notifications on your device</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="push"
                          checked={profile.notificationPreferences.push}
                          onChange={handleNotificationChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-dark peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-6 py-2 flex items-center"
                  >
                    <FaSave className="mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Appearance Settings</h2>
              <form onSubmit={handleAppearanceSubmit}>
                <div className="space-y-6">
                  <div className="bg-dark rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Theme</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => handleAppearanceChange('Theme', 'Dark')}
                        className={`p-4 rounded-lg border-2 ${
                          profile.appearance.theme === 'dark' 
                            ? 'bg-dark border-primary text-white' 
                            : 'bg-white border-gray-200 text-dark'
                        }`}
                      >
                        Dark Theme
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleAppearanceChange('Theme', 'Light')}
                        className={`p-4 rounded-lg border-2 ${
                          profile.appearance.theme === 'light' 
                            ? 'bg-white border-primary text-dark' 
                            : 'bg-dark border-gray-200 text-white'
                        }`}
                      >
                        Light Theme
                      </button>
                    </div>
                  </div>

                  <div className="bg-dark rounded-lg p-4">
                    <h3 className="text-white font-medium mb-4">Font Size</h3>
                    <div className="flex items-center space-x-4">
                      <button 
                        type="button"
                        onClick={() => handleAppearanceChange('Font Size', 'Small')}
                        className={`px-4 py-2 rounded-lg ${
                          profile.appearance.fontSize === 'small' 
                            ? 'bg-primary text-dark' 
                            : 'bg-dark text-white'
                        }`}
                      >
                        Small
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleAppearanceChange('Font Size', 'Medium')}
                        className={`px-4 py-2 rounded-lg ${
                          profile.appearance.fontSize === 'medium' 
                            ? 'bg-primary text-dark' 
                            : 'bg-dark text-white'
                        }`}
                      >
                        Medium
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleAppearanceChange('Font Size', 'Large')}
                        className={`px-4 py-2 rounded-lg ${
                          profile.appearance.fontSize === 'large' 
                            ? 'bg-primary text-dark' 
                            : 'bg-dark text-white'
                        }`}
                      >
                        Large
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-6 py-2 flex items-center"
                  >
                    <FaSave className="mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}