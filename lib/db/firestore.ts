import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  Query,
  FieldValue,
  Timestamp,
  WriteBatch,
  WithFieldValue,
  DocumentData,
  WhereFilterOp,
  Transaction,
} from "firebase-admin/firestore";
import { collections, type CollectionName } from "./schemas";
import { Category, CategoryType, Product, ProductVariant, ProductImage } from "@/lib/types";
import { generateSlugFromName } from "@/lib/cloudinary/folders";
import { getProductFolderPath, getVariantFolderPath } from "@/lib/cloudinary/folders";
import { getCloudinary } from "@/lib/cloudinary/server";

export const adminDb = getAdminDb();

export function getCollection<T extends DocumentData>(name: string): CollectionReference<T> {
  return adminDb.collection(name) as CollectionReference<T>;
}

export function getCollectionRef(name: CollectionName): CollectionReference {
  return adminDb.collection(name);
}

export function getDocRef<T extends DocumentData>(collectionName: string, id: string): DocumentReference<T> {
  return adminDb.collection(collectionName).doc(id) as DocumentReference<T>;
}

export function getDocRefByCollection<T extends DocumentData>(collectionName: CollectionName, id: string): DocumentReference<T> {
  return adminDb.collection(collectionName).doc(id) as DocumentReference<T>;
}

export async function getDoc<T extends DocumentData>(collectionName: string, id: string): Promise<T | null> {
  const snap = await adminDb.collection(collectionName).doc(id).get();
  return snap.exists ? (snap.data() as T) : null;
}

export async function getDocSnapshot<T extends DocumentData>(
  collectionName: string,
  id: string
): Promise<DocumentSnapshot<T> | null> {
  const snap = await adminDb.collection(collectionName).doc(id).get();
  return snap.exists ? (snap as DocumentSnapshot<T>) : null;
}

export async function setDoc<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: WithFieldValue<T>,
  merge = false
): Promise<void> {
  await adminDb.collection(collectionName).doc(id).set(data, { merge });
}

export async function updateDoc<T extends DocumentData>(
  collectionName: string,
  id: string,
  data: Partial<WithFieldValue<T>>
): Promise<void> {
  await adminDb.collection(collectionName).doc(id).update(data as Record<string, unknown>);
}

export async function deleteDoc(collectionName: string, id: string): Promise<void> {
  await adminDb.collection(collectionName).doc(id).delete();
}

export async function addDoc<T extends DocumentData>(
  collectionName: string,
  data: Omit<WithFieldValue<T>, "id"> & { id?: string }
): Promise<string> {
  const docRef = adminDb.collection(collectionName).doc();
  const id = data.id || docRef.id;
  await docRef.set({ ...data, id } as WithFieldValue<T>);
  return id;
}

export async function queryCollection<T extends DocumentData>(
  collectionName: string,
  ...constraints: Array<
    | { field: string; operator: "<" | "<=" | "==" | ">=" | ">" | "array-contains" | "in" | "not-in" | "array-contains-any"; value: unknown }
  >
): Promise<T[]> {
  let query: Query = adminDb.collection(collectionName);
  for (const constraint of constraints) {
    query = query.where(constraint.field, constraint.operator, constraint.value);
  }
  const snap = await query.get();
  return snap.docs.map((doc) => doc.data() as T);
}

export async function queryCollectionWithPagination<T extends DocumentData>(
  collectionName: string,
  page: number,
  limit: number,
  orderByField: string = "createdAt",
  orderDirection: "asc" | "desc" = "desc",
  ...constraints: Array<{ field: string; operator: string; value: unknown }>
): Promise<{ data: T[]; total: number; page: number; totalPages: number }> {
  let query: Query = adminDb.collection(collectionName);
  for (const constraint of constraints) {
    query = query.where(constraint.field, constraint.operator as WhereFilterOp, constraint.value);
  }

  const totalSnap = await query.count().get();
  const total = totalSnap.data().count;

  query = query.orderBy(orderByField, orderDirection).limit(limit).offset((page - 1) * limit);
  const snap = await query.get();
  const data = snap.docs.map((doc) => doc.data() as T);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function runTransaction<T>(
  updateFn: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> {
  return adminDb.runTransaction(updateFn);
}

export async function writeBatch(operations: Array<{
  type: "set" | "update" | "delete";
  collection: string;
  id: string;
  data: Record<string, unknown>;
}>): Promise<void> {
  const batch = adminDb.batch();
  for (const op of operations) {
    const ref = adminDb.collection(op.collection).doc(op.id);
    switch (op.type) {
      case "set":
        batch.set(ref, op.data, { merge: true });
        break;
      case "update":
        batch.update(ref, op.data);
        break;
      case "delete":
        batch.delete(ref);
        break;
    }
  }
  await batch.commit();
}

export function createBatch(): WriteBatch {
  return adminDb.batch();
}

export function serverTimestamp(): FieldValue {
  return FieldValue.serverTimestamp();
}

export function increment(n: number): FieldValue {
  return FieldValue.increment(n);
}

export function arrayUnion(...elements: unknown[]): FieldValue {
  return FieldValue.arrayUnion(...elements);
}

export function arrayRemove(...elements: unknown[]): FieldValue {
  return FieldValue.arrayRemove(...elements);
}

export function deleteField(): FieldValue {
  return FieldValue.delete();
}

export function now(): Timestamp {
  return Timestamp.now();
}

export function fromDate(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function fromMillis(millis: number): Timestamp {
  return Timestamp.fromMillis(millis);
}

/**
 * Cursor-based pagination for Firestore queries.
 * Returns data, nextCursor (for next page), and hasMore.
 */
export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function queryCollectionWithCursor<T extends DocumentData>(
  collectionName: CollectionName,
  limit: number,
  constraints: Array<{ field: string; operator: WhereFilterOp; value: unknown }> = [],
  orderByField: string = "createdAt",
  orderDirection: "asc" | "desc" = "desc",
  cursor?: string
): Promise<PaginatedResult<T>> {
  let query: Query = adminDb.collection(collectionName);
  
  for (const constraint of constraints) {
    query = query.where(constraint.field, constraint.operator, constraint.value);
  }
  
  query = query.orderBy(orderByField, orderDirection).limit(limit + 1);
  
  if (cursor) {
    const cursorDoc = await adminDb.collection(collectionName).doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }
  
  const snap = await query.get();
  const docs = snap.docs;
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;
  
  return {
    data: items.map(doc => getDocData(doc)).filter((d): d is T => d !== null),
    nextCursor,
    hasMore,
  };
}

/**
 * Safely get document data.
 */
function getDocData<T>(doc: DocumentSnapshot): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  return data ? ({ id: doc.id, ...data } as T) : null;
}

/**
 * Reserve a slug in the slug registry.
 * Uses a transaction to ensure uniqueness.
 * Returns true if slug was reserved, false if already taken.
 */
export async function reserveSlug(
  slug: string,
  type: 'category' | 'product',
  resourceId: string
): Promise<boolean> {
  const slugRef = adminDb.collection(collections.slugRegistry).doc(slug);
  
  try {
    await adminDb.runTransaction(async (transaction) => {
      const slugDoc = await transaction.get(adminDb.collection(collections.slugRegistry).doc(slug));
      if (slugDoc.exists) {
        const existing = slugDoc.data();
        if (existing?.resourceId !== slug) {
          throw new Error(`Slug "${slug}" is already in use`);
        }
      }
      transaction.set(adminDb.collection(collections.slugRegistry).doc(slug), {
        slug,
        type,
        resourceId,
        createdAt: serverTimestamp(),
      });
    });
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already in use')) {
      return false;
    }
    throw error;
  }
}

/**
 * Release a slug from the registry.
 */
export async function releaseSlug(slug: string): Promise<void> {
  await adminDb.collection(collections.slugRegistry).doc(slug).delete();
}

/**
 * Check if a slug is available.
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const doc = await adminDb.collection(collections.slugRegistry).doc(slug).get();
  return !doc.exists;
}

/**
 * Generate a unique slug from a base name using local implementation.
 * Appends a counter if the slug is already taken.
 */
export async function generateUniqueSlugFirestore(baseSlug: string, type: 'category' | 'product'): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  
  while (true) {
    const available = await isSlugAvailable(slug);
    if (available) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Helper function to get category data for Cloudinary folder paths.
 */
export function getCategoryForCloudinary(category: Category): Pick<Category, 'type' | 'slug' | 'id'> {
  return {
    type: category.type,
    slug: category.slug,
    id: category.id,
  };
}

/**
 * ============================================================================
 * CATEGORY FUNCTIONS
 * ============================================================================
 */

/**
 * Create a new category with slug reservation.
 * Uses transaction to ensure slug uniqueness.
 */
export async function createCategoryWithSlug(
  data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { slug?: string }
): Promise<string> {
  // Generate slug from name if not provided
  const baseSlug = data.slug || generateSlugFromName(data.name);

  // Generate unique slug
  const uniqueSlug = await generateUniqueSlugFirestore(baseSlug, 'category');

  const docRef = adminDb.collection(collections.categories).doc();
  
  const categoryData: Category = {
    id: docRef.id,
    slug: uniqueSlug,
    name: data.name,
    description: data.description,
    imageUrl: data.imageUrl,
    imagePublicId: data.imagePublicId,
    type: data.type || 'flowers',
    parentId: data.parentId,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
    productCount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  // Reserve slug in registry
  await reserveSlug(uniqueSlug, 'category', docRef.id);

  // Create category document
  await adminDb.collection(collections.categories).doc(docRef.id).set(categoryData);

  return docRef.id;
}

/**
 * Update category with slug change handling.
 * If slug changes, reserve new slug and release old one.
 */
export async function updateCategoryWithSlug(
  categoryId: string,
  data: Partial<Category>,
  newSlug?: string
): Promise<void> {
  const catRef = adminDb.collection(collections.categories).doc(categoryId);
  const catSnap = await catRef.get();

  if (!catSnap.exists) {
    throw new Error('Category not found');
  }

  const oldSlug = catSnap.data()?.slug;

  if (newSlug && newSlug !== oldSlug) {
    // Check if new slug is available
    const available = await isSlugAvailable(newSlug);
    if (!available) {
      throw new Error(`Slug "${newSlug}" is already in use`);
    }

    // Reserve new slug
    await reserveSlug(newSlug, 'category', categoryId);
    // Release old slug
    await releaseSlug(oldSlug);
  }

  await adminDb.collection(collections.categories).doc(categoryId).update({
    ...data,
    ...(newSlug && { slug: newSlug }),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete category with protection.
 * Blocks deletion if products exist unless reassigned.
 */
export async function deleteCategoryWithProtection(
  categoryId: string,
  reassignProductIds: string[] = []
): Promise<{ success: boolean; error?: string }> {
  return adminDb.runTransaction(async (transaction) => {
    const catRef = adminDb.collection(collections.categories).doc(categoryId);
    const catSnap = await transaction.get(catRef);

    if (!catSnap.exists) {
      return { success: false, error: 'Category not found' };
    }

    // Check for subcategories
    const subCatsSnap = await adminDb
      .collection('categories')
      .where('parentId', '==', categoryId)
      .limit(1)
      .get();

    if (!subCatsSnap.empty) {
      return { success: false, error: 'Cannot delete category with subcategories. Delete or reassign subcategories first.' };
    }

    // Check for products in this category
    const productsSnap = await adminDb
      .collection('products')
      .where('categoryId', '==', categoryId)
      .limit(1)
      .get();

    if (!productsSnap.empty) {
      if (reassignProductIds.length === 0) {
        return { success: false, error: 'Cannot delete category with assigned products. Reassign or delete products first.' };
      }

      // Reassign specified products using the transaction
      for (const productId of reassignProductIds) {
        const prodRef = adminDb.collection('products').doc(productId);
        transaction.update(prodRef, {
          categoryId: null,
          updatedAt: Timestamp.now(),
        });
      }
    }

    // Release slug from registry
    const catData = catSnap.data();
    if (catData?.slug) {
      await releaseSlug(catData.slug);
    }

    // Delete category
    transaction.delete(adminDb.collection('categories').doc(categoryId));

    return { success: true };
  });
}

/**
 * ============================================================================
 * PRODUCT FUNCTIONS
 * ============================================================================
 */

/**
 * Reserve a product slug in the slug registry.
 */
export async function reserveProductSlug(
  slug: string,
  resourceId: string
): Promise<boolean> {
  return reserveSlug(slug, 'product', resourceId);
}

/**
 * Generate a unique product slug.
 */
export async function generateUniqueProductSlug(baseSlug: string): Promise<string> {
  return generateUniqueSlugFirestore(baseSlug, 'product');
}

/**
 * Release a product slug from the registry.
 */
export async function releaseProductSlug(slug: string): Promise<void> {
  await releaseSlug(slug);
}

/**
 * Get product by slug.
 */
export async function getProductBySlug(slug: string) {
  const snap = await adminDb
    .collection(collections.products)
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return getDocData(doc);
}

/**
 * Get product by ID with all sub-collections.
 */
export async function getProductWithDetails(productId: string) {
  const productDoc = await adminDb.collection(collections.products).doc(productId).get();
  if (!productDoc.exists) return null;

  const product = getDocData(productDoc);
  if (!product) return null;

  // Get variants
  const variantsSnap = await adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.variants)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .get();

  const variants = variantsSnap.docs
    .map(doc => getDocData(doc))
    .filter((d): d is ProductVariant => d !== null);

  // Get images
  const imagesSnap = await adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.images)
    .orderBy('sortOrder', 'asc')
    .get();

  const images = imagesSnap.docs
    .map(doc => getDocData(doc))
    .filter((d): d is ProductImage => d !== null);

  return {
    ...product,
    variants,
    images,
  };
}

/**
 * Query products with cursor-based pagination and filters.
 */
export async function queryProductsWithCursor(
  limit: number,
  filters: {
    categoryId?: string;
    type?: string;
    status?: string;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  } = {},
  orderByField: string = 'sortOrder',
  orderDirection: 'asc' | 'desc' = 'asc',
  cursor?: string
) {
  let query: Query = adminDb.collection(collections.products);

  if (filters.categoryId) {
    query = query.where('categoryId', '==', filters.categoryId);
  }
  if (filters.type) {
    query = query.where('type', '==', filters.type);
  }
  if (filters.status) {
    query = query.where('status', '==', filters.status);
  }
  if (filters.isFeatured !== undefined) {
    query = query.where('isFeatured', '==', filters.isFeatured);
  }
  if (filters.minPrice !== undefined) {
    query = query.where('basePrice', '>=', filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    query = query.where('basePrice', '<=', filters.maxPrice);
  }
  // Note: Full-text search would require a different approach (Algolia, etc.)

  query = query.orderBy('sortOrder', 'asc').orderBy('createdAt', 'desc').limit(limit + 1);

  if (cursor) {
    const cursorDoc = await adminDb.collection('products').doc(cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snap = await query.get();
  const docs = snap.docs;
  const hasMore = docs.length > limit;
  const items = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    data: docs.map(doc => getDocData(doc)).filter((d): d is any => d !== null),
    nextCursor,
    hasMore,
  };
}

/**
 * Get product by ID.
 */
export async function getProductById(productId: string) {
  const doc = await adminDb.collection(collections.products).doc(productId).get();
  return getDocData(doc);
}

/**
 * Create a new product with slug reservation.
 * Uses transaction to ensure slug uniqueness.
 */
export async function createProductWithSlug(
  data: Omit<any, 'id' | 'createdAt' | 'updatedAt'> & { slug?: string }
): Promise<string> {
  // Generate slug from name if not provided
  const baseSlug = data.slug || generateSlugFromName(data.name);

  // Generate unique slug
  const uniqueSlug = await generateUniqueSlugFirestore(baseSlug, 'product');

  const productData = {
    ...data,
    slug: uniqueSlug,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = adminDb.collection(collections.products).doc();

  // Reserve slug in registry
  await reserveSlug(uniqueSlug, 'product', docRef.id);

  // Create product document
  await adminDb.collection(collections.products).doc(docRef.id).set(productData);

  return docRef.id;
}

/**
 * Update product with slug change handling.
 * If slug changes, reserve new slug and release old one.
 */
export async function updateProductWithSlug(
  productId: string,
  data: Partial<any>,
  newSlug?: string
): Promise<void> {
  const productRef = adminDb.collection(collections.products).doc(productId);
  const productSnap = await productRef.get();

  if (!productSnap.exists) {
    throw new Error('Product not found');
  }

  const oldSlug = productSnap.data()?.slug;

  if (newSlug && newSlug !== oldSlug) {
    // Check if new slug is available
    const available = await isSlugAvailable(newSlug);
    if (!available) {
      throw new Error(`Slug "${newSlug}" is already in use`);
    }

    // Reserve new slug
    await reserveSlug(newSlug, 'product', productId);
    // Release old slug
    await releaseSlug(oldSlug);
  }

  await adminDb.collection(collections.products).doc(productId).update({
    ...data,
    ...(newSlug && { slug: newSlug }),
    updatedAt: Timestamp.now(),
  });
}

/**
 * Delete product with protection.
 * Cleans up associated images from Cloudinary and Firestore.
 * Cloudinary operations are performed OUTSIDE the transaction to avoid
 * blocking the transaction and to handle failures gracefully.
 */
export async function deleteProductWithProtection(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  // First, collect all public IDs to delete from Cloudinary
  // This is done OUTSIDE the transaction to avoid blocking the transaction
  // and to handle Cloudinary failures gracefully
  const productRef = adminDb.collection(collections.products).doc(productId);
  const productSnap = await adminDb.collection(collections.products).doc(productId).get();

  if (!productSnap.exists) {
    return { success: false, error: 'Product not found' };
  }

  const productData = productSnap.data();
  if (!productData) {
    return { success: false, error: 'Product data not found' };
  }

  // Collect all public IDs to delete from Cloudinary
  const publicIdsToDelete: string[] = [];

  // Product images
  if (productData?.images && productData.images.length > 0) {
    const productPublicIds = productData.images
      .filter((img: any) => img.publicId)
      .map((img: any) => img.publicId);
    publicIdsToDelete.push(...productPublicIds);
  }

  // Get variant images
  const variantsSnap = await adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.variants)
    .get();

  for (const variantDoc of variantsSnap.docs) {
    const variantData = variantDoc.data();
    if (variantData?.images && variantData.images.length > 0) {
      const variantPublicIds = variantData.images
        .filter((img: any) => img.publicId)
        .map((img: any) => img.publicId);
      publicIdsToDelete.push(...variantPublicIds);
    }
  }

  // Get product images from subcollection
  const imagesSnap = await adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.images)
    .get();

  for (const imageDoc of imagesSnap.docs) {
    const imageData = imageDoc.data();
    if (imageData?.publicId) {
      publicIdsToDelete.push(imageData.publicId);
    }
  }

  // Now run the Firestore transaction to delete all documents
  try {
    await adminDb.runTransaction(async (transaction) => {
      const productRef = adminDb.collection(collections.products).doc(productId);
      const productSnap = await transaction.get(adminDb.collection(collections.products).doc(productId));

      if (!productSnap.exists) {
        throw new Error('Product not found');
      }

      const productData = productSnap.data();
      if (!productData) {
        throw new Error('Product data not found');
      }

      // Delete variant subcollection
      const variantsSnap = await adminDb
        .collection(collections.products)
        .doc(productId)
        .collection(collections.variants)
        .get();

      for (const variantDoc of variantsSnap.docs) {
        transaction.delete(variantDoc.ref);
      }

      // Delete product images subcollection
      const imagesSnap = await adminDb
        .collection(collections.products)
        .doc(productId)
        .collection(collections.images)
        .get();

      for (const imageDoc of imagesSnap.docs) {
        transaction.delete(imageDoc.ref);
      }

      // Release slug from registry
      if (productSnap.data()?.slug) {
        await releaseSlug(productSnap.data()!.slug);
      }

      // Delete product document
      transaction.delete(adminDb.collection(collections.products).doc(productId));
    });

    // Delete Cloudinary images AFTER successful transaction
    // This is done outside the transaction to avoid blocking and handle failures gracefully
    if (publicIdsToDelete.length > 0) {
      try {
        const cloudinary = await getCloudinary();
        await cloudinary.api.delete_resources(publicIdsToDelete);
      } catch (cloudinaryError) {
        // Log error but don't fail the product deletion
        console.error('Failed to delete Cloudinary images:', cloudinaryError);
        // Could optionally store failed deletions for retry later
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete product' 
    };
  }
}

/**
 * Create a product variant.
 */
export async function createProductVariant(
  productId: string,
  variantData: Omit<any, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const variantRef = adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.variants)
    .doc();

  const variantId = variantData.id || variantRef.id;
  const now = Timestamp.now();

  await variantRef.set({
    ...variantData,
    id: variantId,
    productId,
    createdAt: now,
    updatedAt: now,
  });

  return variantId;
}

/**
 * Update a product variant.
 */
export async function updateProductVariant(
  productId: string,
  variantId: string,
  data: Partial<any>
): Promise<void> {
  await adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.variants)
    .doc(variantId)
    .update({
      ...data,
      updatedAt: Timestamp.now(),
    });
}

/**
 * Delete a product variant.
 */
export async function deleteProductVariant(
  productId: string,
  variantId: string
): Promise<void> {
  const variantRef = adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.variants)
    .doc(variantId);

  const variantSnap = await variantRef.get();
  if (!variantSnap.exists) {
    throw new Error('Variant not found');
  }

  const variantData = variantSnap.data();

  // Delete variant images from Cloudinary
  if (variantData?.images && variantData.images.length > 0) {
    const cloudinary = await getCloudinary();
    const publicIds = variantData.images
      .filter((img: any) => img.publicId)
      .map((img: any) => img.publicId);

    if (publicIds.length > 0) {
      await cloudinary.api.delete_resources(publicIds);
    }
  }

  await variantRef.delete();
}

/**
 * Add product image metadata to Firestore.
 */
export async function addProductImage(
  productId: string,
  imageData: Omit<any, 'id' | 'createdAt'>
): Promise<string> {
  const imageRef = adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.images)
    .doc();

  const imageId = imageData.id || imageRef.id;
  const now = Timestamp.now();

  await imageRef.set({
    ...imageData,
    id: imageId,
    createdAt: now,
  });

  return imageId;
}

/**
 * Delete product image from Firestore and Cloudinary.
 */
export async function deleteProductImage(
  productId: string,
  imageId: string
): Promise<void> {
  const imageRef = adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.images)
    .doc(imageId);

  const imageSnap = await imageRef.get();
  if (!imageSnap.exists) {
    throw new Error('Image not found');
  }

  const imageData = imageSnap.data();

  // Delete from Cloudinary
  if (imageData?.publicId) {
    const cloudinary = await getCloudinary();
    await cloudinary.uploader.destroy(imageData.publicId);
  }

  await adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.images)
    .doc(imageId)
    .delete();
}

/**
 * Set primary image for a product.
 */
export async function setPrimaryProductImage(
  productId: string,
  imageId: string
): Promise<void> {
  const batch = adminDb.batch();

  // Unset current primary
  const currentPrimarySnap = await adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.images)
    .where('isPrimary', '==', true)
    .limit(1)
    .get();

  if (!currentPrimarySnap.empty) {
    batch.update(currentPrimarySnap.docs[0].ref, { isPrimary: false });
  }

  // Set new primary
  const imageRef = adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.images)
    .doc(imageId);

  batch.update(imageRef, { isPrimary: true });

  // Also update product document's primary image reference if needed
  batch.update(adminDb.collection(collections.products).doc(productId), {
    updatedAt: Timestamp.now(),
  });

  await batch.commit();
}

/**
 * Update product variant stock (for inventory management).
 */
export async function updateVariantStock(
  productId: string,
  variantId: string,
  quantityChange: number
): Promise<void> {
  const variantRef = adminDb
    .collection(collections.products)
    .doc(productId)
    .collection(collections.variants)
    .doc(variantId);

  await adminDb.runTransaction(async (transaction) => {
    const variantSnap = await transaction.get(variantRef);
    if (!variantSnap.exists) {
      throw new Error('Variant not found');
    }

    const currentStock = variantSnap.data()?.stock || 0;
    const newStock = currentStock + quantityChange;

    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    transaction.update(variantRef, {
      stock: newStock,
      updatedAt: Timestamp.now(),
    });
  });
}

/**
 * Reserve stock for an order (transaction-safe).
 */
export async function reserveStockForOrder(
  items: Array<{ productId: string; variantId: string; quantity: number }>
): Promise<void> {
  await adminDb.runTransaction(async (transaction) => {
    for (const item of items) {
      const variantRef = adminDb
        .collection(collections.products)
        .doc(item.productId)
        .collection(collections.variants)
        .doc(item.variantId);

      const variantSnap = await transaction.get(variantRef);
      if (!variantSnap.exists) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      const currentStock = variantSnap.data()?.stock || 0;
      const reservedStock = variantSnap.data()?.reservedStock || 0;

      if (currentStock - reservedStock < item.quantity) {
        throw new Error(`Insufficient stock for variant ${item.variantId}`);
      }

      transaction.update(variantRef, {
        reservedStock: reservedStock + item.quantity,
        updatedAt: Timestamp.now(),
      });
    }
  });
}

/**
 * Release reserved stock (e.g., order cancellation).
 */
export async function releaseReservedStock(
  items: Array<{ productId: string; variantId: string; quantity: number }>
): Promise<void> {
  await adminDb.runTransaction(async (transaction) => {
    for (const item of items) {
      const variantRef = adminDb
        .collection(collections.products)
        .doc(item.productId)
        .collection(collections.variants)
        .doc(item.variantId);

      const variantSnap = await transaction.get(variantRef);
      if (!variantSnap.exists) continue;

      const reservedStock = variantSnap.data()?.reservedStock || 0;
      const newReserved = Math.max(0, reservedStock - item.quantity);

      transaction.update(variantRef, {
        reservedStock: newReserved,
        updatedAt: Timestamp.now(),
      });
    }
  });
}

/**
 * Confirm reserved stock (order confirmed).
 */
export async function confirmReservedStock(
  items: Array<{ productId: string; variantId: string; quantity: number }>
): Promise<void> {
  const transactionHandler = async function(transaction: Transaction) {
    for (const item of items) {
      const variantRef = adminDb
        .collection(collections.products)
        .doc(item.productId)
        .collection(collections.variants)
        .doc(item.variantId);

      const variantSnap = await transaction.get(variantRef);
      if (!variantSnap.exists) continue;

      const reservedStock = variantSnap.data()?.reservedStock || 0;
      const stock = variantSnap.data()?.stock || 0;

      if (reservedStock < item.quantity) {
        throw new Error(`Insufficient reserved stock for variant ${item.variantId}`);
      }

      transaction.update(variantRef, {
        stock: stock - item.quantity,
        reservedStock: reservedStock - item.quantity,
        updatedAt: Timestamp.now(),
      });
    }
  };

  await adminDb.runTransaction(transactionHandler);
}