# Login System – Improvements & Roadmap

An analysis of the current authentication implementation and a prioritised list of improvements, what you need for each, and exactly how to implement them.

---

## Current State (Quick Summary)

| File                                   | What it does                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `src/controllers/authController.js`    | `login` (bcrypt compare → JWT sign), `me` (return token payload + DB fields) |
| `src/middlewares/authMiddleware.js`    | Verifies Bearer JWT, normalises `id`/`userId` field                          |
| `src/routes/authRoutes.js`             | `POST /auth/login`, `GET /auth/me`                                           |
| `prisma/schema.prisma` → `model users` | Stores `password_hash`, no refresh token / lockout fields                    |

**Key gaps:** no refresh tokens, no logout, no rate limiting, no brute-force protection, no password-reset flow, weak input validation, no token revocation, incomplete `me` response for non-student roles.

---

## 1. Refresh Token System

### Problem

`accessToken` expires in 1 hour. After that the user must log in again. There is no silent refresh – the front-end has no way to keep the session alive.

### Why you need this

Without refresh tokens, users are forced to log in again every hour. In a college system where students check schedules, grades, and attendance throughout the day, that's a poor experience. More importantly, if you shorten the JWT expiry to 15 minutes (which is the secure recommendation), you **must** have refresh tokens or the app becomes completely unusable. This also enables proper logout — right now there is no `/auth/logout` and no way to invalidate a session.

> **Verdict:** Defer unless you are building a persistent front-end app. If users just use it in short sessions, a 1-hour JWT is acceptable for now.

### What you need

-   A `refresh_tokens` Prisma model (token string, userId FK, expiry, revoked flag).
-   Two new endpoints: `POST /auth/refresh` and `POST /auth/logout`.
-   The access token should be short-lived (~15 min); the refresh token long-lived (~7 days) stored in an **HttpOnly cookie**.

### Schema addition

```prisma
model refresh_tokens {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token      String   @unique
  user_id    String   @db.Uuid
  expires_at DateTime @db.Timestamptz(6)
  revoked    Boolean  @default(false)
  created_at DateTime @default(now()) @db.Timestamptz(6)
  users      users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

### How to implement

1. On `login`: generate a `crypto.randomBytes(64).toString('hex')` refresh token, save to DB, send in an `HttpOnly; Secure; SameSite=Strict` cookie, and return a short-lived JWT access token in the JSON body.
2. `POST /auth/refresh`: read cookie → validate against DB (not revoked, not expired) → issue a new access token (and optionally rotate the refresh token).
3. `POST /auth/logout`: mark the refresh token `revoked = true` in DB, clear the cookie.

```js
// login – after password check
const refreshToken = crypto.randomBytes(64).toString("hex");
await prisma.refresh_tokens.create({
    data: {
        token: refreshToken,
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
});
res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
});
const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
);
return res.json({ accessToken });
```

---

## 2. Brute-Force / Rate Limiting Protection

### Problem

The login endpoint has no throttling. An attacker can try unlimited passwords against any account.

### Why you need this

Your system holds real student and faculty accounts. Without rate limiting, any attacker who knows a user's email (which is often public in a university) can run an automated password-guessing script against the `/auth/login` endpoint indefinitely. `express-rate-limit` takes 5 lines of code and stops this completely. This is the **highest return on investment** of all the improvements listed here — tiny effort, protects every account.

> **Verdict:** Do this. It is not optional for a system with real users.

### What you need

Two complementary layers:

| Layer                         | Package                               | Scope               |
| ----------------------------- | ------------------------------------- | ------------------- |
| Global rate limit             | `express-rate-limit`                  | all requests        |
| Per-IP/account login throttle | `express-rate-limit` or in-DB counter | login endpoint only |
| Account lockout               | DB fields on `users`                  | per-account         |

### Schema addition

```prisma
// add to model users
failed_login_attempts Int      @default(0)
locked_until          DateTime? @db.Timestamptz(6)
```

### How to implement

```bash
npm install express-rate-limit
```

```js
// src/middlewares/rateLimitMiddleware.js
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 attempts per IP
    message: { error: "Too many login attempts, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});
```

```js
// authRoutes.js
router.post("/login", loginLimiter, login);
```

In the `login` controller, also track per-account failures:

```js
if (!isPasswordValid) {
    const MAX_ATTEMPTS = 5;
    const lockDuration = 30 * 60 * 1000; // 30 min

    await prisma.users.update({
        where: { id: user.id },
        data: {
            failed_login_attempts: { increment: 1 },
            ...(user.failed_login_attempts + 1 >= MAX_ATTEMPTS && {
                locked_until: new Date(Date.now() + lockDuration),
            }),
        },
    });
    return res.status(401).json({ message: "Invalid username or password" });
}
// On success – reset counter
await prisma.users.update({
    where: { id: user.id },
    data: { failed_login_attempts: 0, locked_until: null },
});
```

Check lockout at the top of `login`:

```js
if (user.locked_until && user.locked_until > new Date()) {
    return res
        .status(423)
        .json({ message: "Account locked. Try again later." });
}
```

---

## 3. Input Validation

### Problem

`login` accepts any body without validation. A missing `email` field causes an unhandled Prisma error that leaks a 500 stack trace.

### Why you need this

Right now, sending `{}` as the request body to `/auth/login` crashes into a raw Prisma error and returns a 500 with internal details exposed to the caller. This is both a security issue (information disclosure) and a reliability issue. Validation also protects all your other endpoints — the `validate` middleware you build here can be reused across the entire project.

> **Verdict:** Do this. It also improves error messages for the front-end (it gets "Invalid email format" instead of a 500).

### What you need

```bash
npm install zod
```

### How to implement

```js
// src/validators/authValidators.js
import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});
```

```js
// src/middlewares/validateMiddleware.js
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res
            .status(422)
            .json({ errors: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
};
```

```js
// authRoutes.js
router.post("/login", loginLimiter, validate(loginSchema), login);
```

---

## 4. Password Reset (Forgot Password)

### Problem

There is no way for a user to recover their account if they forget their password. The `register` endpoint is commented out, so passwords are set by admins/seeds only.

### Why you need this

If a student forgets their password, the only resolution right now is an admin manually updating the DB. In a college system with potentially hundreds of students, this does not scale and creates admin overhead. That said, this improvement only becomes urgent once students are actively using the system with their own passwords. If passwords are still admin-assigned and rarely changed, you can defer this.

> **Verdict:** Defer for now unless students are self-managing passwords. Add it before going to production with real users.

### What you need

-   A `password_reset_tokens` Prisma model.
-   Two endpoints: `POST /auth/forgot-password` and `POST /auth/reset-password`.
-   A mail-sending utility (e.g. **Nodemailer** + an SMTP provider, or **Resend**).

### Schema addition

```prisma
model password_reset_tokens {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  token      String   @unique
  user_id    String   @db.Uuid
  expires_at DateTime @db.Timestamptz(6)
  used       Boolean  @default(false)
  users      users    @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

### How to implement

```bash
npm install nodemailer
```

```
POST /auth/forgot-password  { email }
  → generate crypto token (32 bytes hex)
  → save to password_reset_tokens (expires in 1 hour)
  → send email with link: https://yourapp.com/reset-password?token=<token>
  → always respond 200 (don't reveal if email exists)

POST /auth/reset-password   { token, newPassword }
  → find token in DB (not used, not expired)
  → hash newPassword with bcrypt
  → update users.password_hash
  → mark token used = true
  → invalidate all active refresh tokens for that user
```

---

## 5. Token Blacklisting / Proper Logout

### Problem

There is no `logout` endpoint. Even after a user "logs out" on the front-end, the JWT remains valid until its `expiresIn` window closes. If a token is stolen, it cannot be revoked.

### Why you need this

If a student's laptop is stolen or a token is leaked, you have no way to force that session to end — the token keeps working for the full 1 hour. A proper logout endpoint (backed by refresh token revocation) closes that gap. It also gives users a real sense of security when they explicitly log out on a shared computer. This is a dependency of Section 1 — once you have refresh tokens, logout comes almost for free.

> **Verdict:** Implement alongside refresh tokens (Section 1). Alone, without refresh tokens, a logout endpoint wouldn't do much since the JWT itself can't be invalidated.

### What you need

After implementing refresh tokens (Section 1), logout is handled by revoking the refresh token in the DB. For access tokens you need a short expiry (15 min) so the risk window is small. Optionally add a Redis-backed JWT blacklist for immediate revocation.

### How to implement (without Redis, using short expiry)

```js
// POST /auth/logout
export const logout = async (req, res) => {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
        await prisma.refresh_tokens.updateMany({
            where: { token: refreshToken },
            data: { revoked: true },
        });
    }
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out successfully" });
};
```

Add to routes:

```js
router.post("/logout", authMiddleware, logout);
```

---

## 6. Complete `me` Endpoint

### Problem

`me` only returns extended DB fields for `student` and `leader` roles. Teachers and admins only get the raw JWT payload with no DB data (no `avatar_url`, `phone`, etc.).

### Why you need this

Any front-end that shows the logged-in teacher's or admin's profile picture, phone, or address will silently display nothing because `GET /auth/me` returns incomplete data for those roles. It's a bug that exists right now, not a hypothetical future concern. The fix is a one-query change — no new tables, no new packages.

> **Verdict:** Do this. It is a simple bug fix.

### How to fix

Unify the DB fetch for all roles:

```js
export const me = async (req, res) => {
    const { userId } = req.user;
    const user = await prisma.users.findUnique({
        where: { id: userId },
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
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
};
```

---

## 7. Proper HTTP Status Codes

### Problem

Both "user not found" and "wrong password" return `400 Bad Request`. The correct code for invalid credentials is `401 Unauthorized`.

### Why you need this

HTTP status codes are the contract between your API and any client (front-end, mobile app, Postman tests). Returning `400` for wrong credentials means the front-end has to inspect the message body to know why it failed, instead of branching on the status code. It also breaks any client that follows HTTP semantics (e.g. interceptors that redirect to login on `401`). This is a one-line fix.

> **Verdict:** Do this immediately. It takes 30 seconds.

### Fix

```js
// authController.js – login
return res.status(401).json({ message: "Invalid username or password" });
//         ^^^
```

---

## 8. Sensitive Data in JWT Payload

### Problem

The JWT currently encodes `name: user.full_name`. This is PII that is bundled into every request and embedded in client storage. If the user later changes their name, the token still carries the old value.

### Why you need this

JWTs are Base64-encoded, not encrypted — anyone who intercepts or reads the token (e.g. from `localStorage`) can decode the payload and read the name instantly. Beyond privacy, stale data in tokens causes subtle bugs: if an admin updates a user's name in the DB, the token keeps broadcasting the old name until it expires. The fix is removing one field from `jwt.sign()` — it costs nothing.

> **Verdict:** Do this. Zero effort, no downside.

### Fix

Only store the minimum required claims:

```js
const token = jwt.sign(
    { userId: user.id, role: user.role }, // remove full_name
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
);
```

Fetch the name server-side via `/auth/me` when the front-end needs to display it.

---

## Implementation Priority

| #   | Improvement                                    | Effort | Impact | Verdict                                                 |
| --- | ---------------------------------------------- | ------ | ------ | ------------------------------------------------------- |
| 1   | Fix HTTP status codes (401 vs 400)             | Low    | Medium | **Do it now** — 30 seconds, one line                    |
| 2   | Remove PII from JWT payload                    | Low    | Medium | **Do it now** — zero cost, no downside                  |
| 3   | Fix `me` endpoint for all roles                | Low    | Medium | **Do it now** — active bug affecting teachers/admins    |
| 4   | Input validation with Zod                      | Low    | High   | **Do it now** — raw 500 errors leak internals today     |
| 5   | Brute-force rate limiting (express-rate-limit) | Low    | High   | **Do it now** — protects all real accounts, 5 lines     |
| 6   | Account lockout (DB fields)                    | Medium | High   | **Defer** — rate limiting already covers this           |
| 7   | Refresh token + proper logout                  | Medium | High   | **Defer** — needed when building a persistent front-end |
| 8   | Password reset flow                            | Medium | High   | **Defer** — needed when users self-manage passwords     |
| 9   | Token blacklisting (Redis optional)            | High   | Medium | **Skip** — over-engineering for this use case           |

---

## New DB Migration Summary

If you implement all improvements above, the migration will need to:

```sql
-- Account lockout fields on users
ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMPTZ;

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Password reset tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false
);
```

Run via Prisma:

```bash
npx prisma migrate dev --name improve_auth_system
```

---

## Required Packages Summary

```bash
npm install express-rate-limit zod nodemailer
# optional, for Redis-backed token blacklist:
npm install ioredis
```
