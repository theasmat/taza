export interface Point {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  type: "customer" | "vendor" | "warehouse_staff" | "rider" | "admin";
  warehouseId?: string;
  vendorId?: string;
  metadata?: Record<string, any>;
}

export interface Warehouse {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  radiusKm: number;
  active: boolean;
  address: string;
  contactInfo: {
    phone: string;
    email: string;
  };
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  images: string[];
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SKU {
  id: string;
  productId: string;
  name: string;
  attributes: Record<string, any>;
  barcode?: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Price {
  skuId: string;
  mrp: number;
  salePrice: number;
  taxIncluded: boolean;
  currency: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
}

export interface Stock {
  warehouseId: string;
  skuId: string;
  onHand: number;
  reserved: number;
  available: number;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  warehouseId: string;
  skuId: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED" | "EXPIRED";
  expiresAt: Date;
  orderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  warehouseId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentGateway?: PaymentGateway;
  paymentTransactionId?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  skuId: string;
  productId: string;
  quantity: number;
  price: number;
  tax: number;
  total: number;
}

export interface Address {
  id?: string;
  userId?: string;
  type: "home" | "work" | "other";
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  location: {
    lat: number;
    lng: number;
  };
  isDefault?: boolean;
}

export interface UserDeliveryPolicy {
  userId: string;
  freeRadiusKm: number;
  payMode: "user" | "seller";
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentTask {
  id: string;
  orderId: string;
  warehouseId: string;
  status: FulfillmentStatus;
  assignedTo?: string;
  items: FulfillmentItem[];
  pickList?: PickList;
  packList?: PackList;
  createdAt: Date;
  updatedAt: Date;
}

export interface FulfillmentItem {
  skuId: string;
  productId: string;
  quantity: number;
  pickedQuantity?: number;
  pickedAt?: Date;
  pickedBy?: string;
}

export interface PickList {
  items: Array<{
    skuId: string;
    location: string;
    quantity: number;
    picked: boolean;
  }>;
}

export interface PackList {
  items: Array<{
    skuId: string;
    quantity: number;
    packed: boolean;
  }>;
}

// Payment Types (Phase 2)
export type PaymentGateway = "stripe" | "razorpay" | "cod";

export type PaymentMethod =
  | "card"
  | "upi"
  | "netbanking"
  | "wallet"
  | "cod"
  | "paylater";

export interface PaymentIntent {
  id: string;
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  orderId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  gatewayResponse?: any;
  paymentMethod?: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentTransaction {
  id: string;
  paymentIntentId: string;
  gateway: PaymentGateway;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  gatewayResponse: any;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentTransactionId: string;
  gatewayRefundId: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  reason?: string;
  gatewayResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  id: string;
  gateway: PaymentGateway;
  event: string;
  payload: any;
  signature?: string;
  timestamp: Date;
}

export type UserRole =
  | "customer"
  | "vendor"
  | "warehouse_staff"
  | "rider"
  | "admin";
export type OrderStatus =
  | "PLACED"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED";
export type FulfillmentStatus =
  | "ASSIGNED"
  | "PICKING"
  | "PICKED"
  | "PACKING"
  | "PACKED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface JWTPayload {
  sub: string;
  email: string;
  roles: UserRole[];
  warehouseId?: string;
  vendorId?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
