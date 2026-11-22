import "server-only";
import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";

const timestampSchema = z.custom<Timestamp>((val) => val instanceof Timestamp, {
  message: "Must be a Firestore Timestamp",
});

export const userProfileSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  photoURL: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  emailVerified: z.boolean(),
  providers: z.array(z.enum(["password", "google"])),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  isAdmin: z.boolean(),
  isActive: z.boolean(),
  role: z.enum(["customer", "manager", "admin"]),
  permissions: z.array(z.string()),
});

export const addressSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  label: z.enum(["home", "work", "other"]).default("home"),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const productSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().min(1),
  shortDescription: z.string().optional(),
  categoryId: z.string().min(1),
  categoryName: z.string().min(1),
  type: z.enum(["made_to_order", "tracked_inventory"]).default("made_to_order"),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  basePrice: z.number().int().nonnegative(),
  salePrice: z.number().int().nonnegative().optional(),
  sku: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  publishedAt: timestampSchema.optional(),
});

export const productVariantSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().optional(),
  price: z.number().int().nonnegative(),
  salePrice: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().default(0),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  images: z.array(z.string().url()).default([]),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  leadTimeDays: z.number().int().positive().optional(),
  reservedStock: z.number().int().nonnegative().optional(),
});

export const productImageSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().optional(),
  url: z.string().url(),
  publicId: z.string().min(1),
  alt: z.string().optional(),
  isPrimary: z.boolean(),
  sortOrder: z.number().int().default(0),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().min(1),
  bytes: z.number().int().positive(),
  createdAt: timestampSchema,
});

export const categorySchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
  type: z.enum(['flowers', 'bouquets', 'crafts', 'other']).default('flowers'),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  productCount: z.number().int().nonnegative().default(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  productSlug: z.string().min(1),
  variantId: z.string().min(1),
  variantName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  totalPrice: z.number().int().nonnegative(),
  productType: z.enum(["made_to_order", "tracked_inventory"]),
  leadTimeDays: z.number().int().positive().optional(),
  images: z.array(z.string().url()).default([]),
});

export const addressSnapshotSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  country: z.string().default("India"),
  deliveryInstructions: z.string().optional(),
});

export const orderSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  userName: z.string().min(1),
  userPhone: z.string().min(1),
  status: z.enum([
    "pending",
    "awaiting_confirmation",
    "confirmed",
    "preparing",
    "ready_to_ship",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "cod_pending"]),
  paymentMethod: z.enum(["whatsapp_cod", "razorpay", "stripe", "bank_transfer", "cod"]),
  items: z.array(orderItemSchema).min(1),
  shippingAddress: addressSnapshotSchema,
  billingAddress: addressSnapshotSchema.optional(),
  subtotal: z.number().int().nonnegative(),
  shipping: z.number().int().nonnegative(),
  discount: z.number().int().nonnegative(),
  tax: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  currency: z.literal("INR"),
  whatsappMessage: z.string().optional(),
  whatsappSentAt: timestampSchema.optional(),
  confirmedAt: timestampSchema.optional(),
  confirmedBy: z.string().optional(),
  shippedAt: timestampSchema.optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  deliveredAt: timestampSchema.optional(),
  cancelledAt: timestampSchema.optional(),
  cancellationReason: z.string().optional(),
  notes: z.string().optional(),
  adminNotes: z.string().optional(),
  idempotencyKey: z.string().min(1),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const orderStatusHistorySchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  fromStatus: z.enum([
    "pending",
    "awaiting_confirmation",
    "confirmed",
    "preparing",
    "ready_to_ship",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  toStatus: z.enum([
    "pending",
    "awaiting_confirmation",
    "confirmed",
    "preparing",
    "ready_to_ship",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  changedBy: z.string().min(1),
  changedByRole: z.enum(["customer", "admin"]),
  note: z.string().optional(),
  createdAt: timestampSchema,
});

export const inventoryItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  availableStock: z.number().int().nonnegative(),
  reservedStock: z.number().int().nonnegative(),
  totalStock: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().positive().default(5),
  lastAdjustedAt: timestampSchema,
  lastAdjustedBy: z.string().min(1),
});

export const inventoryMovementSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().min(1),
  type: z.enum(["purchase", "sale", "adjustment", "reservation", "release", "return", "waste"]),
  quantity: z.number().int(),
  previousStock: z.number().int().nonnegative(),
  newStock: z.number().int().nonnegative(),
  referenceId: z.string().optional(),
  referenceType: z.enum(["order", "purchase", "adjustment", "manual"]).optional(),
  note: z.string().optional(),
  createdBy: z.string().min(1),
  createdAt: timestampSchema,
});

export const reviewSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  userAvatar: z.string().url().optional(),
  orderId: z.string().optional(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  title: z.string().optional(),
  content: z.string().min(1),
  images: z.array(z.string().url()).default([]),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  adminNote: z.string().optional(),
  helpfulCount: z.number().int().nonnegative().default(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  approvedAt: timestampSchema.optional(),
  approvedBy: z.string().optional(),
});

export const customRequestSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  userName: z.string().min(1),
  userEmail: z.string().email(),
  userPhone: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  occasion: z.string().optional(),
  preferredColors: z.array(z.string()).default([]),
  flowerTypes: z.array(z.string()).default([]),
  quantity: z.number().int().positive(),
  budgetMin: z.number().int().nonnegative(),
  budgetMax: z.number().int().nonnegative(),
  deliveryDate: timestampSchema.optional(),
  referenceImages: z.array(z.string().url()).default([]),
  status: z.enum(["submitted", "quoted", "approved", "in_progress", "completed", "cancelled"]).default("submitted"),
  quotedPrice: z.number().int().nonnegative().optional(),
  quotedAt: timestampSchema.optional(),
  adminNotes: z.string().optional(),
  assignedTo: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const generalSettingsSchema = z.object({
  id: z.literal("general"),
  storeName: z.string().min(1),
  storeTagline: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  socialLinks: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    whatsapp: z.string().url().optional(),
    youtube: z.string().url().optional(),
  }).default({}),
  currency: z.literal("INR"),
  timezone: z.literal("Asia/Kolkata"),
  lowStockThreshold: z.number().int().positive().default(5),
  minOrderAmount: z.number().int().nonnegative().default(0),
  freeShippingThreshold: z.number().int().nonnegative().optional(),
  isStoreOpen: z.boolean().default(true),
  maintenanceMessage: z.string().optional(),
  updatedAt: timestampSchema,
  updatedBy: z.string().min(1),
});

export const whatsappSettingsSchema = z.object({
  id: z.literal("whatsapp"),
  businessNumber: z.string().min(1),
  displayNumber: z.string().min(1),
  defaultMessageTemplate: z.string().min(1),
  isEnabled: z.boolean().default(true),
  updatedAt: timestampSchema,
  updatedBy: z.string().min(1),
});

export const shippingZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  states: z.array(z.string()).min(1),
  baseRate: z.number().int().nonnegative(),
  perKmRate: z.number().int().nonnegative().optional(),
  freeShippingThreshold: z.number().int().nonnegative().optional(),
  estimatedDays: z.number().int().positive(),
});

export const shippingSettingsSchema = z.object({
  id: z.literal("shipping"),
  zones: z.array(shippingZoneSchema).default([]),
  defaultZone: z.string().min(1),
  updatedAt: timestampSchema,
  updatedBy: z.string().min(1),
});

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const wishlistItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  addedAt: timestampSchema,
});

export const slugRegistrySchema = z.object({
  slug: z.string().min(1),
  type: z.enum(['category', 'product']),
  resourceId: z.string().min(1),
  createdAt: timestampSchema,
});

export const collections = {
  users: "users",
  products: "products",
  variants: "variants",
  images: "images",
  categories: "categories",
  slugRegistry: "slugRegistry", // For enforcing unique slugs
  orders: "orders",
  orderItems: "orderItems",
  orderStatusHistory: "orderStatusHistory",
  inventory: "inventory",
  inventoryMovements: "inventoryMovements",
  reviews: "reviews",
  customRequests: "customRequests",
  settings: "settings",
  carts: "carts",
  wishlists: "wishlists",
} as const;

export type CollectionName = (typeof collections)[keyof typeof collections];

export type UserProfile = z.infer<typeof userProfileSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type Category = z.infer<typeof categorySchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type AddressSnapshot = z.infer<typeof addressSnapshotSchema>;
export type Order = z.infer<typeof orderSchema>;
export type OrderStatusHistory = z.infer<typeof orderStatusHistorySchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type CustomRequest = z.infer<typeof customRequestSchema>;
export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type WhatsAppSettings = z.infer<typeof whatsappSettingsSchema>;
export type ShippingZone = z.infer<typeof shippingZoneSchema>;
export type ShippingSettings = z.infer<typeof shippingSettingsSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type WishlistItem = z.infer<typeof wishlistItemSchema>;
export type SlugRegistry = z.infer<typeof slugRegistrySchema>;

// Inventory document ID format: `${productId}_${variantId}`
export function getInventoryDocId(productId: string, variantId: string): string {
  return `${productId}_${variantId}`;
}