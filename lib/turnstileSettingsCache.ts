interface TurnstileSettings {
  siteKey: string | null;
  secretKey: string | null;
  enabled: boolean;
}

// Initialize the cache directly from environment variables.
// These env vars should be set correctly in .env (for dev) 
// and the production .env file on the server.
export const settingsCache: TurnstileSettings = {
  siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null,
  secretKey: process.env.TURNSTILE_SECRET_KEY || null,
  // Determine initial 'enabled' status based on the presence of BOTH keys?
  // Or rely on loadTurnstileSettings to update this after first save?
  // Let's assume initially disabled unless keys are present, but rely on DB for true state after load.
  // Safer to default to false and let loadTurnstileSettings set the correct state from DB later.
  enabled: false 
};

/**
 * Retrieves the current Turnstile settings from the cache.
 * Safe to call from both client and server components.
 */
export const getTurnstileSettings = (): TurnstileSettings => {
  // We might need to check env vars again here if loadTurnstileSettings doesn't run on initial load?
  // No, the cache should be the single source of truth after potential load.
  return settingsCache;
}; 