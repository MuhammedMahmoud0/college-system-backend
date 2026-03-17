import { config } from "dotenv";
import logger from "../utils/logger.js";

config();

const PAYPAL_BASE_URL =
    process.env.PAYPAL_ENV === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";

const validatePayPalConfig = () => {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
        logger.error(
            "Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET in environment"
        );
        return false;
    }

    return true;
};

const getPayPalAccessToken = async () => {
    if (!validatePayPalConfig()) {
        throw new Error("PayPal environment variables are not configured");
    }

    const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to get PayPal access token: ${errorBody}`);
    }

    const data = await response.json();
    return data.access_token;
};

const paypalRequest = async (path, options = {}) => {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        const detail = data?.details?.[0];
        const message =
            detail?.description || data?.message || "PayPal request failed";
        const error = new Error(message);

        error.statusCode = response.status;
        error.paypalName = data?.name || null;
        error.paypalIssue = detail?.issue || null;
        error.paypalDebugId = data?.debug_id || null;
        error.paypalResponse = data;

        throw error;
    }

    return data;
};

export { paypalRequest, validatePayPalConfig };
