import Setting from '@/models/Setting';
import dbConnect from '@/lib/dbConnect';
import fs from 'fs';
import path from 'path';
import { settingsCache } from './turnstileSettingsCache'; // Import the cache

/**
 * Loads Turnstile settings from the database into the shared cache.
 * Updates environment variables for the current process.
 * Conditionally updates the .env file (only in production).
 * SERVER-SIDE ONLY.
 */
export const loadTurnstileSettings = async () => {
  console.log('Attempting to load Turnstile settings...');
  try {
    await dbConnect();

    const dbSettings = await Setting.find({
      key: { $in: ['turnstileSiteKey', 'turnstileSecretKey', 'turnstileEnabled'] }
    }).lean(); // Use .lean() for plain objects

    const siteKeySetting = dbSettings.find(s => s.key === 'turnstileSiteKey');
    const secretKeySetting = dbSettings.find(s => s.key === 'turnstileSecretKey');
    const enabledSetting = dbSettings.find(s => s.key === 'turnstileEnabled');

    const siteKey = siteKeySetting?.value || null;
    const secretKey = secretKeySetting?.value || null;
    const enabled = enabledSetting?.value === 'true';

    // Update the shared cache
    settingsCache.siteKey = siteKey;
    settingsCache.secretKey = secretKey;
    settingsCache.enabled = enabled;

    // Update environment variables for the current process
    // --- Temporarily Commented Out for Debugging Syntax Error ---
    // process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = siteKey || '';
    // process.env.TURNSTILE_SECRET_KEY = secretKey || '';
    // -----------------------------------------------------------
    // No direct env var for enabled, use cache value

    if (enabled && siteKey && secretKey) {
      console.log('Turnstile settings loaded successfully: Enabled');
    } else {
      console.log('Turnstile settings loaded: Disabled or keys missing.');
    }

    // Update .env file only in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Production environment detected. Attempting to update .env file...');
      const envPath = path.resolve(process.cwd(), '.env');
      let envContent = '';

      try {
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        } else {
          console.warn('.env file not found for updating.');
        }

        const siteKeyRegex = /^NEXT_PUBLIC_TURNSTILE_SITE_KEY=.*$/m;
        const secretKeyRegex = /^TURNSTILE_SECRET_KEY=.*$/m;

        let updated = false;

        if (enabled && siteKey && secretKey) {
          // Update or add keys
          if (siteKeyRegex.test(envContent)) {
            envContent = envContent.replace(siteKeyRegex, `NEXT_PUBLIC_TURNSTILE_SITE_KEY=${siteKey}`);
          } else {
            envContent += `\nNEXT_PUBLIC_TURNSTILE_SITE_KEY=${siteKey}`;
          }
          if (secretKeyRegex.test(envContent)) {
            envContent = envContent.replace(secretKeyRegex, `TURNSTILE_SECRET_KEY=${secretKey}`);
          } else {
            envContent += `\nTURNSTILE_SECRET_KEY=${secretKey}`;
          }
          updated = true;
        } else {
          // Remove keys if they exist
          if (siteKeyRegex.test(envContent)) {
             envContent = envContent.replace(siteKeyRegex, '');
             updated = true;
          }
          if (secretKeyRegex.test(envContent)) {
             envContent = envContent.replace(secretKeyRegex, '');
             updated = true;
          }
        }
        
        // Clean up potential empty lines from removals
        envContent = envContent.split('\n').filter(line => line.trim() !== '').join('\n');

        if (updated) {
          fs.writeFileSync(envPath, envContent.trim() + '\n'); // Ensure a trailing newline
          console.log('.env file updated successfully.');
        } else {
          console.log('.env file did not require updates.');
        }

      } catch (err) {
        console.error('Error updating .env file:', err);
        // Continue even if .env update fails
      }
    }

  } catch (error) {
    console.error('Failed to load Turnstile settings:', error);
    // Set defaults in cache on error to prevent breaking client
    settingsCache.siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;
    settingsCache.secretKey = process.env.TURNSTILE_SECRET_KEY || null;
    settingsCache.enabled = false;
  }
}; 