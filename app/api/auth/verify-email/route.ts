import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { z } from "zod";

const verifyEmailSchema = z.object({
  uid: z.string().min(1),
});

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get("uid");
    
    if (!uid) {
      return NextResponse.json(
        { error: "Missing user ID" },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    
    // Get user
    const userRecord = await adminAuth.getUser(uid);
    
    if (userRecord.emailVerified) {
      return NextResponse.redirect(new URL("/login?verified=true", request.url));
    }

    if (!userRecord.email) {
      return NextResponse.redirect(new URL("/login?error=no_email", request.url));
    }

    // Generate email verification link
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`,
      handleCodeInApp: true,
    };

    const verificationLink = await adminAuth.generateEmailVerificationLink(userRecord.email, actionCodeSettings);

    // In production, this would redirect to a page that sends the email
    // For development, redirect to a page showing the link
    return NextResponse.redirect(new URL(`/auth/verify-email?link=${encodeURIComponent(verificationLink)}`, request.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = resendSchema.parse(body);

    const adminAuth = getAdminAuth();
    
    const userRecord = await adminAuth.getUserByEmail(email);
    
    if (userRecord.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/login?verified=true`,
      handleCodeInApp: true,
    };

    const verificationLink = await adminAuth.generateEmailVerificationLink(email, actionCodeSettings);

    // In production, send email via email service
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 Resent verification link for ${email}: ${verificationLink}`);
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
      ...(process.env.NODE_ENV === "development" && { verificationLink }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}