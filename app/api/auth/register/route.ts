import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getAdminDb } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import { serverTimestamp } from "@/lib/db/firestore";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1, "Name is required"),
  phoneNumber: z.string().optional(),
});

const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  client: {},
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  skipValidation: true,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, displayName, phoneNumber } = registerSchema.parse(body);

    const adminAuth = getAdminAuth();

    // Check if user already exists
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    } catch {
      // User doesn't exist, continue
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      phoneNumber: phoneNumber || undefined,
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

    const verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

    // In production, send email via email service
    // For now, return the link in development
    if (env.NODE_ENV === "development") {
      console.log(`📧 Email verification link for ${email}: ${verificationLink}`);
    }

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      userId: userRecord.uid,
      ...(env.NODE_ENV === "development" && { verificationLink }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}