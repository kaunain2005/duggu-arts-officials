import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getAdminDb } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    const adminAuth = getAdminAuth();

    // Get user by email
    const userRecord = await adminAuth.getUserByEmail(email);

    // Verify password using Firebase Admin SDK
    // Note: Firebase Admin SDK doesn't directly verify passwords.
    // We need to use the Firebase REST API or create a custom token.
    // For now, we'll use the approach of creating a custom token
    // and then exchanging it for an ID token via the client SDK.
    
    // Actually, the standard approach is:
    // 1. Client signs in with email/password using Firebase Client SDK
    // 2. Client sends ID token to server
    // 3. Server verifies ID token and creates session cookie
    
    // This endpoint is for server-side verification of a Firebase ID token
    // For email/password login, the client should use Firebase Client SDK directly
    // and then call /api/auth/session with the ID token
    
    return NextResponse.json(
      { error: "Use Firebase Client SDK for email/password login, then call /api/auth/session" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}