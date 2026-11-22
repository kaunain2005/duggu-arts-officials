import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import { categoryReorderSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { categories } = categoryReorderSchema.parse(body);

    const batch = adminDb.batch();
    const now = new Date();

    for (const { id, sortOrder } of categories) {
      const docRef = adminDb.collection("categories").doc(id);
      batch.update(docRef, {
        sortOrder,
        updatedAt: new Date(),
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Admin category reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder categories" }, { status: 500 });
  }
}