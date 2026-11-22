import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    const adminAuth = getAdminAuth();
    
    // Check if user exists
    try {
      await adminAuth.getUserByEmail(email);
    } catch {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: "If an account exists, a password reset link has been sent",
      });
    }

    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      handleCodeInApp: true,
    };

    const resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);

    // In production, send email via email service
    if (process.env.NODE_ENV === "development") {
      console.log(`📧 Password reset link for ${email}: ${resetLink}`);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists, a password reset link has been sent",
      ...(process.env.NODE_ENV === "development" && { resetLink }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}