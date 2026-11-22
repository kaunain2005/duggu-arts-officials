import { Timestamp } from 'firebase-admin/firestore';

export type UserRole = 'customer' | 'manager' | 'admin';
export type ProductStatus = 'draft' | 'published' | 'archived';
export type ProductType = 'made_to_order' | 'tracked_inventory';
export type OrderStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'preparing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_pending';
export type PaymentMethod = 'whatsapp_cod' | 'razorpay' | 'stripe' | 'bank_transfer' | 'cod';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type CustomRequestStatus =
  | 'submitted'
  | 'quoted'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type CategoryType = 'flowers' | 'bouquets' | 'crafts' | 'other';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  providers: ('password' | 'google')[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isAdmin: boolean;
  isActive: boolean;
  role: UserRole;
  permissions: string[];
}

export interface Address {
  id: string;
  userId: string;
  label: 'home' | 'work' | 'other';
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  categoryName: string;
  type: ProductType;
  status: ProductStatus;
  basePrice: number;
  salePrice?: number;
  sku?: string;
  tags: string[];
  isFeatured: boolean;
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  price: number;
  salePrice?: number;
  stock: number;
  lowStockThreshold: number;
  images: string[];
  sortOrder: number;
  isActive: boolean;
  leadTimeDays?: number;
  reservedStock?: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId?: string;
  url: string;
  publicId: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
  width: number;
  height: number;
  format: string;
  bytes: number;
  createdAt: Timestamp;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  type: CategoryType;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  shippingAddress: AddressSnapshot;
  billingAddress?: AddressSnapshot;
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  currency: 'INR';
  whatsappMessage?: string;
  whatsappSentAt?: Timestamp;
  confirmedAt?: Timestamp;
  confirmedBy?: string;
  shippedAt?: Timestamp;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveredAt?: Timestamp;
  cancelledAt?: Timestamp;
  cancellationReason?: string;
  notes?: string;
  adminNotes?: string;
  idempotencyKey: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productType: ProductType;
  leadTimeDays?: number;
  images: string[];
}

export interface AddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  deliveryInstructions?: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;
  changedByRole: 'customer' | 'admin';
  note?: string;
  createdAt: Timestamp;
}

export interface InventoryItem {
  productId: string;
  variantId: string;
  availableStock: number;
  reservedStock: number;
  totalStock: number;
  lowStockThreshold: number;
  lastAdjustedAt: Timestamp;
  lastAdjustedBy: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  variantId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'reservation' | 'release' | 'return' | 'waste';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  referenceType?: 'order' | 'purchase' | 'adjustment' | 'manual';
  note?: string;
  createdBy: string;
  createdAt: Timestamp;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  orderId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  content: string;
  images: string[];
  status: ReviewStatus;
  adminNote?: string;
  helpfulCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
}

export interface CustomRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  title: string;
  description: string;
  occasion?: string;
  preferredColors: string[];
  flowerTypes: string[];
  quantity: number;
  budgetMin: number;
  budgetMax: number;
  deliveryDate?: Timestamp;
  referenceImages: string[];
  status: CustomRequestStatus;
  quotedPrice?: number;
  quotedAt?: Timestamp;
  adminNotes?: string;
  assignedTo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GeneralSettings {
  id: 'general';
  storeName: string;
  storeTagline?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
    youtube?: string;
  };
  currency: 'INR';
  timezone: 'Asia/Kolkata';
  lowStockThreshold: number;
  minOrderAmount: number;
  freeShippingThreshold?: number;
  isStoreOpen: boolean;
  maintenanceMessage?: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface WhatsAppSettings {
  id: 'whatsapp';
  businessNumber: string;
  displayNumber: string;
  defaultMessageTemplate: string;
  isEnabled: boolean;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface ShippingSettings {
  id: 'shipping';
  zones: ShippingZone[];
  defaultZone: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  states: string[];
  baseRate: number;
  perKmRate?: number;
  freeShippingThreshold?: number;
  estimatedDays: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface WishlistItem {
  productId: string;
  variantId?: string;
  addedAt: Timestamp;
}
