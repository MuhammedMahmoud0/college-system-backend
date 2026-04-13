# Authentication System — Security Audit & Improvement Roadmap

---

## 1. Security Audit

### Critical Severity

| # | Vulnerability | Why It Matters | Exploit Scenario |
|---|--------------|----------------|-----------------|
| C1 | **No brute-force protection** | An attacker can submit unlimited password attempts against any email. Student/doctor emails are often public in a college system. | Automated script guesses passwords at 1000+ req/min. A weak password like `Student123!` is cracked in minutes. |
| C2 | **No input validation on `/login`** | Sending `{}` or malformed body causes Prisma to throw, which leaks a `500` error with internal details. | `POST /api/v1/auth/login {}` → 500 stack trace exposes DB query internals. |
| C3 | **JWT contains PII (`full_name`)** | JWTs are **Base64-encoded, NOT encrypted**. Anyone who reads the token (browser storage, network logs, proxy) can decode and read the name. Token also carries stale data if the name changes. | Token intercepted → decoded via jwt.io → full_name extracted. |

### High Severity

| # | Vulnerability | Why It Matters | Exploit Scenario |
|---|--------------|----------------|-----------------|
| H1 | **Wrong HTTP status codes (400 vs 401)** | HTTP semantics matter. Interceptors, mobile SDKs, and test frameworks branch on status codes. `400` means "malformed request," not "unauthorized." This breaks client logic. | Frontend interceptor checks `if (res.status === 401) logout()` — never fires for auth failures. |
| H2 | **No token revocation / logout** | A stolen or leaked token works until its 1-hour expiry. No way to force session termination. | Student logs in on shared lab PC, forgets to log out. Next user takes the token from `localStorage` and has full access for up to 60 minutes. |
| H3 | **No password reset flow** | Forgotten passwords require manual admin intervention. At scale, this is unsustainable and creates a support bottleneck. | Student forgets password → emails admin → admin manually updates DB → 24-hour delay. |
| H4 | **`bcryptjs` (JS-only) instead of `bcrypt` (native)** | `bcryptjs` is ~30x slower than native `bcrypt`. This means you likely use low salt rounds (currently 10), making offline hash cracking easier if the DB is breached. | DB dump obtained → attacker runs hashcat against `password_hash` → weak hashing accelerates cracking. |

### Medium Severity

| # | Vulnerability | Why It Matters |
|---|--------------|----------------|
| M1 | **No account lockout tracking** | Even with rate limiting, per-account lockout is a separate defense layer. Without it, a targeted attack on a single account isn't blocked. |
| M2 | **JWT expiry too long (1h)** | 1 hour is too wide a window for a stolen token. Best practice is 15-min access tokens + refresh tokens. |
| M3 | **Socket.IO token reuse** | The same JWT used for REST is also used for WebSocket. If the token is compromised, the attacker gets both REST API and real-time channels (attendance sessions, notifications). |
| M4 | **No CORS configuration** | `socketIO.js` uses `origin: "*"`. If your Express app also lacks CORS, any origin can make authenticated requests. |
| M5 | **No security headers** | No Helmet.js middleware. Missing `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc. |

### Low Severity

| # | Vulnerability | Why It Matters |
|---|--------------|----------------|
| L1 | **`/me` returns stale token data** | `res.json({ ...user, ...data })` merges JWT payload (`name`, `role`) with fresh DB data. If the user's role changed server-side, the response still shows the old role from the token. |
| L2 | **Error messages are generic but status codes leak info** | While the message "Invalid username or password" is good (doesn't reveal which field is wrong), the inconsistent status codes (400 vs 401) still leak implementation details. |
| L3 | **No request ID / trace correlation** | Errors logged but no request ID returned to client. Makes debugging production auth issues difficult. |

---

## 2. Architecture Improvements

### JWT vs Sessions — Recommendation

**Keep JWT.** For this college system's architecture (REST API + WebSocket + likely SPA/mobile frontend), JWT is the right choice. Sessions would require sticky sessions or a centralized session store (Redis), adding operational complexity.

**But change the JWT lifecycle design:**

### Current Design

```
Login → 1-hour JWT → No refresh → No logout → Token dies naturally
```

### Recommended Design

```
Login → 15-min access token (JWT) + 7-day refresh token (opaque, DB-stored)
                                     ↓
                            POST /auth/refresh → new access token (+ optional refresh rotation)
                                     ↓
                            POST /auth/logout → revoke refresh token
```

**Why this is better:**

- Access token window shrinks from **60 min → 15 min** (75% risk reduction)
- Refresh tokens are **opaque strings stored in DB** — they can be revoked individually
- Logout becomes meaningful (revoke the refresh token)
- Frontend silently refreshes without user re-login

### Token Design Details

```
Access Token (JWT):
  payload: { userId, role }
  expiry: 15m
  storage: client memory / localStorage
  sent in: Authorization: Bearer <token>

Refresh Token (opaque):
  value: crypto.randomBytes(64).toString('hex')
  expiry: 7d
  storage: HttpOnly, Secure, SameSite=Strict cookie
  sent in: Cookie (automatic, not accessible to JS)
```

### Why Not JWT for Refresh Tokens?

JWTs cannot be revoked (they're stateless by design). An opaque token stored in the DB gives you:

- **Revocation**: `UPDATE refresh_tokens SET revoked = true`
- **Rotation**: Issue a new refresh token on each use
- **Audit trail**: Track when/where tokens were used
- **Device management**: List and revoke specific sessions

---

## 3. Feature Enhancements — Priority Matrix

| Priority | Feature | Effort | Impact | Verdict |
|----------|---------|--------|--------|---------|
| 🔴 P0 | Fix HTTP status codes | 2 min | Medium | **Do immediately** |
| 🔴 P0 | Remove PII from JWT | 1 min | Medium | **Do immediately** |
| 🔴 P0 | Add Zod validation | 30 min | High | **Do this week** |
| 🔴 P0 | Rate limiting on `/login` | 20 min | High | **Do this week** |
| 🟠 P1 | Refresh tokens + logout | 2–3 hrs | High | **Do next sprint** |
| 🟠 P1 | Password reset flow | 3–4 hrs | High | **Do next sprint** |
| 🟡 P2 | Account lockout (DB fields) | 1 hr | Medium | **After P1** |
| 🟡 P2 | Fix `/me` stale data | 10 min | Medium | **Quick fix** |
| 🟡 P2 | Security headers (Helmet) + CORS | 15 min | Medium | **Quick fix** |
| 🟢 P3 | MFA (TOTP) | 1–2 days | Medium | **Phase 3** |
| 🟢 P3 | Device/session management UI | 1 day | Low | **Nice to have** |

### Feature Details

#### Refresh Tokens

- New `refresh_tokens` Prisma model
- `POST /auth/login` returns access token + sets refresh token cookie
- `POST /auth/refresh` validates refresh token, issues new access token, rotates refresh token
- `POST /auth/logout` revokes refresh token, clears cookie

#### Password Reset Flow

- New `password_reset_tokens` Prisma model
- `POST /auth/forgot-password` → generates token, sends email (Nodemailer/Resend)
- `POST /auth/reset-password` → validates token, hashes new password, invalidates all refresh tokens
- **Always respond 200** regardless of whether email exists (prevent enumeration)

#### Account Lockout

- Add `failed_login_attempts` and `locked_until` to `users` model
- Lock after 5 failed attempts for 30 minutes
- Reset counter on successful login

#### Rate Limiting

- Use `express-rate-limit` on `/login`: 10 attempts per IP per 15 minutes
- Global rate limit: 100 req/min per IP for all routes

---

## 4. Code-Level Improvements

### 4.1 Auth Controller

**Problems:**

1. Status codes are `400` instead of `401`
2. JWT payload includes `full_name` (PII)
3. No input validation before processing
4. `me()` merges stale token data with fresh DB data

**Corrected `login`:**

```javascript
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Minimal JWT payload — no PII
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.status(200).json({ message: "Login successful", accessToken });
    } catch (err) {
        logger.error("Login error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
```

**Corrected `me`:**

```javascript
export const me = async (req, res) => {
    const user = await prisma.users.findUnique({
        where: { id: req.user.userId },
        select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
            avatar_url: true,
            phone: true,
            address: true,
            created_at: true,
        },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
};
```

### 4.2 Auth Middleware

**Problems:**

1. No token expiry warning (helpful for UX)
2. Silent failure on malformed tokens (good) but no logging for debugging
3. `payload.id = payload.id ?? payload.userId` is a band-aid fix — better to normalize at sign-time

**Corrected `authMiddleware`:**

```javascript
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: payload.userId, role: payload.role };
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
};
```

### 4.3 Input Validation with Zod

**New file:** `src/validators/authValidators.js`

```javascript
import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email format").max(255),
    password: z.string().min(1, "Password is required").max(128),
});

export const passwordChangeSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format").max(255),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
```

**Validation middleware:** `src/middlewares/validateMiddleware.js`

```javascript
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(422).json({
            message: "Validation failed",
            errors: result.error.flatten().fieldErrors,
        });
    }
    req.body = result.data;
    next();
};
```

**Usage:**

```javascript
import { loginSchema } from "../validators/authValidators.js";
import { validate } from "../middlewares/validateMiddleware.js";

router.post("/login", loginLimiter, validate(loginSchema), login);
```

### 4.4 Rate Limiting

**New file:** `src/middlewares/rateLimitMiddleware.js`

```javascript
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
});

export const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: { message: "Too many requests. Please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
});
```

**Apply in `server.js`:**

```javascript
import { globalLimiter } from "./middlewares/rateLimitMiddleware.js";

app.use(globalLimiter); // All routes
app.use("/api/v1/auth/login", loginLimiter); // Specific to login
```

### 4.5 Password Hashing — Upgrade from `bcryptjs` to Native `bcrypt`

**Why:** Native `bcrypt` (compiled C++) is ~30x faster, meaning you can afford higher salt rounds (12-14 instead of 10) without UX impact. Higher rounds = harder to crack offline.

```bash
npm uninstall bcryptjs
npm install bcrypt
```

```javascript
import bcrypt from "bcrypt";
const SALT_ROUNDS = 12; // Increased from 10
```

**Note:** Existing hashes remain compatible. New passwords will be hashed with the stronger algorithm.

### 4.6 Security Headers & CORS

**Add Helmet:**

```bash
npm install helmet
```

**In `server.js`:**

```javascript
import helmet from "helmet";
import cors from "cors";

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // Required for HttpOnly cookies (refresh tokens)
}));
```

### 4.7 Socket.IO Token Verification — Current State Is Correct

The Socket.IO JWT middleware is functionally correct. Two minor improvements:

1. **Separate token for WebSocket** (optional, advanced): Issue a short-lived WebSocket-specific token to limit blast radius if the REST token is compromised.

2. **Add reconnection handling**: If the access token expires during a WebSocket session, the socket won't auto-reconnect. Add a mechanism to re-authenticate:

```javascript
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new Error("Token expired. Please reconnect with a new token."));
        }
        return next(new Error("Authentication error: Invalid token"));
    }
});
```

---

## 5. Database Changes

### 5.1 Refresh Tokens Table

```prisma
model refresh_tokens {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token        String   @unique
  user_id      String   @db.Uuid
  expires_at   DateTime @db.Timestamptz(6)
  revoked      Boolean  @default(false)
  created_at   DateTime @default(now()) @db.Timestamptz(6)
  ip_address   String?  // Audit: where was this token issued?
  user_agent   String?  // Audit: what device/browser?
  users        users    @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([token])
  @@index([expires_at])
}
```

### 5.2 Password Reset Tokens Table

```prisma
model password_reset_tokens {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token        String   @unique
  user_id      String   @db.Uuid
  expires_at   DateTime @db.Timestamptz(6)
  used         Boolean  @default(false)
  created_at   DateTime @default(now()) @db.Timestamptz(6)
  users        users    @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([token])
}
```

### 5.3 Account Lockout Fields (add to existing `users` model)

```prisma
model users {
  // ... existing fields ...
  failed_login_attempts Int       @default(0)
  locked_until          DateTime? @db.Timestamptz(6)
  // ... rest of model ...
}
```

### 5.4 Full Migration Command

```bash
npx prisma migrate dev --name add_auth_security_features
```

---

## 6. Step-by-Step Implementation Plan

### Phase 1: Quick Wins (1–2 hours, highest ROI)

| Step | What | Why | Effort |
|------|------|-----|--------|
| 1.1 | Fix HTTP status codes: `400` → `401` | Correct HTTP semantics, fixes client interceptors | 2 min |
| 1.2 | Remove `full_name` from JWT payload | Removes PII from token, eliminates stale data | 1 min |
| 1.3 | Fix `/me` to fetch all data from DB only | Eliminates stale token data in response | 10 min |
| 1.4 | Add Zod validation to `/login` and `/student-settings/password` | Prevents 500 errors on malformed input, improves DX | 30 min |
| 1.5 | Install and apply `express-rate-limit` on `/login` | Stops brute-force attacks immediately | 20 min |
| 1.6 | Add Helmet.js + CORS configuration | Adds security headers, restricts cross-origin requests | 15 min |
| 1.7 | Upgrade `bcryptjs` → native `bcrypt`, increase salt rounds to 12 | Stronger hashing, faster hashing, better offline attack resistance | 15 min |

**Result after Phase 1:** The system is protected against the most common attack vectors. No new tables or migrations needed.

---

### Phase 2: Token Lifecycle & Password Reset (3–5 hours)

| Step | What | Why | Effort |
|------|------|-----|--------|
| 2.1 | Add `refresh_tokens` model to Prisma schema | Enables token revocation and proper logout | 10 min |
| 2.2 | Add `password_reset_tokens` model to Prisma schema | Enables forgot-password flow | 10 min |
| 2.3 | Add `failed_login_attempts` + `locked_until` to `users` model | Per-account brute-force protection | 5 min |
| 2.4 | Run Prisma migration | Apply schema changes | 5 min |
| 2.5 | Update `login` controller: issue short-lived JWT (15m) + refresh token (HttpOnly cookie) | Reduces token theft window from 60m → 15m | 30 min |
| 2.6 | Create `POST /auth/refresh` endpoint | Silent token refresh without re-login | 30 min |
| 2.7 | Create `POST /auth/logout` endpoint | Proper session termination | 20 min |
| 2.8 | Create `POST /auth/forgot-password` endpoint | Generates reset token, sends email | 45 min |
| 2.9 | Create `POST /auth/reset-password` endpoint | Validates token, updates password, revokes all refresh tokens | 45 min |
| 2.10 | Update `studentSettingsController` to invalidate refresh tokens on password change | Prevents old sessions from persisting after password change | 15 min |

**Result after Phase 2:** Full token lifecycle with proper logout, password recovery, and per-account lockout.

---

### Phase 3: Advanced Hardening (1–3 days)

| Step | What | Why | Effort |
|------|------|-----|--------|
| 3.1 | Implement refresh token rotation | Each refresh issues a new refresh token. If a token is stolen and used, the legitimate user's next refresh fails, detecting the theft | 1 hr |
| 3.2 | Add MFA (TOTP) using `otplib` + `qrcode` | Protects accounts even if passwords are compromised | 1–2 days |
| 3.3 | Add session/device management endpoint (`GET /auth/sessions`, `DELETE /auth/sessions/:id`) | Users can view and revoke active sessions | 2 hrs |
| 3.4 | Add request ID / correlation ID middleware | Production debugging for auth issues | 15 min |
| 3.5 | Add audit logging for auth events (login, logout, password change, failed attempts) | Security incident investigation | 1 hr |
| 3.6 | Add automated `refresh_tokens` cleanup job (cron) | Remove expired tokens from DB to keep it lean | 30 min |

---

## 7. Best Practices Checklist

### Token Security

- [ ] Access token expiry ≤ 15 minutes
- [ ] Refresh tokens stored in HttpOnly, Secure, SameSite=Strict cookies
- [ ] Refresh tokens are opaque strings (NOT JWTs)
- [ ] Refresh token rotation on each use
- [ ] Token revocation on logout and password change
- [ ] JWT payload contains only `userId` and `role` (no PII)
- [ ] `JWT_SECRET` is ≥ 256 bits of entropy (use `openssl rand -hex 64`)

### Password Security

- [ ] Use native `bcrypt` (not `bcryptjs`)
- [ ] Salt rounds ≥ 12
- [ ] Minimum password length: 8 characters
- [ ] Password change invalidates all existing sessions
- [ ] Password reset tokens expire within 1 hour
- [ ] Reset tokens are single-use

### Brute-Force Protection

- [ ] Rate limit on `/login`: ≤ 10 attempts per 15 minutes
- [ ] Global rate limit: ≤ 100 requests per minute
- [ ] Account lockout after 5 failed attempts (30-minute cooldown)
- [ ] Consistent response time for valid/invalid credentials (prevent timing attacks)

### Input Validation

- [ ] Zod schema on all auth endpoints (`/login`, `/forgot-password`, `/reset-password`, `/password`)
- [ ] Email format validation
- [ ] Password length constraints (min 8, max 128)
- [ ] All validation errors return `422 Unprocessable Entity`

### HTTP / Transport

- [ ] Correct status codes: `401` for auth failures, `403` for authorization, `422` for validation
- [ ] Helmet.js security headers active
- [ ] CORS configured with specific origin (not `*`)
- [ ] HTTPS in production (TLS 1.2+)
- [ ] `Strict-Transport-Security` header set

### Database

- [ ] `refresh_tokens` table with `revoked` flag and `expires_at`
- [ ] `password_reset_tokens` table with `used` flag and `expires_at`
- [ ] `users.failed_login_attempts` and `users.locked_until` fields
- [ ] Indexes on `token` columns for fast lookups
- [ ] Cascade delete on user deletion

### Logging & Monitoring

- [ ] All auth events logged (login success/failure, logout, password change, reset)
- [ ] No sensitive data (passwords, tokens) in logs
- [ ] Failed login attempts logged with IP (for incident response)
- [ ] Automated cleanup job for expired tokens

### Socket.IO

- [ ] JWT verification on WebSocket handshake
- [ ] Token expiry check with clear error message
- [ ] Personal notification room per user (`notifications:<userId>`)
- [ ] Instructor authorization verified before attendance operations

### Operational

- [ ] `JWT_SECRET` rotated periodically (requires re-login for all users)
- [ ] Database backups encrypted at rest
- [ ] `.env` file in `.gitignore`
- [ ] Swagger docs updated with new auth endpoints
- [ ] Test coverage for all auth flows (happy path + edge cases)

---

## Appendix: Recommended Dependencies

```bash
# Phase 1
npm install zod express-rate-limit helmet cors bcrypt

# Phase 2
# (no new deps — uses existing Prisma + nodemailer for email)
npm install nodemailer  # or @resend/node for Resend API

# Phase 3 (optional)
npm install ioredis      # For token blacklist / session store
npm install otplib qrcode  # For MFA (TOTP)
npm install cron          # For token cleanup job
```

---

## Final Notes

1. **Do Phase 1 today.** It takes ~2 hours and closes the most dangerous gaps (brute-force, input validation, PII leakage).
2. **Phase 2 is your next sprint.** Full token lifecycle is what separates a prototype from production-grade auth.
3. **Phase 3 is optional** but recommended before going to production with real student data.
4. **Never roll your own crypto.** Use `bcrypt` for passwords, `jsonwebtoken` for JWTs, `otplib` for TOTP. All three are battle-tested.
5. **Test everything.** Write integration tests for login, refresh, logout, and password reset. Test edge cases: expired tokens, revoked tokens, locked accounts, malformed input.
