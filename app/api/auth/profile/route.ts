import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import { serverTimestamp } from "@/lib/db/firestore";
import { z } from "zod";

const profileQuerySchema = z.object({
  uid: z.string().min(1, "User ID is required"),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { uid } = profileQuerySchema.parse(Object.fromEntries(searchParams));

    const adminAuth = getAdminAuth();
    
    // Verify user exists in Firebase Auth
    const userRecord = await adminAuth.getUser(uid);
    
    // Check if profile exists in Firestore
    let profileDoc;
    try {
      profileDoc = await adminDb.collection(collections.users).doc(uid).get();
    } catch (firestoreError) {
      console.error("Firestore error:", firestoreError);
      // If Firestore throws NOT_FOUND, it might be a database location issue
      const errorMessage = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);
      if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("database") || errorMessage.includes("Database")) {
        return NextResponse.json(
          { error: "Firestore database not found. Please ensure Firestore is enabled in the correct location.", details: errorMessage },
          { status: 503 }
        );
      }
      throw firestoreError;
    }
    
    if (!profileDoc.exists) {
      // Create profile for new user (e.g., Google sign-in user)
      const profileData = {
        uid: userRecord.uid,
        email: userRecord.email || "",
        displayName: userRecord.displayName || "",
        photoURL: userRecord.photoURL || null,
        phoneNumber: userRecord.phoneNumber || null,
        emailVerified: userRecord.emailVerified,
        providers: userRecord.providerData.map(p => p.providerId),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
      };
      
      try {
        await adminDb.collection(collections.users).doc(uid).set({
          profile: profileData,
        });
      } catch (createError) {
        console.error("Profile creation error:", createError);
        return NextResponse.json(
          { error: "Failed to create profile", details: createError instanceof Error ? createError.message : String(createError) },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        profile: profileData,
        created: true,
      });
    }
    
    const profile = profileDoc.data();
    
    return NextResponse.json({
      success: true,
      profile: profile?.profile,
      created: false,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}