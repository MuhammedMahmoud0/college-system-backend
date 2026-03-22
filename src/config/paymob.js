import { config } from "dotenv";
import logger from "../utils/logger.js";

config();

const PAYMOB_BASE_URL =
    process.env.PAYMOB_BASE_URL || "https://accept.paymobsolutions.com";

const paymobRequest = async (path, options = {}) => {
    const response = await fetch(`${PAYMOB_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        const message =
            data?.message || data?.detail || "Paymob request failed";
        const error = new Error(message);
        error.statusCode = response.status;
        error.paymobResponse = data;
        throw error;
    }

    return data;
};

const validatePaymobConfig = () => {
    if (
        !process.env.PAYMOB_API_KEY ||
        !process.env.PAYMOB_INTEGRATION_ID ||
        !process.env.PAYMOB_IFRAME_ID
    ) {
        logger.error(
            "Missing PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, or PAYMOB_IFRAME_ID in environment"
        );
        return false;
    }

    return true;
};

const getPaymobAuthToken = async () => {
    if (!validatePaymobConfig()) {
        throw new Error("Paymob environment variables are not configured");
    }

    const data = await paymobRequest("/api/auth/tokens", {
        method: "POST",
        body: JSON.stringify({ api_key: process.env.PAYMOB_API_KEY }),
    });

    return data.token;
};

const registerPaymobOrder = async ({
    authToken,
    amountCents,
    merchantOrderId,
    items = [],
}) => {
    return paymobRequest("/api/ecommerce/orders", {
        method: "POST",
        body: JSON.stringify({
            auth_token: authToken,
            delivery_needed: false,
            amount_cents: String(amountCents),
            currency: "EGP",
            merchant_order_id: merchantOrderId,
            items,
        }),
    });
};

const createPaymobPaymentKey = async ({
    authToken,
    amountCents,
    orderId,
    billingData,
}) => {
    return paymobRequest("/api/acceptance/payment_keys", {
        method: "POST",
        body: JSON.stringify({
            auth_token: authToken,
            amount_cents: String(amountCents),
            expiration: 3600,
            order_id: orderId,
            billing_data: billingData,
            currency: "EGP",
            integration_id: Number(process.env.PAYMOB_INTEGRATION_ID),
        }),
    });
};

const getPaymobTransaction = async ({ authToken, transactionId }) => {
    return paymobRequest(
        `/api/acceptance/transactions/${transactionId}?token=${authToken}`,
        {
            method: "GET",
        }
    );
};

const buildPaymobIframeUrl = (paymentToken) => {
    return `${PAYMOB_BASE_URL}/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
};

export {
    validatePaymobConfig,
    getPaymobAuthToken,
    registerPaymobOrder,
    createPaymobPaymentKey,
    getPaymobTransaction,
    buildPaymobIframeUrl,
};
