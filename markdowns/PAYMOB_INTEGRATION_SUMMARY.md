# Paymob Payment Integration - Complete Technical Summary

> **Purpose:** This document provides a comprehensive overview of the Paymob payment integration in the College Management System. Use it as context for AI assistants to generate implementation prompts, debug issues, or extend functionality.

---

## Table of Contents

- [1. System Overview](#1-system-overview)
- [2. Paymob Gateway Configuration](#2-paymob-gateway-configuration)
- [3. Database Schema](#3-database-schema)
- [4. Payment Flow Architecture](#4-payment-flow-architecture)
- [5. API Endpoints](#5-api-endpoints)
- [6. Core Implementation Details](#6-core-implementation-details)
- [7. Period Control System](#7-period-control-system)
- [8. Error Handling & Edge Cases](#8-error-handling--edge-cases)
- [9. Webhook Integration](#9-webhook-integration)
- [10. Security & Validation](#10-security--validation)
- [11. Testing](#11-testing)
- [12. Quick Reference for AI Prompts](#12-quick-reference-for-ai-prompts)

---

## 1. System Overview

### Project Stack
- **Runtime:** Node.js with Express.js
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT-based with role-based access control
- **Payment Gateways:** PayPal (USD) + Paymob (EGP)
- **Project Type:** College Management System Backend

### Payment Model
- **Pay-All-At-Once:** Students must pay ALL pending invoices for a semester together (no individual invoice payments)
- **Semester-Based:** Payments are tied to academic semesters (Fall/Spring/Summer) and years
- **Period-Controlled:** Payments only allowed during admin-defined windows
- **Dual Gateway:** Both PayPal and Paymob supported with identical business logic

### Key Design Decisions
- Merchant order ID format: `bulk_{studentUserId}_{timestamp}`
- Amounts stored as Decimals in DB, converted to cents for Paymob API
- Transaction verification requires success + !pending + !refunded + !voided
- Idempotent payment records via upsert on `student_payments` table
- Webhook handlers re-fetch transaction state to avoid trusting payload alone

---

## 2. Paymob Gateway Configuration

### Environment Variables

```env
# Required
PAYMOB_API_KEY=your_api_key_here          # Authentication key from Paymob dashboard
PAYMOB_INTEGRATION_ID=123456              # Payment integration ID (numeric)
PAYMOB_IFRAME_ID=789012                   # Iframe display ID (numeric)

# Optional
PAYMOB_BASE_URL=https://accept.paymobsolutions.com  # Override default base URL
```

### Configuration Validation

Located in: `src/config/paymob.js`

```javascript
validatePaymobConfig()
// Returns false if any of:
// - PAYMOB_API_KEY is missing
// - PAYMOB_INTEGRATION_ID is missing
// - PAYMOB_IFRAME_ID is missing
```

### Core Paymob Utility Functions

| Function | HTTP Method | Endpoint | Purpose |
|----------|-------------|----------|---------|
| `getPaymobAuthToken()` | POST | `/api/auth/tokens` | Get authentication token using API key |
| `registerPaymobOrder()` | POST | `/api/ecommerce/orders` | Create order with amount and items |
| `createPaymobPaymentKey()` | POST | `/api/acceptance/payment_keys` | Generate payment token for iframe |
| `getPaymobTransaction()` | GET | `/api/acceptance/transactions/{id}` | Fetch transaction details for verification |
| `buildPaymobIframeUrl()` | N/A | N/A | Construct iframe URL from payment token |

### Paymob API Request Wrapper

```javascript
paymobRequest(path, options)
// - Base URL: PAYMOB_BASE_URL or https://accept.paymobsolutions.com
// - Headers: Content-Type: application/json
// - Error handling: Throws with statusCode + paymobResponse on failure
```

---

## 3. Database Schema

### Prisma Models

#### `student_payments` (Semester Payment Record)
```prisma
model student_payments {
  id             Int             @id @default(autoincrement())
  student_user_id String         @db.Uuid
  semester       semester_type   // enum: Fall, Spring, Summer
  year           Int
  total_amount   Decimal         @db.Decimal
  invoice_count  Int
  gateway        payment_gateway // enum: paypal, paymob
  transaction_id String
  paid_at        DateTime        @db.Timestamptz(6)
  created_at     DateTime?       @default(now()) @db.Timestamptz(6)
  users          users           @relation(fields: [student_user_id], references: [id])

  @@unique([student_user_id, semester, year])       // One record per semester per student
  @@unique([gateway, transaction_id])               // Prevent duplicate transactions
  @@index([student_user_id])
  @@index([semester, year])
}
```

**Key Constraints:**
- Unique composite key: `(student_user_id, semester, year)` - ensures one payment record per semester
- Upsert logic: Updates existing record if student pays again for same semester (e.g., partial refunds + repay)

#### `payments` (Per-Invoice Payment Record)
```prisma
model payments {
  id             Int             @id @default(autoincrement())
  invoice_id     Int
  gateway        payment_gateway
  transaction_id String
  amount         Decimal         @db.Decimal
  status         payment_status  // enum: pending, paid, failed, refunded
  created_at     DateTime?       @default(now()) @db.Timestamptz(6)
  invoices       invoices        @relation(fields: [invoice_id], references: [id])

  @@unique([gateway, transaction_id])
  @@index([invoice_id])
  @@index([status])
}
```

**Note:** Each invoice in a semester payment gets its own `payments` record with format:
- PayPal: `{captureTransactionId}:{invoiceId}`
- Paymob: `paymob_{transactionId}:{invoiceId}`

#### `invoices` (Student Invoice)
```prisma
model invoices {
  id               Int            @id @default(autoincrement())
  student_user_id  String         @db.Uuid
  enrollment_id    Int?           @unique
  course_code      String
  semester         semester_type
  year             Int
  credit_hours     Int
  credit_price     Decimal        @db.Decimal
  total_amount     Decimal        @db.Decimal
  status           payment_status @default(pending)
  paypal_order_id  String?
  payment_date     DateTime?      @db.Timestamptz(6)
  created_at       DateTime?      @default(now()) @db.Timestamptz(6)
  updated_at       DateTime?      @updatedAt @db.Timestamptz(6)
  payments         payments[]
  
  @@index([student_user_id])
  @@index([semester, year])
  @@index([status])
  @@index([paypal_order_id])
}
```

### Enums

```prisma
enum payment_status {
  pending
  paid
  failed
  refunded
}

enum payment_gateway {
  paypal
  paymob
}

enum semester_type {
  Fall
  Spring
  Summer
}
```

---

## 4. Payment Flow Architecture

### Complete Paymob Payment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Student Requests Payment                                        │
│    POST /api/payment/invoices/paymob-order                         │
│    Body: { payAll: true }                                          │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 2. Server Validates                                                │
│    - Check payment period is open (getPaymentPeriod)               │
│    - Fetch pending invoices for semester (getPendingSemesterInvoices)│
│    - Fetch student user data for billing                           │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Create Paymob Order                                             │
│    POST /api/ecommerce/orders                                      │
│    Body: {                                                         │
│      auth_token, amount_cents, merchant_order_id, items            │
│    }                                                               │
│    merchant_order_id = "bulk_{studentId}_{timestamp}"              │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Create Payment Key                                              │
│    POST /api/acceptance/payment_keys                               │
│    Body: {                                                         │
│      auth_token, amount_cents, expiration, order_id,               │
│      billing_data, currency, integration_id                        │
│    }                                                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 5. Return Iframe URL to Client                                     │
│    Response: {                                                     │
│      iframeUrl: "/api/acceptance/iframes/{IFRAME_ID}?payment_token={token}",│
│      paymentToken, orderId, merchantOrderId,                       │
│      invoiceIds, invoiceCount, totalAmount, amountCents            │
│    }                                                               │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 6. Student Completes Payment in Iframe                             │
│    (Paymob handles card entry, 3D Secure, etc.)                    │
└────────────────────────┬────────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
┌─────────────────────┐       ┌─────────────────────┐
│ A. Manual Verify    │       │ B. Webhook (Async)  │
│ POST /paymob-verify │       │ POST /webhook/paymob│
└──────────┬──────────┘       └──────────┬──────────┘
           │                             │
           ▼                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 7. Verify Transaction                                              │
│    GET /api/acceptance/transactions/{transactionId}                │
│    Validate:                                                       │
│    - success === true                                              │
│    - pending !== true                                              │
│    - is_refunded !== true                                          │
│    - is_voided !== true                                            │
│    - merchant_order_id starts with "bulk_{studentId}_"             │
│    - amount_cents matches invoice total                            │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 8. Mark Invoices Paid (DB Transaction)                             │
│    - Update invoices.status = "paid"                               │
│    - Create payments records (one per invoice)                     │
│    - Upsert student_payments record                                │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ 9. Return Success Response                                         │
│    {                                                               │
│      message: "Paymob payment verified successfully",              │
│      invoiceIds, transactionId, orderId, status, semester, year    │
│    }                                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### Billing Data Format

```javascript
buildPaymobBillingData(user) = {
  first_name: "FirstName",           // Extracted from full_name
  last_name: "LastName",             // Remaining name parts
  email: "student@example.com",
  phone_number: "+201000000000",     // From user.phone or default
  apartment: "NA",
  floor: "NA",
  street: "User Address or NA",
  building: "NA",
  shipping_method: "PKG",
  postal_code: "00000",
  city: "Cairo",
  country: "EG",
  state: "Cairo"
}
```

### Items Format

```javascript
buildPaymobItemsForInvoices(invoices) = [
  {
    name: "Invoice {id}",
    amount_cents: "{total_amount * 100}",
    description: "{course_code} {semester} {year}",
    quantity: 1
  },
  // ... one per invoice
]
```

---

## 5. API Endpoints

### Base Path: `/api/payment`

#### 1. Get My Invoices
```
GET /invoices/me
Auth: student, leader
Query: ?status=pending|paid|failed|refunded (optional)

Response 200:
{
  "invoices": [InvoiceItem],
  "groupedInvoices": [GroupedInvoiceItem],
  "summary": {
    "totalInvoices": 3,
    "pendingInvoices": 3,
    "totalDue": 2700.00
  },
  "registrationPeriod": PeriodInfo,
  "paymentPeriod": PeriodInfo
}
```

#### 2. Get My Payments (Semester History)
```
GET /me
Auth: student, leader

Response 200:
{
  "payments": [StudentPaymentItem],
  "summary": {
    "totalPayments": 4,
    "totalAmountPaid": 9900.00
  }
}
```

#### 3. Create Paymob Order
```
POST /invoices/paymob-order
Auth: student, leader
Body: { "payAll": true }

Response 201:
{
  "message": "Paymob checkout created for all pending invoices in Fall 2026",
  "payAll": true,
  "orderId": 9944332,
  "merchantOrderId": "bulk_8f66a5e1-62b4-45be-b80f-927ecf8e8fb0_1774089894200",
  "iframeUrl": "https://accept.paymobsolutions.com/api/acceptance/iframes/789012?payment_token=xyz...",
  "paymentToken": "xyz...",
  "invoiceIds": [1, 2, 3],
  "invoiceCount": 3,
  "totalAmount": 2700.00,
  "amountCents": 270000,
  "currency": "EGP",
  "paymentPeriod": PeriodInfo
}

Error 400: { "error": "payAll must be true..." }
Error 403: { "error": "Payment period is currently closed for Fall 2026", "paymentPeriod": {...} }
Error 404: { "error": "No pending invoices found for Fall 2026" }
Error 500: { "error": "Paymob is not configured..." }
```

#### 4. Verify Paymob Payment
```
POST /invoices/paymob-verify
Auth: student, leader
Body: {
  "transactionId": "1122334455",
  "orderId": 9944332
}

Response 200:
{
  "message": "Paymob payment verified successfully",
  "invoiceIds": [1, 2, 3],
  "transactionId": "1122334455",
  "orderId": 9944332,
  "status": "paid",
  "semester": "Fall",
  "year": 2026
}

Error 400: Various validation errors (amount mismatch, transaction not completed, etc.)
```

#### 5. Paymob Webhook
```
POST /webhook/paymob
Auth: None (public webhook endpoint)
Body: Paymob webhook payload (various formats handled)

Response 200: Same as verify endpoint + { "source": "paymob_webhook", "merchantOrderId", "studentId" }
```

### Route Definitions (`src/routes/paymentRoutes.js`)

```javascript
router.get("/invoices/me", authMiddleware, authorizationMiddleware("student", "leader"), getMyInvoices);
router.get("/me", authMiddleware, authorizationMiddleware("student", "leader"), getMyPayments);
router.post("/invoices/paypal-order", authMiddleware, authorizationMiddleware("student", "leader"), createPayPalOrder);
router.post("/invoices/paymob-order", authMiddleware, authorizationMiddleware("student", "leader"), createPaymobOrder);
router.post("/invoices/capture", authMiddleware, authorizationMiddleware("student", "leader"), capturePayPalOrder);
router.post("/invoices/paymob-verify", authMiddleware, authorizationMiddleware("student", "leader"), verifyPaymobPayment);
```

**Note:** Webhook route is defined separately in main app router (no auth middleware).

---

## 6. Core Implementation Details

### Key Helper Functions

#### `ensurePayAllRequest(body)`
Validates that request body has `payAll: true` and no `invoiceIds` array.

```javascript
// Returns: { ok: true } | { ok: false, error: "..." }
```

#### `toTotalAmountCents(invoices)`
Converts invoice array to total cents for Paymob.

```javascript
// Math.round(sum(total_amount * 100))
// Returns: string (e.g., "270000")
```

#### `getPendingSemesterInvoices({ studentId, semester, year, paypalOrderId? })`
Fetches pending invoices for specific semester.

```javascript
// Where: student_user_id, status: "pending", semester, year
// Optional: paypal_order_id filter
// OrderBy: id ASC
```

#### `getInvoiceSemesterContext(invoices)`
Validates all invoices belong to same semester.

```javascript
// Returns: { semester, year }
// Throws: Error if mixed semesters
```

#### `resolveOpenPaymentContext()`
Checks if payment period is open for current semester.

```javascript
// Returns: 
//   { ok: true, semester, year, paymentPeriod } |
//   { ok: false, status: 403|404, body: { error, paymentPeriod? } }
```

#### `createOrUpdateStudentPaymentRecord({ tx, studentId, semester, year, gateway, transactionId, paidAt })`
Upserts semester payment record.

```javascript
// Calculates cumulative totals from paid invoices in semester
// Uses upsert to handle potential re-verification
```

### Payment Verification Logic

#### `verifyAndMarkPaymobSemesterPayment({ studentId, transactionId, orderId, preloadedTransaction? })`

**Validation Steps:**
1. Check `studentId` and `transactionId` present
2. Validate Paymob configuration
3. Check payment period is open
4. Fetch pending invoices for semester
5. Check for existing semester payment (idempotent)
6. Fetch transaction from Paymob API (or use preloaded)
7. Validate transaction status:
   - `success === true`
   - `pending !== true`
   - `is_refunded !== true`
   - `is_voided !== true`
8. Validate `merchant_order_id` format: `bulk_{studentId}_*`
9. Validate `amount_cents` matches invoice total
10. Check for duplicate payment records
11. Mark invoices paid in DB transaction

**Returns:** `{ status: 200|400|404|500, body: {...} }`

### Database Transaction Pattern

```javascript
await prisma.$transaction(async (tx) => {
  // 1. Update invoices
  await tx.invoices.updateMany({
    where: { student_user_id: studentId, id: { in: invoiceIds } },
    data: { status: "paid", payment_date: paidAt }
  });

  // 2. Create individual payment records
  for (const invoice of invoices) {
    await tx.payments.create({
      data: {
        invoice_id: invoice.id,
        gateway: "paymob",
        transaction_id: `paymob_${transactionId}:${invoice.id}`,
        amount: toMoneyString(invoice.total_amount),
        status: "paid"
      }
    });
  }

  // 3. Upsert semester payment record
  await createOrUpdateStudentPaymentRecord({ tx, ... });
});
```

### Webhook Payload normalization

```javascript
normalizePaymobWebhookPayload(payload)
// Handles multiple payload formats:
// - payload.obj
// - payload.data.obj
// - payload.transaction
// - payload directly

// Extracts:
// - transactionId (from various field names)
// - orderId (converted to number)
// - merchantOrderId (for student ID extraction)
```

### Student ID Extraction from Merchant Order

```javascript
extractStudentIdFromMerchantOrderId("bulk_{studentId}_{timestamp}")
// Returns: studentId string or null
// Format: "bulk_8f66a5e1-..._1774089894200"
```

---

## 7. Period Control System

### Academic Calendar Event Types

Admins create events in `academic_calendar` table:

| Event Type | Purpose | Example Date |
|------------|---------|--------------|
| `registration_start` | Registration opens | 2026-08-01 |
| `registration_end` | Registration closes | 2026-08-15 |
| `payment_start` | Payment window opens | 2026-08-16 |
| `payment_end` | Payment window closes | 2026-09-01 |

### Event Structure

```json
{
  "event_name": "Fall 2026 Payment Opens",
  "event_type": "payment_start",
  "event_date": "2026-08-16",
  "semester": "Fall",
  "academic_year": "2026-2027"
}
```

### Period Resolution Logic (`src/utils/periodHelpers.js`)

**Functions:**
- `getCurrentSemester()` - Determines current semester from latest `course_offerings`
- `getPaymentPeriod(semester, year)` - Returns period object with open/closed status
- `getRegistrationPeriod(semester, year)` - Same for registration
- `isPaymentOpen(semester, year)` - Boolean check
- `isRegistrationOpen(semester, year)` - Boolean check

**Scoring Algorithm:**
Events are scored by relevance:
- +4 if semester matches (normalized)
- +3 if semester matches with year suffix (e.g., "Fall 2026")
- +3 if academic_year matches
- +2 if event_date year matches
- +1 if event_date year is ±1

Best scoring event is selected. Ties broken by earliest date.

**Period Object Structure:**

```javascript
{
  isOpen: false,
  semester: "Fall",
  year: 2026,
  startDate: "2026-08-16",
  endDate: "2026-09-01",
  nextOpenDate: null
}
```

**Date Handling:**
- Start date: 00:00:00 UTC
- End date: 23:59:59.999 UTC
- Fallback: Uses `startEvent.end_date` if no explicit `*_end` event exists

---

## 8. Error Handling & Edge Cases

### Paymob API Errors

```javascript
// paymobRequest() throws:
{
  message: "Error message from Paymob",
  statusCode: 400|401|404|500,
  paymobResponse: { ... }
}
```

### Validation Errors

| Error | Status | Condition |
|-------|--------|-----------|
| "payAll must be true" | 400 | Individual payment attempt |
| "invoiceIds is no longer supported" | 400 | Old client sending invoiceIds |
| "Paymob is not configured" | 500 | Missing env vars |
| "Payment period is currently closed" | 403 | Outside payment window |
| "No pending invoices found" | 404 | All invoices already paid |
| "transactionId is required" | 400 | Missing verification param |
| "orderId is required" | 400 | Missing verification param |

### Transaction Validation Failures

| Error | Status | Condition |
|-------|--------|-----------|
| "Paymob transaction is not completed" | 400 | success=false OR pending=true |
| "Transaction does not belong to this user" | 400 | merchant_order_id mismatch |
| "Transaction amount does not match" | 400 | amount_cents != invoice total |
| "Payment already verified" | 200 | Idempotent - returns existing |
| "Semester payment already completed" | 200 | Idempotent - returns existing |

### Edge Cases Handled

1. **Double Verification:** Returns existing payment record (idempotent)
2. **Mixed Semester Invoices:** Throws error - must be single semester
3. **Refunded Transactions:** Rejected - `is_refunded !== true` check
4. **Voided Transactions:** Rejected - `is_voided !== true` check
5. **Pending Transactions:** Rejected - `pending !== true` check
6. **Amount Mismatch:** Explicit error with expected vs actual cents
7. **Merchant Order Hijacking:** Validates `bulk_{studentId}_` prefix
8. **Webhook Payload Variations:** Normalizes multiple payload formats
9. **Missing Student ID in Webhook:** Returns 400 with merchantOrderId context
10. **Preloaded Transaction:** Skips API call if already fetched (webhook flow)

---

## 9. Webhook Integration

### Webhook URL
```
POST /api/payment/webhook/paymob
```

**Configured in:** Paymob Dashboard → Webhooks → Add URL

### Webhook Flow

```
Paymob → POST /webhook/paymob → normalizePaymobWebhookPayload
                              → getPaymobAuthToken
                              → getPaymobTransaction (re-fetch)
                              → extractStudentIdFromMerchantOrderId
                              → verifyAndMarkPaymobSemesterPayment
                              → Return result + metadata
```

### Why Re-fetch Transaction?
Webhook payload may be incomplete or stale. Re-fetching ensures:
- Latest transaction status
- Complete order details
- Accurate amount validation
- Protection against payload spoofing

### Webhook Payload Sources

The normalizer checks multiple locations:
```javascript
transactionId = payload?.obj?.id || 
                payload?.data?.obj?.id || 
                payload?.transaction?.id || 
                payload?.id

orderId = payload?.obj?.order?.id || 
          payload?.order?.id || 
          payload?.order_id

merchantOrderId = payload?.obj?.order?.merchant_order_id || 
                  payload?.merchant_order_id
```

### Webhook Response

Same as manual verify endpoint, plus:
```javascript
{
  ...verificationResult,
  source: "paymob_webhook",
  merchantOrderId: "bulk_abc123_1234567890",
  studentId: "abc123"
}
```

---

## 10. Security & Validation

### Authentication & Authorization

**Student Endpoints:**
```javascript
authMiddleware                     // Validates JWT token
authorizationMiddleware("student", "leader")  // Checks role
```

**Webhook Endpoint:**
- No authentication (public URL from Paymob)
- Security via merchant_order_id validation + transaction re-fetch

### Validation Layers

1. **Request Validation:**
   - `payAll: true` required
   - Required params checked early
   - Type validation (string, number)

2. **Business Logic Validation:**
   - Payment period open
   - Pending invoices exist
   - Single semester constraint

3. **Gateway Validation:**
   - Paymob config validated before API calls
   - Transaction status validated before marking paid
   - Amount matched exactly

4. **Database Validation:**
   - Unique constraints prevent duplicates
   - Foreign keys ensure referential integrity
   - Transaction atomicity for multi-step updates

### Idempotency

**Mechanism:**
- `student_payments` upsert on `(student_user_id, semester, year)`
- Early return if payment records already exist
- Transaction ID uniqueness on `payments` table

**Benefits:**
- Safe to retry verification
- Webhook can fire multiple times
- No duplicate charges

---

## 11. Testing

### Test File
`tests/payment-financials-smoke.js`

### Planned Test Updates (from `payment_plan.md`)

- [ ] Remove tests for individual invoice payments
- [ ] Add tests for pay-all behavior
- [ ] Add tests for period enforcement (mocking dates)
- [ ] Add tests for `student_payments` record creation

### Manual Testing Checklist

- [ ] Create order returns iframe URL
- [ ] Iframe loads and accepts test card
- [ ] Verify payment marks invoices paid
- [ ] Webhook triggers and processes correctly
- [ ] Period blocking works (outside window)
- [ ] Idempotent verification (call twice)
- [ ] Amount mismatch rejected
- [ ] Wrong student rejected
- [ ] Refunded transaction rejected

---

## 12. Quick Reference for AI Prompts

### Copy-Paste Context Block

```
PROJECT: College Management System Backend
STACK: Node.js, Express, Prisma, PostgreSQL
PAYMENT GATEWAY: Paymob (EGP currency)

FLOW: 
1. POST /api/payment/invoices/paymob-order (body: { payAll: true })
2. Returns iframeUrl for student to complete payment
3. POST /api/payment/invoices/paymob-verify (body: { transactionId, orderId })
4. OR webhook POST /api/payment/webhook/paymob

KEY DETAILS:
- Pay-all enforced (no individual invoice payments)
- Payment period control via academic_calendar table
- Merchant order ID: bulk_{studentUserId}_{timestamp}
- Amount in cents for Paymob API
- Transaction validation: success=true, pending=false, refunded=false, voided=false
- Creates student_payments record (upsert per semester)
- Billing data: first_name, last_name, email, phone, country: EG
- Items: { name: "Invoice {id}", amount_cents, description: "{course} {sem} {year}", quantity: 1 }

DATABASE:
- student_payments: semester-level record (unique: student_id + semester + year)
- payments: per-invoice record (one per invoice in semester)
- invoices: student invoices (status: pending/paid/failed/refunded)

ENV VARS:
- PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_IFRAME_ID, PAYMOB_BASE_URL

CURRENT ISSUE/REQUEST: [YOUR SPECIFIC QUESTION HERE]
```

### Common Prompt Starters

1. **"Add a new feature:"** How do I add [feature] to the Paymob integration?
2. **"Debug this error:"** I'm getting [error] when [action]. What could cause this?
3. **"Refactor this code:"** Improve [specific function] for better [performance/readability/error handling]
4. **"Write tests for:"** Create test cases for [endpoint/function]
5. **"Extend to support:"** How do I support [new payment method/recurring payments/installments]?
6. **"Security review:"** Are there any security vulnerabilities in the Paymob implementation?
7. **"Performance optimization:"** The [endpoint] is slow. How can I optimize it?
8. **"Migration guide:"** How do I migrate from [old implementation] to this one?

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/config/paymob.js` | Paymob API client utilities |
| `src/controllers/paymentController.js` | Payment endpoint handlers |
| `src/routes/paymentRoutes.js` | Route definitions + middleware |
| `src/middlewares/paymentMiddleware.js` | Unpaid invoice blocker |
| `src/swagger/payment.swagger.js` | OpenAPI documentation |
| `src/utils/periodHelpers.js` | Payment/registration period checks |
| `prisma/schema.prisma` | Database models (lines 231-290) |
| `tests/payment-financials-smoke.js` | Payment integration tests |
| `payment_plan.md` | Refactor plan & roadmap |
| `.env.example` | Environment variable template |

---

## Version & Metadata

- **Last Updated:** 2026-04-15
- **Paymob API Version:** Accept API (v1)
- **Node.js Version:** Modern (ES modules, top-level await)
- **Prisma Version:** 5.x+
- **Database:** PostgreSQL 14+

---

**End of Document**
