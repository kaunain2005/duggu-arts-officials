import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number (use E.164 format)');
export const urlSchema = z.string().url('Invalid URL');
export const positiveIntSchema = z.coerce.number().int().positive();
export const nonNegativeIntSchema = z.coerce.number().int().nonnegative();
export const priceSchema = z.coerce.number().int().nonnegative(); // in paise

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Cursor-based pagination
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(), // Firestore document snapshot cursor
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const addressSchema = z.object({
  label: z.enum(['home', 'work', 'other']).default('home'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: phoneSchema,
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid PIN code (6 digits)'),
  country: z.string().default('India'),
  isDefault: z.boolean().default(false),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'At least one item required'),
  shippingAddress: addressSchema,
  idempotencyKey: z.string().min(1, 'Idempotency key required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'awaiting_confirmation',
    'confirmed',
    'preparing',
    'ready_to_ship',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  note: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  type: z.enum(['made_to_order', 'tracked_inventory']).default('made_to_order'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  basePrice: priceSchema,
  salePrice: priceSchema.optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  price: priceSchema,
  salePrice: priceSchema.optional(),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  images: z.array(z.string().url()).default([]),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  leadTimeDays: z.number().int().positive().optional(),
});

export const categoryTypeSchema = z.enum(['flowers', 'bouquets', 'crafts', 'other']);

export const categoryBaseSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
  type: z.enum(['flowers', 'bouquets', 'crafts', 'other']).default('flowers'),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  productCount: z.number().int().nonnegative().default(0),
});

export const categoryCreateSchema = categoryBaseSchema.extend({
  // slug is auto-generated from name if not provided
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

export const categoryUpdateSchema = categoryBaseSchema.partial().extend({
  id: z.string().min(1),
  newSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

export const categoryReorderSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string().min(1),
      sortOrder: z.number().int(),
    })
  ),
});

export const categoryDeleteSchema = z.object({
  id: z.string().min(1),
  reassignProductIds: z.array(z.string()).optional(), // Products to reassign before delete
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().min(1, 'Review content is required'),
  images: z.array(z.string().url()).default([]),
});

export const customRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  occasion: z.string().optional(),
  preferredColors: z.array(z.string()).default([]),
  flowerTypes: z.array(z.string()).default([]),
  quantity: z.number().int().positive(),
  budgetMin: priceSchema,
  budgetMax: priceSchema,
  deliveryDate: z.string().datetime().optional(),
  referenceImages: z.array(z.string().url()).default([]),
});

export const settingsSchema = z.object({
  storeName: z.string().min(1),
  storeTagline: z.string().optional(),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  socialLinks: z
    .object({
      instagram: urlSchema.optional(),
      facebook: urlSchema.optional(),
      whatsapp: urlSchema.optional(),
      youtube: urlSchema.optional(),
    })
    .default({}),
  currency: z.literal('INR'),
  timezone: z.literal('Asia/Kolkata'),
  lowStockThreshold: z.number().int().positive().default(5),
  minOrderAmount: priceSchema.default(0),
  freeShippingThreshold: priceSchema.optional(),
  isStoreOpen: z.boolean().default(true),
  maintenanceMessage: z.string().optional(),
});

export const whatsappSettingsSchema = z.object({
  businessNumber: phoneSchema,
  displayNumber: z.string().min(1),
  defaultMessageTemplate: z.string().min(1),
  isEnabled: z.boolean().default(true),
});

export const shippingZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  states: z.array(z.string()).min(1),
  baseRate: priceSchema,
  perKmRate: priceSchema.optional(),
  freeShippingThreshold: priceSchema.optional(),
  estimatedDays: z.number().int().positive(),
});

// Search and filter schemas
export const productFilterSchema = z.object({
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  type: z.enum(['made_to_order', 'tracked_inventory']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  minPrice: priceSchema.optional(),
  maxPrice: priceSchema.optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  search: z.string().optional(),
});

export const categoryFilterSchema = z.object({
  type: z.enum(['flowers', 'bouquets', 'crafts', 'other']).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional(),
});

export const productSortSchema = z.object({
  sortBy: z.enum(['name', 'basePrice', 'salePrice', 'createdAt', 'sortOrder', 'isFeatured']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Product image schema
export const productImageSchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.string().url(),
  alt: z.string().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().optional(),
  bytes: z.number().int().positive().optional(),
  variantId: z.string().optional(),
});

// Product variant schemas
export const productVariantCreateSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  price: priceSchema,
  salePrice: priceSchema.optional(),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  images: z.array(z.string().url()).default([]),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  leadTimeDays: z.number().int().positive().optional(),
});

export const productVariantUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().optional(),
  price: priceSchema.optional(),
  salePrice: priceSchema.optional(),
  stock: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  images: z.array(z.string().url()).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  leadTimeDays: z.number().int().positive().optional(),
});

// Product image metadata schema (for Firestore storage)
export const productImageMetadataSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().optional(),
  publicId: z.string().min(1),
  secureUrl: z.string().url(),
  alt: z.string().optional(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().optional(),
  bytes: z.number().int().positive().optional(),
  createdAt: z.any(), // Timestamp
});

// Product create schema (extends productSchema with required fields for creation)
export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  type: z.enum(['made_to_order', 'tracked_inventory']).default('made_to_order'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  basePrice: priceSchema,
  salePrice: priceSchema.optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  variants: z.array(
    z.object({
      name: z.string().min(1, 'Variant name is required'),
      sku: z.string().optional(),
      price: priceSchema,
      salePrice: priceSchema.optional(),
      stock: z.number().int().nonnegative().default(0),
      lowStockThreshold: z.number().int().nonnegative().default(5),
      images: z.array(z.string().url()).default([]),
      sortOrder: z.number().int().default(0),
      isActive: z.boolean().default(true),
      leadTimeDays: z.number().int().positive().optional(),
    })
  ).default([]),
  images: z
    .array(
      z.object({
        publicId: z.string().min(1),
        secureUrl: z.string().url(),
        alt: z.string().optional(),
        isPrimary: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        format: z.string().optional(),
        bytes: z.number().int().positive().optional(),
        variantId: z.string().optional(),
      })
    )
    .default([]),
});

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.enum(['made_to_order', 'tracked_inventory']).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  basePrice: priceSchema.optional(),
  salePrice: priceSchema.optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).optional(),
        sku: z.string().optional(),
        price: priceSchema.optional(),
        salePrice: priceSchema.optional(),
        stock: z.number().int().nonnegative().optional(),
        lowStockThreshold: z.number().int().nonnegative().optional(),
        images: z.array(z.string().url()).optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
        leadTimeDays: z.number().int().positive().optional(),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        publicId: z.string().min(1),
        secureUrl: z.string().url(),
        alt: z.string().optional(),
        isPrimary: z.boolean().optional(),
        sortOrder: z.number().int().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
        format: z.string().optional(),
        bytes: z.number().int().positive().optional(),
        variantId: z.string().optional(),
      })
    )
    .optional(),
  newSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
});

// Signed upload schema
export const signedUploadSchema = z.object({
  folder: z.string().min(1),
  resourceType: z.enum(['image', 'video', 'raw']).default('image'),
  maxFileSize: z.number().int().positive().max(100 * 1024 * 1024).default(10 * 1024 * 1024),
  allowedFormats: z.array(z.string()).default(['jpg', 'jpeg', 'png', 'webp', 'avif']),
  transformation: z
    .object({
      width: z.number().int().positive().max(4000).optional(),
      height: z.number().int().positive().max(4000).optional(),
      quality: z.union([z.string(), z.number()]).default('auto'),
      fetchFormat: z.string().default('auto'),
    })
    .optional(),
});

// Cursor-based pagination for products
export const productCursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(['name', 'basePrice', 'salePrice', 'createdAt', 'sortOrder', 'isFeatured'])
    .default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});