import { prisma } from "../config/connection.js";
import { paypalRequest, validatePayPalConfig } from "../config/paypal.js";
import logger from "../utils/logger.js";

const toMoneyString = (value) => Number.parseFloat(value).toFixed(2);

export const getMyInvoices = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { status } = req.query;
        const allowedStatuses = ["pending", "paid", "failed", "refunded"];

        if (status && !allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid status filter",
            });
        }

        const where = {
            student_user_id: studentId,
            ...(status ? { status } : {}),
        };

        const invoices = await prisma.invoices.findMany({
            where,
            include: {
                payments: {
                    orderBy: { created_at: "desc" },
                    select: {
                        id: true,
                        gateway: true,
                        transaction_id: true,
                        amount: true,
                        status: true,
                        created_at: true,
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });

        const pendingInvoices = invoices.filter(
            (invoice) => invoice.status === "pending"
        );
        const totalDue = pendingInvoices.reduce(
            (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
            0
        );

        return res.status(200).json({
            invoices: invoices.map((invoice) => ({
                ...invoice,
                credit_price: Number.parseFloat(invoice.credit_price),
                total_amount: Number.parseFloat(invoice.total_amount),
                payments: invoice.payments.map((payment) => ({
                    ...payment,
                    amount: Number.parseFloat(payment.amount),
                })),
            })),
            summary: {
                totalInvoices: invoices.length,
                pendingInvoices: pendingInvoices.length,
                totalDue: Number.parseFloat(totalDue.toFixed(2)),
            },
        });
    } catch (err) {
        logger.error("Error getting my invoices:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createPayPalOrder = async (req, res) => {
    try {
        const studentId = req.user.id;
        const invoiceId = Number.parseInt(req.params.invoiceId);

        if (!Number.isInteger(invoiceId)) {
            return res.status(400).json({ error: "Invalid invoice id" });
        }

        if (!validatePayPalConfig()) {
            return res.status(500).json({
                error: "PayPal is not configured on the server",
            });
        }

        const invoice = await prisma.invoices.findFirst({
            where: {
                id: invoiceId,
                student_user_id: studentId,
            },
        });

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        if (invoice.status === "paid") {
            return res.status(400).json({ error: "Invoice is already paid" });
        }

        const orderPayload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    reference_id: String(invoice.id),
                    description: `Tuition invoice for ${invoice.course_code} (${invoice.semester} ${invoice.year})`,
                    amount: {
                        currency_code: "USD",
                        value: toMoneyString(invoice.total_amount),
                    },
                },
            ],
        };

        const order = await paypalRequest("/v2/checkout/orders", {
            method: "POST",
            body: JSON.stringify(orderPayload),
        });

        await prisma.invoices.update({
            where: { id: invoice.id },
            data: {
                paypal_order_id: order.id,
                status: "pending",
            },
        });

        const approveLink =
            order.links?.find((link) => link.rel === "approve")?.href || null;

        return res.status(201).json({
            message: "PayPal order created",
            invoiceId: invoice.id,
            orderId: order.id,
            approveUrl: approveLink,
        });
    } catch (err) {
        logger.error("Error creating PayPal order:", err);
        return res.status(500).json({
            error: err.message || "Failed to create PayPal order",
        });
    }
};

export const capturePayPalOrder = async (req, res) => {
    try {
        const studentId = req.user.id;
        const invoiceId = Number.parseInt(req.params.invoiceId);
        const { orderId } = req.body || {};

        if (!Number.isInteger(invoiceId)) {
            return res.status(400).json({ error: "Invalid invoice id" });
        }

        const invoice = await prisma.invoices.findFirst({
            where: {
                id: invoiceId,
                student_user_id: studentId,
            },
        });

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        if (invoice.status === "paid") {
            return res.status(200).json({
                message: "Invoice is already paid",
                invoiceId: invoice.id,
            });
        }

        const captureOrderId = orderId || invoice.paypal_order_id;

        if (!captureOrderId) {
            return res.status(400).json({
                error: "No PayPal order found for this invoice. Create order first.",
            });
        }

        if (
            invoice.paypal_order_id &&
            orderId &&
            invoice.paypal_order_id !== orderId
        ) {
            return res.status(400).json({
                error: "Provided orderId does not match this invoice",
            });
        }

        const capture = await paypalRequest(
            `/v2/checkout/orders/${captureOrderId}/capture`,
            {
                method: "POST",
                body: JSON.stringify({}),
            }
        );

        const captureUnit =
            capture.purchase_units?.[0]?.payments?.captures?.[0];
        const captureStatus = captureUnit?.status;
        const transactionId = captureUnit?.id || capture.id;

        if (captureStatus !== "COMPLETED") {
            await prisma.invoices.update({
                where: { id: invoice.id },
                data: { status: "failed" },
            });

            return res.status(400).json({
                error: "Payment was not completed",
                paypalStatus: captureStatus || capture.status,
            });
        }

        await prisma.$transaction(async (tx) => {
            await tx.invoices.update({
                where: { id: invoice.id },
                data: {
                    status: "paid",
                    payment_date: new Date(),
                    paypal_order_id: captureOrderId,
                },
            });

            await tx.payments.create({
                data: {
                    invoice_id: invoice.id,
                    gateway: "paypal",
                    transaction_id: transactionId,
                    amount: toMoneyString(invoice.total_amount),
                    status: "paid",
                },
            });
        });

        return res.status(200).json({
            message: "Payment captured successfully",
            invoiceId: invoice.id,
            transactionId,
            status: "paid",
        });
    } catch (err) {
        logger.error("Error capturing PayPal order:", err);
        return res.status(500).json({
            error: err.message || "Failed to capture payment",
        });
    }
};
