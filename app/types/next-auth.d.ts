import 'next-auth';
import { DefaultSession } from 'next-auth';

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
    } & DefaultSession['user']
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'subscriber';
    isAdmin: boolean;
    permissions: string[];
    coins: number;
  }
} 