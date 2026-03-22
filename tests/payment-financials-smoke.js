/* eslint-disable no-console */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";
const STUDENT_TOKEN = process.env.STUDENT_TOKEN;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const INVOICE_ID = process.env.INVOICE_ID;
const PAYMOB_TRANSACTION_ID = process.env.PAYMOB_TRANSACTION_ID;
const PAYMOB_BULK_TRANSACTION_ID = process.env.PAYMOB_BULK_TRANSACTION_ID;
const BULK_PAY_ALL = process.env.BULK_PAY_ALL === "true";
const BULK_INVOICE_IDS = (process.env.BULK_INVOICE_IDS || "")
    .split(",")
    .map((id) => Number.parseInt(id.trim(), 10))
    .filter(Number.isInteger);

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
            "Set STUDENT_TOKEN and ADMIN_TOKEN env vars before running this script"
        );
        process.exit(1);
    }

    console.log("1) List financials");
    console.log(await callApi("/financials", "GET", ADMIN_TOKEN));

    console.log("2) List my invoices");
    console.log(await callApi("/payments/invoices/me", "GET", STUDENT_TOKEN));

    if (INVOICE_ID) {
        console.log("3) Create PayPal order");
        const order = await callApi(
            `/payments/invoices/${INVOICE_ID}/paypal-order`,
            "POST",
            STUDENT_TOKEN
        );
        console.log(order);

        if (order?.json?.orderId) {
            console.log("4) Capture PayPal order");
            console.log(
                await callApi(
                    `/payments/invoices/${INVOICE_ID}/capture`,
                    "POST",
                    STUDENT_TOKEN,
                    { orderId: order.json.orderId }
                )
            );
        }

        console.log("5) Create Paymob checkout");
        const paymobOrder = await callApi(
            `/payments/invoices/${INVOICE_ID}/paymob-order`,
            "POST",
            STUDENT_TOKEN
        );
        console.log(paymobOrder);

        if (PAYMOB_TRANSACTION_ID) {
            console.log("6) Verify Paymob transaction");
            console.log(
                await callApi(
                    `/payments/invoices/${INVOICE_ID}/paymob-verify`,
                    "POST",
                    STUDENT_TOKEN,
                    { transactionId: PAYMOB_TRANSACTION_ID }
                )
            );
        }

        console.log("7) Create bulk Paymob checkout");
        const bulkPaymobOrder = await callApi(
            "/payments/invoices/paymob-order/bulk",
            "POST",
            STUDENT_TOKEN,
            {
                payAll: BULK_PAY_ALL,
                ...(BULK_PAY_ALL ? {} : { invoiceIds: BULK_INVOICE_IDS }),
            }
        );
        console.log(bulkPaymobOrder);

        if (PAYMOB_BULK_TRANSACTION_ID && bulkPaymobOrder?.json?.orderId) {
            console.log("8) Verify bulk Paymob transaction");
            console.log(
                await callApi(
                    "/payments/invoices/paymob-verify/bulk",
                    "POST",
                    STUDENT_TOKEN,
                    {
                        transactionId: PAYMOB_BULK_TRANSACTION_ID,
                        orderId: bulkPaymobOrder.json.orderId,
                        payAll: BULK_PAY_ALL,
                        ...(BULK_PAY_ALL
                            ? {}
                            : { invoiceIds: BULK_INVOICE_IDS }),
                    }
                )
            );
        }
    }
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
