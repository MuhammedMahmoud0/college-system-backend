import rateLimit from "express-rate-limit";

/**
 * Strict limiter for the login endpoint.
 * 10 attempts per 15-minute window per IP.
 * Successful requests are not counted (skipSuccessfulRequests: true).
 */
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: {
        message: "Too many login attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});

/**
 * General API rate limiter (applied globally).
 * 300 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: {
        message: "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
