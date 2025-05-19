// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation (Relaxed: Minimum 8 characters)
export function validatePassword(password: string): boolean {
  // Only check for minimum length
  return typeof password === 'string' && password.length >= 8;
}

// Name validation (Relaxed: Allow letters, numbers, spaces, hyphens, underscores, min 2 chars)
export function validateName(name: string): boolean {
  // Allow letters, numbers, spaces, hyphens, underscores. Min 2 chars.
  const nameRegex = /^[a-zA-Z0-9_\s-]{2,}$/;
  return typeof name === 'string' && nameRegex.test(name);
}

// Token validation (for reset password)
export function validateToken(token: string): boolean {
  // Token should be at least 32 characters
  return token.length >= 32;
}

// Rate limiting check
export function isRateLimited(
  attempts: number,
  maxAttempts: number,
  windowMs: number,
  lastAttempt: number
): boolean {
  if (attempts >= maxAttempts) {
    const timeSinceLastAttempt = Date.now() - lastAttempt;
    return timeSinceLastAttempt < windowMs;
  }
  return false;
}

// Username validation
export function validateUsername(username: string): boolean {
  // 3-20 characters, alphanumeric and underscore only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// Phone number validation (Indian format)
export function validatePhone(phone: string): boolean {
  // 10 digits, optionally starting with +91
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}

// URL validation
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Amount validation (for coins/currency)
export function validateAmount(amount: number): boolean {
  return amount > 0 && Number.isInteger(amount);
}

// Date validation
export function validateDate(date: string | Date): boolean {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

// File size validation (in bytes)
export function validateFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

// File type validation
export function validateFileType(type: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(type.toLowerCase());
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
} 