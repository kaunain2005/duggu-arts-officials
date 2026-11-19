import 'server-only';
import { cookies } from 'next/headers';
import { getAdminAuth } from './admin';
import { getAdminDb } from './admin';
import { type UserRole, ROLE_PERMISSIONS } from './claims';

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  permissions: string[];
  emailVerified: boolean;
}

const COOKIE_NAME = process.env.FIREBASE_SESSION_COOKIE_NAME || 'session';

export async function verifySession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const customClaims = decoded.customClaims || {};

    return {
      uid: decoded.uid,
      email: decoded.email || '',
      role: (customClaims.role as UserRole) || 'customer',
      permissions: customClaims.permissions || ROLE_PERMISSIONS.customer,
      emailVerified: decoded.email_verified || false,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await verifySession();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== 'admin' && user.role !== 'manager') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function requirePermission(permission: string): Promise<AuthUser> {
  const user = await requireAuth();
  if (!user.permissions.includes(permission)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function requireOwnership(resourceUserId: string): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.uid !== resourceUserId && user.role === 'customer') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function getUserProfile(uid: string) {
  const db = getAdminDb();
  const doc = await db.collection('users').doc(uid).get();
  return doc.exists ? doc.data() : null;
}
