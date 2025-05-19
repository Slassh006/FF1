// import { authService } from './auth'; // Removed import
import { scheduleAnalyticsUpdate } from './cron';

export function initializeApp() {
  try {
    // Initialize admin user - REMOVED as authService was deleted
    // await authService.initAdminUser(); 
    console.log('App initialization checked (Admin init removed).');
  } catch (error) {
    console.error('App initialization failed:', error);
  }

  // Start analytics update cron job
  scheduleAnalyticsUpdate();
  console.log('Application initialized with scheduled tasks');
} 