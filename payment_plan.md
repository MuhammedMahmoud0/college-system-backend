# Payment System Refactor Plan

## Problem Statement

The current payment system allows students to pay invoices individually or in bulk. The new requirements are:
1. **Pay All-at-Once**: Students must pay ALL pending invoices for a semester together (no individual payments)
2. **Registration Period Control**: Registration opens/closes at admin-specified times (using academic_calendar)
3. **Payment Period Control**: Payments open/close at admin-specified times (after registration closes)
4. **Bulk Payment Record**: Create a new `student_payments` table to record when a student completes semester payment
5. **Period Enforcement**: Block actions when periods are closed (with clear messages)
6. **No Refunds When Closed**: Disable unregistration/refunds when registration period is closed

## Approach

Use the existing `academic_calendar` table with specific `event_type` values:
- `registration_start` / `registration_end` - for registration period per semester
- `payment_start` / `payment_end` - for payment period per semester

Add helper functions to check if registration/payment periods are currently open for a given semester.

---

## Todos

### 1. Database Schema Changes
- **Add `student_payments` table** to record bulk semester payments:
  - `id` (PK)
  - `student_user_id` (FK to users)
  - `semester` (semester_type enum)
  - `year` (Int)
  - `total_amount` (Decimal)
  - `invoice_count` (Int)
  - `gateway` (payment_gateway enum)
  - `transaction_id` (String)
  - `paid_at` (DateTime)
  - `created_at` (DateTime)

### 2. Period Helper Utilities
- Create `src/utils/periodHelpers.js` with functions:
  - `isRegistrationOpen(semester, year)` - checks academic_calendar for registration period
  - `isPaymentOpen(semester, year)` - checks academic_calendar for payment period
  - `getRegistrationPeriod(semester, year)` - returns start/end dates
  - `getPaymentPeriod(semester, year)` - returns start/end dates
  - `getCurrentSemester()` - determines current semester from latest course_offerings

### 3. Update Registration Controller
- Modify `registerCourses`:
  - Check if registration period is open before allowing registration
  - Return 403 with message if closed, including period dates
- Modify `unregisterSession`:
  - Check if registration period is open before allowing unregistration
  - Remove refund logic when registration is closed
  - Return 403 with message if closed
- Modify `getAvailableOfferings`:
  - Add `registrationPeriod` object to response (isOpen, startDate, endDate)

### 4. Refactor Payment Controller
- **Remove individual payment endpoints**:
  - Remove `createPayPalOrder` (single invoice)
  - Remove `createPaymobOrder` (single invoice)
  - Remove `capturePayPalOrder` (single invoice)
  - Remove `verifyPaymobPayment` (single invoice)
- **Modify bulk payment endpoints**:
  - `createPayPalOrderBulk` → enforce `payAll: true`, remove `invoiceIds` selection
  - `createPaymobOrderBulk` → enforce `payAll: true`, remove `invoiceIds` selection
  - Check if payment period is open before creating order
  - Filter invoices by semester matching the open payment period
- **Modify capture/verify endpoints**:
  - `capturePayPalOrderBulk` → create `student_payments` record on success
  - `verifyPaymobPaymentBulk` → create `student_payments` record on success
- **Update `getMyInvoices`**:
  - Add `paymentPeriod` object (isOpen, startDate, endDate)
  - Add `registrationPeriod` object (isOpen, startDate, endDate)
  - Group invoices by semester for clarity

### 5. Update Payment Routes
- Remove routes for single invoice payment:
  - `POST /invoices/:invoiceId/paypal-order`
  - `POST /invoices/:invoiceId/paymob-order`
  - `POST /invoices/:invoiceId/capture`
  - `POST /invoices/:invoiceId/paymob-verify`
- Rename/simplify bulk routes:
  - `POST /invoices/paypal-order/bulk` → `POST /invoices/paypal-order`
  - `POST /invoices/paymob-order/bulk` → `POST /invoices/paymob-order`
  - `POST /invoices/capture/bulk` → `POST /invoices/capture`
  - `POST /invoices/paymob-verify/bulk` → `POST /invoices/paymob-verify`
- Add new endpoint:
  - `GET /payments/me` - get student's payment history (from student_payments)

### 6. Update Swagger Documentation
- Update `payment.swagger.js`:
  - Remove individual payment endpoint docs
  - Update bulk payment docs (now primary endpoints)
  - Add period information in responses
  - Document new `/payments/me` endpoint
- Update `registration.swagger.js`:
  - Add registration period info to response docs
  - Document 403 responses for closed periods

### 7. Update Tests
- Update `tests/payment-financials-smoke.js`:
  - Remove tests for individual invoice payments
  - Add tests for pay-all behavior
  - Add tests for period enforcement (mocking dates)
  - Add tests for student_payments record creation

### 8. Add Academic Calendar Event Types (Documentation)
- Document the expected event_type values for periods:
  - `registration_start`, `registration_end`
  - `payment_start`, `payment_end`
- Each should have `semester` and optionally `academic_year` fields populated
- Example calendar entries for admins to create

---

## Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `student_payments` model |
| `src/utils/periodHelpers.js` | **NEW** - Period checking utilities |
| `src/controllers/registrationController.js` | Add period checks, remove refund when closed |
| `src/controllers/paymentController.js` | Remove single-invoice funcs, enforce pay-all, add student_payments |
| `src/routes/paymentRoutes.js` | Remove single-invoice routes, simplify bulk routes |
| `src/routes/registrationRoutes.js` | No route changes, just controller behavior |
| `src/swagger/payment.swagger.js` | Update documentation |
| `src/swagger/registration.swagger.js` | Add period info docs |
| `tests/payment-financials-smoke.js` | Update tests |

---

## Event Type Reference for Academic Calendar

Admins will use the existing calendar API to create these events:

```json
// Registration period for Fall 2026
{
  "event_name": "Fall 2026 Registration Opens",
  "event_type": "registration_start",
  "event_date": "2026-08-01",
  "semester": "Fall",
  "academic_year": "2026-2027"
}
{
  "event_name": "Fall 2026 Registration Closes",
  "event_type": "registration_end",
  "event_date": "2026-08-15",
  "semester": "Fall",
  "academic_year": "2026-2027"
}

// Payment period for Fall 2026
{
  "event_name": "Fall 2026 Payment Opens",
  "event_type": "payment_start",
  "event_date": "2026-08-16",
  "semester": "Fall",
  "academic_year": "2026-2027"
}
{
  "event_name": "Fall 2026 Payment Closes",
  "event_type": "payment_end",
  "event_date": "2026-09-01",
  "semester": "Fall",
  "academic_year": "2026-2027"
}
```

---

## API Response Examples

### GET /api/payment/invoices/me (updated response)
```json
{
  "invoices": [...],
  "summary": {
    "totalInvoices": 3,
    "pendingInvoices": 3,
    "totalDue": 2700.00
  },
  "registrationPeriod": {
    "isOpen": false,
    "startDate": "2026-08-01",
    "endDate": "2026-08-15",
    "semester": "Fall",
    "year": 2026
  },
  "paymentPeriod": {
    "isOpen": true,
    "startDate": "2026-08-16",
    "endDate": "2026-09-01",
    "semester": "Fall",
    "year": 2026
  }
}
```

### POST /api/registration/register (403 when closed)
```json
{
  "error": "Registration is currently closed",
  "registrationPeriod": {
    "isOpen": false,
    "startDate": "2026-08-01",
    "endDate": "2026-08-15",
    "nextOpenDate": null
  }
}
```

### POST /api/payment/invoices/paypal-order (403 when closed)
```json
{
  "error": "Payment period is currently closed for Fall 2026",
  "paymentPeriod": {
    "isOpen": false,
    "startDate": "2026-08-16",
    "endDate": "2026-09-01"
  }
}
```

---

## Notes

- **Both gateways (PayPal & Paymob)**: All changes apply to both payment gateways
- **Backward compatibility**: This is a breaking change for API consumers who rely on single-invoice payments
- **student_payments table**: Provides a clean record that "student X paid for semester Y on date Z"
- **No middleware changes**: Period checks done in controllers for clarity
- **Currency**: PayPal uses USD, Paymob uses EGP (no change to this logic)
