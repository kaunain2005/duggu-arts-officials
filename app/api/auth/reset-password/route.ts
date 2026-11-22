import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { z } from "zod";

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  oobCode: z.string().min(1, "Reset code is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, oobCode } = resetPasswordSchema.parse(body);

    const adminAuth = getAdminAuth();
    
    // Verify the reset code and update password
    // Firebase Admin SDK doesn't directly verify oobCode
    // The client should use Firebase Client SDK to confirm the reset
    // This endpoint is for reference - actual reset happens client-side
    
    return NextResponse.json(
      { error: "Use Firebase Client SDK to confirm password reset with oobCode" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const oobCode = request.nextUrl.searchParams.get("oobCode");
    const apiKey = request.nextUrl.searchParams.get("apiKey");
    const mode = request.nextUrl.searchParams.get("mode");
    
    if (!oobCode) {
      return NextResponse.redirect(new URL("/reset-password?error=invalid_link", request.url));
    }

    // This page would be handled by the client-side reset password page
    // which uses Firebase Client SDK to verify the code
    return NextResponse.redirect(new URL(`/reset-password?oobCode=${encodeURIComponent(oobCode)}`, request.url));
  } catch (error) {
    console.error("Reset password link error:", error);
    return NextResponse.redirect(new URL("/reset-password?error=invalid_link", request.url));
  }
}