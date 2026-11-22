#!/usr/bin/env tsx

import "server-only";
import { initializeFirstAdmin } from "@/lib/firebase/claims";
import { env } from "@/lib/constants/config";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { GeneralSettings, WhatsAppSettings, ShippingSettings, ShippingZone } from "@/lib/types";

async function main() {
  console.log("🚀 Starting admin initialization...\n");

  try {
    // 1. Initialize first admin user
    const adminEmail = env.INITIAL_ADMIN_EMAIL;
    console.log(`📧 Creating admin user: ${adminEmail}`);
    
    const adminUid = await initializeFirstAdmin(adminEmail);
    console.log(`✅ Admin user created with UID: ${adminUid}\n`);

    // 2. Seed general settings
    console.log("⚙️  Seeding general settings...");
    const now = Timestamp.now();
    
    const generalSettings: GeneralSettings = {
      id: "general",
      storeName: "Duggu Arts Official",
      storeTagline: "Handmade Flowers & Crafts with Love",
      email: "hello@dugguarts.com",
      phone: "+91XXXXXXXXXX",
      address: "123 Art Street, Creative Colony",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      socialLinks: {
        instagram: "https://instagram.com/dugguarts",
        facebook: "https://facebook.com/dugguarts",
        whatsapp: "https://wa.me/91XXXXXXXXXX",
        youtube: "https://youtube.com/@dugguarts",
      },
      currency: "INR",
      timezone: "Asia/Kolkata",
      lowStockThreshold: 5,
      minOrderAmount: 0,
      freeShippingThreshold: 200000, // ₹2000
      isStoreOpen: true,
      maintenanceMessage: "",
      updatedAt: now,
      updatedBy: adminUid,
    };

    await getAdminDb().collection("settings").doc("general").set(generalSettings);
    console.log("✅ General settings seeded\n");

    // 3. Seed WhatsApp settings
    console.log("📱 Seeding WhatsApp settings...");
    const whatsappSettings: WhatsAppSettings = {
      id: "whatsapp",
      businessNumber: env.WHATSAPP_BUSINESS_NUMBER,
      displayNumber: "+91 XXXXX XXXXX",
      defaultMessageTemplate: `Hello! I would like to place an order.

Customer Details:
Name: {{name}}
Phone: {{phone}}

Delivery Address:
{{address}}

Order Details:
{{items}}

Subtotal: {{subtotal}}
Shipping: {{shipping}}
Total: {{total}}

Please confirm my order. Thank you!`,
      isEnabled: true,
      updatedAt: now,
      updatedBy: adminUid,
    };

    await getAdminDb().collection("settings").doc("whatsapp").set(whatsappSettings);
    console.log("✅ WhatsApp settings seeded\n");

    // 4. Seed shipping settings
    console.log("🚚 Seeding shipping settings...");
    const defaultZone: ShippingZone = {
      id: "india-standard",
      name: "Standard Shipping (India)",
      states: [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
        "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
        "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
        "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
        "Uttar Pradesh", "Uttarakhand", "West Bengal",
        "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli",
        "Daman and Diu", "Delhi", "Lakshadweep", "Puducherry", "Jammu and Kashmir", "Ladakh"
      ],
      baseRate: 5000, // ₹50
      perKmRate: 50,
      freeShippingThreshold: 200000, // ₹2000
      estimatedDays: 5,
    };

    const metroZone: ShippingZone = {
      id: "india-metro",
      name: "Metro Cities Express",
      states: ["Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "West Bengal", "Telangana"],
      baseRate: 10000, // ₹100
      perKmRate: 100,
      freeShippingThreshold: 150000, // ₹1500
      estimatedDays: 2,
    };

    const shippingSettings: ShippingSettings = {
      id: "shipping",
      zones: [defaultZone, metroZone],
      defaultZone: "india-standard",
      updatedAt: now,
      updatedBy: adminUid,
    };

    await getAdminDb().collection("settings").doc("shipping").set(shippingSettings);
    console.log("✅ Shipping settings seeded\n");

    // 5. Seed initial categories
    console.log("🌸 Seeding initial categories...");
    const categories = [
      { id: "roses", name: "Roses", slug: "roses", description: "Beautiful handmade pipe-cleaner roses", sortOrder: 1 },
      { id: "tulips", name: "Tulips", slug: "tulips", description: "Elegant handmade pipe-cleaner tulips", sortOrder: 2 },
      { id: "daisies", name: "Daisies", slug: "daisies", description: "Cheerful handmade pipe-cleaner daisies", sortOrder: 3 },
      { id: "bouquets", name: "Bouquets", slug: "bouquets", description: "Handmade bouquets in various sizes", sortOrder: 4 },
      { id: "custom", name: "Custom Orders", slug: "custom", description: "Personalized flower arrangements", sortOrder: 5 },
      { id: "gifts", name: "Personalized Gifts", slug: "gifts", description: "Custom gifts with floral touches", sortOrder: 6 },
    ];

    for (const cat of categories) {
      await getAdminDb().collection("categories").doc(cat.id).set({
        ...cat,
        isActive: true,
        productCount: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log("✅ Categories seeded\n");

    console.log("🎉 Admin initialization complete!");
    console.log(`
┌─────────────────────────────────────────────────────────────┐
│                    SETUP COMPLETE                             │
├─────────────────────────────────────────────────────────────┤
│  Admin UID: ${adminUid}
│  Admin Email: ${adminEmail}
│  Default Categories: ${categories.length}
│  Settings: General, WhatsApp, Shipping
│                                                               │
│  Next Steps:                                                  │
│  1. Configure .env.local with real Firebase credentials      │
│  2. Run 'npm run dev' to start development                   │
│  3. Visit /admin to access dashboard                         │
└─────────────────────────────────────────────────────────────┘
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Admin initialization failed:", error);
    process.exit(1);
  }
}

main();