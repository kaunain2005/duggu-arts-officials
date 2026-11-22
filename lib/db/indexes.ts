import "server-only";

export interface FirestoreIndex {
  collectionGroup: string;
  queryScope: "COLLECTION" | "COLLECTION_GROUP";
  fields: Array<{ fieldPath: string; order?: "ASCENDING" | "DESCENDING"; arrayConfig?: "CONTAINS" }>;
}

export const requiredIndexes: FirestoreIndex[] = [
  {
    collectionGroup: "products",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "categoryId", order: "ASCENDING" },
      { fieldPath: "isFeatured", order: "DESCENDING" },
      { fieldPath: "sortOrder", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: "products",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "slug", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: "products",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "categoryId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "products",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "isFeatured", order: "DESCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "variants",
    queryScope: "COLLECTION_GROUP",
    fields: [
      { fieldPath: "productId", order: "ASCENDING" },
      { fieldPath: "isActive", order: "ASCENDING" },
      { fieldPath: "sortOrder", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: "orders",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "orders",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "orders",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "orders",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "idempotencyKey", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: "inventory",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "availableStock", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: "inventory",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "productId", order: "ASCENDING" },
      { fieldPath: "variantId", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: "reviews",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "productId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "reviews",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "customRequests",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "customRequests",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "inventoryMovements",
    queryScope: "COLLECTION_GROUP",
    fields: [
      { fieldPath: "productId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "inventoryMovements",
    queryScope: "COLLECTION_GROUP",
    fields: [
      { fieldPath: "referenceId", order: "ASCENDING" },
      { fieldPath: "referenceType", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: "orderItems",
    queryScope: "COLLECTION_GROUP",
    fields: [
      { fieldPath: "orderId", order: "ASCENDING" },
    ],
  },
  {
    collectionGroup: "orderStatusHistory",
    queryScope: "COLLECTION_GROUP",
    fields: [
      { fieldPath: "orderId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "addresses",
    queryScope: "COLLECTION_GROUP",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "isDefault", order: "DESCENDING" },
    ],
  },
  {
    collectionGroup: "wishlists",
    queryScope: "COLLECTION_GROUP",
    fields: [
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "addedAt", order: "DESCENDING" },
    ],
  },
];

export function generateFirebaseCLICommands(): string[] {
  return requiredIndexes.map((idx) => {
    const fields = idx.fields
      .map((f) => {
        let str = f.fieldPath;
        if (f.order) str += ` ${f.order}`;
        if (f.arrayConfig) str += ` ${f.arrayConfig}`;
        return str;
      })
      .join(", ");
    return `firebase firestore:indexes create ${idx.collectionGroup} --fields="${fields}"`;
  });
}

export function getIndexDefinitions(): string {
  const commands = generateFirebaseCLICommands();
  return `# Firestore Indexes Deployment Commands
# Run these commands after deploying firestore.rules

${commands.join("\n")}

# Or deploy all at once:
# firebase deploy --only firestore:indexes
`;
}