import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { hasRole, hasPermission } from './roleHierarchy';

type Role = 'user' | 'admin' | 'moderator';

interface GuardOptions {
  roles?: Role[];
  permissions?: string[];
}

export async function roleGuard(handler: Function, options: GuardOptions) {
  return async (request: Request) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const userRole = session.user.role as Role;

      // Check role-based access
      if (options.roles && options.roles.length > 0) {
        const hasRequiredRole = options.roles.some(role => hasRole(userRole, role));
        if (!hasRequiredRole) {
          return NextResponse.json(
            { error: 'Insufficient role' },
            { status: 403 }
          );
        }
      }

      // Check permission-based access
      if (options.permissions && options.permissions.length > 0) {
        const hasRequiredPermission = options.permissions.some(permission => 
          hasPermission(userRole, permission)
        );
        if (!hasRequiredPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        }
      }

      return handler(request);
    } catch (error) {
      console.error('Role guard error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Example usage in API routes:
/*
export const GET = roleGuard(async (request: Request) => {
  // Your API route logic here
  return NextResponse.json({ data: 'Protected data' });
}, { 
  roles: ['admin'],
  permissions: ['write:blogs']
});
*/ 