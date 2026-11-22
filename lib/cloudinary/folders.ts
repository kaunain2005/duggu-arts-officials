/**
 * Dynamic Cloudinary folder path generators.
 * 
 * IMPORTANT: Category renaming must NOT break existing Cloudinary public IDs.
 * Cloudinary does NOT automatically move assets when folder paths change in code.
 * 
 * Strategy:
 * - Folder path uses STABLE category ID + slug: {type}/{slug}-{categoryId}/{productId}/
 * - Renaming a category updates the slug but keeps the same categoryId
 * - Existing assets remain at the old path: .../old-slug-{id}/{productId}/
 * - New uploads go to new path: .../new-slug-{id}/{productId}/
 * - Both paths work because the stable {categoryId} is part of the path
 */

export type CategoryType = 'flowers' | 'bouquets' | 'crafts' | 'other';

export interface CategoryInfo {
  id: string;           // Stable Firestore document ID
  slug: string;         // URL-friendly slug (can change)
  type: CategoryType | string;   // flowers | bouquets | crafts | other
}

export interface ProductInfo {
  id: string;           // Stable Firestore document ID
  categoryId: string;   // Parent category ID
}

/**
 * Generate product folder path.
 * Format: duggu-arts/products/{type}/{slug}-{categoryId}/{productId}/
 * Example: duggu-arts/products/flowers/roses-abc123/prod456/
 * 
 * @param category - Category info (id, slug, type)
 * @param productId - Product Firestore document ID
 * @returns Cloudinary folder path
 */
export function getProductFolderPath(
  category: Pick<CategoryInfo, 'type' | 'slug' | 'id'>,
  productId: string
): string {
  const { type, slug, id: categoryId } = category;
  // Path: duggu-arts/products/{type}/{slug}-{categoryId}/{productId}/
  // The {slug}-{categoryId} ensures uniqueness even if slugs collide
  // The stable {categoryId} ensures renaming doesn't break existing URLs
  return `duggu-arts/products/${category.type}/${category.slug}-${category.id}/${productId}/`;
}

/**
 * Generate variant folder path.
 * Format: duggu-arts/products/{type}/{slug}-{categoryId}/{productId}/variants/{variantId}/
 * Example: duggu-arts/products/flowers/roses-abc123/prod456/variants/var789/
 */
export function getVariantFolderPath(
  category: Pick<CategoryInfo, 'type' | 'slug' | 'id'>,
  productId: string,
  variantId: string
): string {
  const { type, slug, id: categoryId } = category;
  return `duggu-arts/products/${category.type}/${category.slug}-${category.id}/${productId}/variants/${variantId}/`;
}

/**
 * Generate category image folder path.
 * Format: duggu-arts/categories/{type}/{categoryId}/
 * Example: duggu-arts/categories/flowers/abc123/
 */
export function getCategoryImageFolder(categoryType: CategoryType, categoryId: string): string {
  return `duggu-arts/categories/${categoryType}/${categoryId}/`;
}

/**
 * Generate product image public ID from folder path and filename.
 * Example: duggu-arts/products/flowers/roses-abc123/prod456/img_xyz
 */
export function getProductImagePublicId(
  category: Pick<CategoryInfo, 'type' | 'slug' | 'id'>,
  productId: string,
  filename: string
): string {
  const folder = getProductFolderPath(category, productId);
  // Remove extension from filename
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return `${folder}${nameWithoutExt}`;
}

/**
 * Generate variant image public ID.
 */
export function getVariantImagePublicId(
  category: Pick<CategoryInfo, 'type' | 'slug' | 'id'>,
  productId: string,
  variantId: string,
  filename: string
): string {
  const folder = getVariantFolderPath(category, productId, variantId);
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return `${folder}${nameWithoutExt}`;
}

/**
 * Generate category image public ID.
 */
export function getCategoryImagePublicId(categoryType: CategoryType, categoryId: string, filename: string): string {
  const folder = getCategoryImageFolder(categoryType, categoryId);
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  return `${folder}${nameWithoutExt}`;
}

/**
 * Parse category info from a Cloudinary public ID.
 * Useful for migration or debugging.
 * Expected format: duggu-arts/products/{type}/{slug}-{categoryId}/{productId}/...
 */
export function parseCategoryFromPublicId(publicId: string): {
  type: string;
  slug: string;
  categoryId: string;
  productId: string;
  remainder: string;
} | null {
  const match = publicId.match(
    /^duggu-arts\/products\/([^/]+)\/([^-]+)-([^/]+)\/([^/]+)\/(.+)$/
  );
  
  if (!match) return null;
  
  return {
    type: match[1],
    slug: match[2],
    categoryId: match[3],
    productId: match[4],
    remainder: match[5],
  };
}

/**
 * Generate a unique slug from a base name.
 * Appends a counter if the slug is already taken.
 * This is a client-side helper - actual uniqueness is enforced by Firestore transaction in the backend.
 */
export async function generateUniqueSlug(baseSlug: string, type: 'category' | 'product'): Promise<string> {
  let slug = baseSlug;
  let counter = 0;
  
  while (true) {
    // Check if slug is available in the registry
    // Note: This is a client-side check - server enforces uniqueness
    const available = true; // Placeholder - actual check would need API call
    if (available) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Validate that a category slug is unique.
 * This is a helper for the Admin UI - actual uniqueness is enforced
 * by Firestore transaction in the backend.
 */
export function validateSlugFormat(slug: string): { valid: boolean; error?: string } {
  if (!slug || slug.length === 0) {
    return { valid: false, error: 'Slug is required' };
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug must be lowercase alphanumeric with hyphens only' };
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with hyphen' };
  }
  
  if (slug.includes('--')) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
  }
  
  if (slug.length > 100) {
    return { valid: false, error: 'Slug must be 100 characters or less' };
  }
  
  return { valid: true };
}

/**
 * Generate a slug from a category name.
 * Used for auto-generation when admin doesn't provide a slug.
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')     // Remove special chars
    .replace(/\s+/g, '-')              // Spaces to hyphens
    .replace(/-+/g, '-')               // Collapse multiple hyphens
    .replace(/^-|-$/g, '');            // Trim leading/trailing hyphens
}

/**
 * Cloudinary upload options for product images.
 * Uses dynamic folder path based on category.
 */
export function getProductUploadOptions(
  category: Pick<{ type: string; slug: string; id: string }, 'type' | 'slug' | 'id'>,
  productId: string
) {
  const folder = getProductFolderPath(category, productId);
  
  return {
    folder,
    resource_type: 'image' as const,
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 2000, height: 2000, crop: 'limit' },
    ],
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  };
}

/**
 * Cloudinary upload options for variant images.
 */
export function getVariantUploadOptions(
  category: Pick<{ type: string; slug: string; id: string }, 'type' | 'slug' | 'id'>,
  productId: string,
  variantId: string
) {
  const folder = `duggu-arts/products/${category.type}/${category.slug}-${category.id}/${productId}/variants/${variantId}/`;
  
  return {
    folder,
    resource_type: 'image' as const,
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 2000, height: 2000, crop: 'limit' },
    ],
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  };
}

/**
 * Cloudinary upload options for category images.
 */
export function getCategoryUploadOptions(categoryType: 'flowers' | 'bouquets' | 'crafts' | 'other', categoryId: string) {
  const folder = `duggu-arts/categories/${categoryType}/${categoryId}/`;
  
  return {
    folder,
    resource_type: 'image' as const,
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
      { width: 1200, height: 800, crop: 'limit' },
    ],
    overwrite: false,
    unique_filename: true,
    use_filename: true,
  };
}