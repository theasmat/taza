import { z } from 'zod';

// Common schemas
export const PointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

export const AddressSchema = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1).default('India'),
  location: PointSchema
});

// Auth DTOs
export const RegisterUserDTOSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  name: z.string().min(2),
  password: z.string().min(8),
  roles: z.array(z.enum(['customer', 'vendor', 'warehouse_staff', 'rider'])).default(['customer'])
});

export const LoginDTOSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const RefreshTokenDTOSchema = z.object({
  refreshToken: z.string()
});

export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    roles: z.array(z.string())
  }),
  accessToken: z.string(),
  refreshToken: z.string()
});

// Catalog DTOs
export const CreateProductDTOSchema = z.object({
  vendorId: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  attributes: z.record(z.any()).optional(),
  images: z.array(z.string().url()).optional()
});

export const CreateSKUDTOSchema = z.object({
  productId: z.string(),
  name: z.string().min(1),
  attributes: z.record(z.any()),
  barcode: z.string().optional(),
  weight: z.number().positive(),
  dimensions: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    height: z.number().positive()
  })
});

export const UpdatePriceDTOSchema = z.object({
  skuId: z.string(),
  mrp: z.number().positive(),
  salePrice: z.number().positive(),
  taxIncluded: z.boolean(),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional()
});

// Inventory DTOs
export const CheckAvailabilityDTOSchema = z.object({
  items: z.array(z.object({
    skuId: z.string(),
    quantity: z.number().int().positive()
  })),
  location: PointSchema,
  userId: z.string()
});

export const AvailabilityResponseSchema = z.object({
  available: z.boolean(),
  warehouseId: z.string().optional(),
  distanceKm: z.number().optional(),
  items: z.array(z.object({
    skuId: z.string(),
    available: z.boolean(),
    availableQuantity: z.number()
  }))
});

export const CreateReservationDTOSchema = z.object({
  items: z.array(z.object({
    skuId: z.string(),
    quantity: z.number().int().positive(),
    warehouseId: z.string()
  })),
  orderId: z.string().optional()
});

export const ReservationResponseSchema = z.object({
  reservationId: z.string(),
  items: z.array(z.object({
    skuId: z.string(),
    warehouseId: z.string(),
    quantity: z.number(),
    status: z.enum(['PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED'])
  })),
  expiresAt: z.string().datetime()
});

// Pricing DTOs
export const QuoteRequestDTOSchema = z.object({
  items: z.array(z.object({
    skuId: z.string(),
    quantity: z.number().int().positive()
  })),
  address: AddressSchema,
  userId: z.string()
});

export const QuoteResponseSchema = z.object({
  warehouseId: z.string(),
  items: z.array(z.object({
    skuId: z.string(),
    quantity: z.number(),
    price: z.number(),
    tax: z.number(),
    total: z.number()
  })),
  subtotal: z.number(),
  tax: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
  sellerDeliveryCost: z.number(),
  estimatedDeliveryTime: z.string().datetime()
});

// Orders DTOs
export const AddToCartDTOSchema = z.object({
  userId: z.string(),
  skuId: z.string(),
  quantity: z.number().int().positive()
});

export const CheckoutDTOSchema = z.object({
  userId: z.string(),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
  paymentMethod: z.literal('COD'),
  idempotencyKey: z.string()
});

export const OrderResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  warehouseId: z.string(),
  status: z.enum(['PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  items: z.array(z.object({
    id: z.string(),
    skuId: z.string(),
    productId: z.string(),
    quantity: z.number(),
    price: z.number(),
    total: z.number()
  })),
  subtotal: z.number(),
  tax: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
  paymentMethod: z.string(),
  paymentStatus: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED']),
  createdAt: z.string().datetime(),
  estimatedDeliveryTime: z.string().datetime()
});

// Fulfillment DTOs
export const CreateFulfillmentTaskDTOSchema = z.object({
  orderId: z.string(),
  warehouseId: z.string(),
  items: z.array(z.object({
    skuId: z.string(),
    quantity: z.number().int().positive()
  }))
});

export const UpdateFulfillmentStatusDTOSchema = z.object({
  taskId: z.string(),
  status: z.enum(['ASSIGNED', 'PICKING', 'PICKED', 'PACKING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED']),
  assignedTo: z.string().optional(),
  items: z.array(z.object({
    skuId: z.string(),
    pickedQuantity: z.number().int().nonnegative()
  })).optional()
});

// Export types
export type RegisterUserDTO = z.infer<typeof RegisterUserDTOSchema>;
export type LoginDTO = z.infer<typeof LoginDTOSchema>;
export type RefreshTokenDTO = z.infer<typeof RefreshTokenDTOSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export type CreateProductDTO = z.infer<typeof CreateProductDTOSchema>;
export type CreateSKUDTO = z.infer<typeof CreateSKUDTOSchema>;
export type UpdatePriceDTO = z.infer<typeof UpdatePriceDTOSchema>;

export type CheckAvailabilityDTO = z.infer<typeof CheckAvailabilityDTOSchema>;
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
export type CreateReservationDTO = z.infer<typeof CreateReservationDTOSchema>;
export type ReservationResponse = z.infer<typeof ReservationResponseSchema>;

export type QuoteRequestDTO = z.infer<typeof QuoteRequestDTOSchema>;
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

export type AddToCartDTO = z.infer<typeof AddToCartDTOSchema>;
export type CheckoutDTO = z.infer<typeof CheckoutDTOSchema>;
export type OrderResponse = z.infer<typeof OrderResponseSchema>;

export type CreateFulfillmentTaskDTO = z.infer<typeof CreateFulfillmentTaskDTOSchema>;
export type UpdateFulfillmentStatusDTO = z.infer<typeof UpdateFulfillmentStatusDTOSchema>;