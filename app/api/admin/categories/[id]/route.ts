import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import { categoryUpdateSchema, categoryDeleteSchema } from "@/lib/validation/schemas";
import { updateCategoryWithSlug, deleteCategoryWithProtection } from "@/lib/db/firestore";
import { z } from "zod";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const data = categoryUpdateSchema.parse(body);

    const { newSlug, ...updateData } = data;

    await updateCategoryWithSlug(id, updateData, newSlug);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    if (error instanceof Error && error.message.includes("Slug")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Admin category update error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();

    const { id } = await params;
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { reassignProductIds } = categoryDeleteSchema.parse(searchParams);

    const result = await deleteCategoryWithProtection(id, reassignProductIds || []);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Admin category delete error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}