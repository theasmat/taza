import Redis from 'ioredis';
import { config } from './config';

export const redis = new Redis(config.REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

export async function initializeCache() {
  try {
    await redis.connect();
    console.log('Redis cache initialized successfully');
  } catch (error) {
    console.error('Error initializing Redis cache:', error);
    throw error;
  }
}