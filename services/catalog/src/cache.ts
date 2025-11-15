import Redis from "ioredis";
import { config } from "./config";

let redis: Redis | null = null;

try {
  redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  redis.on("error", (error) => {
    console.error("Redis connection error:", error);
  });

  redis.on("connect", () => {
    console.log("Redis connected successfully");
  });
} catch (error) {
  console.warn("Redis initialization failed, running without cache:", error);
}

export { redis };

export async function initializeCache() {
  if (redis) {
    try {
      await redis.connect();
      console.log("Cache (Redis) initialized");
    } catch (error) {
      console.warn("Could not connect to Redis, running without cache:", error);
    }
  } else {
    console.warn("Running without Redis cache");
  }
}
