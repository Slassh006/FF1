import { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { User as UserModel } from '@/app/models/User';
import dbConnect from '@/app/lib/dbConnect';
import type { User as NextAuthUser, Session } from 'next-auth';
import mongoose from 'mongoose';
import crypto from 'crypto'; // Import crypto for random bytes
import type { Account, Profile } from 'next-auth'; // Import Account and Profile

// Define the AuthUser type that matches NextAuth's requirements
type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'subscriber';
  isAdmin: boolean;
  permissions: string[];
  coins: number;
  avatar?: string;
  preferences?: {
    theme?: string;
  };
  referralCode?: string;
};

// Extend the built-in types
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'subscriber';
    isAdmin: boolean;
    permissions: string[];
    coins: number;
    avatar?: string;
    referralCode?: string;
    emailVerified?: boolean;
  }
  
  interface Session {
    user: User & {
      id: string;
      role: 'admin' | 'subscriber';
      isAdmin: boolean;
      permissions: string[];
      coins: number;
      avatar?: string;
      referralCode?: string;
      emailVerified?: boolean;
    };
  }
}

// Extend the built-in JWT types
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'subscriber';
    isAdmin: boolean;
    permissions: string[];
    coins: number;
    avatar?: string;
    referralCode?: string;
    emailVerified?: boolean;
  }
}

// Generate a unique referral code
const generateReferralCode = (name: string): string => {
    // Simple example: First 3 letters of name (uppercase) + 4 random hex characters
    const namePart = name.substring(0, 3).toUpperCase();
    const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 hex chars
    return `${namePart}${randomPart}`;
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<NextAuthUser | null> {
        console.log(`--- Authorize attempt for: ${credentials?.email} ---`); // Log entry
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Authorize: Missing email or password');
            throw new Error('Please provide both email and password');
          }

          console.log('Authorize: Connecting to DB...');
          await dbConnect();
          console.log('Authorize: DB Connected. Searching for user...');

          const user = await UserModel.findOne({ 
            email: credentials.email.toLowerCase()
          }).select('+password');

          console.log(`Authorize: User found in DB: ${user ? user.email : 'NULL'}`); // Log find result

          if (!user) {
            console.error('Authorize: User not found in DB, returning null.'); // Log explicit failure
            return null;
          }

          console.log(`Authorize: User ${user.email} found. Checking status...`);
          if (user.isBlocked) {
            console.log(`Authorize: User ${user.email} is blocked.`);
            throw new Error('Your account has been blocked. Please contact support.');
          }

          if (!user.isActive) {
            console.log(`Authorize: User ${user.email} is inactive.`);
            throw new Error('Your account is not active. Please verify your email.');
          }

          console.log(`Authorize: User ${user.email} is active and not blocked. Checking password...`);
          const isPasswordValid = await user.comparePassword(credentials.password);
          console.log(`Authorize: Password valid for ${user.email}: ${isPasswordValid}`); // Log password check result

          if (!isPasswordValid) {
            console.error(`Authorize: Invalid password for user ${user.email}, returning null.`); // Log explicit failure
            return null;
          }

          console.log(`Authorize: Password valid for ${user.email}. Updating last login...`);
          // Update last login and save
          user.lastLogin = new Date();
          if (!user.preferences) {
            user.preferences = {
              theme: 'system',
              language: 'en',
              timezone: 'UTC',
              notifications: {
                email: true,
                push: true,
                inApp: true
              }
            };
          }
          await user.save();

          // --- Generate referral code IF missing (for existing users logging in) ---
          if (!user.referralCode) {
            console.log(`User ${user.email} missing referral code. Generating...`);
            user.referralCode = generateReferralCode(user.name);
            try {
              await user.save(); // Save the newly generated code
              console.log(`Saved new referral code for ${user.email}`);
            } catch (saveError) {
              console.error(`Failed to save new referral code for ${user.email}:`, saveError);
              // Continue without referral code if save fails, maybe log this error
            }
          } else {
            console.log(`User ${user.email} already has referral code: ${user.referralCode}`);
          }

          console.log(`--- Authorize successful for: ${user.email}. Returning user object. ---`); // Log success
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            isAdmin: user.isAdmin,
            permissions: user.permissions || [],
            coins: user.coins || 0,
            avatar: user.avatar || undefined,
            referralCode: user.referralCode || '',
          } as NextAuthUser;
        } catch (error) {
          console.error(`--- Authorize error for ${credentials?.email}:`, error); // Log error
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile, trigger, session }) {
      await dbConnect();
      console.log(`JWT Callback Start: Trigger=${trigger}, Token ID=${token?.id}, User ID=${user?.id}, Account Provider=${account?.provider}`);

      // --- User Existence Check --- 
      if (token?.id && (!user || trigger === "update")) {
        try {
          console.log(`JWT Check: Verifying existence for user ID ${token.id}`);
          const dbUserExists = await UserModel.findById(token.id).select('_id').lean(); 
          if (!dbUserExists) {
            console.log(`JWT Check: User ID ${token.id} not found in DB. Invalidating token by throwing error.`);
            // Throw an error to invalidate the session
            throw new Error("User not found"); 
          }
          console.log(`JWT Check: User ID ${token.id} confirmed exists.`);
        } catch (dbError: any) {
          console.error(`JWT Check: Error verifying user existence for ID ${token.id}:`, dbError);
          // Also invalidate token on DB error during check for safety
          throw new Error(`Error verifying user existence: ${dbError.message}`); 
        }
      }
      // --- End User Existence Check ---

      if (trigger === "update") {
        console.log('JWT Callback Triggered: Update');
        // The existence check above already ran (or threw an error)
        const dbUser = await UserModel.findById(token.id);
        if (dbUser) {
          console.log(`Update: Found DB user ${dbUser.email}`);
          token.coins = dbUser.coins;
          token.name = dbUser.name;
          token.avatar = dbUser.avatar || undefined;
          token.referralCode = dbUser.referralCode;
          token.emailVerified = dbUser.emailVerified;
          console.log(`Update: Updated token with coins=${token.coins}, referralCode=${token.referralCode}, avatar=${token.avatar}, emailVerified=${token.emailVerified}`);
        } else {
          // This case should not be reached if the check above works
          console.error('JWT Update Error: User not found after existence check passed?');
          throw new Error("User inconsistency during update");
        }
      }
      else if (user) {
        console.log('JWT Callback Triggered: Initial Sign-in/linking');
        const dbUser = await UserModel.findById(user.id);
        if (!dbUser) {
          console.error('JWT Callback: User from provider exists, but not found in DB! ID:', user.id);
          throw new Error("User data mismatch"); // Invalidate if user somehow passed authorize but isn't in DB
        }
        console.log(`Initial Sign-in: Found DB user ${dbUser.email} with existing avatar: ${dbUser.avatar}, referralCode: ${dbUser.referralCode}`);

        let avatarToUse: string | undefined = dbUser.avatar || undefined;
        let shouldUpdateDb = false;

        // --- Referral Code Generation (if missing) --- 
        if (!dbUser.referralCode) {
            console.log(`JWT: User ${dbUser.email} missing referral code. Generating...`);
            dbUser.referralCode = generateReferralCode(dbUser.name);
            shouldUpdateDb = true;
        }

        // --- Save DB User if needed (Avatar or Referral Code changed) --- 
        if (shouldUpdateDb) {
            try {
                await dbUser.save();
                console.log(`JWT: Saved updated DB user data (avatar/referral) for ${dbUser.email}`);
            } catch (saveError) {
                console.error(`JWT: Failed to save updated user data for ${dbUser.email}:`, saveError);
            }
        }

        // --- Populate Token --- 
        token.id = dbUser._id.toString();
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.role = dbUser.role;
        token.isAdmin = dbUser.isAdmin;
        token.permissions = dbUser.permissions || [];
        token.coins = dbUser.coins || 0;
        token.avatar = avatarToUse;
        token.referralCode = dbUser.referralCode || '';
        token.emailVerified = dbUser.emailVerified;
      }
      // --- START: ADDED Refresh emailVerified Status ---
      // Always try to refresh the verification status from DB if token exists
      else if (token?.id) { // Changed from `if` to `else if` to avoid running after initial/update
        try {
          // Don't re-fetch if initial sign-in or update already did it
          // This condition is now handled by the `else if` structure
           console.log(`JWT Refresh: Fetching latest emailVerified status for user ID ${token.id}`);
           const currentDbUser = await UserModel.findById(token.id).select('emailVerified').lean();
           if (currentDbUser) {
             // Update the token ONLY if the DB status is different
             if (token.emailVerified !== currentDbUser.emailVerified) {
               console.log(`JWT Refresh: Updating emailVerified from ${token.emailVerified} to ${currentDbUser.emailVerified} for user ID ${token.id}`);
               token.emailVerified = currentDbUser.emailVerified;
             } else {
                // console.log(`JWT Refresh: emailVerified status (${token.emailVerified}) is already up-to-date for user ID ${token.id}`);
             }
           } else {
             // This case should ideally be caught by the existence check earlier
             console.warn(`JWT Refresh: User ID ${token.id} not found when refreshing status.`);
           }
        } catch (dbError: any) {
          console.error(`JWT Refresh: Error fetching emailVerified status for ID ${token.id}:`, dbError);
          // Decide: proceed with potentially stale token.emailVerified, or throw error?
          // Proceeding is often safer UX unless verification is critical for the current action.
        }
      }
      // --- END: ADDED Refresh emailVerified Status ---

      console.log('JWT Callback End: Returning token', token);
      return token; // Return the valid (potentially updated) token
    },
    async session({ session, token }) {
      console.log('Session Callback Start: Token received', token);
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        session.user.permissions = token.permissions;
        session.user.coins = token.coins;
        session.user.avatar = token.avatar || undefined;
        session.user.referralCode = token.referralCode;
        session.user.emailVerified = token.emailVerified;
        console.log('Session Callback End: Populated session.user', session.user);
      } else {
         console.log('Session Callback End: No token or session.user found.');
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}; 