import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { config } from '../config';
import { PaymentGateway, PaymentMethod, PaymentIntent, PaymentStatus } from '../types';

let stripe: Stripe;
let razorpay: Razorpay;

export async function initializePaymentGateways() {
  // Initialize Stripe
  if (config.STRIPE_SECRET_KEY) {
    stripe = new Stripe(config.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true
    });
    console.log('Stripe initialized successfully');
  }

  // Initialize Razorpay
  if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET
    });
    console.log('Razorpay initialized successfully');
  }
}

export const paymentGatewayService = {
  async createPaymentIntent(
    amount: number,
    currency: string,
    gateway: PaymentGateway,
    metadata: Record<string, any>
  ): Promise<PaymentIntent> {
    const paymentIntentId = generatePaymentIntentId();
    
    switch (gateway) {
      case 'stripe':
        return this.createStripePaymentIntent(amount, currency, paymentIntentId, metadata);
      
      case 'razorpay':
        return this.createRazorpayPaymentIntent(amount, currency, paymentIntentId, metadata);
      
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  },

  async createStripePaymentIntent(
    amount: number,
    currency: string,
    paymentIntentId: string,
    metadata: Record<string, any>
  ): Promise<PaymentIntent> {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    // Convert amount to smallest currency unit (cents for INR)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      metadata: {
        ...metadata,
        paymentIntentId
      },
      automatic_payment_methods: {
        enabled: true
      },
      capture_method: 'automatic'
    });

    return {
      id: paymentIntentId,
      gateway: 'stripe',
      gatewayPaymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount,
      currency,
      status: this.mapStripeStatus(paymentIntent.status),
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  async createRazorpayPaymentIntent(
    amount: number,
    currency: string,
    paymentIntentId: string,
    metadata: Record<string, any>
  ): Promise<PaymentIntent> {
    if (!razorpay) {
      throw new Error('Razorpay not initialized');
    }

    // Convert amount to smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: paymentIntentId,
      notes: {
        ...metadata,
        paymentIntentId
      }
    });

    return {
      id: paymentIntentId,
      gateway: 'razorpay',
      gatewayPaymentId: order.id,
      clientSecret: order.id, // Razorpay uses order ID as client secret
      amount,
      currency,
      status: this.mapRazorpayStatus(order.status),
      metadata,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  async confirmPayment(
    gateway: PaymentGateway,
    gatewayPaymentId: string,
    paymentData: any
  ): Promise<PaymentIntent> {
    switch (gateway) {
      case 'stripe':
        return this.confirmStripePayment(gatewayPaymentId, paymentData);
      
      case 'razorpay':
        return this.confirmRazorpayPayment(gatewayPaymentId, paymentData);
      
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  },

  async confirmStripePayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentIntent> {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      return {
        id: paymentIntent.metadata.paymentIntentId,
        gateway: 'stripe',
        gatewayPaymentId: paymentIntent.id,
        clientSecret: '',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        status: PaymentStatus.CONFIRMED,
        metadata: paymentIntent.metadata,
        gatewayResponse: paymentIntent,
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date()
      };
    }

    throw new Error('Payment not completed');
  },

  async confirmRazorpayPayment(
    orderId: string,
    paymentData: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }
  ): Promise<PaymentIntent> {
    if (!razorpay) {
      throw new Error('Razorpay not initialized');
    }

    // Verify payment signature
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(`${paymentData.razorpay_order_id}|${paymentData.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== paymentData.razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Fetch payment details
    const payment = await razorpay.payments.fetch(paymentData.razorpay_payment_id);
    
    if (payment.status === 'captured') {
      return {
        id: payment.notes?.paymentIntentId as string,
        gateway: 'razorpay',
        gatewayPaymentId: payment.id,
        clientSecret: '',
        amount: payment.amount / 100,
        currency: payment.currency,
        status: PaymentStatus.CONFIRMED,
        metadata: payment.notes || {},
        gatewayResponse: payment,
        createdAt: new Date(payment.created_at * 1000),
        updatedAt: new Date()
      };
    }

    throw new Error('Payment not captured');
  },

  async refundPayment(
    gateway: PaymentGateway,
    gatewayPaymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    switch (gateway) {
      case 'stripe':
        return this.refundStripePayment(gatewayPaymentId, amount, reason);
      
      case 'razorpay':
        return this.refundRazorpayPayment(gatewayPaymentId, amount, reason);
      
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  },

  async refundStripePayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason as any,
      metadata: {
        refundReason: reason || 'Customer request'
      }
    });

    return refund;
  },

  async refundRazorpayPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<any> {
    if (!razorpay) {
      throw new Error('Razorpay not initialized');
    }

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes: {
        reason: reason || 'Customer request'
      }
    });

    return refund;
  },

  async handleWebhook(
    gateway: PaymentGateway,
    payload: any,
    signature?: string
  ): Promise<any> {
    switch (gateway) {
      case 'stripe':
        return this.handleStripeWebhook(payload, signature);
      
      case 'razorpay':
        return this.handleRazorpayWebhook(payload, signature);
      
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  },

  async handleStripeWebhook(payload: any, signature?: string): Promise<any> {
    if (!stripe || !config.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe webhook not configured');
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature || '',
      config.STRIPE_WEBHOOK_SECRET
    );

    return event;
  },

  async handleRazorpayWebhook(payload: any, signature?: string): Promise<any> {
    // Razorpay webhooks don't require signature verification in the same way
    return payload;
  },

  mapStripeStatus(status: string): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.CONFIRMED;
      case 'processing':
        return PaymentStatus.PENDING;
      case 'requires_payment_method':
      case 'requires_confirmation':
        return PaymentStatus.PENDING;
      case 'canceled':
        return PaymentStatus.FAILED;
      default:
        return PaymentStatus.PENDING;
    }
  },

  mapRazorpayStatus(status: string): PaymentStatus {
    switch (status) {
      case 'created':
        return PaymentStatus.PENDING;
      case 'authorized':
        return PaymentStatus.PENDING;
      case 'captured':
        return PaymentStatus.CONFIRMED;
      case 'failed':
        return PaymentStatus.FAILED;
      case 'refunded':
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }
};

function generatePaymentIntentId(): string {
  return `pi_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export { stripe, razorpay };