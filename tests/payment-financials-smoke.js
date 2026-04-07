/* eslint-disable no-console */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";
const STUDENT_TOKEN = process.env.STUDENT_TOKEN;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const PAYMOB_TRANSACTION_ID = process.env.PAYMOB_TRANSACTION_ID;
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

    console.log("2) List my invoices (with registration/payment periods)");
    const myInvoices = await callApi(
        "/payments/invoices/me",
        "GET",
        STUDENT_TOKEN,
    );
    console.log(myInvoices);

    console.log("3) Verify pay-all enforcement (payAll=false should fail)");
    const payAllValidation = await callApi(
        "/payments/invoices/paypal-order",
        "POST",
        STUDENT_TOKEN,
        { payAll: false },
    );
    console.log(payAllValidation);

    if (EXPECT_PAYMENT_CLOSED) {
        console.log("4) Expect payment period closure response (403)");
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

    console.log("4) Create PayPal pay-all order");
    const paypalOrder = await callApi(
        "/payments/invoices/paypal-order",
        "POST",
        STUDENT_TOKEN,
        { payAll: true },
    );
    console.log(paypalOrder);

    if (paypalOrder?.json?.orderId) {
        console.log("5) Capture PayPal pay-all order");
        console.log(
            await callApi("/payments/invoices/capture", "POST", STUDENT_TOKEN, {
                orderId: paypalOrder.json.orderId,
            }),
        );
    }

    console.log("6) Create Paymob pay-all checkout");
    const paymobOrder = await callApi(
        "/payments/invoices/paymob-order",
        "POST",
        STUDENT_TOKEN,
        { payAll: true },
    );
    console.log(paymobOrder);

    if (PAYMOB_TRANSACTION_ID && paymobOrder?.json?.orderId) {
        console.log("7) Verify Paymob pay-all transaction");
        console.log(
            await callApi(
                "/payments/invoices/paymob-verify",
                "POST",
                STUDENT_TOKEN,
                {
                    transactionId: PAYMOB_TRANSACTION_ID,
                    orderId: paymobOrder.json.orderId,
                },
            ),
        );
    }

    console.log("8) Get student semester payment history");
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
