export const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL || 'http://localhost:3000';
export const ALLOWED_CATEGORIES = ['news', 'updates', 'guides', 'events', 'other'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;
// Add other shared constants here as needed 