# Manual Payment Fix

## Problem
When using the `manual_payment` endpoint to mark student invoices as paid, the system was throwing an internal server error. The expected behavior was:
1. Update the status of the specified invoices to "paid" in the `invoices` table
2. Create individual records in the `payments` table for each paid invoice
3. Create/update a single record in `student_payments` with the total amount for all invoices

## Root Cause
The issue was in the `createOrUpdateStudentPaymentRecord` function in `paymentController.js`. 

The function was querying for invoices with `status: "paid"` within a transaction **after** calling `updateMany` to change their status from "pending" to "paid". However, due to how Prisma handles transactions with PostgreSQL adapters, the aggregate query wasn't seeing the uncommitted changes made by `updateMany` within the same transaction.

This caused the `student_payments` record to be created with incorrect totals (missing the invoices that were just paid).

## Solution
Modified the `createOrUpdateStudentPaymentRecord` function to:

1. **Query already-paid invoices**: Get invoices that were already paid BEFORE this transaction started (excluding the ones being paid now)
2. **Query invoices being paid**: Get the specific invoices being paid in this transaction by their IDs (regardless of status)
3. **Combine the totals**: Add both amounts together to get the correct cumulative total

### Code Changes

**File**: `src/controllers/paymentController.js`

### Updated `createOrUpdateStudentPaymentRecord` function:
```javascript
const createOrUpdateStudentPaymentRecord = async ({
  tx,
  studentId,
  semester,
  year,
  gateway,
  transactionId,
  paidAt,
  newlyPaidInvoiceIds,  // NEW PARAMETER
}) => {
  // Get invoices that were already paid BEFORE this transaction
  const previouslyPaidSemesterTotals = await tx.invoices.aggregate({
    where: {
      student_user_id: studentId,
      semester,
      year,
      status: "paid",
      ...(newlyPaidInvoiceIds && newlyPaidInvoiceIds.length > 0
        ? { id: { notIn: newlyPaidInvoiceIds } }
        : {}),
    },
    _sum: {
      total_amount: true,
    },
    _count: {
      _all: true,
    },
  });

  // Calculate the total amount of invoices being paid in this transaction
  const newlyPaidInvoices = await tx.invoices.findMany({
    where: {
      student_user_id: studentId,
      id: { in: newlyPaidInvoiceIds || [] },
    },
    select: {
      total_amount: true,
    },
  });

  const newlyPaidAmount = newlyPaidInvoices.reduce(
    (sum, invoice) => sum + Number.parseFloat(invoice.total_amount || 0),
    0,
  );

  const cumulativeTotalAmount =
    Number.parseFloat(previouslyPaidSemesterTotals?._sum?.total_amount || 0) +
    newlyPaidAmount;
  const cumulativeInvoiceCount =
    Number.parseInt(previouslyPaidSemesterTotals?._count?._all || 0, 10) +
    (newlyPaidInvoiceIds?.length || 0);

  // ... rest of the upsert logic
}
```

### Updated all callers to pass `newlyPaidInvoiceIds`:
- `captureAndMarkInvoicesPaid` (PayPal)
- `markInvoicesPaidWithPaymob` (Paymob)
- `recordManualPayment` (Manual)
- PayPal sandbox bypass section

## Testing
To test the fix:

1. Register student (ID: 10) for two courses (e.g., Intro to CS & OOP)
2. Verify two invoices are created with status "pending" and amounts (e.g., 900 each = 1800 total)
3. Call `POST /payments/manual` with super_admin account:
   ```json
   {
     "student_name": "Student Name",
     "student_id": "10",
     "amount": 1800,
     "semester": "Fall",
     "year": 2024
   }
   ```
4. Verify:
   - Both invoices have `status: "paid"` in `invoices` table
   - Two records created in `payments` table (one per invoice)
   - One record in `student_payments` with `total_amount: 1800`

## Additional Improvements
Added enhanced error logging in the `recordManualPayment` catch block to help debug future issues:
```javascript
logger.error("Manual payment error details:", {
  error: err.message,
  stack: err.stack,
  code: err.code,
  meta: err.meta,
});
```
