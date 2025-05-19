import React, { useState } from 'react';
import { FaSave, FaGlobe } from 'react-icons/fa';
import { GeneralData, GeneralSettingsProps } from '../types';

export default function GeneralSettings({
  generalData,
  setGeneralData,
  onSuccess
}: GeneralSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ensure maintenance data exists with default values
  const maintenance = generalData?.maintenance || { enabled: false, message: '' };

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setGeneralData({
        ...generalData,
        maintenance: {
          ...maintenance,
          enabled: checked
        }
      });
    } else if (name === 'maintenanceMessage') {
      setGeneralData({
        ...generalData,
        maintenance: {
          ...maintenance,
          message: value
        }
      });
    } else {
      setGeneralData({
        ...generalData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...generalData,
          maintenance
        }),
      });

      if (response.ok) {
        onSuccess('General settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving general settings:', error);
      onSuccess('Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">General Settings</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-white/50">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            maintenance.enabled
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-green-500/20 text-green-400'
          }`}>
            {maintenance.enabled ? 'Maintenance Mode' : 'Active'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Name */}
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-white mb-2">
              Site Name
            </label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={generalData?.siteName || ''}
              onChange={handleGeneralChange}
              className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            />
            <p className="text-xs text-white/50 mt-1">The name of your website</p>
          </div>

          {/* Site URL */}
          <div>
            <label htmlFor="siteUrl" className="block text-sm font-medium text-white mb-2">
              Site URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaGlobe className="text-white/50" />
              </div>
              <input
                type="url"
                id="siteUrl"
                name="siteUrl"
                value={generalData?.siteUrl || ''}
                onChange={handleGeneralChange}
                className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 pl-10"
                required
              />
            </div>
            <p className="text-xs text-white/50 mt-1">Your website's full URL (e.g., https://example.com)</p>
          </div>

          {/* Site Description */}
          <div className="md:col-span-2">
            <label htmlFor="siteDescription" className="block text-sm font-medium text-white mb-2">
              Site Description
            </label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              rows={3}
              value={generalData?.siteDescription || ''}
              onChange={handleGeneralChange}
              className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <p className="text-xs text-white/50 mt-1">A brief description of your website</p>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="border-t border-primary/10 pt-6">
          <h3 className="text-lg font-medium text-white mb-4">Maintenance Mode</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="maintenanceEnabled"
                checked={maintenance.enabled}
                onChange={handleGeneralChange}
                className="h-4 w-4 text-primary focus:ring-primary border-primary/20 rounded bg-secondary"
              />
              <label htmlFor="maintenanceEnabled" className="ml-2 block text-sm text-white">
                Enable Maintenance Mode
              </label>
            </div>

            <div>
              <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-white mb-2">
                Maintenance Message
              </label>
              <textarea
                id="maintenanceMessage"
                name="maintenanceMessage"
                value={maintenance.message}
                onChange={handleGeneralChange}
                rows={3}
                className="w-full px-4 py-2 bg-secondary border border-primary/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Enter maintenance mode message..."
              />
            </div>
          </div>
          <p className="text-xs text-white/50 mt-1 ml-6">
            When enabled, only administrators can access the site
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
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