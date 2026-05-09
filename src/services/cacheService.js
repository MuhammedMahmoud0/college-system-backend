import { getRedisClient } from "../config/redis.js";
import logger from "../utils/logger.js";

// ─── Hit rate tracking ────────────────────────────────────────────────────────
let cacheHits = 0;
let cacheMisses = 0;

export function getCacheStats() {
    const total = cacheHits + cacheMisses;
    return {
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: total > 0 ? ((cacheHits / total) * 100).toFixed(1) + "%" : "N/A",
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check if caching is enabled via env.
 */
function isCacheEnabled() {
    return process.env.CACHE_ENABLED !== "false";
}

// ─── Core Cache Operations ────────────────────────────────────────────────────

/**
 * Get cached data from Redis.
 * Returns parsed JSON or null on miss/failure.
 */
export async function getCache(key) {
    if (!isCacheEnabled()) return null;

    try {
        const client = getRedisClient();
        if (!client) return null;
        const data = await client.get(key);
        if (!data) {
            cacheMisses++;
            return null;
        }
        cacheHits++;
        return JSON.parse(data);
    } catch (err) {
        logger.warn(`Cache GET failed for key ${key}:`, err.message);
        return null;
    }
}

/**
 * Set data in Redis with TTL (seconds).
 */
export async function setCache(key, data, ttlSeconds = 300) {
    if (!isCacheEnabled()) return;

    try {
        const client = getRedisClient();
        if (!client) return;
        await client.set(key, JSON.stringify(data), "EX", ttlSeconds);
    } catch (err) {
        logger.warn(`Cache SET failed for key ${key}:`, err.message);
    }
}

/**
 * Delete a single cache key.
 */
export async function delCache(key) {
    if (!isCacheEnabled()) return;

    try {
        const client = getRedisClient();
        if (!client) return;
        await client.del(key);
    } catch (err) {
        logger.warn(`Cache DEL failed for key ${key}:`, err.message);
    }
}

/**
 * Delete multiple keys matching a glob pattern.
 * Uses SCAN instead of KEYS for production safety.
 */
export async function invalidateByPattern(pattern) {
    if (!isCacheEnabled()) return;

    try {
        const client = getRedisClient();
        if (!client) return;
        let cursor = "0";
        const deleted = [];

        do {
            const [nextCursor, keys] = await client.scan(
                cursor,
                "MATCH",
                pattern,
                "COUNT",
                100
            );
            cursor = nextCursor;

            if (keys.length > 0) {
                await client.del(keys);
                deleted.push(...keys);
            }
        } while (cursor !== "0");

        if (deleted.length > 0) {
            logger.info(
                `Cache invalidated ${deleted.length} keys matching ${pattern}`
            );
        }
    } catch (err) {
        logger.warn(
            `Cache invalidation failed for pattern ${pattern}:`,
            err.message
        );
    }
}

/**
 * Helper: check if a key exists (for stampede prevention).
 */
export async function cacheExists(key) {
    if (!isCacheEnabled()) return false;
    try {
        const client = getRedisClient();
        if (!client) return false;
        const val = await client.exists(key);
        return val === 1;
    } catch {
        return false;
    }
}

/**
 * Cache stampede prevention: try to acquire a lock.
 * Returns true if this caller should compute, false if another is already computing.
 */
export async function tryAcquireLock(key, ttlSeconds = 10) {
    if (!isCacheEnabled()) return true;
    try {
        const client = getRedisClient();
        if (!client) return true;
        const lockKey = `v1:lock:${key}`;
        const result = await client.set(lockKey, "1", "EX", ttlSeconds, "NX");
        return result === "OK";
    } catch {
        return true;
    }
}

/**
 * Release a stampede lock.
 */
export async function releaseLock(key) {
    if (!isCacheEnabled()) return;
    try {
        const client = getRedisClient();
        if (!client) return;
        await client.del(`v1:lock:${key}`);
    } catch {
        // ignore
    }
}
