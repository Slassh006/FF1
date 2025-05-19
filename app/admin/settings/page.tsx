'use client';

import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import ProfileSettings from '@/app/admin/settings/components/ProfileSettings';
import GeneralSettings from '@/app/admin/settings/components/GeneralSettings';
import EmailSettings from '@/app/admin/settings/components/EmailSettings';
import TurnstileSettings from '@/app/admin/settings/components/TurnstileSettings';
import SecuritySettings from '@/app/admin/settings/components/SecuritySettings';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  ProfileData,
  GeneralData,
  EmailConfig,
  TurnstileConfig,
  SecurityData
} from './types';
import { useRouter } from 'next/navigation';
import AdminLayout from '../layout';

// Add loading component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-fire flex items-center justify-center">
    <div className="text-white text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
      <p>Loading settings...</p>
    </div>
  </div>
);

export default function AdminSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [generalData, setGeneralData] = useState<GeneralData>({
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    maintenance: {
      enabled: false,
      message: ''
    }
  });
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: ''
  });
  const [securityData, setSecurityData] = useState<SecurityData>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordExpiry: 90
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch general settings
        const generalResponse = await fetch('/api/admin/settings/general');
        if (generalResponse.ok) {
          const generalData = await generalResponse.json();
          setGeneralData(generalData);
        }

        // Fetch email settings
        const emailResponse = await fetch('/api/admin/settings/email');
        if (emailResponse.ok) {
          const emailData = await emailResponse.json();
          setEmailConfig(emailData);
        }

        // Fetch security settings
        const securityResponse = await fetch('/api/admin/settings/security');
        if (securityResponse.ok) {
          const securityData = await securityResponse.json();
          setSecurityData(securityData);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Admin Settings</h1>

        {successMessage && (
          <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{successMessage}</span>
          </div>
        )}

        <div className="bg-secondary rounded-lg shadow border border-primary/10">
          <div className="border-b border-primary/10">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-6 text-sm font-medium transition-colors duration-200 focus:outline-none ${
                  activeTab === 'general'
                    ? 'border-b-2 border-primary text-primary bg-dark'
                    : 'text-gray-300 hover:text-primary hover:bg-primary/10'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`py-4 px-6 text-sm font-medium transition-colors duration-200 focus:outline-none ${
                  activeTab === 'email'
                    ? 'border-b-2 border-primary text-primary bg-dark'
                    : 'text-gray-300 hover:text-primary hover:bg-primary/10'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-6 text-sm font-medium transition-colors duration-200 focus:outline-none ${
                  activeTab === 'security'
                    ? 'border-b-2 border-primary text-primary bg-dark'
                    : 'text-gray-300 hover:text-primary hover:bg-primary/10'
                }`}
              >
                Security
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <GeneralSettings
                generalData={generalData}
                setGeneralData={setGeneralData}
                onSuccess={handleSuccess}
              />
            )}
            {activeTab === 'email' && (
              <EmailSettings
                emailConfig={emailConfig}
                setEmailConfig={setEmailConfig}
                onSuccess={handleSuccess}
              />
            )}
            {activeTab === 'security' && (
              <SecuritySettings
                securityData={securityData}
                setSecurityData={setSecurityData}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 