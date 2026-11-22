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
import { Category, CategoryType } from "@/lib/types";
import { generateSlugFromName } from "@/lib/cloudinary/folders";

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
 * Query active categories with optional type filter.
 */
export async function queryActiveCategories(filters?: {
  type?: string;
  parentId?: string;
  limit?: number;
}): Promise<Category[]> {
  let query: Query = adminDb.collection(collections.categories);
  
  query = query.where('isActive', '==', true);
  
  if (filters?.type) {
    query = query.where('type', '==', filters.type);
  }
  
  if (filters?.parentId) {
    query = query.where('parentId', '==', filters.parentId);
  }
  
  query = query.orderBy('sortOrder', 'asc').orderBy('name', 'asc');
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  const snap = await query.get();
  return snap.docs.map(doc => getDocData(doc)).filter((d): d is Category => d !== null);
}

/**
 * Get category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const snap = await adminDb
    .collection(collections.categories)
    .where('slug', '==', slug)
    .limit(1)
    .get();
  
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = getDocData<Category>(doc);
  if (!data) return null;
  return data;
}

/**
 * Get category by ID with all sub-collections.
 */
export async function getCategoryWithDetails(categoryId: string) {
  const catDoc = await adminDb.collection(collections.categories).doc(categoryId).get();
  if (!catDoc.exists) return null;
  
  const category = getDocData<Category>(catDoc);
  if (!category) return null;
  
  // Get subcategories
  const subCatsSnap = await adminDb
    .collection('categories')
    .where('parentId', '==', categoryId)
    .where('isActive', '==', true)
    .orderBy('sortOrder', 'asc')
    .get();
  
  const subcategories = subCatsSnap.docs
    .map(doc => getDocData<Category>(doc))
    .filter((d): d is Category => d !== null);
  
  // Get product count (denormalized or real-time)
  const productsSnap = await adminDb
    .collection('products')
    .where('categoryId', '==', catDoc.id)
    .where('status', '==', 'published')
    .count()
    .get();
  
  return {
    ...category,
    subcategories,
    productCount: productsSnap.data().count,
  };
}

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
  
  const categoryData: Category = {
    ...data,
    slug: uniqueSlug,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as Category;
  
  const docRef = adminDb.collection(collections.categories).doc();
  
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
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
    
    // Release slug from registry
    const catData = catSnap.data();
    if (catData?.slug) {
      await releaseSlug(catData.slug);
    }
    
    // Delete category
    transaction.delete(adminDb.collection(collections.categories).doc(categoryId));
    
    return { success: true };
  });
}