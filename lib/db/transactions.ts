import "server-only";
import { adminDb, runTransaction, getDocRef, serverTimestamp, increment, fromDate } from "./firestore";
import { collections, getInventoryDocId } from "./schemas";
import {
  InventoryItem,
  InventoryMovement,
  Order,
  OrderStatus,
  OrderStatusHistory,
  Category,
  Product,
} from "@/lib/types";

export interface StockReservation {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface StockRelease {
  productId: string;
  variantId: string;
  quantity: number;
}

export async function reserveStockForOrder(
  items: Array<{ productId: string; variantId: string; quantity: number }>
): Promise<void> {
  await runTransaction(async (transaction) => {
    for (const item of items) {
      const inventoryDocId = getInventoryDocId(item.productId, item.variantId);
      const inventoryRef = getDocRef(collections.inventory, inventoryDocId);
      const inventorySnap = await transaction.get(inventoryRef);

      if (!inventorySnap.exists) {
        throw new Error(`Inventory not found for product ${item.productId}, variant ${item.variantId}`);
      }

      const inventory = inventorySnap.data() as InventoryItem;
      if (inventory.availableStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}, variant ${item.variantId}`);
      }

      transaction.update(inventoryRef, {
        availableStock: increment(-item.quantity),
        reservedStock: increment(item.quantity),
        lastAdjustedAt: serverTimestamp(),
      });
    }
  });
}

export async function releaseReservedStock(
  items: Array<{ productId: string; variantId: string; quantity: number }>
): Promise<void> {
  await runTransaction(async (transaction) => {
    for (const item of items) {
      const inventoryDocId = getInventoryDocId(item.productId, item.variantId);
      const inventoryRef = getDocRef(collections.inventory, inventoryDocId);
      const inventorySnap = await transaction.get(inventoryRef);

      if (!inventorySnap.exists) continue;

      const inventory = inventorySnap.data() as InventoryItem;
      const releaseQty = Math.min(item.quantity, inventory.reservedStock);

      transaction.update(inventoryRef, {
        availableStock: increment(releaseQty),
        reservedStock: increment(-releaseQty),
        lastAdjustedAt: serverTimestamp(),
      });
    }
  });
}

export async function confirmStockReservation(
  items: Array<{ productId: string; variantId: string; quantity: number }>
): Promise<void> {
  await runTransaction(async (transaction) => {
    for (const item of items) {
      const inventoryDocId = getInventoryDocId(item.productId, item.variantId);
      const inventoryRef = getDocRef(collections.inventory, inventoryDocId);
      const inventorySnap = await transaction.get(inventoryRef);

      if (!inventorySnap.exists) continue;

      const inventory = inventorySnap.data() as InventoryItem;
      const confirmQty = Math.min(item.quantity, inventory.reservedStock);

      transaction.update(inventoryRef, {
        reservedStock: increment(-confirmQty),
        totalStock: increment(-confirmQty),
        lastAdjustedAt: serverTimestamp(),
      });
    }
  });
}

export async function adjustInventoryStock(
  productId: string,
  variantId: string,
  adjustment: number,
  type: InventoryMovement["type"],
  referenceId?: string,
  referenceType?: InventoryMovement["referenceType"],
  note?: string,
  createdBy: string = "system"
): Promise<void> {
  await runTransaction(async (transaction) => {
    const inventoryDocId = getInventoryDocId(productId, variantId);
    const inventoryRef = getDocRef(collections.inventory, inventoryDocId);
    const inventorySnap = await transaction.get(inventoryRef);

    if (!inventorySnap.exists) {
      throw new Error(`Inventory not found for product ${productId}, variant ${variantId}`);
    }

    const inventory = inventorySnap.data() as InventoryItem;
    const previousStock = inventory.totalStock;
    const newStock = previousStock + adjustment;

    if (newStock < 0) {
      throw new Error("Cannot adjust stock below zero");
    }

    transaction.update(inventoryRef, {
      totalStock: newStock,
      availableStock: increment(adjustment),
      lastAdjustedAt: serverTimestamp(),
      lastAdjustedBy: createdBy,
    });

    const movementRef = getDocRef(collections.inventoryMovements, `${inventoryDocId}_${Date.now()}`);
    transaction.set(movementRef, {
      id: movementRef.id,
      productId,
      variantId,
      type,
      quantity: adjustment,
      previousStock,
      newStock,
      referenceId,
      referenceType,
      note,
      createdBy,
      createdAt: serverTimestamp(),
    } as InventoryMovement);
  });
}

export async function createOrderWithStockValidation(
  order: Omit<Order, "id" | "createdAt" | "updatedAt"> & { id: string }
): Promise<void> {
  await runTransaction(async (transaction) => {
    for (const item of order.items) {
      if (item.productType === "tracked_inventory") {
        const inventoryDocId = getInventoryDocId(item.productId, item.variantId);
        const inventoryRef = getDocRef(collections.inventory, inventoryDocId);
        const inventorySnap = await transaction.get(inventoryRef);

        if (!inventorySnap.exists) {
          throw new Error(`Inventory not found for product ${item.productId}, variant ${item.variantId}`);
        }

        const inventory = inventorySnap.data() as InventoryItem;
        if (inventory.availableStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}, variant ${item.variantId}`);
        }
      }
    }

    const orderRef = getDocRef(collections.orders, order.id);
    transaction.set(orderRef, {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    for (const item of order.items) {
      if (item.productType === "tracked_inventory") {
        const inventoryDocId = getInventoryDocId(item.productId, item.variantId);
        const inventoryRef = getDocRef(collections.inventory, inventoryDocId);
        
        // Reserve stock
        transaction.update(inventoryRef, {
          availableStock: increment(-item.quantity),
          reservedStock: increment(item.quantity),
          lastAdjustedAt: serverTimestamp(),
        });

        // Create inventory movement for reservation
        const movementRef = getDocRef(collections.inventoryMovements, `${inventoryDocId}_${Date.now()}_reservation`);
        transaction.set(movementRef, {
          id: movementRef.id,
          productId: item.productId,
          variantId: item.variantId,
          type: "reservation",
          quantity: -item.quantity,
          previousStock: 0, // Will be updated by transaction
          newStock: 0,
          referenceId: order.id,
          referenceType: "order",
          note: `Stock reserved for order ${order.id}`,
          createdBy: order.userId,
          createdAt: serverTimestamp(),
        } as InventoryMovement);
      }
    }
  });
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  changedBy: string,
  changedByRole: "customer" | "admin",
  note?: string
): Promise<void> {
  await runTransaction(async (transaction) => {
    const orderRef = getDocRef(collections.orders, orderId);
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = orderSnap.data() as Order;
    const oldStatus = order.status;

    if (oldStatus === newStatus) return;

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      pending: ["awaiting_confirmation", "cancelled"],
      awaiting_confirmation: ["confirmed", "cancelled"],
      confirmed: ["preparing", "cancelled"],
      preparing: ["ready_to_ship", "cancelled"],
      ready_to_ship: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: ["refunded"],
      cancelled: [],
      refunded: [],
    };

    if (!validTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`);
    }

    if (newStatus === "confirmed" && oldStatus === "awaiting_confirmation") {
      for (const item of order.items) {
        if (item.productType === "tracked_inventory") {
          const inventoryDocId = getInventoryDocId(item.productId, item.variantId);
          const inventoryRef = getDocRef(collections.inventory, inventoryDocId);
          
          // Convert reservation to confirmed sale
          transaction.update(inventoryRef, {
            reservedStock: increment(-item.quantity),
            totalStock: increment(-item.quantity),
            lastAdjustedAt: serverTimestamp(),
          });

          // Create inventory movement for confirmed sale
          const movementRef = getDocRef(collections.inventoryMovements, `${inventoryDocId}_${Date.now()}_sale`);
          transaction.set(movementRef, {
            id: movementRef.id,
            productId: item.productId,
            variantId: item.variantId,
            type: "sale",
            quantity: -item.quantity,
            previousStock: 0,
            newStock: 0,
            referenceId: orderId,
            referenceType: "order",
            note: `Stock confirmed for order ${orderId}`,
            createdBy: changedBy,
            createdAt: serverTimestamp(),
          } as InventoryMovement);
        }
      }
    }

    if (newStatus === "cancelled" && oldStatus !== "pending" && oldStatus !== "awaiting_confirmation") {
      for (const item of order.items) {
        if (item.productType === "tracked_inventory") {
          const inventoryDocId = getInventoryDocId(item.productId, item.variantId);
          const inventoryRef = getDocRef(collections.inventory, inventoryDocId);
          
          // Release reserved stock back to available
          transaction.update(inventoryRef, {
            availableStock: increment(item.quantity),
            reservedStock: increment(-item.quantity),
            lastAdjustedAt: serverTimestamp(),
          });

          // Create inventory movement for release
          const movementRef = getDocRef(collections.inventoryMovements, `${inventoryDocId}_${Date.now()}_release`);
          transaction.set(movementRef, {
            id: movementRef.id,
            productId: item.productId,
            variantId: item.variantId,
            type: "release",
            quantity: item.quantity,
            previousStock: 0,
            newStock: 0,
            referenceId: orderId,
            referenceType: "order",
            note: `Stock released for cancelled order ${orderId}`,
            createdBy: changedBy,
            createdAt: serverTimestamp(),
          } as InventoryMovement);
        }
      }
    }

    transaction.update(orderRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...(newStatus === "confirmed" && { confirmedAt: serverTimestamp(), confirmedBy: changedBy }),
      ...(newStatus === "shipped" && { shippedAt: serverTimestamp() }),
      ...(newStatus === "delivered" && { deliveredAt: serverTimestamp() }),
      ...(newStatus === "cancelled" && { cancelledAt: serverTimestamp(), cancellationReason: note }),
    });

    const historyRef = getDocRef(collections.orderStatusHistory, `${orderId}_${Date.now()}`);
    transaction.set(historyRef, {
      id: historyRef.id,
      orderId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      changedBy,
      changedByRole,
      note,
      createdAt: serverTimestamp(),
    } as OrderStatusHistory);
  });
}

export async function createProductWithDefaults(
  product: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id: string }
): Promise<void> {
  const now = fromDate(new Date());
  await adminDb.collection(collections.products).doc(product.id).set({
    ...product,
    createdAt: now,
    updatedAt: now,
  });
}

export async function createCategoryWithDefaults(
  category: Omit<Category, "id" | "createdAt" | "updatedAt"> & { id: string }
): Promise<void> {
  const now = fromDate(new Date());
  await adminDb.collection(collections.categories).doc(category.id).set({
    ...category,
    createdAt: now,
    updatedAt: now,
  });
}

export async function incrementProductCount(categoryId: string, delta: number): Promise<void> {
  const catRef = getDocRef(collections.categories, categoryId);
  await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(catRef);
    if (snap.exists) {
      const data = snap.data() as { productCount?: number };
      const current = data.productCount || 0;
      transaction.update(catRef, { productCount: Math.max(0, current + delta) });
    }
  });
}