import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/firebase/auth";
import { adminDb } from "@/lib/db/firestore";
import { collections } from "@/lib/db/schemas";
import { signedUploadSchema } from "@/lib/validation/schemas";
import { z } from "zod";
import { Category } from "@/lib/types";
import {
  generateSignedUploadParams,
  isCloudinaryConfigured,
} from "@/lib/cloudinary/server";
import {
  getProductFolderPath,
  getVariantFolderPath,
  getCategoryImageFolder,
  getCategoryImagePublicId,
  getProductImagePublicId,
  getVariantImagePublicId,
} from "@/lib/cloudinary/folders";

const uploadRequestSchema = z.object({
  targetType: z.enum(["category", "product", "variant"]),
  categoryId: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
  variantId: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
  options: signedUploadSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Cloudinary is not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const data = uploadRequestSchema.parse(body);

    const { targetType, categoryId, productId, variantId, filename, options } = data;

    let folder: string;
    let publicIdPrefix: string;

    switch (targetType) {
      case "category": {
        if (!categoryId) {
          return NextResponse.json(
            { error: "categoryId is required for category uploads" },
            { status: 400 }
          );
        }
        const categorySnap = await adminDb
          .collection(collections.categories)
          .doc(categoryId)
          .get();
        if (!categorySnap.exists) {
          return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        const category = categorySnap.data() as Category;
        if (!category.isActive) {
          return NextResponse.json(
            { error: "Category is not active" },
            { status: 400 }
          );
        }
        folder = getCategoryImageFolder(category.type, categoryId);
        publicIdPrefix = filename
          ? getCategoryImagePublicId(category.type, categoryId, filename)
          : `${folder}${Date.now()}`;
        break;
      }

      case "product": {
        if (!categoryId || !productId) {
          return NextResponse.json(
            { error: "categoryId and productId are required for product uploads" },
            { status: 400 }
          );
        }
        const categorySnap = await adminDb
          .collection(collections.categories)
          .doc(categoryId)
          .get();
        if (!categorySnap.exists) {
          return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        const category = categorySnap.data() as Category;
        if (!category.isActive) {
          return NextResponse.json(
            { error: "Category is not active" },
            { status: 400 }
          );
        }
        const productSnap = await adminDb
          .collection(collections.products)
          .doc(productId)
          .get();
        if (!productSnap.exists) {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        const product = productSnap.data();
        if (product?.categoryId !== categoryId) {
          return NextResponse.json(
            { error: "Product does not belong to the specified category" },
            { status: 400 }
          );
        }
        folder = getProductFolderPath(
          { type: category.type, slug: category.slug, id: categoryId },
          productId
        );
        publicIdPrefix = filename
          ? getProductImagePublicId(
              { type: category.type, slug: category.slug, id: categoryId },
              productId,
              filename
            )
          : `${folder}${Date.now()}`;
        break;
      }

      case "variant": {
        if (!categoryId || !productId || !variantId) {
          return NextResponse.json(
            {
              error:
                "categoryId, productId, and variantId are required for variant uploads",
            },
            { status: 400 }
          );
        }
        const categorySnap = await adminDb
          .collection(collections.categories)
          .doc(categoryId)
          .get();
        if (!categorySnap.exists) {
          return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        const category = categorySnap.data() as Category;
        if (!category.isActive) {
          return NextResponse.json(
            { error: "Category is not active" },
            { status: 400 }
          );
        }
        const productSnap = await adminDb
          .collection(collections.products)
          .doc(productId)
          .get();
        if (!productSnap.exists) {
          return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }
        const product = productSnap.data();
        if (product?.categoryId !== categoryId) {
          return NextResponse.json(
            { error: "Product does not belong to the specified category" },
            { status: 400 }
          );
        }
        const variantSnap = await adminDb
          .collection(collections.products)
          .doc(productId)
          .collection(collections.variants)
          .doc(variantId)
          .get();
        if (!variantSnap.exists) {
          return NextResponse.json({ error: "Variant not found" }, { status: 404 });
        }
        folder = getVariantFolderPath(
          { type: category.type, slug: category.slug, id: categoryId },
          productId,
          variantId
        );
        publicIdPrefix = filename
          ? getVariantImagePublicId(
              { type: category.type, slug: category.slug, id: categoryId },
              productId,
              variantId,
              filename
            )
          : `${folder}${Date.now()}`;
        break;
      }

      default: {
        return NextResponse.json(
          { error: "Invalid targetType" },
          { status: 400 }
        );
      }
    }

    // Generate signed upload parameters
    const { params } = await generateSignedUploadParams(folder, options);

    // The client will need to include the public_id in the upload request
    // We return the folder and the public_id prefix so the client can construct the full public_id
    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
        params,
        folder,
        publicIdPrefix,
        targetType,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join("; ") },
        { status: 422 }
      );
    }
    console.error("Signed upload error:", error);
    return NextResponse.json(
      { error: "Failed to generate signed upload parameters" },
      { status: 500 }
    );
  }
}