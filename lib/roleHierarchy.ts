export type Role = 'admin' | 'subscriber';

// Define role hierarchy
const roleHierarchy: Record<Role, Role[]> = {
  'admin': ['admin', 'subscriber'],
  'subscriber': ['subscriber']
};

// Define role permissions
const rolePermissions: Record<Role, string[]> = {
  'admin': [
    'create_post',
    'edit_post',
    'delete_post',
    'manage_users',
    'manage_content',
    'write:blogs',
    'write:wallpapers',
    'write:users',
    'write:orders',
    'manage:settings'
  ],
  'subscriber': [
    'create_post',
    'view_content',
    'access_premium'
  ]
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole]?.includes(requiredRole) || false;
}

export function hasPermission(userRole: Role, permission: string): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}

export function getAllPermissions(userRole: Role): string[] {
  return rolePermissions[userRole] || [];
}

export function getInheritedRoles(userRole: Role): Role[] {
  return roleHierarchy[userRole] || [];
} 