import { FaSave } from 'react-icons/fa';
import { TurnstileConfig, TurnstileSettingsProps } from '../types';

export default function TurnstileSettings({
  turnstileData,
  setTurnstileData,
  turnstileSuccess,
  setTurnstileSuccess,
  isSubmitting,
  setIsSubmitting
}: TurnstileSettingsProps) {
  const handleTurnstileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setTurnstileData({
      ...turnstileData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleTurnstileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/settings/turnstile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(turnstileData),
      });

      if (response.ok) {
        setTurnstileSuccess(true);
        setTimeout(() => setTurnstileSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error updating Turnstile settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="section-title">Turnstile Settings</h2>
      
      {turnstileSuccess && (
        <div className="bg-green-500/20 border border-green-500 text-white px-4 py-3 rounded-lg mb-6">
          Turnstile settings saved!
        </div>
      )}

      <form onSubmit={handleTurnstileSubmit} className="space-y-6">
        {/* Site Key */}
        <div>
          <label htmlFor="siteKey" className="label">Site Key</label>
          <input
            type="text"
            id="siteKey"
            name="siteKey"
            value={turnstileData.siteKey}
            onChange={handleTurnstileChange}
            className="input-field"
            required
          />
        </div>

        {/* Secret Key */}
        <div>
          <label htmlFor="secretKey" className="label">Secret Key</label>
          <input
            type="password"
            id="secretKey"
            name="secretKey"
            value={turnstileData.secretKey}
            onChange={handleTurnstileChange}
            className="input-field"
            required
          />
        </div>

        {/* Enable Turnstile */}
        <div className="pt-4 border-t border-primary/20">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={turnstileData.enabled}
              onChange={handleTurnstileChange}
              className="w-4 h-4 mr-2 accent-primary"
            />
            <label htmlFor="enabled" className="text-white/90">
              Enable Turnstile Protection
            </label>
          </div>
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
    </div>
  );
} 