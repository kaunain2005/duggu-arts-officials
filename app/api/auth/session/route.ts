import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/constants/config";

const sessionSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = sessionSchema.parse(body);

    const adminAuth = getAdminAuth();
    const cookieStore = await cookies();

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Check if user exists and is active
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
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Session created successfully",
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    
    cookieStore.delete(cookieName);

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookieName = env.FIREBASE_SESSION_COOKIE_NAME || "session";
    const sessionCookie = cookieStore.get(cookieName)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json({
      authenticated: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.name,
        emailVerified: decoded.email_verified,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}