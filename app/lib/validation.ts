import { z } from 'zod';

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): boolean => {
  // At least 6 characters, 1 number
  const passwordRegex = /^(?=.*\d).{6,}$/;
  return passwordRegex.test(password);
};

// Username validation
export const validateUsername = (username: string): boolean => {
  // 3-20 characters, letters, numbers, underscores, hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Slug validation
export const validateSlug = (slug: string): boolean => {
  // Lowercase letters, numbers, hyphens
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
};

// Phone number validation (basic)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

// Date validation
export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

// File size validation (in bytes)
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// File type validation
export const validateFileType = (type: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(type.toLowerCase());
};

// Object ID validation (MongoDB)
export const validateObjectId = (id: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// Price validation
export const validatePrice = (price: number): boolean => {
  return price >= 0 && Number.isFinite(price);
};

// Quantity validation
export const validateQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity > 0;
};

// Text length validation
export const validateLength = (text: string, min: number, max: number): boolean => {
  return text.length >= min && text.length <= max;
};

// Required fields validation
export const validateRequired = (fields: Record<string, any>): boolean => {
  return Object.values(fields).every(value => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  });
};

// User validation schemas
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin']).default('user'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Craftland code validation schemas
export const craftlandCodeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  code: z.string().min(1, 'Code is required'),
  region: z.enum(['NA', 'EU', 'ASIA']),
  coverImage: z.any().optional(),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').optional(),
});

// Type exports
export type UserInput = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CraftlandCodeInput = z.infer<typeof craftlandCodeSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>; 