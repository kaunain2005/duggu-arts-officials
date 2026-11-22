import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import {
  productCreateSchema,
  productCursorPaginationSchema,
  productFilterSchema,
  productSortSchema,
} from "@/lib/validation/schemas";
import { Query } from "firebase-admin/firestore";
import { z } from "zod";
import { Category } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { cursor, limit, sortBy, sortOrder, ...filters } = productCursorPaginationSchema.parse(searchParams);
    const { categoryId, type, status, minPrice, maxPrice, isFeatured } = productFilterSchema.parse(filters);
    const { sortBy: sortByValidated, sortOrder: sortOrderValidated } = productSortSchema.parse({ sortBy, sortOrder });

    let query: Query = adminDb.collection(collections.products);

    // Apply filters
    if (categoryId) {
      query = query.where("categoryId", "==", categoryId);
    }
    if (type) {
      query = query.where("type", "==", type);
    }
    if (status) {
      query = query.where("status", "==", status);
    }
    if (isFeatured !== undefined) {
      query = query.where("isFeatured", "==", isFeatured);
    }
    if (minPrice !== undefined) {
      query = query.where("basePrice", ">=", minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.where("basePrice", "<=", maxPrice);
    }
    // Note: Full-text search (search) would require a different approach (Algolia, etc.)
    // For now, we'll do a simple name match if needed, but it's not efficient for large datasets
    // tags filter would require array-contains-any, skipped for now

    // Apply sorting
    const orderByField = sortByValidated || "sortOrder";
    const orderDirection = sortOrderValidated || "asc";
    query = query.orderBy(orderByField, orderDirection).limit(limit + 1);

    // Apply cursor for pagination
    if (cursor) {
      const cursorDoc = await adminDb.collection(collections.products).doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const products = items.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      success: true,
      data: products,
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
    console.error("Admin products list error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const data = productCreateSchema.parse(body);

    const { createProductWithSlug } = await import("@/lib/db/firestore");

    // Verify category exists and is active
    const categorySnap = await adminDb.collection(collections.categories).doc(data.categoryId).get();
    if (!categorySnap.exists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    const categoryData = categorySnap.data() as Category;
    if (!categoryData.isActive) {
      return NextResponse.json({ error: "Category is not active" }, { status: 400 });
    }

    // Prepare product data
    const productData = {
      ...data,
      categoryName: categoryData.name,
      slug: data.slug, // slug is optional - server will generate if not provided
    };

    // Create product with slug reservation (uses transaction internally)
    const productId = await createProductWithSlug(productData);

    // Create variants if provided
    if (data.variants && data.variants.length > 0) {
      const { createProductVariant } = await import("@/lib/db/firestore");
      for (const variant of data.variants) {
        const variantData = {
          ...variant,
          images: variant.images || [],
        };
        await createProductVariant(productId, variantData);
      }
    }

    // Create product images if provided
    if (data.images && data.images.length > 0) {
      const { addProductImage } = await import("@/lib/db/firestore");
      for (const image of data.images) {
        const imageData = {
          ...image,
          productId,
        };
        await addProductImage(productId, imageData);
      }
    }

    return NextResponse.json(
      { success: true, data: { id: productId } },
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
    console.error("Admin product create error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}