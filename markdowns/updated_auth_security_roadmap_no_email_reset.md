# Authentication System — Security Audit & Improvement Roadmap

---

# 1. Security Audit

## Critical Severity

| # | Vulnerability | Why It Matters | Exploit Scenario |
|---|--------------|----------------|-----------------|
| C1 | **No brute-force protection** | An attacker can submit unlimited password attempts against any email. Student/doctor emails are often public in a college system. | Automated script guesses passwords at 1000+ req/min. A weak password like `Student123!` is cracked in minutes. |
| C2 | **No input validation on `/login`** | Sending malformed requests may crash Prisma or leak internal errors. | `POST /api/v1/auth/login {}` → stack traces or internal DB errors exposed. |
| C3 | **JWT contains PII (`full_name`)** | JWTs are Base64 encoded, not encrypted. Anyone with the token can decode it. | Token decoded using jwt.io reveals user full name. |

---

## High Severity

| # | Vulnerability | Why It Matters |
|---|--------------|----------------|
| H1 | **Wrong HTTP status codes** | `400` should not be used for authentication failure. Use `401`. |
| H2 | **No token revocation / logout** | A stolen token works until expiry. |
| H3 | **`bcryptjs` instead of native `bcrypt`** | Slower hashing implementation reduces practical security. |
| H4 | **No password reset strategy** | Admins currently need manual DB updates. |

---

## Medium Severity

| # | Vulnerability | Why It Matters |
|---|--------------|----------------|
| M1 | **No account lockout tracking** | Allows repeated attacks against one account. |
| M2 | **JWT expiry too long (1h)** | Stolen tokens remain usable for too long. |
| M3 | **Socket.IO token reuse** | Same token used for REST and WebSocket increases blast radius. |
| M4 | **No CORS configuration** | Any origin may send requests. |
| M5 | **No security headers** | Missing Helmet.js protections. |

---

## Low Severity

| # | Vulnerability | Why It Matters |
|---|--------------|----------------|
| L1 | **`/me` returns stale token data** | Role/name may become outdated. |
| L2 | **Inconsistent error semantics** | Client interceptors may fail. |
| L3 | **No request correlation IDs** | Harder production debugging. |

---

# 2. Authentication Architecture Recommendation

## Keep JWT

JWT is still the correct choice for:

- REST APIs
- Socket.IO
- SPA frontend
- Mobile apps

But the lifecycle must improve.

---

## Current Design

```text
Login → 1-hour JWT → No logout → Token expires naturally
```

---

## Recommended Design

```text
Login
  ↓
15-min access token (JWT)
+
7-day refresh token (opaque token stored in DB)
```

---

## Why This Design Is Better

### Short-lived access tokens

If a token leaks:

- attacker only gets 15 minutes
- not 1 hour

---

### Real logout support

Refresh tokens can be revoked.

```sql
UPDATE refresh_tokens
SET revoked = true
```

---

### Silent authentication refresh

```text
Access token expires
    ↓
Frontend calls /auth/refresh
    ↓
New access token returned
```

---

# 3. Account Recovery Policy

If a user forgets their password:

- they must visit student affairs or system administration
- identity is verified manually
- staff resets the password directly from the admin panel or database

No self-service password reset flow is implemented.

This approach is acceptable for:

- internal university systems
- centrally managed student accounts
- systems without public registration

---

# 4. Feature Priority Matrix

| Priority | Feature | Effort | Impact | Verdict |
|----------|---------|--------|--------|---------|
| 🔴 P0 | Fix HTTP status codes | 2 min | Medium | Do immediately |
| 🔴 P0 | Remove PII from JWT | 1 min | Medium | Do immediately |
| 🔴 P0 | Add Zod validation | 30 min | High | Do immediately |
| 🔴 P0 | Add rate limiting | 20 min | High | Do immediately |
| 🟠 P1 | Refresh tokens + logout | 2–3 hrs | High | Next sprint |
| 🟠 P1 | Admin password reset flow | 1 hr | High | Next sprint |
| 🟡 P2 | Account lockout | 1 hr | Medium | After P1 |
| 🟡 P2 | Helmet + CORS | 15 min | Medium | Quick win |
| 🟢 P3 | MFA | 1–2 days | Medium | Optional |

---

# 5. Code-Level Improvements

---

## 5.1 Corrected Login Controller

```javascript
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.users.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const accessToken = jwt.sign(
            {
                userId: user.id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m",
            }
        );

        return res.status(200).json({
            message: "Login successful",
            accessToken,
            requiresPasswordChange: user.must_change_password,
        });
    } catch (err) {
        logger.error(err);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
```

---

## 5.2 Corrected `/me` Endpoint

```javascript
export const me = async (req, res) => {
    const user = await prisma.users.findUnique({
        where: {
            id: req.user.userId,
        },
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

    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }

    return res.json(user);
};
```

---

## 5.3 Auth Middleware

```javascript
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = {
            userId: payload.userId,
            role: payload.role,
        };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired",
            });
        }

        return res.status(401).json({
            message: "Invalid token",
        });
    }
};
```

---

## 5.4 Zod Validation

```javascript
import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .email("Invalid email format")
        .max(255),

    password: z
        .string()
        .min(1, "Password is required")
        .max(128),
});
```

---

## Validation Middleware

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

---

# 6. Rate Limiting

```javascript
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        message: "Too many login attempts. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
```

---

# 7. Password Hashing Upgrade

## Replace `bcryptjs`

```bash
npm uninstall bcryptjs
npm install bcrypt
```

---

## Use stronger rounds

```javascript
const SALT_ROUNDS = 12;
```

---

# 8. Helmet + CORS

## Install

```bash
npm install helmet cors
```

---

## Apply middleware

```javascript
app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
```

---

# 9. Refresh Tokens

## Refresh Token Table

```prisma
model refresh_tokens {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token        String   @unique
  user_id      String   @db.Uuid
  expires_at   DateTime @db.Timestamptz(6)
  revoked      Boolean  @default(false)
  created_at   DateTime @default(now()) @db.Timestamptz(6)
  ip_address   String?
  user_agent   String?

  users users @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([token])
}
```

---

## Refresh Endpoint

```text
POST /auth/refresh
```

Purpose:

- validate refresh token
- issue new access token
- optionally rotate refresh token

---

## Logout Endpoint

```text
POST /auth/logout
```

Purpose:

- revoke refresh token
- clear cookie

---

# 10. Account Lockout

## Add Fields

```prisma
failed_login_attempts Int       @default(0)
locked_until          DateTime?
```

---

## Logic

```text
5 failed attempts
    ↓
lock account for 30 minutes
```

---

# 11. Socket.IO Improvements

```javascript
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Authentication error"));
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.user = decoded;

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(
                new Error("Token expired. Reconnect required.")
            );
        }

        return next(new Error("Invalid token"));
    }
});
```

---

# 12. Prisma Schema Changes

## Additions To Users Model

```prisma
model users {
  // existing fields

  failed_login_attempts Int       @default(0)
  locked_until          DateTime?
  must_change_password  Boolean   @default(false)
}
```

---

# 13. Implementation Plan

## Phase 1 — Quick Wins

### Do Immediately

- Fix HTTP status codes
- Remove PII from JWT
- Add Zod validation
- Add rate limiting
- Add Helmet
- Configure CORS
- Replace bcryptjs with bcrypt

Estimated time:

```text
1–2 hours
```

---

## Phase 2 — Authentication Lifecycle

### Add

- refresh tokens
- logout
- account lockout
- admin reset flow
- forced password change

Estimated time:

```text
3–5 hours
```

---

## Phase 3 — Advanced Security

### Optional Features

- MFA
- session/device management
- audit logging
- request correlation IDs

Estimated time:

```text
1–3 days
```

---

# 14. Best Practices Checklist

## Token Security

- [ ] Access token expiry ≤ 15 minutes
- [ ] Refresh token stored in HttpOnly cookie
- [ ] Refresh token revocation supported
- [ ] JWT contains only `userId` and `role`
- [ ] JWT secret generated securely

---

## Password Security

- [ ] Native bcrypt used
- [ ] Salt rounds ≥ 12
- [ ] Password change invalidates sessions
- [ ] Temporary admin reset passwords force change on next login

---

## Brute Force Protection

- [ ] Login rate limiting
- [ ] Global rate limiting
- [ ] Account lockout after repeated failures

---

## Validation

- [ ] Zod schemas on all auth routes
- [ ] Validation returns 422
- [ ] Email format validated
- [ ] Password length validated

---

## HTTP Security

- [ ] Helmet enabled
- [ ] CORS restricted to frontend domain
- [ ] HTTPS enabled in production
- [ ] Secure cookies enabled

---

## Database

- [ ] Refresh tokens table exists
- [ ] Refresh tokens indexed
- [ ] Cascade delete enabled
- [ ] Account lockout fields added
- [ ] `must_change_password` field added

---

## Logging

- [ ] Login attempts logged
- [ ] Password changes logged
- [ ] No tokens/passwords logged

---

# 15. Recommended Dependencies

```bash
npm install \
  zod \
  express-rate-limit \
  helmet \
  cors \
  bcrypt
```

---

# Final Notes

1. Phase 1 should be implemented immediately.
2. Refresh token lifecycle is the most important architectural improvement.
3. Admin-assisted password reset is appropriate for a university/internal system.
4. Do not store sensitive data inside JWT payloads.
5. Never implement custom cryptography.
6. Add integration tests for login, logout, refresh, and lockout flows.

