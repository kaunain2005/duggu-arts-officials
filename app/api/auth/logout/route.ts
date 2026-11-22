import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { env } from "@/lib/constants/config";

export async function POST() {
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