import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server config
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3002', 10),
  HOST: process.env.HOST || '0.0.0.0',
  
  // Database config
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://qcom_user:password@localhost:5432/qcom_catalog',
  
  // Kafka config
  KAFKA_BROKERS: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'qcom-catalog-service',
  
  // Redis config
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // CORS config
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // File upload
  UPLOAD_MAX_SIZE_MB: parseInt(process.env.UPLOAD_MAX_SIZE_MB || '10', 10),
  
  // Cache settings
  CACHE_TTL_SECONDS: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10)
};