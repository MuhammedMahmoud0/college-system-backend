# Redis Caching Implementation Plan

## 1. Overview

This plan introduces **application-level Redis caching** to an existing Node.js/Express/Prisma/PostgreSQL backend where Redis (`ioredis` v5.10.0) is already installed but used **only** for BullMQ job queue. There is **zero** application-level caching today — every request hits PostgreSQL.

The implementation follows a **cache-aside pattern**:
1. Check Redis → hit: return cached data
2. Miss → query Prisma → write to Redis → return data
3. On mutations → delete affected cache keys explicitly

**Scope**: 10 Tier 1 endpoints + 11 Tier 2 endpoints, implemented in 3 phases.

---

## 2. Architecture

### 2.1 Redis Client Separation

**Current state**: `userImportQueue.js` creates its own `ioredis` instance exclusively for BullMQ.

**New state**: A **separate** shared `ioredis` instance for application caching. Two options:

| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A (Recommended)** | Single `ioredis` client shared by both BullMQ and cache layer | One TCP connection, simpler config | BullMQ requires `maxRetriesPerRequest: null` which is fine for caching too |
| B | Two separate `ioredis` instances | Complete isolation | 2× connections, duplicate config |

**Go with Option A**: Create a single `ioredis` client in `src/config/redis.js` that both BullMQ and the cache layer import. The BullMQ connection config already includes `maxRetriesPerRequest: null` which doesn't harm cache operations.

### 2.2 File Structure

```
src/
├── config/
│   ├── connection.js          # existing — Prisma client
│   └── redis.js               # NEW — shared ioredis client + health check
├── services/
│   └── cacheService.js        # NEW — getCache, setCache, delCache, invalidateByPattern
├── middlewares/
│   └── cacheMiddleware.js     # NEW — optional generic GET response cache middleware
├── controllers/
│   ├── departmentController.js      # MODIFIED — add cache-aside
│   ├── financialController.js       # MODIFIED — add cache-aside
│   ├── adminDashboardController.js  # MODIFIED — add cache-aside
│   ├── courseController.js          # MODIFIED — add cache-aside
│   ├── courseOfferingController.js  # MODIFIED — add cache-aside
│   ├── doctorDashboardController.js # MODIFIED — add cache-aside
│   ├── examController.js            # MODIFIED — add cache-aside
│   ├── registrationController.js    # MODIFIED — add cache-aside
│   ├── scheduleController.js        # MODIFIED — add cache-aside
│   ├── teacherController.js         # MODIFIED — add cache-aside
│   ├── systemConfigController.js    # MODIFIED — add cache-aside
│   └── leaderboard/
│       └── leaderboard.service.js   # MODIFIED — add cache-aside
└── utils/
    └── periodHelpers.js             # MODIFIED — add cache-aside
```

### 2.3 Environment Variables

Already present in `.env.example`:
```
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=
REDIS_DB=0
# REDIS_URL=redis://:password@localhost:6379/0
```

**New additions** to `.env.example`:
```
# Cache settings
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300
```

---

## 3. Step-by-Step Implementation Phases

### Phase 1 — Foundation (New files, zero behavior change)

#### Step 1.1: `src/config/redis.js`

```js
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
```

#### Step 1.2: `src/services/cacheService.js`

```js
import { getRedisClient } from "../config/redis.js";
import logger from "../utils/logger.js";

/**
 * Check if caching is enabled via env.
 */
function isCacheEnabled() {
    return process.env.CACHE_ENABLED !== "false";
}

/**
 * Get cached data from Redis.
 * Returns parsed JSON or null on miss/failure.
 */
export async function getCache(key) {
    if (!isCacheEnabled()) return null;

    try {
        const client = getRedisClient();
        const data = await client.get(key);
        if (!data) return null;
        return JSON.parse(data);
    } catch (err) {
        logger.warn(`Cache GET failed for key ${key}:`, err.message);
        return null; // fail open — caller will hit DB
    }
}

/**
 * Set data in Redis with TTL (seconds).
 */
export async function setCache(key, data, ttlSeconds = 300) {
    if (!isCacheEnabled()) return;

    try {
        const client = getRedisClient();
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
            logger.info(`Cache invalidated ${deleted.length} keys matching ${pattern}`);
        }
    } catch (err) {
        logger.warn(`Cache invalidation failed for pattern ${pattern}:`, err.message);
    }
}

/**
 * Helper: check if a key exists (for stampede prevention).
 */
export async function cacheExists(key) {
    if (!isCacheEnabled()) return false;
    try {
        const client = getRedisClient();
        const val = await client.exists(key);
        return val === 1;
    } catch {
        return false;
    }
}

/**
 * Cache stampede prevention: try to acquire a lock.
 * Only one request will compute; others wait or fall through to DB.
 * Returns true if this caller should compute, false if another is already computing.
 */
export async function tryAcquireLock(key, ttlSeconds = 10) {
    if (!isCacheEnabled()) return true; // no lock needed without cache
    try {
        const client = getRedisClient();
        const lockKey = `lock:${key}`;
        // SET NX = only set if NOT exists
        const result = await client.set(lockKey, "1", "EX", ttlSeconds, "NX");
        return result === "OK"; // "OK" means we got the lock
    } catch {
        return true; // fail open — let the request proceed
    }
}

/**
 * Release a stampede lock.
 */
export async function releaseLock(key) {
    if (!isCacheEnabled()) return;
    try {
        const client = getRedisClient();
        await client.del(`lock:${key}`);
    } catch {
        // ignore
    }
}
```

#### Step 1.3: `src/middlewares/cacheMiddleware.js` (Optional — not used for Tier 1, but useful for Tier 3)

```js
import { getCache, setCache } from "../services/cacheService.js";
import logger from "../utils/logger.js";

/**
 * Generic Express middleware for caching GET responses.
 *
 * Usage:
 *   router.get("/endpoint", cacheMiddleware({ key: "my-key", ttl: 300 }), handler);
 *
 * Note: This is NOT used for Tier 1 endpoints (we do manual cache-aside in controllers
 * for finer control over invalidation). This is kept for simpler Tier 3 endpoints.
 */
export const cacheMiddleware = ({ key, ttl = 300 }) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== "GET") return next();

        // Skip if user-specific and no userId available
        const cacheKey = key.includes("{userId}") && req.user?.id
            ? key.replace("{userId}", req.user.id)
            : key.includes("{")
                ? key // key has other placeholders; skip auto-resolution
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
```

---

### Phase 2 — Tier 1 Implementation (High Priority)

#### 2.1 Departments

**File**: `src/controllers/departmentController.js`

**Read functions to modify**: `getAllDepartments`, `getDepartmentById`
**Write functions to add invalidation to**: `createDepartment`, `updateDepartment`, `deleteDepartment`

```js
// ADD at top of file:
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// ─── READ: getAllDepartments ───
export const getAllDepartments = async (req, res) => {
    try {
        const { search } = req.query;

        // Only cache the non-search version (search results are user-specific)
        const cacheKey = !search ? "departments:list" : null;

        if (cacheKey) {
            const cached = await getCache(cacheKey);
            if (cached) return res.status(200).json(cached);
        }

        const departments = await prisma.departments.findMany({
            where: search
                ? { name: { contains: search, mode: "insensitive" } }
                : undefined,
            select: {
                department_id: true,
                name: true,
                _count: {
                    select: {
                        courses: true,
                        student_profiles: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        const response = { departments };

        if (cacheKey) {
            await setCache(cacheKey, response, 1800); // 30 min
        }

        res.status(200).json(response);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── READ: getDepartmentById ───
export const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `departments:detail:${id}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const department = await prisma.departments.findUnique({
            where: { department_id: id },
            select: {
                department_id: true,
                name: true,
                _count: {
                    select: {
                        courses: true,
                        student_profiles: true,
                    },
                },
            },
        });

        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        await setCache(cacheKey, department, 1800); // 30 min
        res.status(200).json(department);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── WRITE: createDepartment — ADD invalidation at end of success path ───
// Inside the existing createDepartment, after res.status(201).json(department):
// ADD this line BEFORE the res.status(201) line:
await invalidateByPattern("departments:*");

// ─── WRITE: updateDepartment — ADD invalidation ───
// Before the final res.status(200).json(updated):
await invalidateByPattern("departments:*");

// ─── WRITE: deleteDepartment — ADD invalidation ───
// Before the final res.status(200).json({ message: ... }):
await invalidateByPattern("departments:*");
```

#### 2.2 Financials

**File**: `src/controllers/financialController.js`

```js
// ADD at top:
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// ─── READ: getAllFinancials ───
export const getAllFinancials = async (req, res) => {
    try {
        const { departmentId } = req.query;
        const cacheKey = departmentId
            ? `financials:by-dept:${departmentId}`
            : "financials:list";

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const financials = await prisma.financials.findMany({
            where: departmentId ? { department_id: departmentId } : undefined,
            include: {
                departments: {
                    select: {
                        department_id: true,
                        name: true,
                    },
                },
            },
            orderBy: { id: "asc" },
        });

        const response = {
            financials: financials.map((item) => ({
                ...item,
                credit_price: Number.parseFloat(item.credit_price),
            })),
        };

        await setCache(cacheKey, response, 3600); // 1 hour
        res.status(200).json(response);
    } catch (err) {
        logger.error("Error getting financials:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── READ: getFinancialById ───
export const getFinancialById = async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Invalid financial id" });
        }

        const cacheKey = `financials:detail:${id}`;
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const financial = await prisma.financials.findUnique({
            where: { id },
            include: {
                departments: {
                    select: {
                        department_id: true,
                        name: true,
                    },
                },
            },
        });

        if (!financial) {
            return res.status(404).json({ error: "Financial record not found" });
        }

        const response = {
            ...financial,
            credit_price: Number.parseFloat(financial.credit_price),
        };

        await setCache(cacheKey, response, 3600);
        res.status(200).json(response);
    } catch (err) {
        logger.error("Error getting financial by id:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── WRITE: createFinancial ───
// Before the final res.status(201).json(...):
await invalidateByPattern("financials:*");

// ─── WRITE: updateFinancial ───
// Before the final res.status(200).json(...):
await invalidateByPattern("financials:*");

// ─── WRITE: deleteFinancial ───
// Before the final res.status(200).json(...):
await invalidateByPattern("financials:*");
```

#### 2.3 Leaderboard

**File**: `src/controllers/leaderboard/leaderboard.service.js`

```js
// ADD at top:
import { getCache, setCache, invalidateByPattern, tryAcquireLock, releaseLock } from "../../services/cacheService.js";

// ─── WRAP buildLeaderboard with cache-aside ───
export const buildLeaderboard = async ({ type, department, level, limit, currentUserId }) => {
    const cacheKey = `leaderboard:${type}:${department || "all"}:${level || "all"}:${limit}`;

    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    // Stampede prevention: only one request computes
    const gotLock = await tryAcquireLock(cacheKey, 15);
    if (!gotLock) {
        // Another request is computing — wait briefly then try cache again
        await new Promise((r) => setTimeout(r, 500));
        const retry = await getCache(cacheKey);
        if (retry) return retry;
        // Fall through to compute if still not cached
    }

    try {
        // ─── EXISTING computation logic (unchanged) ───
        let rows = [];
        // ... (entire existing GPA/ATTENDANCE/ACTIVITIES/RANKING logic stays as-is)
        // ... (copy the existing function body exactly)

        const result = { leaderboard, userRank };

        // Cache the result
        await setCache(cacheKey, result, type === "gpa" ? 900 : 300); // GPA: 15 min, others: 5 min

        return result;
    } finally {
        await releaseLock(cacheKey);
    }
};
```

**Invalidation triggers** (add these in their respective controllers):

| When | Where to add | Pattern to invalidate |
|------|-------------|----------------------|
| Grade update | `gradeController.js` — every grade write | `leaderboard:gpa:*` |
| Attendance save | `attendanceController.js` | `leaderboard:attendance:*` |
| Task submission graded | `taskController.js` | `leaderboard:activities:*` |
| Community post/like | `communityController.js` | `leaderboard:activities:*` |

Example in `gradeController.js`:
```js
import { invalidateByPattern } from "../services/cacheService.js";

// In any grade update function, after successful write:
await invalidateByPattern("leaderboard:gpa:*");
```

#### 2.4 Admin Dashboard — Alerts

**File**: `src/controllers/adminDashboardController.js`

```js
// ADD at top:
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// ─── READ: getAlerts ───
export const getAlerts = async (req, res) => {
    try {
        const cacheKey = "admin:alerts";
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const now = new Date();
        const alerts = [];
        // ... (ALL existing alert logic stays unchanged)

        const response = { count: alerts.length, data: alerts };
        await setCache(cacheKey, response, 180); // 3 min
        return res.status(200).json(response);
    } catch (err) {
        logger.error("Error fetching admin alerts:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// ─── READ: getRecentActivity ───
export const getRecentActivity = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const cacheKey = `admin:activity:${limit}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        // ... (ALL existing activity logic stays unchanged)

        await setCache(cacheKey, { count: result.length, data: result }, 90); // 90 sec
        return res.status(200).json({ count: result.length, data: result });
    } catch (err) {
        logger.error("Error fetching recent activity:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// ─── READ: getEnrollmentTrends ───
export const getEnrollmentTrends = async (req, res) => {
    try {
        const fromYear = parseInt(req.query.from) || 2021;
        const toYear = parseInt(req.query.to) || new Date().getFullYear();

        if (fromYear > toYear) {
            return res.status(400).json({ error: "`from` year must be less than or equal to `to` year." });
        }

        const cacheKey = `admin:enrollment-trends:${fromYear}:${toYear}`;
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        // ... (existing raw SQL logic unchanged)

        await setCache(cacheKey, { data }, 1800); // 30 min
        return res.status(200).json({ data });
    } catch (err) {
        logger.error("Error fetching enrollment trends:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};

// ─── READ: getPaymentAging ───
export const getPaymentAging = async (req, res) => {
    try {
        const cacheKey = "admin:payment-aging";
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        // ... (existing logic unchanged)

        await setCache(cacheKey, response, 300); // 5 min
        return res.status(200).json(response);
    } catch (err) {
        logger.error("Error fetching payment aging:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
};
```

**Admin alerts invalidation** — add in these controllers:

| When | Where |
|------|-------|
| Enrollment change (register/drop) | `registrationController.js` — after enrollment write |
| Lecture change | `courseController.js` — create/update/delete lecture |
| User creation | `usersController.js` — after user create |

Add in each:
```js
import { invalidateByPattern } from "../services/cacheService.js";
// After write:
await invalidateByPattern("admin:alerts");
await invalidateByPattern("admin:enrollment-trends:*");
```

#### 2.5 Period Helpers

**File**: `src/utils/periodHelpers.js`

```js
// ADD at top:
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// ─── getCurrentSemester ───
export const getCurrentSemester = async () => {
    const cacheKey = "semester:current";
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const latestOffering = await prisma.course_offerings.findFirst({
        orderBy: [{ year: "desc" }, { offering_id: "desc" }],
        select: { semester: true, year: true },
    });

    if (!latestOffering) return null;

    const result = { semester: latestOffering.semester, year: latestOffering.year };
    await setCache(cacheKey, result, 1800); // 30 min
    return result;
};

// ─── getRegistrationPeriod ───
export const getRegistrationPeriod = async (semester, year) => {
    const normalizedSemester = normalizeSemester(semester);
    const cacheKey = `period:registration:${normalizedSemester}:${year}`;

    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = getPeriodWindow({
        startType: "registration_start",
        endType: "registration_end",
        semester: normalizedSemester,
        year,
    });

    await setCache(cacheKey, result, 600); // 10 min
    return result;
};

// ─── getPaymentPeriod ───
export const getPaymentPeriod = async (semester, year) => {
    const normalizedSemester = normalizeSemester(semester);
    const cacheKey = `period:payment:${normalizedSemester}:${year}`;

    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = getPeriodWindow({
        startType: "payment_start",
        endType: "payment_end",
        semester: normalizedSemester,
        year,
    });

    await setCache(cacheKey, result, 600); // 10 min
    return result;
};
```

**Period invalidation** — add in `courseOfferingController.js` and `systemConfigController.js`:

```js
// After any offering create/update/delete:
await invalidateByPattern("semester:*");
await invalidateByPattern("period:*");

// After any calendar CRUD:
await invalidateByPattern("period:*");
```

#### 2.6 Registration — Available Offerings

**File**: `src/controllers/registrationController.js`

```js
// ADD at top:
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// ─── READ: getAvailableOfferings ───
// In the existing function, AFTER the semester/year resolution block
// (after currentSemester and currentYear are resolved), add cache logic:

export const getAvailableOfferings = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // ... (existing semester/year resolution logic — lines 182-230 — UNCHANGED)

        // Build cache key after semester/year resolved
        const isStaff = ["doctor", "teaching_assistant", "admin", "super_admin"].includes(userRole);
        const cacheKey = isStaff
            ? `registration:available:staff:${currentSemester}:${currentYear}`
            : `registration:available:${userId}:${currentSemester}:${currentYear}`;

        // For staff, cache is straightforward
        if (isStaff) {
            const cached = await getCache(cacheKey);
            if (cached) return res.status(200).json(cached);
        }
        // For students, we CANNOT fully cache because enrollment data changes per user.
        // Strategy: cache the base offerings (without user-specific enrolled flags)
        // and let the per-user filtering happen after.

        // ... (ALL existing logic UNCHANGED through to the final res.status(200).json(...))

        const response = { /* whatever the endpoint currently returns */ };

        // Cache only the staff version (it's the same for all staff)
        if (isStaff) {
            await setCache(cacheKey, response, 600); // 10 min
        }

        res.status(200).json(response);
    } catch (err) {
        logger.error("Error fetching available offerings:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
```

**Registration invalidation** — add after enrollment writes in `registrationController.js`:

```js
// After student registration (registerCourse POST handler):
await invalidateByPattern(`registration:available:${studentId}:*`);
await invalidateByPattern("registration:available:staff:*");
```

#### 2.7 Course Offerings

**File**: `src/controllers/courseOfferingController.js`

```js
// ADD at top:
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// ─── READ: getAllCourseOfferings ───
export const getAllCourseOfferings = async (req, res) => {
    try {
        const cacheKey = "course-offerings:all";
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const offerings = await prisma.course_offerings.findMany({
            include: {
                courses: { select: { code: true, name: true, credits: true } },
                _count: {
                    select: { lectures: true, tutorials_labs: true, exams: true },
                },
            },
            orderBy: [{ semester: "desc" }, { course_code: "asc" }],
        });

        const formattedOfferings = offerings.map((offering) => ({
            offering_id: offering.offering_id,
            course_code: offering.course_code,
            course_name: offering.courses.name,
            credits: offering.courses.credits,
            semester: offering.semester,
            year: offering.year,
            lectures_count: offering._count.lectures,
            tutorials_labs_count: offering._count.tutorials_labs,
            exams_count: offering._count.exams,
        }));

        const response = { success: true, count: formattedOfferings.length, data: formattedOfferings };
        await setCache(cacheKey, response, 1800); // 30 min
        res.status(200).json(response);
    } catch (err) {
        logger.error("Error fetching course offerings:", err);
        res.status(500).json({ success: false, error: "Internal server error" });
    }
};

// ─── WRITE: createCourseOffering ───
// Before the final res.status(201).json(...):
await invalidateByPattern("course-offerings:*");
await invalidateByPattern("semester:*");
await invalidateByPattern("period:*");

// ─── WRITE: updateCourseOffering ───
// Before the final res.status(200).json(...):
await invalidateByPattern("course-offerings:*");
await invalidateByPattern("semester:*");
await invalidateByPattern("period:*");

// ─── WRITE: deleteCourseOffering ───
// Before the final res.status(200).json(...):
await invalidateByPattern("course-offerings:*");
await invalidateByPattern("semester:*");
await invalidateByPattern("period:*");
```

#### 2.8 All Courses

**File**: `src/controllers/courseController.js`

```js
// ADD at top:
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// ─── READ: getAllCourses ───
export const getAllCourses = async (req, res) => {
    try {
        const cacheKey = "courses:all";
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const courses = await prisma.courses.findMany({
            include: {
                departments: { select: { name: true } },
                course_prerequisites_course_prerequisites_course_codeTocourses: {
                    include: {
                        courses_course_prerequisites_prerequisite_codeTocourses: {
                            select: { code: true, name: true },
                        },
                    },
                },
            },
            orderBy: { code: "asc" },
        });

        const formattedCourses = courses.map((course) => ({
            code: course.code,
            name: course.name,
            credits: course.credits,
            department: course.departments.name,
            prerequisites: course.course_prerequisites_course_prerequisites_course_codeTocourses.map(
                (prereq) => ({
                    code: prereq.courses_course_prerequisites_prerequisite_codeTocourses.code,
                    name: prereq.courses_course_prerequisites_prerequisite_codeTocourses.name,
                })
            ),
        }));

        const response = { courses: formattedCourses, total: formattedCourses.length };
        await setCache(cacheKey, response, 1800); // 30 min
        res.status(200).json(response);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── READ: getCourseDetails ───
export const getCourseDetails = async (req, res) => {
    try {
        const { offeringId } = req.params;
        const cacheKey = `course:detail:${offeringId}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        // ... (existing logic unchanged through to res.status(200).json(...))

        const response = { /* existing response object */ };
        await setCache(cacheKey, response, 900); // 15 min
        res.status(200).json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── WRITE: createCourse ───
// Before final res.status(201).json(...):
await invalidateByPattern("courses:*");
await invalidateByPattern("course-offerings:*");

// ─── WRITE: updateCourse ───
// Before final res.status(200).json(...):
await invalidateByPattern("courses:*");
await invalidateByPattern("course-offerings:*");

// ─── WRITE: deleteCourse ───
// Before final res.status(200).json(...):
await invalidateByPattern("courses:*");
await invalidateByPattern("course-offerings:*");

// ─── WRITE: createLecture ───
// Before final res.status(201).json(...):
await invalidateByPattern("course:detail:*");
await invalidateByPattern("schedule:teacher:*");
await invalidateByPattern("doctor:courses:*");

// ─── WRITE: updateLecture ───
// Before final res.status(200).json(...):
await invalidateByPattern("course:detail:*");
await invalidateByPattern("schedule:teacher:*");
await invalidateByPattern("doctor:courses:*");

// ─── WRITE: deleteLecture ───
// Before final res.status(200).json(...):
await invalidateByPattern("course:detail:*");
await invalidateByPattern("schedule:teacher:*");
await invalidateByPattern("doctor:courses:*");

// ─── WRITE: createTutorialLab ───
// Before final res.status(201).json(...):
await invalidateByPattern("course:detail:*");
await invalidateByPattern("schedule:teacher:*");

// ─── WRITE: updateTutorialLab ───
// Before final res.status(200).json(...):
await invalidateByPattern("course:detail:*");
await invalidateByPattern("schedule:teacher:*");

// ─── WRITE: deleteTutorialLab ───
// Before final res.status(200).json(...):
await invalidateByPattern("course:detail:*");
await invalidateByPattern("schedule:teacher:*");
```

#### 2.9 Doctor Dashboard — Courses & Alerts

**File**: `src/controllers/doctorDashboardController.js`

```js
// ADD at top:
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// ─── READ: getDoctorCourses ───
export const getDoctorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const cacheKey = `doctor:courses:${instructorId}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        // ... (ALL existing logic unchanged)

        await setCache(cacheKey, { count: courses.length, courses }, 300); // 5 min
        return res.status(200).json({ count: courses.length, courses });
    } catch (err) {
        logger.error("Error fetching doctor courses:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// ─── READ: getDoctorAlerts ───
export const getDoctorAlerts = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const cacheKey = `doctor:alerts:${instructorId}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        // ... (ALL existing logic unchanged)

        await setCache(cacheKey, { count: alerts.length, alerts }, 90); // 90 sec
        return res.status(200).json({ count: alerts.length, alerts });
    } catch (err) {
        logger.error("Error fetching doctor alerts:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
```

**Doctor alerts invalidation** — add in these controllers:

| When | Where |
|------|-------|
| Grade update | `gradeController.js` — after grade write |
| Task submission | `taskController.js` — after submission create/update |
| Enrollment change | `registrationController.js` — after enrollment write |

```js
import { invalidateByPattern } from "../services/cacheService.js";
// After relevant writes:
await invalidateByPattern("doctor:alerts:*");
await invalidateByPattern("ta:alerts:*");
```

---

### Phase 3 — Tier 2 Rollout (Medium Priority)

Apply the **exact same pattern** as Phase 2 to these endpoints:

| # | File | Function | Cache Key | TTL | Invalidated By |
|---|------|----------|-----------|-----|----------------|
| 2.1 | `courseController.js` | `getCourseDetails` | `course:detail:{offeringId}` | 15 min | Lecture/tutorial CRUD |
| 2.2 | `examController.js` | `examSchedule` | `exam:schedule:{userId}` | 10 min | Exam CRUD |
| 2.3 | `examController.js` | `getAllExams`, `getActiveCourses` | `exams:all`, `exams:active-courses` | 10-15 min | Exam/Offering CRUD |
| 2.4 | `doctorDashboardController.js` | `getDoctorCourses` | `doctor:courses:{doctorId}` | 5 min | Lecture assignment, enrollment |
| 2.5 | `scheduleController.js` | `getStudentSchedule` | `schedule:student:{userId}` | 5 min | Enrollment changes |
| 2.6 | `teacherController.js` | `getTeacherSchedule` | `schedule:teacher:{teacherId}` | 15 min | Lecture/tutorial assignment |
| 2.7 | `teacherController.js` | `getAllTeachers` | `teachers:all` | 30 min | User role/assignment changes |
| 2.8 | `systemConfigController.js` | `getAcademicCalendar` | `calendar:{semester}:{year}:{type}` | 30 min | Calendar CRUD |
| 2.9 | `systemConfigController.js` | `getAnnouncements` | `announcements:{userRole}` | 5 min | Announcement CRUD |
| 2.10 | `adminDashboardController.js` | `getEnrollmentTrends` | `admin:enrollment-trends:{from}:{to}` | 30 min | Enrollment changes |
| 2.11 | `adminDashboardController.js` | `getPaymentAging` | `admin:payment-aging` | 5 min | Enrollment changes |

**Rollout strategy**:
1. Implement one endpoint at a time
2. Test it locally
3. Commit with a clear message: `feat(cache): add Redis caching to exam schedule`
4. Move to the next
5. **Do not deploy partial phases** — complete Phase 3 locally, then deploy all at once

---

## 4. Cache Key Strategy Validation

### Current naming convention
```
{domain}:{action}:{param1}:{param2}
```

This is **solid**. Recommendations for improvement:

| Aspect | Current | Improved | Why |
|--------|---------|----------|-----|
| Versioning | None | Prefix with `v1:` | Allows cache busting when response format changes |
| Separator | `:` | Keep `:` | Redis-friendly, no issues |
| Null params | `"null"` in key | `"all"` | More readable |

### Final key format
```
v1:departments:list
v1:departments:detail:{id}
v1:financials:list
v1:financials:by-dept:{departmentId}
v1:leaderboard:{type}:{department}:{level}:{limit}
v1:admin:alerts
v1:admin:activity:{limit}
v1:admin:enrollment-trends:{fromYear}:{toYear}
v1:admin:payment-aging
v1:semester:current
v1:period:registration:{semester}:{year}
v1:period:payment:{semester}:{year}
v1:registration:available:{userId}:{semester}:{year}
v1:registration:available:staff:{semester}:{year}
v1:course-offerings:all
v1:courses:all
v1:course:detail:{offeringId}
v1:doctor:courses:{doctorId}
v1:doctor:alerts:{doctorId}
v1:ta:alerts:{taId}
v1:schedule:student:{userId}
v1:schedule:teacher:{teacherId}
v1:teachers:all
v1:exams:all
v1:exams:active-courses
v1:exam:schedule:{userId}
v1:calendar:{semester}:{year}:{type}
v1:announcements:{userRole}
v1:grades:breakdown:{userId}:{courseId}
v1:grades:distribution:{lectureId}
v1:grades:my-distribution:{userId}
v1:grades:lecture:{lectureId}
v1:grades:tutorial:{tutorialLabId}
v1:community:feed:{userId}:{page}:{limit}
v1:community:suggested-groups:{userId}
v1:events:upcoming
v1:materials:lecture:{lectureId}
v1:materials:tutorial:{tutorialLabId}
v1:student:profile:{userId}
v1:student:id-card:front:{userId}
v1:student:id-card:back:{userId}
v1:notifications:unread:{userId}
v1:users:management:students:{page}:{limit}
v1:users:management:staff:{page}:{limit}:{role}
v1:admin:report:{reportType}:{params}
v1:lock:{key}              (internal — stampede prevention)
```

**Update all cache keys in `cacheService.js` calls to use `v1:` prefix**.

---

## 5. Invalidation Strategy — Centralized Approach

### Option A: Decentralized (inline in controllers) — ✅ Recommended for v1

Each controller that mutates data calls `invalidateByPattern()` directly. Simple, explicit, easy to debug.

### Option B: Centralized invalidation service — for future scaling

```js
// src/services/cacheInvalidationService.js
import { invalidateByPattern } from "./cacheService.js";

export const CacheInvalidation = {
    async onDepartmentChange() {
        await Promise.all([
            invalidateByPattern("v1:departments:*"),
            invalidateByPattern("v1:financials:*"),
            invalidateByPattern("v1:teachers:*"),
        ]);
    },

    async onFinancialChange() {
        await invalidateByPattern("v1:financials:*");
    },

    async onEnrollmentChange() {
        await Promise.all([
            invalidateByPattern("v1:registration:available:*"),
            invalidateByPattern("v1:schedule:student:*"),
            invalidateByPattern("v1:courses:student:*"),
            invalidateByPattern("v1:admin:alerts"),
            invalidateByPattern("v1:admin:enrollment-trends:*"),
            invalidateByPattern("v1:admin:payment-aging"),
            invalidateByPattern("v1:doctor:alerts:*"),
            invalidateByPattern("v1:ta:alerts:*"),
        ]);
    },

    async onGradeChange() {
        await Promise.all([
            invalidateByPattern("v1:grades:*"),
            invalidateByPattern("v1:leaderboard:gpa:*"),
            invalidateByPattern("v1:doctor:alerts:*"),
            invalidateByPattern("v1:ta:alerts:*"),
            invalidateByPattern("v1:leaderboard:activities:*"),
        ]);
    },

    async onAttendanceChange() {
        await Promise.all([
            invalidateByPattern("v1:leaderboard:attendance:*"),
            invalidateByPattern("v1:admin:alerts"),
        ]);
    },

    async onOfferingChange() {
        await Promise.all([
            invalidateByPattern("v1:courses:*"),
            invalidateByPattern("v1:course:detail:*"),
            invalidateByPattern("v1:course-offerings:*"),
            invalidateByPattern("v1:semester:*"),
            invalidateByPattern("v1:period:*"),
            invalidateByPattern("v1:registration:available:*"),
        ]);
    },

    async onExamChange() {
        await Promise.all([
            invalidateByPattern("v1:exams:*"),
            invalidateByPattern("v1:exam:schedule:*"),
        ]);
    },

    async onAnnouncementChange() {
        await Promise.all([
            invalidateByPattern("v1:announcements:*"),
            invalidateByPattern("v1:admin:activity:*"),
        ]);
    },

    async onCalendarChange() {
        await Promise.all([
            invalidateByPattern("v1:calendar:*"),
            invalidateByPattern("v1:period:*"),
        ]);
    },

    async onCommunityChange() {
        await Promise.all([
            invalidateByPattern("v1:community:feed:*"),
            invalidateByPattern("v1:leaderboard:activities:*"),
        ]);
    },

    async onTaskSubmissionChange() {
        await Promise.all([
            invalidateByPattern("v1:leaderboard:activities:*"),
            invalidateByPattern("v1:doctor:alerts:*"),
            invalidateByPattern("v1:ta:alerts:*"),
        ]);
    },

    async onLectureChange() {
        await Promise.all([
            invalidateByPattern("v1:course:detail:*"),
            invalidateByPattern("v1:schedule:teacher:*"),
            invalidateByPattern("v1:doctor:courses:*"),
            invalidateByPattern("v1:materials:*"),
            invalidateByPattern("v1:admin:alerts"),
        ]);
    },
};
```

**Usage in any controller**:
```js
import { CacheInvalidation } from "../services/cacheInvalidationService.js";

// After department create:
await CacheInvalidation.onDepartmentChange();

// After grade update:
await CacheInvalidation.onGradeChange();
```

This is **strongly recommended** over inline `invalidateByPattern` calls — it gives you a single place to audit and update invalidation rules.

---

## 6. Performance & Safety

### 6.1 Cache Stampede Prevention

Already implemented via `tryAcquireLock()` / `releaseLock()` in `cacheService.js`.

**How it works**:
1. When a cache miss occurs, the first caller acquires a Redis lock (`SET lock:key NX EX 15`)
2. Concurrent callers see the lock exists → wait 500ms → retry cache
3. If still not cached (rare), they fall through to DB
4. After the first caller caches the result, subsequent hits come from Redis

**Used for**: Leaderboard (heaviest endpoint). Can be added to admin alerts if needed.

### 6.2 Redis Failure Graceful Degradation (Fail-Open)

Every cache operation is wrapped in try/catch:

| Scenario | Behavior |
|----------|----------|
| Redis down on `getCache` | Returns `null` → controller queries DB → user gets data (slower but functional) |
| Redis down on `setCache` | Logs warning → data not cached → next request hits DB |
| Redis down on `invalidateByPattern` | Logs warning → stale data may be served until TTL expires |
| Redis down on `tryAcquireLock` | Returns `true` → no stampede prevention → multiple DB queries possible (rare) |

**No single point of failure**: if Redis dies, the app continues serving data from PostgreSQL.

### 6.3 TTL Justification

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Departments | 30 min | Changed ~once/month. Read on every page load. |
| Financials | 1 hour | Changed ~once/semester. Critical for registration cost calculation. |
| Leaderboard GPA | 15 min | Expensive query. Score changes don't need instant reflection. |
| Leaderboard attendance/activities | 5 min | Slightly more dynamic (new attendance records). |
| Admin alerts | 3 min | Admins check periodically; 3 min is imperceptible for capacity alerts. |
| Admin activity feed | 90 sec | "Recent" activity is inherently time-sensitive. |
| Current semester | 30 min | Changes once/term. Called on every student request. |
| Registration period | 10 min | Opens/closes at specific times; 10 min max lag is acceptable. |
| Registration offerings (staff) | 10 min | Staff view is same for all; 10 min is fine for admin planning. |
| Course offerings | 30 min | Changes at semester boundaries only. |
| All courses | 30 min | Course catalog changes rarely. |
| Course details | 15 min | Lectures/TAs may be adjusted during early semester. |
| Doctor courses | 5 min | Assignment changes are infrequent. |
| Doctor alerts | 90 sec | Task submissions and grading happen actively. |
| TA alerts | 90 sec | Same as doctor. |
| Student schedule | 5 min | Only changes on enrollment. |
| Teacher schedule | 15 min | Stable between semester changes. |
| Exams | 10 min | Exam schedule is set weeks in advance. |
| Announcements | 5 min | Admins post occasionally; 5 min propagation is fine. |
| Enrollment trends | 30 min | Historical aggregation; doesn't change rapidly. |
| Payment aging | 5 min | Invoice status changes asynchronously. |

### 6.4 Memory Management

Redis memory usage estimation:
- **Departments list**: ~2 KB → negligible
- **Leaderboard (100 rows)**: ~50 KB
- **Admin alerts**: ~10 KB
- **Registration offerings (staff)**: ~100 KB
- **Total estimated cache**: ~5-10 MB for all Tier 1 keys combined

With default Redis `maxmemory` of 256 MB, this is **well within limits**. Add `maxmemory-policy allkeys-lru` to Redis config to evict least-recently-used keys when memory is full.

---

## 7. Testing Plan

### 7.1 Manual Verification

```bash
# 1. Start the server
npm run dev

# 2. First request — should be a cache MISS (check logs)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/departments

# 3. Second request — should be a cache HIT
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/departments

# 4. Verify in Redis CLI
redis-cli
> GET v1:departments:list
> TTL v1:departments:list
> KEYS v1:*

# 5. Trigger invalidation (update a department)
curl -X PATCH -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}' \
  http://localhost:3000/api/v1/departments/<id>

# 6. Verify key was deleted
redis-cli
> GET v1:departments:list
# Should return (nil)

# 7. Request again — should be a miss, then re-cached
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/departments
```

### 7.2 Performance Measurement

Add timing logging to `cacheService.js`:

```js
export async function getCache(key) {
    const start = Date.now();
    // ... existing logic
    const duration = Date.now() - start;
    if (duration > 10) {
        logger.warn(`Slow cache GET: ${key} took ${duration}ms`);
    }
    return data;
}
```

**Before/after comparison**:
1. Without cache: run `ab -n 100 -c 10 http://localhost:3000/api/v1/departments`
2. With cache: same command
3. Compare avg response time and PostgreSQL query count (check Prisma logs)

### 7.3 Hit Rate Monitoring

Add a simple counter:

```js
// src/services/cacheService.js
let cacheHits = 0;
let cacheMisses = 0;

export function getCacheStats() {
    const total = cacheHits + cacheMisses;
    return {
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: total > 0 ? (cacheHits / total * 100).toFixed(1) + "%" : "N/A",
    };
}

// In getCache:
if (data) { cacheHits++; } else { cacheMisses++; }
```

Expose via health endpoint:
```js
// GET /health
import { getCacheStats } from "./services/cacheService.js";
// ... in handler:
res.json({ status: "ok", cache: getCacheStats() });
```

---

## 8. Deployment Plan

### 8.1 Pre-Deployment Checklist

- [ ] `CACHE_ENABLED=true` set in production `.env`
- [ ] Redis server running and accessible from app
- [ ] `ioredis` connection test passes in staging
- [ ] All Tier 1 controllers modified and tested locally
- [ ] All invalidation paths verified (write → cache miss → next read = fresh data)
- [ ] Redis memory usage baseline recorded (`INFO memory`)

### 8.2 Gradual Rollout Strategy

**Week 1: Read-only caching (no invalidation yet)**

Deploy Phase 1 + Phase 2 read functions **without** invalidation calls in write functions. Caching works but data may be stale for up to the TTL. This is safe because:
- Department TTL = 30 min → worst case: admin creates dept, it shows up in 30 min
- Financial TTL = 1 hour → worst case: credit price update, old price shown for 1 hour

**Week 2: Add invalidation**

Deploy the invalidation calls in write functions. Now data is fresh immediately after writes.

**Week 3: Add Tier 2**

Same pattern — read-only first, then invalidation.

### 8.3 Feature Flag Kill Switch

The `CACHE_ENABLED` env var acts as a kill switch:

```bash
# Disable all caching immediately without redeploy:
# (if your deployment supports env var updates)
CACHE_ENABLED=false
```

All cache operations will no-op. The app falls back to direct DB queries.

### 8.4 Monitoring

**Redis metrics to watch**:
```bash
# Check memory usage
redis-cli INFO memory

# Check connected clients
redis-cli INFO clients

# Check hit rate at Redis level
redis-cli INFO stats
# Look for: keyspace_hits, keyspace_hitrate

# Monitor keys
redis-cli DBSIZE
redis-cli --stat
```

**App metrics to add** (if using a monitoring tool like Prometheus/DataDog):
- Cache hit rate per endpoint
- Cache operation latency (p50, p95, p99)
- Redis connection status
- Number of invalidated keys per event type

### 8.5 Rollback Plan

If caching causes issues:

1. **Immediate**: Set `CACHE_ENABLED=false` → all caching no-ops
2. **Clear stale data**: `redis-cli FLUSHDB` (or `redis-cli KEYS "v1:*" | xargs redis-cli DEL`)
3. **Redeploy** previous version if code-level issues found

### 8.6 Post-Deployment Verification

```bash
# 1. Verify cache is populating
redis-cli KEYS "v1:*" | head -20

# 2. Check memory growth over 1 hour
redis-cli INFO memory | grep used_memory_human

# 3. Verify invalidation works
#    - Update a department via API
#    - Check that v1:departments:* keys are deleted
redis-cli KEYS "v1:departments:*"

# 4. Check app logs for Redis errors
grep -i "redis" logs/app.log | tail -20

# 5. Verify no increased DB load
#    Check PostgreSQL slow query log or pg_stat_statements
```

---

## Appendix A: Complete Invalidation Matrix

| Write Event | Controllers to Modify | Patterns to Invalidate |
|-------------|----------------------|----------------------|
| Department CRUD | `departmentController.js` | `v1:departments:*`, `v1:financials:*`, `v1:teachers:*` |
| Financial CRUD | `financialController.js` | `v1:financials:*` |
| Course CRUD | `courseController.js` | `v1:courses:*`, `v1:course-offerings:*` |
| Course Offering CRUD | `courseOfferingController.js` | `v1:course-offerings:*`, `v1:courses:*`, `v1:course:detail:*`, `v1:semester:*`, `v1:period:*`, `v1:registration:available:*` |
| Lecture CRUD | `courseController.js` | `v1:course:detail:*`, `v1:schedule:teacher:*`, `v1:doctor:courses:*`, `v1:admin:alerts` |
| Tutorial/Lab CRUD | `courseController.js` | `v1:course:detail:*`, `v1:schedule:teacher:*`, `v1:materials:*` |
| Enrollment change (register/drop) | `registrationController.js` | `v1:registration:available:*`, `v1:schedule:student:*`, `v1:courses:student:*`, `v1:admin:alerts`, `v1:admin:enrollment-trends:*`, `v1:admin:payment-aging`, `v1:doctor:alerts:*`, `v1:ta:alerts:*` |
| Grade update | `gradeController.js` | `v1:grades:*`, `v1:leaderboard:gpa:*`, `v1:doctor:alerts:*`, `v1:ta:alerts:*`, `v1:leaderboard:activities:*` |
| Attendance save | `attendanceController.js` | `v1:leaderboard:attendance:*`, `v1:admin:alerts` |
| Exam CRUD | `examController.js` | `v1:exams:*`, `v1:exam:schedule:*` |
| Announcement CRUD | `systemConfigController.js` | `v1:announcements:*`, `v1:admin:activity:*` |
| Calendar CRUD | `systemConfigController.js` | `v1:calendar:*`, `v1:period:*` |
| Community post/like/comment | `communityController.js` | `v1:community:feed:*`, `v1:leaderboard:activities:*` |
| Task/submission change | `taskController.js` | `v1:leaderboard:activities:*`, `v1:doctor:alerts:*`, `v1:ta:alerts:*` |
| User role/assignment change | `usersController.js` | `v1:teachers:*`, `v1:admin:alerts` |

---

## Appendix B: BullMQ Compatibility Note

The existing `userImportQueue.js` in `src/utils/userImportQueue.js` creates its own ioredis connection. To share the client:

**Option A (minimal change — recommended)**: Keep the existing BullMQ setup as-is. The new `getRedisClient()` in `src/config/redis.js` creates a separate connection. This is fine — two connections is not a problem for Redis.

**Option B (consolidate later)**: After Phase 2 is stable, refactor `userImportQueue.js` to import `getRedisClient()` from `src/config/redis.js` and use it for BullMQ's `connection` option. The `maxRetriesPerRequest: null` in the shared client satisfies BullMQ's requirement.

**Go with Option A for now** — don't touch what works.

---

## Appendix C: Estimated Impact

| Metric | Before Cache | After Cache (Tier 1) |
|--------|-------------|---------------------|
| DB queries per admin dashboard load | ~8 full-table scans | 0 (after first load per 3 min window) |
| DB queries per leaderboard load | 3-4 full-table scans + client joins | 0 (after first load per 5-15 min window) |
| DB queries per registration page | 6+ queries | 0 for staff; reduced for students |
| DB queries per department list | 1 query | 0 (after first load per 30 min) |
| Redis memory usage | 0 | ~5-10 MB |
| Worst-case staleness | N/A (always fresh) | 90 sec (doctor alerts) to 1 hour (financials) |
