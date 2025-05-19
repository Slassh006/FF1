import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import User, { IUser } from '../../../../models/User';
import NextAuth from 'next-auth';
import { authOptions } from './options';
import dbConnect from '@/app/lib/dbConnect';

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
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
  interface User extends IUser {
    id: string;
  }
}

// Extend the built-in JWT types
declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
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

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions }; 