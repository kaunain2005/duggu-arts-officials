#!/usr/bin/env tsx

import "server-only";
import { adminDb } from "@/lib/db/firestore";
import { collections, getInventoryDocId } from "@/lib/db/schemas";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { Product, ProductVariant, Category } from "@/lib/types";

async function main() {
  // Block execution in production
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Dev seed script cannot run in production");
    process.exit(1);
  }

  console.log("🌱 Seeding development data...\n");

  const now = Timestamp.now();

  try {
    // Create sample products
    const products: (Omit<Product, "id" | "createdAt" | "updatedAt"> & { id: string })[] = [
      {
        id: "prod-red-rose",
        slug: "red-rose",
        name: "Handmade Red Rose",
        description: "A beautiful handmade red rose crafted from premium pipe cleaners. Perfect for expressing love and admiration. Each petal is carefully shaped and assembled by hand.",
        shortDescription: "Premium handmade red pipe-cleaner rose",
        categoryId: "roses",
        categoryName: "Roses",
        type: "made_to_order",
        status: "published",
        basePrice: 15000, // ₹150
        salePrice: 12000, // ₹120
        sku: "RR-001",
        tags: ["valentine", "anniversary", "romantic", "red"],
        isFeatured: true,
        sortOrder: 1,
        seoTitle: "Handmade Red Rose | Duggu Arts Official",
        seoDescription: "Beautiful handmade pipe-cleaner red rose. Perfect for gifting on Valentine's Day, anniversaries, or any romantic occasion.",
      },
      {
        id: "prod-pink-rose",
        slug: "pink-rose",
        name: "Handmade Pink Rose",
        description: "A delicate pink rose made from soft pipe cleaners. Symbolizes grace, elegance, and sweetness. Ideal for birthdays, thank you gifts, or just to brighten someone's day.",
        shortDescription: "Delicate handmade pink pipe-cleaner rose",
        categoryId: "roses",
        categoryName: "Roses",
        type: "made_to_order",
        status: "published",
        basePrice: 15000,
        salePrice: undefined,
        sku: "RR-002",
        tags: ["birthday", "thank-you", "pink", "elegant"],
        isFeatured: true,
        sortOrder: 2,
        seoTitle: "Handmade Pink Rose | Duggu Arts Official",
        seoDescription: "Delicate handmade pipe-cleaner pink rose. Perfect for birthdays, thank you gifts, or expressing appreciation.",
      },
      {
        id: "prod-yellow-tulip",
        slug: "yellow-tulip",
        name: "Handmade Yellow Tulip",
        description: "A cheerful yellow tulip symbolizing sunshine and happiness. Handcrafted with attention to detail, this tulip brings warmth to any space.",
        shortDescription: "Sunny handmade yellow pipe-cleaner tulip",
        categoryId: "tulips",
        categoryName: "Tulips",
        type: "made_to_order",
        status: "published",
        basePrice: 12000,
        salePrice: 10000,
        sku: "YT-001",
        tags: ["spring", "cheerful", "yellow", "sunshine"],
        isFeatured: false,
        sortOrder: 1,
        seoTitle: "Handmade Yellow Tulip | Duggu Arts Official",
        seoDescription: "Cheerful handmade pipe-cleaner yellow tulip. Perfect for spring celebrations and brightening someone's day.",
      },
      {
        id: "prod-white-daisy",
        slug: "white-daisy",
        name: "Handmade White Daisy",
        description: "A pure white daisy representing innocence and purity. Each petal is individually crafted and assembled to create a lifelike flower that lasts forever.",
        shortDescription: "Pure handmade white pipe-cleaner daisy",
        categoryId: "daisies",
        categoryName: "Daisies",
        type: "made_to_order",
        status: "published",
        basePrice: 8000,
        salePrice: undefined,
        sku: "WD-001",
        tags: ["innocence", "purity", "white", "simple"],
        isFeatured: false,
        sortOrder: 1,
        seoTitle: "Handmade White Daisy | Duggu Arts Official",
        seoDescription: "Pure handmade pipe-cleaner white daisy. Symbolizes innocence and new beginnings.",
      },
      {
        id: "prod-bouquet-3",
        slug: "bouquet-3-roses",
        name: "Mini Rose Bouquet (3 Roses)",
        description: "A charming mini bouquet of 3 handmade roses. Perfect for small gestures, desk decoration, or as part of a larger gift. Mix of red and pink roses.",
        shortDescription: "Mini bouquet of 3 handmade roses",
        categoryId: "bouquets",
        categoryName: "Bouquets",
        type: "tracked_inventory",
        status: "published",
        basePrice: 35000, // ₹350
        salePrice: 30000, // ₹300
        sku: "BQ-003",
        tags: ["bouquet", "gift", "mini", "roses"],
        isFeatured: true,
        sortOrder: 1,
        seoTitle: "Mini Rose Bouquet (3 Roses) | Duggu Arts Official",
        seoDescription: "Charming mini bouquet of 3 handmade pipe-cleaner roses. Perfect for small gifts and desk decoration.",
      },
      {
        id: "prod-bouquet-5",
        slug: "bouquet-5-mixed",
        name: "Mixed Flower Bouquet (5 Flowers)",
        description: "A beautiful bouquet of 5 mixed handmade flowers - roses, tulips, and daisies. Wrapped in premium paper with a personalized note card included.",
        shortDescription: "Mixed bouquet of 5 handmade flowers",
        categoryId: "bouquets",
        categoryName: "Bouquets",
        type: "tracked_inventory",
        status: "published",
        basePrice: 55000, // ₹550
        salePrice: 49000, // ₹490
        sku: "BQ-005",
        tags: ["bouquet", "mixed", "gift", "premium"],
        isFeatured: true,
        sortOrder: 2,
        seoTitle: "Mixed Flower Bouquet (5 Flowers) | Duggu Arts Official",
        seoDescription: "Beautiful mixed bouquet of 5 handmade pipe-cleaner flowers. Includes personalized note card and premium wrapping.",
      },
      {
        id: "prod-bouquet-10",
        slug: "bouquet-10-grand",
        name: "Grand Rose Bouquet (10 Roses)",
        description: "An impressive grand bouquet of 10 handmade roses in a stunning arrangement. Comes in a luxury gift box with ribbon and personalized message card. Perfect for anniversaries, proposals, or major celebrations.",
        shortDescription: "Grand bouquet of 10 handmade roses in luxury box",
        categoryId: "bouquets",
        categoryName: "Bouquets",
        type: "made_to_order",
        status: "published",
        basePrice: 120000, // ₹1200
        salePrice: 100000, // ₹1000
        sku: "BQ-010",
        tags: ["bouquet", "grand", "luxury", "anniversary", "proposal"],
        isFeatured: true,
        sortOrder: 3,
        seoTitle: "Grand Rose Bouquet (10 Roses) | Duggu Arts Official",
        seoDescription: "Impressive grand bouquet of 10 handmade pipe-cleaner roses in luxury gift box. Perfect for anniversaries and special occasions.",
      },
    ];

    console.log(`📦 Creating ${products.length} products...`);
    for (const product of products) {
      await adminDb.collection(collections.products).doc(product.id).set({
        ...product,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
      });
      console.log(`  ✅ ${product.name}`);
    }

    // Create variants for tracked inventory products
    const variants: (Omit<ProductVariant, "id"> & { id: string })[] = [
      // Mini bouquet variants
      {
        id: "var-bq3-red",
        productId: "prod-bouquet-3",
        name: "Red Roses",
        sku: "BQ-003-RED",
        price: 35000,
        salePrice: 30000,
        stock: 20,
        lowStockThreshold: 5,
        images: [],
        sortOrder: 1,
        isActive: true,
        leadTimeDays: undefined,
        reservedStock: 0,
      },
      {
        id: "var-bq3-pink",
        productId: "prod-bouquet-3",
        name: "Pink Roses",
        sku: "BQ-003-PINK",
        price: 35000,
        salePrice: 30000,
        stock: 15,
        lowStockThreshold: 5,
        images: [],
        sortOrder: 2,
        isActive: true,
        leadTimeDays: undefined,
        reservedStock: 0,
      },
      {
        id: "var-bq3-mixed",
        productId: "prod-bouquet-3",
        name: "Mixed (Red & Pink)",
        sku: "BQ-003-MIX",
        price: 35000,
        salePrice: 30000,
        stock: 25,
        lowStockThreshold: 5,
        images: [],
        sortOrder: 3,
        isActive: true,
        leadTimeDays: undefined,
        reservedStock: 0,
      },
      // 5-flower bouquet variants
      {
        id: "var-bq5-standard",
        productId: "prod-bouquet-5",
        name: "Standard Mix",
        sku: "BQ-005-STD",
        price: 55000,
        salePrice: 49000,
        stock: 10,
        lowStockThreshold: 3,
        images: [],
        sortOrder: 1,
        isActive: true,
        leadTimeDays: undefined,
        reservedStock: 0,
      },
      {
        id: "var-bq5-premium",
        productId: "prod-bouquet-5",
        name: "Premium Mix (with Baby's Breath)",
        sku: "BQ-005-PREM",
        price: 65000,
        salePrice: 59000,
        stock: 8,
        lowStockThreshold: 3,
        images: [],
        sortOrder: 2,
        isActive: true,
        leadTimeDays: undefined,
        reservedStock: 0,
      },
    ];

    console.log(`\n🔧 Creating ${variants.length} variants...`);
    for (const variant of variants) {
      await adminDb
        .collection(collections.products)
        .doc(variant.productId)
        .collection(collections.variants)
        .doc(variant.id)
        .set({
          ...variant,
          createdAt: now,
          updatedAt: now,
        });
      console.log(`  ✅ ${variant.name} (${variant.productId})`);
    }

    // Initialize inventory for tracked inventory products (per-variant)
    const inventoryItems = [
      { productId: "prod-bouquet-3", variantId: "var-bq3-red", availableStock: 20, reservedStock: 0, totalStock: 20, lowStockThreshold: 5 },
      { productId: "prod-bouquet-3", variantId: "var-bq3-pink", availableStock: 15, reservedStock: 0, totalStock: 15, lowStockThreshold: 5 },
      { productId: "prod-bouquet-3", variantId: "var-bq3-mixed", availableStock: 25, reservedStock: 0, totalStock: 25, lowStockThreshold: 5 },
      { productId: "prod-bouquet-5", variantId: "var-bq5-standard", availableStock: 10, reservedStock: 0, totalStock: 10, lowStockThreshold: 3 },
      { productId: "prod-bouquet-5", variantId: "var-bq5-premium", availableStock: 8, reservedStock: 0, totalStock: 8, lowStockThreshold: 3 },
    ];

    console.log(`\n📊 Initializing inventory...`);
    for (const inv of inventoryItems) {
      const docId = getInventoryDocId(inv.productId, inv.variantId);
      await adminDb.collection(collections.inventory).doc(docId).set({
        ...inv,
        lastAdjustedAt: now,
        lastAdjustedBy: "system:seed",
      });
      console.log(`  ✅ Inventory for ${docId}`);
    }

    // Create additional categories
    const additionalCategories: (Omit<Category, "id" | "createdAt" | "updatedAt"> & { id: string })[] = [
      {
        id: "seasonal",
        slug: "seasonal",
        name: "Seasonal Specials",
        description: "Limited edition flowers for special seasons and festivals",
        sortOrder: 7,
        isActive: true,
        productCount: 0,
      },
      {
        id: "wedding",
        slug: "wedding",
        name: "Wedding Collection",
        description: "Elegant floral arrangements for weddings and ceremonies",
        sortOrder: 8,
        isActive: true,
        productCount: 0,
      },
    ];

    console.log(`\n📁 Creating additional categories...`);
    for (const cat of additionalCategories) {
      await adminDb.collection(collections.categories).doc(cat.id).set({
        ...cat,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  ✅ ${cat.name}`);
    }

    console.log(`
┌─────────────────────────────────────────────────────────────┐
│                    DEV DATA SEEDED                            │
├─────────────────────────────────────────────────────────────┤
│  Products: ${products.length}
│  Variants: ${variants.length}
│  Inventory Items: ${inventoryItems.length}
│  Categories: ${additionalCategories.length} (additional)
│                                                               │
│  Featured Products:                                          │
│  • Handmade Red Rose (made_to_order)                         │
│  • Handmade Pink Rose (made_to_order)                        │
│  • Mini Rose Bouquet 3 (tracked_inventory)                   │
│  • Mixed Bouquet 5 (tracked_inventory)                       │
│  • Grand Bouquet 10 (made_to_order)                          │
└─────────────────────────────────────────────────────────────┘
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Dev seeding failed:", error);
    process.exit(1);
  }
}

main();