# Authentication System - College System Backend

## Overview

**Authentication Type:** JWT-based Bearer token authentication  
**Framework:** Express.js (ES modules)  
**Database:** PostgreSQL via Prisma ORM  
**Password Hashing:** `bcryptjs` (10 salt rounds)  
**Token Library:** `jsonwebtoken`  

---

## File Structure

| Component | Absolute Path |
|-----------|---------------|
| Auth Controller | `src/controllers/authController.js` |
| Auth Middleware | `src/middlewares/authMiddleware.js` |
| Auth Routes | `src/routes/authRoutes.js` |
| Auth Swagger Docs | `src/swagger/auth.swagger.js` |
| Password Change Controller | `src/controllers/studentSettingsController.js` |
| User Controller (password hashing) | `src/controllers/usersController.js` |
| User Import Service (password hashing) | `src/utils/userImportService.js` |
| WebSocket Auth (Socket.IO) | `src/utils/socketIO.js` |
| Server Entry Point | `src/server.js` |
| Prisma Schema | `prisma/schema.prisma` |
| Environment Example | `.env.example` |
| Auth Improvements Doc | `markdowns/LOGIN_SYSTEM_IMPROVEMENTS.md` |

---

## Database Schema

### `users` Model (prisma/schema.prisma)

```prisma
model users {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  full_name     String
  email         String   @unique
  password_hash String
  role          user_role
  avatar_url    String?
  phone         String?
  national_id   String?
  address       String?
  created_at    DateTime? @default(now()) @db.Timestamptz(6)
  updated_at    DateTime? @default(now()) @db.Timestamptz(6)
  // ... relations to many other tables
}
```

### `user_role` Enum

```prisma
enum user_role {
  student
  doctor
  admin
  teaching_assistant
  super_admin
  leader
}
```

---

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `JWT_SECRET` | Secret key for JWT signing/verification | Random hex string |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `PORT` | Server port (default 3000) | `3000` |
| `SUPABASE_URL` | Supabase storage integration | `https://project.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key (bypasses RLS) | Service role key |

---

## Authentication Flow

### 1. Login (POST `/api/v1/auth/login`)

**File:** `src/controllers/authController.js`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Implementation:**
```javascript
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Find user by email
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        
        // 2. Validate password with bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        
        // 3. Sign JWT token
        const token = jwt.sign(
            { userId: user.id, name: user.full_name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        
        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
```

**JWT Payload:**
- `userId` (string UUID)
- `name` (full_name from database)
- `role` (user_role enum value)
- `exp` (1 hour from issuance)

**Known Issues:**
- Returns `400` instead of `401` for invalid credentials
- JWT contains PII (`full_name`)
- No rate limiting or brute-force protection
- No input validation (Zod/schema validation)

---

### 2. Get Current User (GET `/api/v1/auth/me`)

**File:** `src/controllers/authController.js`  
**Middleware:** `authMiddleware`

**Headers:**
```
Authorization: Bearer <token>
```

**Implementation:**
```javascript
export const me = async (req, res) => {
    const user = req.user;
    
    if (!user) return res.status(401).json({ error: "not authenticated" });
    
    // Same query for all roles (previously had role-based branching)
    const data = await prisma.users.findUnique({
        where: { id: user.userId },
        select: {
            email: true,
            role: true,
            avatar_url: true,
            phone: true,
            address: true,
        },
    });
    
    return res.json({ ...user, ...data });
};
```

**Response:**
```json
{
  "userId": "uuid-string",
  "name": "John Doe",
  "role": "student",
  "email": "john@example.com",
  "avatar_url": "https://...",
  "phone": "+1234567890",
  "address": "..."
}
```

**Known Issues:**
- Previously had role-based branching that was unified (now fixed)
- Returns token payload merged with DB fields (potential stale data)

---

## Authentication Middleware

### 1. `authMiddleware` - JWT Verification

**File:** `src/middlewares/authMiddleware.js`

**Implementation:**
```javascript
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // 1. Check Authorization header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Authentication invalid" });
    }
    
    // 2. Extract token
    const token = authHeader.split(" ")[1];
    
    try {
        // 3. Verify JWT token
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Normalize user ID (handle both id and userId fields)
        payload.id = payload.id ?? payload.userId;
        
        if (!payload.id) {
            return res.status(401).json({ error: "Invalid token payload" });
        }
        
        // 5. Attach to request object
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Authentication invalid" });
    }
};
```

**Usage:** Applied to any route requiring authentication
```javascript
router.get("/me", authMiddleware, me);
```

---

### 2. `authorizationMiddleware` - Role-Based Access Control (RBAC)

**File:** `src/middlewares/authMiddleware.js`

**Implementation:**
```javascript
export const authorizationMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
};
```

**Usage:**
```javascript
import { authMiddleware, authorizationMiddleware } from "../middlewares/authMiddleware.js";

router.delete("/users/:id", 
    authMiddleware, 
    authorizationMiddleware("admin", "super_admin"), 
    deleteUser
);
```

---

## WebSocket Authentication (Socket.IO)

**File:** `src/utils/socketIO.js`

**⚠️ CONFIRMED:** The project DOES have JWT verification in Socket.IO middleware.

**Implementation:**
```javascript
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded; // Attach user info to socket
        next();
    } catch (err) {
        return next(new Error("Authentication error: Invalid token"));
    }
});
```

**Client Connection:**
```javascript
const socket = io("http://localhost:3000", {
    auth: {
        token: "your-jwt-token-here"
    }
});
```

**Socket.IO Events (after authentication):**
- `join-session` - Instructor joins attendance session room
- `scan-qr` - Student marks attendance via QR code
- `toggle-attendance` - Instructor manually toggles student attendance
- `leave-session` - Leave session room
- `disconnect` - Client disconnected

**Personal Notification Room:**
- Each user automatically joins `notifications:<userId>` room on connect
- Used for real-time notification delivery

---

## Password Change (Student Settings)

**File:** `src/controllers/studentSettingsController.js`  
**Route:** `PUT /api/v1/student-settings/password` (requires auth)

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456",
  "confirmNewPassword": "newpassword456"
}
```

**Validation:**
- All fields required
- `newPassword` must match `confirmNewPassword`
- `newPassword` minimum 6 characters
- `currentPassword` must be valid (verified with bcrypt)

**Implementation:**
```javascript
export const updatePassword = async (req, res) => {
    const userId = req.user.userId;
    const { currentPassword, confirmNewPassword, newPassword } = req.body;
    
    // Validation checks...
    
    const user = await prisma.users.findUnique({ where: { id: userId } });
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
    }
    
    // Hash and update new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
        where: { id: userId },
        data: { password_hash: hashedNewPassword },
    });
    
    res.status(200).json({ message: "Password updated successfully" });
};
```

---

## Password Hashing Across the System

**Library:** `bcryptjs`  
**Salt Rounds:** 10

**Locations:**
| File | Usage |
|------|-------|
| `authController.js` | `bcrypt.compare()` for login validation |
| `usersController.js` | `bcrypt.hash()` for creating/updating users |
| `studentSettingsController.js` | `bcrypt.compare()` + `bcrypt.hash()` for password change |
| `userImportService.js` | `bcrypt.hash()` for bulk Excel user import |
| `prisma/seed.js` | `bcrypt.hash()` for seed data creation |
| `scripts/createSuperAdmin.js` | `bcrypt.hash()` for super admin creation |

---

## Disabled Features

### Self-Registration (Commented Out)

**File:** `src/controllers/authController.js`

The `register` function is commented out. Self-registration is **disabled**.

```javascript
// export const register = async (req, res) => {
//     const { email, password } = req.body;
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//         return res.status(400).json({ message: "Username already exists" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({
//         data: { email, password: hashedPassword },
//     });
//     res.status(201).json({
//         message: "User registered successfully",
//         userId: newUser.id,
//     });
// };
```

**User Creation Methods:**
1. Admin Excel import (`userImportService.js`)
2. Database seeding (`prisma/seed.js`)
3. Manual admin creation via users CRUD

---

## Known Security Gaps

**Source:** `markdowns/LOGIN_SYSTEM_IMPROVEMENTS.md`

### Critical Issues

1. **No Rate Limiting** - Login endpoint has no brute-force protection
2. **No Input Validation** - No Zod/schema validation on login body
3. **Wrong HTTP Status Codes** - Returns `400` instead of `401` for invalid credentials
4. **PII in JWT** - `full_name` is embedded in token payload

### Missing Features

5. **No Refresh Tokens** - Users must re-login every hour
6. **No Logout Endpoint** - Tokens remain valid until expiry
7. **No Password Reset** - No forgot/reset password flow
8. **No Token Revocation** - Cannot invalidate tokens before expiry
9. **No Account Lockout** - No failed login attempt tracking

### Recommended Priority Fixes

| Priority | Improvement | Effort | Impact |
|----------|-------------|--------|--------|
| 🔴 P0 | Fix HTTP status codes (400 → 401) | 30 seconds | Medium |
| 🔴 P0 | Remove `full_name` from JWT | 1 minute | Medium |
| 🟡 P1 | Add Zod validation to login | Low | High |
| 🟡 P1 | Add rate limiting (express-rate-limit) | Low | High |
| 🟢 P2 | Implement refresh tokens + logout | Medium | High |
| 🟢 P2 | Add password reset flow | Medium | High |

---

## Swagger/OpenAPI Documentation

**File:** `src/swagger/auth.swagger.js`

**Schemas Defined:**
- `LoginRequest` - email + password
- `LoginResponse` - message + token
- `MeResponse` - user object with profile data
- `ErrorResponse` - error message
- `bearerAuth` - JWT security scheme

**Access:** `GET /docs` (Swagger UI)

---

## Route Summary

| Method | Path | Handler | Auth Required | Description |
|--------|------|---------|---------------|-------------|
| POST | `/api/v1/auth/login` | `login` | ❌ No | Authenticate user, return JWT |
| GET | `/api/v1/auth/me` | `me` | ✅ Yes | Get current user profile |

---

## Additional Password Management

### Users Controller (Admin CRUD)

**File:** `src/controllers/usersController.js`

Admin can create/update users with password hashing:
- Line 311: `bcrypt.hash()` for user creation
- Line 463: `bcrypt.hash()` for user update
- Line 600: `bcrypt.hash()` for password reset by admin

### User Import Service

**File:** `src/utils/userImportService.js`

Bulk Excel import hashes passwords:
- Line 105: `bcrypt.hash()` for new users
- Line 255: `bcrypt.hash()` for updated users

---

## Error Handling

| Scenario | Current Status Code | Expected Status Code |
|----------|---------------------|----------------------|
| Missing auth header | 401 | 401 ✅ |
| Invalid/malformed token | 401 | 401 ✅ |
| User not found | 400 | 401 ❌ |
| Wrong password | 400 | 401 ❌ |
| Internal server error | 500 | 500 ✅ |

---

## Dependencies

```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.x.x"
}
```

---

## Implementation Notes

1. **No DTOs or Validators** - The project has no `src/validators/` or `src/dto/` directories
2. **No Refresh Tokens** - Only access tokens with 1-hour expiry
3. **No Logout** - No endpoint to invalidate sessions
4. **No Account Lockout** - No `failed_login_attempts` or `locked_until` fields
5. **Password Reset** - Only admin can reset via users CRUD
6. **User Registration** - Disabled, users created by admin import/seeding only
7. **WebSocket Auth** - Uses same JWT via `socket.handshake.auth.token`
8. **ID Normalization** - Middleware handles both `id` and `userId` in JWT payload
