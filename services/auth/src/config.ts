import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server config
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  
  // Database config
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://qcom_user:password@localhost:5432/qcom_auth',
  
  // JWT config
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'qcom.auth',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'qcom.platform',
  
  // Kafka config
  KAFKA_BROKERS: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID || 'qcom-auth-service',
  
  // Redis config
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // CORS config
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  
  // Email config
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@qcom.com',
  FROM_NAME: process.env.FROM_NAME || 'QCom Platform'
};