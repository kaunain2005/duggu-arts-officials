"use server";

import { getAdminAuth } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import { serverTimestamp } from "@/lib/db/firestore";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { env } from "@/lib/constants/config";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Name is required"),
  phoneNumber: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  photoURL: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function registerUser(formData: FormData) {
  try {
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
      displayName: formData.get("displayName"),
      phoneNumber: formData.get("phoneNumber") || undefined,
    };

    const { email, password, displayName, phoneNumber } = registerSchema.parse(data);

    const adminAuth = getAdminAuth();

    // Check if user already exists
    try {
      await adminAuth.getUserByEmail(email as string);
      return { error: "An account with this email already exists" };
    } catch {
      // User doesn't exist, continue
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: email as string,
      password: password as string,
      displayName: displayName as string,
      phoneNumber: phoneNumber as string | undefined,
      emailVerified: false,
    });

    // Create user profile in Firestore
    const now = serverTimestamp();
    await adminDb.collection(collections.users).doc(userRecord.uid).set({
      profile: {
        uid: userRecord.uid,
        email,
        displayName,
        photoURL: null,
        phoneNumber: phoneNumber || null,
        emailVerified: false,
        providers: ["password"],
        createdAt: now,
        updatedAt: now,
        isAdmin: false,
        isActive: true,
        role: "customer",
        permissions: [
          "orders:read:own",
          "orders:create",
          "cart:read",
          "cart:write",
          "wishlist:read",
          "wishlist:write",
          "reviews:create",
          "custom-requests:create",
          "profile:read",
          "profile:write",
          "addresses:read",
          "addresses:write",
        ],
      },
    });

    // Generate email verification link
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?uid=${userRecord.uid}`,
      handleCodeInApp: true,
    };

    const verificationLink = await adminAuth.generateEmailVerificationLink(email as string, actionCodeSettings);

    // In production, send email via email service
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 Email verification link for ${email}: ${verificationLink}`);
    }

    revalidatePath("/login");
    
    return { 
      success: true, 
      message: "Account created successfully. Please verify your email.",
      userId: userRecord.uid,
      ...(process.env.NODE_ENV === "development" && { verificationLink }),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") };
    }
    console.error("Registration error:", error);
    return { error: "Failed to create account" };
  }
}

export async function loginUser(formData: FormData) {
  try {
    const data = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    loginSchema.parse(data);

    // Email/password login should be done via Firebase Client SDK
    // This server action is for reference - actual login happens client-side
    // which then calls createSession with the ID token
    
    return { error: "Use Firebase Client SDK for login, then call createSession" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") };
    }
    return { error: "Login failed" };
  }
}

export async function createSession(idToken: string) {
  try {
    const adminAuth = getAdminAuth();
    const cookieStore = await cookies();

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const userRecord = await adminAuth.getUser(decodedToken.uid);
    
    // Create session cookie (expires in 7 days)
    const expiresIn = 60 * 60 * 24 * 7 * 1000; // 7 days in ms
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set HTTP-only cookie
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    cookieStore.set(cookieName, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      },
    };
  } catch (error) {
    console.error("Session creation error:", error);
    return { error: "Failed to create session" };
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    
    cookieStore.delete(cookieName);
    revalidatePath("/");
    
    return { success: true, message: "Logged out successfully" };
  } catch (error) {
    console.error("Logout error:", error);
    return { error: "Failed to logout" };
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    const sessionCookie = cookieStore.get(cookieName)?.value;

    if (!sessionCookie) {
      return { error: "Not authenticated" };
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    const data = {
      displayName: formData.get("displayName") || undefined,
      phoneNumber: formData.get("phoneNumber") || undefined,
      photoURL: formData.get("photoURL") || undefined,
    };

    const { displayName, phoneNumber, photoURL } = updateProfileSchema.parse(data);

    // Update Firebase Auth profile
    await adminAuth.updateUser(decoded.uid, {
      displayName: displayName || undefined,
      phoneNumber: phoneNumber || undefined,
      photoURL: photoURL || undefined,
    });

    // Update Firestore profile
    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (displayName !== undefined) updateData["profile.displayName"] = displayName;
    if (phoneNumber !== undefined) updateData["profile.phoneNumber"] = phoneNumber;
    if (photoURL !== undefined) updateData["profile.photoURL"] = photoURL;

    await adminDb.collection(collections.users).doc(decoded.uid).update(updateData);

    revalidatePath("/account/profile");
    
    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") };
    }
    console.error("Update profile error:", error);
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(formData: FormData) {
  try {
    const cookieStore = await cookies();
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    const sessionCookie = cookieStore.get(cookieName)?.value;

    if (!sessionCookie) {
      return { error: "Not authenticated" };
    }

    const adminAuth = getAdminAuth();
    await adminAuth.verifySessionCookie(sessionCookie, true);

    const data = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
    };

    changePasswordSchema.parse(data);

    // Note: Firebase Admin SDK cannot verify current password
    // This should be done client-side with Firebase Client SDK
    // which then updates the password and we sync the session
    
    return { error: "Use Firebase Client SDK to change password, then refresh session" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") };
    }
    return { error: "Failed to change password" };
  }
}

export async function sendEmailVerification() {
  try {
    const cookieStore = await cookies();
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    const sessionCookie = cookieStore.get(cookieName)?.value;

    if (!sessionCookie) {
      return { error: "Not authenticated" };
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    const userRecord = await adminAuth.getUser(decoded.uid);
    // decoded.uid is used above to fetch user record
    
    if (userRecord.emailVerified) {
      return { message: "Email is already verified" };
    }

    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`,
      handleCodeInApp: true,
    };

    if (!userRecord.email) {
      return { error: "User email not found" };
    }
    const verificationLink = await adminAuth.generateEmailVerificationLink(userRecord.email, actionCodeSettings);

    if (process.env.NODE_ENV === "development") {
      console.log(`📧 Resent verification link for ${userRecord.email}: ${verificationLink}`);
    }

    return { 
      success: true, 
      message: "Verification email sent",
      ...(process.env.NODE_ENV === "development" && { verificationLink }),
    };
  } catch (error) {
    console.error("Send verification error:", error);
    return { error: "Failed to send verification email" };
  }
}

export async function sendPasswordReset(formData: FormData) {
  try {
    const email = formData.get("email");
    
    if (!email || typeof email !== "string") {
      return { error: "Email is required" };
    }

    const adminAuth = getAdminAuth();
    
    // Check if user exists (don't reveal if not)
    try {
      await adminAuth.getUserByEmail(email);
    } catch {
      return { success: true, message: "If an account exists, a password reset link has been sent" };
    }

    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      handleCodeInApp: true,
    };

    const resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);

    if (process.env.NODE_ENV === "development") {
      console.log(`📧 Password reset link for ${email}: ${resetLink}`);
    }

    return { 
      success: true, 
      message: "If an account exists, a password reset link has been sent",
      ...(process.env.NODE_ENV === "development" && { resetLink }),
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to process password reset request" };
  }
}

export async function linkGoogleAccount(_idToken: string) {
  try {
    const cookieStore = await cookies();
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    const sessionCookie = cookieStore.get(cookieName)?.value;

    if (!sessionCookie) {
      return { error: "Not authenticated" };
    }

    // Link Google account - requires Firebase Client SDK on client side
    // This server action is a placeholder for the client to call after linking
    return { success: true, message: "Use Firebase Client SDK to link Google account" };
  } catch (error) {
    console.error("Link Google account error:", error);
    return { error: "Failed to link Google account" };
  }
}

export async function unlinkProvider(_providerId: string) {
  try {
    const cookieStore = await cookies();
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    const sessionCookie = cookieStore.get(cookieName)?.value;

    if (!sessionCookie) {
      return { error: "Not authenticated" };
    }

    const adminAuth = getAdminAuth();
    await adminAuth.verifySessionCookie(sessionCookie, true);

    // Unlink provider - requires Firebase Client SDK on client side
    return { error: "Use Firebase Client SDK to unlink provider" };
  } catch (error) {
    console.error("Unlink provider error:", error);
    return { error: "Failed to unlink provider" };
  }
}