import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server config
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3008', 10),
  HOST: process.env.HOST || '0.0.0.0',
  
  // Database config
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://qcom_user:password@localhost:5432/qcom_payment',
  
  // Payment Gateway Config
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  
  // Kafka config
  KAFKA_BROKERS: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'qcom-payment-service',
  
  // Redis config
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // CORS config
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Payment settings
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || 'INR',
  PAYMENT_TIMEOUT_MINUTES: parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '15', 10),
  
  // Webhook settings
  WEBHOOK_TIMEOUT_MS: parseInt(process.env.WEBHOOK_TIMEOUT_MS || '30000', 10)
};