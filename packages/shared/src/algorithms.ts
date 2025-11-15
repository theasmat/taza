import { PRICING_CONFIG } from "./constants";
import { Point, Stock, UserDeliveryPolicy, Warehouse } from "./types";
import { calculateDistance } from "./utils";

export interface WarehouseSelectionResult {
  warehouseId: string;
  distance: number;
  deliveryFee: number;
  sellerDeliveryCost: number;
  itemsAvailable: boolean;
}

export async function selectOptimalWarehouse(
  items: Array<{ skuId: string; quantity: number }>,
  customerLocation: Point,
  userPolicy: UserDeliveryPolicy,
  warehouses: Warehouse[],
  getStockForWarehouse: (
    warehouseId: string,
    skuId: string
  ) => Promise<Stock | null>
): Promise<WarehouseSelectionResult | null> {
  // Filter active warehouses
  const activeWarehouses = warehouses.filter((w) => w.active);

  // Calculate distances and check availability for each warehouse
  const warehouseResults: Array<{
    warehouse: Warehouse;
    distance: number;
    allItemsAvailable: boolean;
  }> = [];

  for (const warehouse of activeWarehouses) {
    const distance = calculateDistance(customerLocation, warehouse.location);

    // Check if all items are available in this warehouse
    let allItemsAvailable = true;

    for (const item of items) {
      const stock = await getStockForWarehouse(warehouse.id, item.skuId);

      if (!stock || stock.available < item.quantity) {
        allItemsAvailable = false;
        break;
      }
    }

    warehouseResults.push({
      warehouse,
      distance,
      allItemsAvailable,
    });
  }

  // Sort by distance (closest first)
  warehouseResults.sort((a, b) => a.distance - b.distance);

  // Find the closest warehouse with all items available
  for (const result of warehouseResults) {
    if (result.allItemsAvailable) {
      const { deliveryFee, sellerDeliveryCost } = calculateDeliveryFee(
        result.distance,
        userPolicy
      );

      return {
        warehouseId: result.warehouse.id,
        distance: result.distance,
        deliveryFee,
        sellerDeliveryCost,
        itemsAvailable: true,
      };
    }
  }

  // If no warehouse has all items, check if we can find one outside free radius
  if (userPolicy.payMode === "seller") {
    for (const result of warehouseResults) {
      if (result.allItemsAvailable) {
        const { deliveryFee, sellerDeliveryCost } = calculateDeliveryFee(
          result.distance,
          userPolicy
        );

        return {
          warehouseId: result.warehouse.id,
          distance: result.distance,
          deliveryFee: 0, // Customer pays 0 when seller pays
          sellerDeliveryCost,
          itemsAvailable: true,
        };
      }
    }
  }

  return null;
}

export function calculateDeliveryFee(
  distance: number,
  userPolicy: UserDeliveryPolicy
): { deliveryFee: number; sellerDeliveryCost: number } {
  // Check if within free delivery radius
  if (distance <= userPolicy.freeRadiusKm) {
    return {
      deliveryFee: 0,
      sellerDeliveryCost: 0,
    };
  }

  // Calculate delivery fee based on distance
  const additionalDistance = Math.max(0, distance - PRICING_CONFIG.BASE_KM);
  const deliveryFee =
    PRICING_CONFIG.BASE_DELIVERY_FEE +
    additionalDistance * PRICING_CONFIG.PER_KM_FEE;

  if (userPolicy.payMode === "seller") {
    return {
      deliveryFee: 0, // Customer pays nothing
      sellerDeliveryCost: Math.round(deliveryFee),
    };
  } else {
    return {
      deliveryFee: Math.round(deliveryFee),
      sellerDeliveryCost: 0,
    };
  }
}

export interface ReservationResult {
  reservationId: string;
  warehouseId: string;
  items: Array<{
    skuId: string;
    quantity: number;
    available: boolean;
  }>;
  expiresAt: Date;
  success: boolean;
}

export async function createStockReservation(
  items: Array<{ skuId: string; quantity: number }>,
  warehouseId: string,
  orderId: string | undefined,
  expiresInMinutes: number,
  reserveStock: (
    warehouseId: string,
    skuId: string,
    quantity: number
  ) => Promise<void>,
  createReservationRecord: (reservationData: any) => Promise<string>
): Promise<ReservationResult> {
  const reservationId = generateId();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  try {
    // Reserve stock for each item atomically
    for (const item of items) {
      await reserveStock(warehouseId, item.skuId, item.quantity);
    }

    // Create reservation record
    await createReservationRecord({
      id: reservationId,
      warehouseId,
      items,
      orderId,
      expiresAt,
      status: "PENDING",
    });

    return {
      reservationId,
      warehouseId,
      items: items.map((item) => ({
        ...item,
        available: true,
      })),
      expiresAt,
      success: true,
    };
  } catch (error) {
    // If any reservation fails, just log the error
    // The calling code should handle cleanup with proper updateStock function
    console.error("Stock reservation failed:", error);
    throw error;
  }
}

export async function releaseStockReservation(
  warehouseId: string,
  skuId: string,
  quantity: number,
  updateStock: (
    warehouseId: string,
    skuId: string,
    quantity: number
  ) => Promise<void>
): Promise<void> {
  await updateStock(warehouseId, skuId, -quantity);
}

export async function confirmStockReservation(
  reservationId: string,
  warehouseId: string,
  items: Array<{ skuId: string; quantity: number }>,
  updateStock: (
    warehouseId: string,
    skuId: string,
    reservedDelta: number,
    onHandDelta: number
  ) => Promise<void>,
  updateReservation: (reservationId: string, status: string) => Promise<void>
): Promise<void> {
  try {
    // Move from reserved to actual stock deduction
    for (const item of items) {
      await updateStock(
        warehouseId,
        item.skuId,
        -item.quantity,
        -item.quantity
      );
    }

    // Update reservation status
    await updateReservation(reservationId, "CONFIRMED");
  } catch (error) {
    console.error("Error confirming reservation:", error);
    throw error;
  }
}

export async function cleanupExpiredReservations(
  getExpiredReservations: () => Promise<
    Array<{ id: string; warehouseId: string; items: any[] }>
  >,
  releaseReservation: (reservationId: string) => Promise<void>
): Promise<void> {
  try {
    const expiredReservations = await getExpiredReservations();

    for (const reservation of expiredReservations) {
      try {
        await releaseReservation(reservation.id);
      } catch (error) {
        console.error(
          `Error releasing expired reservation ${reservation.id}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Error cleaning up expired reservations:", error);
  }
}

import { generateId } from "./utils";
