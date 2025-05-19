import React, { useEffect, useRef } from 'react';
import { getTurnstileSettings } from '../../lib/turnstileSettingsCache';

interface TurnstileProps {
  onVerify: (token: string) => void;
  onError?: () => void;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, options: any) => void;
    };
  }
}

export default function Turnstile({ onVerify, onError }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settings = getTurnstileSettings();

  useEffect(() => {
    // If no site key is provided, skip Turnstile and auto-verify
    if (!settings.siteKey || !settings.enabled) {
      console.warn('Turnstile site key not found or disabled. Skipping verification.');
      onVerify('development-mode-token');
      return;
    }

    // Load Turnstile script
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=invisible';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (containerRef.current && window.turnstile) {
        window.turnstile.render(containerRef.current, {
          sitekey: settings.siteKey,
          callback: onVerify,
          'error-callback': onError,
          theme: 'dark',
          size: 'invisible',
        });
      }
    };

    return () => {
      // Cleanup script on component unmount
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, [onVerify, onError, settings.siteKey, settings.enabled]);

  // Don't render anything if no site key or disabled
  if (!settings.siteKey || !settings.enabled) {
    return null;
  }

  return <div ref={containerRef} />;
} 