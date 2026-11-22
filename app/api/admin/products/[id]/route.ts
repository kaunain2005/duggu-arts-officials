import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import {
  productUpdateSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const { getProductWithDetails } = await import("@/lib/db/firestore");

    const product = await getProductWithDetails(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Admin product get error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const data = productUpdateSchema.parse(body);

    const { updateProductWithSlug, getProductById } = await import("@/lib/db/firestore");

    // Check product exists
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Validate category if provided
    if (data.categoryId) {
      const categorySnap = await adminDb.collection(collections.categories).doc(data.categoryId).get();
      if (!categorySnap.exists) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      const categoryData = categorySnap.data();
      if (!categoryData?.isActive) {
        return NextResponse.json({ error: "Category is not active" }, { status: 400 });
      }
    }

    // Extract newSlug for slug handling
    const { newSlug, ...updateData } = data;

    // Prevent modification of protected fields
    const protectedFields = ['id', 'createdAt', 'updatedAt', 'categoryName'];
    for (const field of protectedFields) {
      if (field in updateData) {
        delete (updateData as Record<string, unknown>)[field];
      }
    }

    // Update product with slug handling (uses transaction internally)
    await updateProductWithSlug(id, updateData, newSlug);

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
    console.error("Admin product update error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const { deleteProductWithProtection } = await import("@/lib/db/firestore");

    const result = await deleteProductWithProtection(id);

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
    console.error("Admin product delete error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}