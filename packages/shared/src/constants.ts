export const SERVICE_NAMES = {
  AUTH: 'auth-service',
  CATALOG: 'catalog-service',
  INVENTORY: 'inventory-service',
  PRICING: 'pricing-service',
  ORDERS: 'orders-service',
  FULFILLMENT: 'fulfillment-service',
  NOTIFICATIONS: 'notifications-service',
  PAYMENT: 'payment-service',
  GATEWAY: 'gateway'
} as const;

export const EVENT_TOPICS = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  
  // Product events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRICE_UPDATED: 'price.updated',
  
  // Order events
  ORDER_PLACED: 'order.placed',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_UPDATED: 'order.updated',
  ORDER_COD_CONFIRMED: 'order.cod.confirmed',
  
  // Payment events (Phase 2)
  PAYMENT_INTENT_CREATED: 'payment.intent.created',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  
  // Inventory events
  INVENTORY_RESERVED: 'inventory.reserved',
  INVENTORY_CONFIRMED: 'inventory.confirmed',
  INVENTORY_RELEASED: 'inventory.released',
  STOCK_UPDATED: 'stock.updated',
  
  // Fulfillment events
  FULFILLMENT_ASSIGNED: 'fulfillment.assigned',
  FULFILLMENT_PICKED: 'fulfillment.picked',
  FULFILLMENT_PACKED: 'fulfillment.packed',
  FULFILLMENT_OUT_FOR_DELIVERY: 'fulfillment.out_for_delivery',
  FULFILLMENT_DELIVERED: 'fulfillment.delivered',
  FULFILLMENT_FAILED: 'fulfillment.failed',
  
  // Notification events
  EMAIL_SENT: 'email.sent',
  EMAIL_FAILED: 'email.failed',
  PUSH_SENT: 'push.sent',
  PUSH_FAILED: 'push.failed',
  
  // Analytics events
  ORDER_ANALYTICS_UPDATED: 'order.analytics.updated',
  USER_ANALYTICS_UPDATED: 'user.analytics.updated',
  
  // Real-time events
  ORDER_STATUS_CHANGED: 'order.status.changed',
  PAYMENT_STATUS_CHANGED: 'payment.status.changed',
  LOCATION_UPDATED: 'location.updated'
} as const;

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ISSUER: 'qcom.auth',
  AUDIENCE: 'qcom.platform'
} as const;

export const PRICING_CONFIG = {
  BASE_DELIVERY_FEE: 20,
  PER_KM_FEE: 6,
  BASE_KM: 3,
  DEFAULT_FREE_RADIUS_KM: 5
} as const;

export const RESERVATION_CONFIG = {
  TTL_MINUTES: 15,
  CLEANUP_INTERVAL_MINUTES: 5
} as const;

export const KAFKA_CONFIG = {
  CLIENT_ID: 'qcom-platform',
  GROUP_ID: 'qcom-consumers',
  RETRY_ATTEMPTS: 3,
  SESSION_TIMEOUT: 30000,
  HEARTBEAT_INTERVAL: 3000
} as const;

export const DATABASE_CONFIG = {
  CONNECTION_POOL_SIZE: 20,
  CONNECTION_TIMEOUT_MS: 60000,
  IDLE_TIMEOUT_MS: 30000
} as const;

export const REDIS_CONFIG = {
  DEFAULT_TTL_SECONDS: 3600,
  LOCK_TTL_SECONDS: 30,
  RETRY_DELAY_MS: 100,
  MAX_RETRIES: 3
} as const;

export const API_CONFIG = {
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  TIMEOUT_MS: 30000,
  UPLOAD_MAX_SIZE_MB: 10
} as const;

export const NOTIFICATION_CONFIG = {
  FROM_EMAIL: 'noreply@qcom.com',
  FROM_NAME: 'QCom Platform',
  TEMPLATES: {
    ORDER_PLACED: 'order-placed',
    ORDER_CONFIRMED: 'order-confirmed',
    ORDER_OUT_FOR_DELIVERY: 'order-out-for-delivery',
    ORDER_DELIVERED: 'order-delivered',
    ORDER_CANCELLED: 'order-cancelled',
    PAYMENT_SUCCEEDED: 'payment-succeeded',
    PAYMENT_FAILED: 'payment-failed',
    PAYMENT_REFUNDED: 'payment-refunded'
  }
} as const;

// Phase 2 Payment Configuration
export const PAYMENT_CONFIG = {
  SUPPORTED_GATEWAYS: ['stripe', 'razorpay', 'cod'] as const,
  SUPPORTED_METHODS: ['card', 'upi', 'netbanking', 'wallet', 'cod', 'paylater'] as const,
  DEFAULT_CURRENCY: 'INR',
  PAYMENT_TIMEOUT_MINUTES: 15,
  WEBHOOK_TIMEOUT_MS: 30000,
  
  // Stripe Configuration
  STRIPE_WEBHOOK_EVENTS: [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.canceled',
    'charge.refunded',
    'charge.dispute.created'
  ],
  
  // Razorpay Configuration
  RAZORPAY_WEBHOOK_EVENTS: [
    'payment.captured',
    'payment.failed',
    'refund.created',
    'refund.failed'
  ],
  
  // Refund Configuration
  MAX_REFUND_PERCENTAGE: 100,
  REFUND_PROCESSING_TIME_HOURS: 24,
  
  // Payment Retry Configuration
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
  
  // Currency Configuration
  SUPPORTED_CURRENCIES: ['INR', 'USD', 'EUR', 'GBP'] as const,
  MINIMUM_AMOUNT: {
    INR: 100, // ₹1
    USD: 50,  // $0.50
    EUR: 50,  // €0.50
    GBP: 50   // £0.50
  }
} as const;

// Real-time Configuration
export const REALTIME_CONFIG = {
  WEBSOCKET_HEARTBEAT_INTERVAL: 30000,
  WEBSOCKET_MAX_CONNECTIONS: 10000,
  WEBSOCKET_TIMEOUT_MS: 60000,
  
  // Redis Pub/Sub
  REDIS_PUBSUB_CHANNELS: {
    ORDER_UPDATES: 'order:updates',
    PAYMENT_UPDATES: 'payment:updates',
    LOCATION_UPDATES: 'location:updates',
    FULFILLMENT_UPDATES: 'fulfillment:updates'
  }
} as const;

// Push Notification Configuration
export const PUSH_NOTIFICATION_CONFIG = {
  FCM_ENABLED: true,
  FCM_BATCH_SIZE: 500,
  FCM_RETRY_ATTEMPTS: 3,
  
  // Notification Types
  NOTIFICATION_TYPES: {
    ORDER_PLACED: 'ORDER_PLACED',
    ORDER_CONFIRMED: 'ORDER_CONFIRMED',
    ORDER_OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
    ORDER_DELIVERED: 'ORDER_DELIVERED',
    PAYMENT_SUCCEEDED: 'PAYMENT_SUCCEEDED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    OFFERS: 'OFFERS',
    GENERAL: 'GENERAL'
  } as const,
  
  // TTL for notifications
  TTL_SECONDS: {
    ORDER: 3600, // 1 hour
    PAYMENT: 1800, // 30 minutes
    OFFERS: 86400, // 24 hours
    GENERAL: 3600 // 1 hour
  }
} as const;

// Analytics Configuration
export const ANALYTICS_CONFIG = {
  EVENT_BATCH_SIZE: 100,
  EVENT_BATCH_INTERVAL_MS: 5000,
  
  // Metrics
  METRICS: {
    ORDER_COUNT: 'order.count',
    ORDER_VALUE: 'order.value',
    PAYMENT_SUCCESS_RATE: 'payment.success_rate',
    DELIVERY_TIME: 'delivery.time',
    USER_RETENTION: 'user.retention',
    WAREHOUSE_EFFICIENCY: 'warehouse.efficiency'
  } as const,
  
  // Time windows for analytics
  TIME_WINDOWS: {
    REALTIME: '1m',
    HOURLY: '1h',
    DAILY: '1d',
    WEEKLY: '1w',
    MONTHLY: '1M'
  } as const
} as const;

// Monitoring Configuration
export const MONITORING_CONFIG = {
  METRICS_ENABLED: true,
  METRICS_PORT: 9090,
  
  // Custom Metrics
  METRICS_NAMES: {
    HTTP_REQUEST_DURATION: 'http_request_duration_seconds',
    HTTP_REQUEST_TOTAL: 'http_requests_total',
    DATABASE_CONNECTIONS: 'database_connections_total',
    REDIS_OPERATIONS: 'redis_operations_total',
    KAFKA_MESSAGES: 'kafka_messages_total',
    PAYMENT_TRANSACTIONS: 'payment_transactions_total',
    ORDER_PROCESSING_TIME: 'order_processing_time_seconds',
    INVENTORY_STOCK_LEVEL: 'inventory_stock_level'
  } as const,
  
  // Alerting thresholds
  ALERT_THRESHOLDS: {
    HTTP_ERROR_RATE: 0.05, // 5%
    RESPONSE_TIME_P95: 0.5, // 500ms
    DATABASE_CONNECTIONS: 15,
    PAYMENT_FAILURE_RATE: 0.02 // 2%
  }
} as const;