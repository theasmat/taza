import { z } from "zod";

// Base event schema
export const BaseEventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.string(),
  aggregateId: z.string(),
  timestamp: z.string().datetime(),
  source: z.string(),
  version: z.string().default("1.0"),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

// User events
export const UserCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("user.created"),
  payload: z.object({
    userId: z.string(),
    email: z.string().email(),
    name: z.string(),
    roles: z.array(z.string()),
  }),
});

export type UserCreatedEvent = z.infer<typeof UserCreatedEventSchema>;

// Product events
export const ProductCreatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("product.created"),
  payload: z.object({
    productId: z.string(),
    vendorId: z.string(),
    name: z.string(),
    category: z.string(),
  }),
});

export const PriceUpdatedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("price.updated"),
  payload: z.object({
    skuId: z.string(),
    oldPrice: z.number(),
    newPrice: z.number(),
    currency: z.string(),
  }),
});

export type ProductCreatedEvent = z.infer<typeof ProductCreatedEventSchema>;
export type PriceUpdatedEvent = z.infer<typeof PriceUpdatedEventSchema>;

// Order events
export const OrderPlacedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("order.placed"),
  payload: z.object({
    orderId: z.string(),
    userId: z.string(),
    warehouseId: z.string(),
    items: z.array(
      z.object({
        skuId: z.string(),
        quantity: z.number(),
        price: z.number(),
      })
    ),
    subtotal: z.number(),
    deliveryFee: z.number(),
    total: z.number(),
    paymentMethod: z.string(),
  }),
});

export const OrderCancelledEventSchema = BaseEventSchema.extend({
  eventType: z.literal("order.cancelled"),
  payload: z.object({
    orderId: z.string(),
    userId: z.string(),
    reason: z.string(),
    cancelledAt: z.string().datetime(),
  }),
});

export const OrderCODConfirmedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("order.cod.confirmed"),
  payload: z.object({
    orderId: z.string(),
    confirmedBy: z.string(),
    confirmedAt: z.string().datetime(),
  }),
});

export type OrderPlacedEvent = z.infer<typeof OrderPlacedEventSchema>;
export type OrderCancelledEvent = z.infer<typeof OrderCancelledEventSchema>;
export type OrderCODConfirmedEvent = z.infer<
  typeof OrderCODConfirmedEventSchema
>;

// Inventory events
export const InventoryReservedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("inventory.reserved"),
  payload: z.object({
    reservationId: z.string(),
    warehouseId: z.string(),
    skuId: z.string(),
    quantity: z.number(),
    orderId: z.string(),
    expiresAt: z.string().datetime(),
  }),
});

export const InventoryConfirmedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("inventory.confirmed"),
  payload: z.object({
    reservationId: z.string(),
    warehouseId: z.string(),
    skuId: z.string(),
    quantity: z.number(),
    orderId: z.string(),
  }),
});

export const InventoryReleasedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("inventory.released"),
  payload: z.object({
    reservationId: z.string(),
    warehouseId: z.string(),
    skuId: z.string(),
    quantity: z.number(),
    reason: z.string(),
  }),
});

export type InventoryReservedEvent = z.infer<
  typeof InventoryReservedEventSchema
>;
export type InventoryConfirmedEvent = z.infer<
  typeof InventoryConfirmedEventSchema
>;
export type InventoryReleasedEvent = z.infer<
  typeof InventoryReleasedEventSchema
>;

// Fulfillment events
export const FulfillmentAssignedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("fulfillment.assigned"),
  payload: z.object({
    taskId: z.string(),
    orderId: z.string(),
    warehouseId: z.string(),
    assignedTo: z.string(),
  }),
});

export const FulfillmentPickedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("fulfillment.picked"),
  payload: z.object({
    taskId: z.string(),
    orderId: z.string(),
    pickedBy: z.string(),
    pickedAt: z.string().datetime(),
  }),
});

export const FulfillmentPackedEventSchema = BaseEventSchema.extend({
  eventType: z.literal("fulfillment.packed"),
  payload: z.object({
    taskId: z.string(),
    orderId: z.string(),
    packedBy: z.string(),
    packedAt: z.string().datetime(),
  }),
});

export const FulfillmentOutForDeliveryEventSchema = BaseEventSchema.extend({
  eventType: z.literal("fulfillment.out_for_delivery"),
  payload: z.object({
    orderId: z.string(),
    riderId: z.string(),
    estimatedDeliveryTime: z.string().datetime(),
  }),
});

export const FulfillmentDeliveredEventSchema = BaseEventSchema.extend({
  eventType: z.literal("fulfillment.delivered"),
  payload: z.object({
    orderId: z.string(),
    riderId: z.string(),
    deliveredAt: z.string().datetime(),
    signature: z.string().optional(),
  }),
});

export type FulfillmentAssignedEvent = z.infer<
  typeof FulfillmentAssignedEventSchema
>;
export type FulfillmentPickedEvent = z.infer<
  typeof FulfillmentPickedEventSchema
>;
export type FulfillmentPackedEvent = z.infer<
  typeof FulfillmentPackedEventSchema
>;
export type FulfillmentOutForDeliveryEvent = z.infer<
  typeof FulfillmentOutForDeliveryEventSchema
>;
export type FulfillmentDeliveredEvent = z.infer<
  typeof FulfillmentDeliveredEventSchema
>;

// Event union type
export type PlatformEvent =
  | UserCreatedEvent
  | ProductCreatedEvent
  | PriceUpdatedEvent
  | OrderPlacedEvent
  | OrderCancelledEvent
  | OrderCODConfirmedEvent
  | InventoryReservedEvent
  | InventoryConfirmedEvent
  | InventoryReleasedEvent
  | FulfillmentAssignedEvent
  | FulfillmentPickedEvent
  | FulfillmentPackedEvent
  | FulfillmentOutForDeliveryEvent
  | FulfillmentDeliveredEvent;

// Event topic to type mapping
export interface EventTypeMap {
  "user.created": UserCreatedEvent;
  "product.created": ProductCreatedEvent;
  "price.updated": PriceUpdatedEvent;
  "order.placed": OrderPlacedEvent;
  "order.cancelled": OrderCancelledEvent;
  "order.cod.confirmed": OrderCODConfirmedEvent;
  "inventory.reserved": InventoryReservedEvent;
  "inventory.confirmed": InventoryConfirmedEvent;
  "inventory.released": InventoryReleasedEvent;
  "fulfillment.assigned": FulfillmentAssignedEvent;
  "fulfillment.picked": FulfillmentPickedEvent;
  "fulfillment.packed": FulfillmentPackedEvent;
  "fulfillment.out_for_delivery": FulfillmentOutForDeliveryEvent;
  "fulfillment.delivered": FulfillmentDeliveredEvent;
}
