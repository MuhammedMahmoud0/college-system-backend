import { getCache, setCache } from "../services/cacheService.js";
import logger from "../utils/logger.js";

/**
 * Generic Express middleware for caching GET responses.
 *
 * Usage:
 *   router.get("/endpoint", cacheMiddleware({ key: "my-key", ttl: 300 }), handler);
 *
 * Supports `{userId}` placeholder in keys (resolved from req.user.id).
 * For manual cache-aside in controllers (Tier 1) use getCache/setCache directly.
 */
export const cacheMiddleware = ({ key, ttl = 300 }) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== "GET") return next();

        // Resolve {userId} placeholder
        const cacheKey =
            key.includes("{userId}") && req.user?.id
                ? key.replace("{userId}", req.user.id)
                : key.includes("{")
                ? key // has unresolved placeholders — skip
                : key;

        if (cacheKey.includes("{")) return next(); // unresolved placeholders

        try {
            const cached = await getCache(cacheKey);
            if (cached) {
                logger.debug(`Cache HIT: ${cacheKey}`);
                return res.json(cached);
            }
            logger.debug(`Cache MISS: ${cacheKey}`);

            // Monkey-patch res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    setCache(cacheKey, body, ttl).catch(() => {});
                }
                return originalJson(body);
            };
            next();
        } catch (err) {
            logger.warn("cacheMiddleware error:", err.message);
            next(); // fail open
        }
    };
};
