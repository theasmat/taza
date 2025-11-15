export type PaymentGateway = 'stripe' | 'razorpay' | 'cod';

export type PaymentMethod = 
  | 'card'
  | 'upi'
  | 'netbanking'
  | 'wallet'
  | 'cod'
  | 'paylater';

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED'
}

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
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
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

export interface PaymentMethodConfig {
  gateway: PaymentGateway;
  methods: PaymentMethod[];
  enabled: boolean;
  config: Record<string, any>;
}

export interface PaymentOptions {
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  orderId: string;
  userId?: string;
  description?: string;
  metadata?: Record<string, any>;
  captureMethod?: 'automatic' | 'manual';
}

export interface PaymentConfirmation {
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  paymentData: any;
}

export interface PaymentRefundRequest {
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  amount?: number;
  reason?: string;
  refundId?: string;
}

export interface PaymentHistory {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  paymentMethod?: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}