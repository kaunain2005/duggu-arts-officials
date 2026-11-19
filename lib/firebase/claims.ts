import 'server-only';
import { getAdminAuth } from './admin';
import { getAdminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export type UserRole = 'customer' | 'manager' | 'admin';

export interface CustomClaims {
  role: UserRole;
  permissions: string[];
  assignedAt: number;
  assignedBy: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: [
    'orders:read:own',
    'orders:create',
    'cart:read',
    'cart:write',
    'wishlist:read',
    'wishlist:write',
    'reviews:create',
    'custom-requests:create',
    'profile:read',
    'profile:write',
    'addresses:read',
    'addresses:write',
  ],
  manager: [
    ...([
      'orders:read:own',
      'orders:create',
      'cart:read',
      'cart:write',
      'wishlist:read',
      'wishlist:write',
      'reviews:create',
      'custom-requests:create',
      'profile:read',
      'profile:write',
      'addresses:read',
      'addresses:write',
    ] as const),
    'products:read',
    'products:write',
    'categories:read',
    'categories:write',
    'orders:read:all',
    'orders:write:status',
    'inventory:read',
    'inventory:write',
    'reviews:moderate',
    'custom-requests:read:all',
    'custom-requests:write',
    'settings:read',
  ],
  admin: [
    ...([
      'orders:read:own',
      'orders:create',
      'cart:read',
      'cart:write',
      'wishlist:read',
      'wishlist:write',
      'reviews:create',
      'custom-requests:create',
      'profile:read',
      'profile:write',
      'addresses:read',
      'addresses:write',
      'products:read',
      'products:write',
      'categories:read',
      'categories:write',
      'orders:read:all',
      'orders:write:status',
      'inventory:read',
      'inventory:write',
      'reviews:moderate',
      'custom-requests:read:all',
      'custom-requests:write',
      'settings:read',
    ] as const),
    'users:read:all',
    'users:write:roles',
    'settings:write',
    'analytics:read',
    'webhooks:manage',
  ],
};

export async function setUserRole(uid: string, role: UserRole, assignedBy: string): Promise<void> {
  const claims: CustomClaims = {
    role,
    permissions: ROLE_PERMISSIONS[role],
    assignedAt: Date.now(),
    assignedBy,
  };

  await getAdminAuth().setCustomUserClaims(uid, claims);

  await getAdminDb().collection('users').doc(uid).set(
    {
      'profile.role': role,
      'profile.permissions': claims.permissions,
      'profile.updatedAt': FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const userRecord = await getAdminAuth().getUser(uid);
    return (userRecord.customClaims?.role as UserRole) || 'customer';
  } catch {
    return null;
  }
}

export async function initializeFirstAdmin(adminEmail: string): Promise<string> {
  let userRecord;
  try {
    userRecord = await getAdminAuth().getUserByEmail(adminEmail);
  } catch {
    userRecord = await getAdminAuth().createUser({
      email: adminEmail,
      emailVerified: true,
    });
  }

  await setUserRole(userRecord.uid, 'admin', 'system:initialization');

  await getAdminDb()
    .collection('users')
    .doc(userRecord.uid)
    .set(
      {
        profile: {
          uid: userRecord.uid,
          email: adminEmail,
          displayName: 'Administrator',
          emailVerified: true,
          providers: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          isAdmin: true,
          isActive: true,
          role: 'admin',
          permissions: ROLE_PERMISSIONS.admin,
        },
      },
      { merge: true }
    );

  return userRecord.uid;
}

export async function revokeUserSessions(uid: string): Promise<void> {
  await getAdminAuth().revokeRefreshTokens(uid);
}
