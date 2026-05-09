import IORedis from "ioredis";
import logger from "../utils/logger.js";

let redisClient = null;

/**
 * Build ioredis config from env vars.
 * Supports REDIS_URL (full URI) or REDIS_HOST/PORT/PASSWORD/DB.
 */
function buildRedisConfig() {
    if (process.env.REDIS_URL) {
        return { url: process.env.REDIS_URL };
    }

    return {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || null,
        db: parseInt(process.env.REDIS_DB, 10) || 0,
    };
}

/**
 * Get or create the shared Redis client.
 * Singleton pattern — one connection for the entire app.
 */
export function getRedisClient() {
    if (!redisClient) {
        redisClient = new IORedis({
            ...buildRedisConfig(),
            maxRetriesPerRequest: null, // Required for BullMQ compatibility
            enableOfflineQueue: true,
            connectTimeout: 10000,
            retryStrategy: (times) => {
                if (times > 10) {
                    logger.error("Redis: max retries reached, returning null");
                    return null; // fail open
                }
                return Math.min(times * 200, 3000);
            },
        });

        redisClient.on("error", (err) => {
            logger.error("Redis connection error:", err.message);
        });

        redisClient.on("connect", () => {
            logger.info("Redis connected successfully");
        });
    }
    return redisClient;
}

/**
 * Graceful shutdown — close Redis connection.
 */
export async function closeRedisClient() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info("Redis connection closed");
    }
}

/**
 * Health check — returns true if Redis is reachable.
 */
export async function isRedisHealthy() {
    try {
        const client = getRedisClient();
        const pong = await client.ping();
        return pong === "PONG";
    } catch {
        return false;
    }
}
