import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

export const urlSchema = z
  .string()
  .url('Invalid URL');

export const dateSchema = z
  .string()
  .datetime('Invalid date');

export const numberSchema = z
  .number()
  .min(0, 'Number must be positive');

export const booleanSchema = z
  .boolean();

export const arraySchema = z
  .array(z.string());

export const objectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: emailSchema,
  }); 