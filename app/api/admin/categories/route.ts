import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import { categoryCreateSchema, categoryFilterSchema, cursorPaginationSchema } from "@/lib/validation/schemas";
import { Query } from "firebase-admin/firestore";
import { z } from "zod";
import { Category } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { cursor, limit, sortBy, sortOrder, ...filters } = cursorPaginationSchema.parse(searchParams);
    const { type, isActive, parentId } = categoryFilterSchema.parse(filters);

    let query: Query = adminDb.collection(collections.categories);

    if (type) query = query.where("type", "==", type);
    if (isActive !== undefined) query = query.where("isActive", "==", isActive);
    if (parentId) query = query.where("parentId", "==", parentId);

    query = query.orderBy(sortBy || "sortOrder", sortOrder || "asc").limit(limit + 1);

    if (cursor) {
      const cursorDoc = await adminDb.collection(collections.categories).doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const categories = items.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      success: true,
      data: categories,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Admin categories list error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = categoryCreateSchema.parse(body);

    const { createCategoryWithSlug } = await import("@/lib/db/firestore");

    // Ensure all required fields are present with defaults
    const categoryData = {
      name: data.name,
      slug: data.slug, // slug is optional - server will generate if not provided
      description: data.description,
      imageUrl: data.imageUrl,
      imagePublicId: data.imagePublicId,
      type: data.type ?? "flowers",
      parentId: data.parentId,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      productCount: 0,
    };

    const categoryId = await createCategoryWithSlug(categoryData as Omit<Category, "id" | "createdAt" | "updatedAt"> & { slug?: string });

    return NextResponse.json(
      { success: true, data: { id: categoryId } },
      { status: 201 }
    );
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
    console.error("Admin category create error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}