/* eslint-disable no-console */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";
const STUDENT_TOKEN = process.env.STUDENT_TOKEN;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const PAYMOB_TRANSACTION_ID = process.env.PAYMOB_TRANSACTION_ID;
const PAYMOB_WEBHOOK_TRANSACTION_ID = process.env.PAYMOB_WEBHOOK_TRANSACTION_ID;
const PAYMOB_VERIFY_WITH_ORDER_ONLY =
  process.env.PAYMOB_VERIFY_WITH_ORDER_ONLY === "true";
const MANUAL_PAYMENT_STUDENT_ID = process.env.MANUAL_PAYMENT_STUDENT_ID;
const MANUAL_PAYMENT_STUDENT_NAME = process.env.MANUAL_PAYMENT_STUDENT_NAME;
const MANUAL_PAYMENT_AMOUNT = process.env.MANUAL_PAYMENT_AMOUNT;
const MANUAL_PAYMENT_DATE = process.env.MANUAL_PAYMENT_DATE;
const MANUAL_PAYMENT_SEMESTER = process.env.MANUAL_PAYMENT_SEMESTER;
const MANUAL_PAYMENT_YEAR = process.env.MANUAL_PAYMENT_YEAR;
const EXPECT_PAYMENT_CLOSED = process.env.EXPECT_PAYMENT_CLOSED === "true";

const callApi = async (path, method, token, body) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await response.json();
  return { status: response.status, json };
};

const run = async () => {
  if (!STUDENT_TOKEN || !ADMIN_TOKEN) {
    console.error(
      "Set STUDENT_TOKEN and ADMIN_TOKEN env vars before running this script",
    );
    process.exit(1);
  }

  console.log("1) List financials");
  console.log(await callApi("/financials", "GET", ADMIN_TOKEN));

  console.log("2) Payment management cards (admin)");
  const paymentCards = await callApi(
    "/payments/admin/cards",
    "GET",
    ADMIN_TOKEN,
  );
  console.log(paymentCards);

  if (paymentCards.status !== 200) {
    console.error("Expected 200 from /payments/admin/cards");
    process.exit(1);
  }

  console.log("3) Payment management student_payments table (admin)");
  const studentPaymentsTable = await callApi(
    "/payments/admin/student-payments?status=paid&payMethod=manual",
    "GET",
    ADMIN_TOKEN,
  );
  console.log(studentPaymentsTable);

  if (studentPaymentsTable.status !== 200) {
    console.error("Expected 200 from /payments/admin/student-payments");
    process.exit(1);
  }

  if (
    Array.isArray(studentPaymentsTable?.json?.payments) &&
    studentPaymentsTable.json.payments.length > 0
  ) {
    const firstRow = studentPaymentsTable.json.payments[0];

    if (!Object.prototype.hasOwnProperty.call(firstRow, "student_name")) {
      console.error(
        "Expected student_name field in /payments/admin/student-payments rows",
      );
      process.exit(1);
    }

    if (!Object.prototype.hasOwnProperty.call(firstRow, "status")) {
      console.error(
        "Expected status field in /payments/admin/student-payments rows",
      );
      process.exit(1);
    }
  }

  console.log("4) List my invoices (with registration/payment periods)");
  const myInvoices = await callApi(
    "/payments/invoices/me",
    "GET",
    STUDENT_TOKEN,
  );
  console.log(myInvoices);

  console.log("5) Verify pay-all enforcement (payAll=false should fail)");
  const payAllValidation = await callApi(
    "/payments/invoices/paypal-order",
    "POST",
    STUDENT_TOKEN,
    { payAll: false },
  );
  console.log(payAllValidation);

  if (EXPECT_PAYMENT_CLOSED) {
    console.log("6) Expect payment period closure response (403)");
    const closedAttempt = await callApi(
      "/payments/invoices/paypal-order",
      "POST",
      STUDENT_TOKEN,
      { payAll: true },
    );
    console.log(closedAttempt);

    if (closedAttempt.status !== 403) {
      console.error(
        `Expected 403 when payment is closed, got ${closedAttempt.status}`,
      );
      process.exit(1);
    }

    console.log(
      "Payment period closure check passed (set EXPECT_PAYMENT_CLOSED=false to run paid flow).",
    );
    return;
  }

  console.log("6) Create PayPal pay-all order");
  const paypalOrder = await callApi(
    "/payments/invoices/paypal-order",
    "POST",
    STUDENT_TOKEN,
    { payAll: true },
  );
  console.log(paypalOrder);

  if (paypalOrder?.json?.orderId) {
    console.log("7) Capture PayPal pay-all order");
    console.log(
      await callApi("/payments/invoices/capture", "POST", STUDENT_TOKEN, {
        orderId: paypalOrder.json.orderId,
      }),
    );
  }

  console.log("8) Create Paymob pay-all checkout");
  const paymobOrder = await callApi(
    "/payments/invoices/paymob-order",
    "POST",
    STUDENT_TOKEN,
    { payAll: true },
  );
  console.log(paymobOrder);

  if (PAYMOB_WEBHOOK_TRANSACTION_ID && paymobOrder?.json?.orderId) {
    console.log("9) Verify Paymob pay-all transaction via webhook endpoint");
    const webhookVerification = await callApi(
      "/payments/invoices/paymob-webhook",
      "POST",
      null,
      {
        obj: {
          id: PAYMOB_WEBHOOK_TRANSACTION_ID,
          order: {
            id: paymobOrder.json.orderId,
          },
        },
      },
    );
    console.log(webhookVerification);

    if (webhookVerification.status !== 200) {
      console.error(
        `Expected 200 from /payments/invoices/paymob-webhook, got ${webhookVerification.status}`,
      );
      process.exit(1);
    }

    if (!webhookVerification?.json?.transactionId) {
      console.error("Expected transactionId in webhook verification response");
      process.exit(1);
    }

    if (
      String(webhookVerification.json.transactionId) !==
      String(PAYMOB_WEBHOOK_TRANSACTION_ID)
    ) {
      console.error(
        "Webhook transactionId does not match PAYMOB_WEBHOOK_TRANSACTION_ID",
      );
      process.exit(1);
    }
  } else if (PAYMOB_TRANSACTION_ID && paymobOrder?.json?.orderId) {
    console.log("9) Verify Paymob pay-all transaction");
    console.log(
      await callApi("/payments/invoices/paymob-verify", "POST", STUDENT_TOKEN, {
        transactionId: PAYMOB_TRANSACTION_ID,
        orderId: paymobOrder.json.orderId,
      }),
    );
  } else if (PAYMOB_VERIFY_WITH_ORDER_ONLY && paymobOrder?.json?.orderId) {
    console.log(
      "9) Verify Paymob pay-all transaction using order inquiry fallback",
    );
    console.log(
      await callApi("/payments/invoices/paymob-verify", "POST", STUDENT_TOKEN, {
        orderId: paymobOrder.json.orderId,
        merchantOrderId: paymobOrder.json.merchantOrderId,
      }),
    );
  }

  if (
    MANUAL_PAYMENT_STUDENT_ID &&
    MANUAL_PAYMENT_STUDENT_NAME &&
    MANUAL_PAYMENT_AMOUNT &&
    MANUAL_PAYMENT_DATE
  ) {
    console.log("10) Record admin manual payment");
    console.log(
      await callApi("/payments/manual", "POST", ADMIN_TOKEN, {
        student_id: MANUAL_PAYMENT_STUDENT_ID,
        student_name: MANUAL_PAYMENT_STUDENT_NAME,
        amount: Number(MANUAL_PAYMENT_AMOUNT),
        date: MANUAL_PAYMENT_DATE,
        ...(MANUAL_PAYMENT_SEMESTER
          ? { semester: MANUAL_PAYMENT_SEMESTER }
          : {}),
        ...(MANUAL_PAYMENT_YEAR ? { year: Number(MANUAL_PAYMENT_YEAR) } : {}),
      }),
    );
  }

  console.log("11) Get student semester payment history");
  const paymentHistory = await callApi("/payments/me", "GET", STUDENT_TOKEN);
  console.log(paymentHistory);

  if (paymentHistory.status !== 200) {
    console.error("Expected 200 from /payments/me");
    process.exit(1);
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
