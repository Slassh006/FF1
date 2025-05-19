export function getTurnstileSettings() {
  // Return a default config or fetch from env/settings if needed
  return {
    siteKey: process.env.TURNSTILE_SITE_KEY || '',
    enabled: false
  };
} 