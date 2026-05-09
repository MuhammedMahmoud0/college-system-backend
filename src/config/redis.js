import IORedis from "ioredis";
import logger from "../utils/logger.js";

let redisClient = null;

/**
 * Build ioredis config for the CACHE provider.
 *
 * Uses dedicated CACHE_REDIS_* env vars so that the caching layer
 * connects to a completely separate Redis provider from the BullMQ
 * Excel-import queue (which uses REDIS_HOST / REDIS_URL).
 *
 * Required env vars (pick one style):
 *   CACHE_REDIS_URL=redis://:password@host:port/db
 * OR
 *   CACHE_REDIS_HOST=...
 *   CACHE_REDIS_PORT=...      (default: 6379)
 *   CACHE_REDIS_PASSWORD=...  (optional)
 *   CACHE_REDIS_USERNAME=...  (optional)
 *   CACHE_REDIS_DB=...        (default: 0)
 */
function buildCacheRedisConfig() {
    if (process.env.CACHE_REDIS_URL) {
        const parsed = new URL(process.env.CACHE_REDIS_URL);
        const dbFromPath = parsed.pathname
            ? parseInt(parsed.pathname.replace("/", ""), 10)
            : NaN;

        return {
            host: parsed.hostname,
            port: parsed.port ? parseInt(parsed.port, 10) : 6379,
            username: parsed.username || undefined,
            password: parsed.password || undefined,
            db: isNaN(dbFromPath) ? 0 : dbFromPath,
            tls: parsed.protocol === "rediss:" ? {} : undefined,
        };
    }

    const host = process.env.CACHE_REDIS_HOST;
    if (!host) {
        logger.warn(
            "[CacheRedis] CACHE_REDIS_URL or CACHE_REDIS_HOST is not set. " +
            "Application caching will be silently disabled."
        );
        return null;
    }

    return {
        host,
        port: parseInt(process.env.CACHE_REDIS_PORT, 10) || 6379,
        username: process.env.CACHE_REDIS_USERNAME || undefined,
        password: process.env.CACHE_REDIS_PASSWORD || undefined,
        db: parseInt(process.env.CACHE_REDIS_DB, 10) || 0,
    };
}

/**
 * Get or create the shared cache Redis client (singleton).
 * Completely isolated from the BullMQ queue client in userImportQueue.js.
 */
export function getRedisClient() {
    if (!redisClient) {
        const config = buildCacheRedisConfig();

        if (!config) {
            // No cache Redis configured — return null, cacheService will handle it
            return null;
        }

        redisClient = new IORedis({
            ...config,
            maxRetriesPerRequest: null, // BullMQ-style — prevents hanging on down Redis
            enableOfflineQueue: true,
            connectTimeout: 10000,
            retryStrategy: (times) => {
                if (times > 10) {
                    logger.error(
                        "[CacheRedis] Max retries reached. Cache calls will fail open."
                    );
                    return null;
                }
                return Math.min(times * 200, 3000);
            },
        });

        redisClient.on("error", (err) => {
            logger.error("[CacheRedis] Connection error:", err.message);
        });

        redisClient.on("connect", () => {
            logger.info("[CacheRedis] Connected to cache Redis provider");
        });
    }

    return redisClient;
}

/**
 * Graceful shutdown — close the cache Redis connection only.
 * Does NOT affect the BullMQ queue connection.
 */
export async function closeRedisClient() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        logger.info("[CacheRedis] Cache Redis connection closed");
    }
}

/**
 * Health check — returns true if the cache Redis is reachable.
 */
export async function isRedisHealthy() {
    try {
        const client = getRedisClient();
        if (!client) return false;
        const pong = await client.ping();
        return pong === "PONG";
    } catch {
        return false;
    }
}
