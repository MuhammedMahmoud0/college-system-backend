import { prisma } from "../config/connection.js";
import { paypalRequest, validatePayPalConfig } from "../config/paypal.js";
import logger from "../utils/logger.js";

const toMoneyString = (value) => Number.parseFloat(value).toFixed(2);
const shouldBypassSandboxCompliance =
    process.env.PAYPAL_ENV !== "live" &&
    process.env.PAYPAL_SANDBOX_BYPASS_COMPLIANCE === "true";

const parseInvoiceSelection = (body) => {
    const payAll = body?.payAll === true;
    const invoiceIds = Array.isArray(body?.invoiceIds)
        ? [
              ...new Set(
                  body.invoiceIds
                      .map((id) => Number.parseInt(id))
                      .filter(Number.isInteger)
              ),
          ]
        : [];

    return {
        payAll,
        invoiceIds,
    };
};

const getPendingInvoicesForPayment = async (studentId, invoiceIds, payAll) => {
    if (!payAll && invoiceIds.length === 0) {
        return [];
    }

    return prisma.invoices.findMany({
        where: {
            student_user_id: studentId,
            status: "pending",
            ...(payAll ? {} : { id: { in: invoiceIds } }),
        },
        orderBy: { id: "asc" },
    });
};

const createOrderForInvoices = async (invoices, label = "Tuition invoices") => {
    const totalAmount = invoices.reduce(
        (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
        0
    );

    const orderPayload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                reference_id: `bulk_${Date.now()}`,
                description: `${label}: ${invoices
                    .map((invoice) => invoice.course_code)
                    .join(", ")}`,
                amount: {
                    currency_code: "USD",
                    value: toMoneyString(totalAmount),
                },
            },
        ],
    };

    return paypalRequest("/v2/checkout/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
    });
};

const captureAndMarkInvoicesPaid = async ({ studentId, orderId, invoices }) => {
    const orderDetails = await paypalRequest(`/v2/checkout/orders/${orderId}`, {
        method: "GET",
    });

    const approveUrl =
        orderDetails.links?.find((link) => link.rel === "approve")?.href ||
        null;

    if (orderDetails.status !== "APPROVED") {
        return {
            ok: false,
            status: 400,
            body: {
                error: "Payer has not approved this order yet. Redirect the payer to approveUrl first.",
                paypalStatus: orderDetails.status,
                approveUrl,
                orderId,
            },
        };
    }

    const capture = await paypalRequest(
        `/v2/checkout/orders/${orderId}/capture`,
        {
            method: "POST",
            body: JSON.stringify({}),
        }
    );

    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureStatus = captureUnit?.status;
    const transactionId = captureUnit?.id || capture.id;

    if (captureStatus !== "COMPLETED") {
        await prisma.invoices.updateMany({
            where: {
                student_user_id: studentId,
                id: { in: invoices.map((invoice) => invoice.id) },
            },
            data: { status: "failed" },
        });

        return {
            ok: false,
            status: 400,
            body: {
                error: "Payment was not completed",
                paypalStatus: captureStatus || capture.status,
            },
        };
    }

    await prisma.$transaction(async (tx) => {
        await tx.invoices.updateMany({
            where: {
                student_user_id: studentId,
                id: { in: invoices.map((invoice) => invoice.id) },
            },
            data: {
                status: "paid",
                payment_date: new Date(),
                paypal_order_id: orderId,
            },
        });

        for (const invoice of invoices) {
            await tx.payments.create({
                data: {
                    invoice_id: invoice.id,
                    gateway: "paypal",
                    transaction_id: `${transactionId}:${invoice.id}`,
                    amount: toMoneyString(invoice.total_amount),
                    status: "paid",
                },
            });
        }
    });

    return {
        ok: true,
        status: 200,
        body: {
            message: "Payment captured successfully",
            invoiceIds: invoices.map((invoice) => invoice.id),
            transactionId,
            status: "paid",
        },
    };
};

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

export const createPayPalOrderBulk = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { payAll, invoiceIds } = parseInvoiceSelection(req.body || {});

        if (!validatePayPalConfig()) {
            return res.status(500).json({
                error: "PayPal is not configured on the server",
            });
        }

        const invoices = await getPendingInvoicesForPayment(
            studentId,
            invoiceIds,
            payAll
        );

        if (invoices.length === 0) {
            return res.status(404).json({
                error: "No pending invoices found for selected scope",
            });
        }

        const order = await createOrderForInvoices(
            invoices,
            "Tuition invoices"
        );

        await prisma.invoices.updateMany({
            where: {
                student_user_id: studentId,
                id: { in: invoices.map((invoice) => invoice.id) },
            },
            data: {
                paypal_order_id: order.id,
                status: "pending",
            },
        });

        const approveLink =
            order.links?.find((link) => link.rel === "approve")?.href || null;

        const totalAmount = invoices.reduce(
            (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
            0
        );

        return res.status(201).json({
            message: "PayPal order created for selected invoices",
            orderId: order.id,
            approveUrl: approveLink,
            invoiceIds: invoices.map((invoice) => invoice.id),
            totalAmount: Number.parseFloat(totalAmount.toFixed(2)),
            currency: "USD",
        });
    } catch (err) {
        logger.error("Error creating bulk PayPal order:", err);
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

        const captureResult = await captureAndMarkInvoicesPaid({
            studentId,
            orderId: captureOrderId,
            invoices: [invoice],
        });

        return res.status(captureResult.status).json(captureResult.body);
    } catch (err) {
        logger.error("Error capturing PayPal order:", err);

        const isComplianceViolation =
            err.paypalIssue === "COMPLIANCE_VIOLATION" ||
            err.message?.toLowerCase().includes("compliance violation");

        if (isComplianceViolation) {
            if (shouldBypassSandboxCompliance) {
                const invoiceId = Number.parseInt(req.params.invoiceId);
                const invoice = await prisma.invoices.findFirst({
                    where: {
                        id: invoiceId,
                        student_user_id: req.user.id,
                    },
                });

                if (invoice) {
                    const mockTransactionId = `sandbox_bypass_${Date.now()}:${
                        invoice.id
                    }`;
                    await prisma.$transaction(async (tx) => {
                        await tx.invoices.update({
                            where: { id: invoice.id },
                            data: {
                                status: "paid",
                                payment_date: new Date(),
                            },
                        });

                        await tx.payments.create({
                            data: {
                                invoice_id: invoice.id,
                                gateway: "paypal",
                                transaction_id: mockTransactionId,
                                amount: toMoneyString(invoice.total_amount),
                                status: "paid",
                            },
                        });
                    });

                    return res.status(200).json({
                        message:
                            "Payment marked as paid using sandbox compliance bypass",
                        invoiceId: invoice.id,
                        transactionId: mockTransactionId,
                        status: "paid",
                        bypassed: true,
                        paypalDebugId: err.paypalDebugId || null,
                    });
                }
            }

            return res.status(400).json({
                error: "Transaction blocked by PayPal due to compliance checks. Please contact PayPal support and provide paypalDebugId.",
                paypalDebugId: err.paypalDebugId || null,
                paypalIssue: err.paypalIssue || null,
            });
        }

        if (err.message?.includes("Payer has not yet approved")) {
            return res.status(400).json({
                error: "Payer has not approved this order yet. Open approveUrl from create-order response, approve payment, then retry capture.",
                paypalDebugId: err.paypalDebugId || null,
            });
        }

        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(400).json({
                error: err.message || "PayPal rejected this payment request",
                paypalDebugId: err.paypalDebugId || null,
                paypalIssue: err.paypalIssue || null,
            });
        }

        return res.status(500).json({
            error: err.message || "Failed to capture payment",
            paypalDebugId: err.paypalDebugId || null,
        });
    }
};

export const capturePayPalOrderBulk = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { orderId } = req.body || {};

        if (!orderId || typeof orderId !== "string") {
            return res.status(400).json({ error: "orderId is required" });
        }

        const { payAll, invoiceIds } = parseInvoiceSelection(req.body || {});

        const invoices = await prisma.invoices.findMany({
            where: {
                student_user_id: studentId,
                status: "pending",
                paypal_order_id: orderId,
                ...(payAll
                    ? {}
                    : invoiceIds.length > 0
                    ? { id: { in: invoiceIds } }
                    : {}),
            },
            orderBy: { id: "asc" },
        });

        if (invoices.length === 0) {
            return res.status(404).json({
                error: "No pending invoices found for this order",
            });
        }

        const captureResult = await captureAndMarkInvoicesPaid({
            studentId,
            orderId,
            invoices,
        });

        return res.status(captureResult.status).json(captureResult.body);
    } catch (err) {
        logger.error("Error capturing bulk PayPal order:", err);

        const isComplianceViolation =
            err.paypalIssue === "COMPLIANCE_VIOLATION" ||
            err.message?.toLowerCase().includes("compliance violation");

        if (isComplianceViolation) {
            if (shouldBypassSandboxCompliance) {
                const { orderId } = req.body || {};
                const invoices = await prisma.invoices.findMany({
                    where: {
                        student_user_id: req.user.id,
                        status: "pending",
                        paypal_order_id: orderId,
                    },
                });

                if (invoices.length > 0) {
                    await prisma.$transaction(async (tx) => {
                        await tx.invoices.updateMany({
                            where: {
                                id: {
                                    in: invoices.map((invoice) => invoice.id),
                                },
                            },
                            data: {
                                status: "paid",
                                payment_date: new Date(),
                            },
                        });

                        for (const invoice of invoices) {
                            await tx.payments.create({
                                data: {
                                    invoice_id: invoice.id,
                                    gateway: "paypal",
                                    transaction_id: `sandbox_bypass_${Date.now()}:${
                                        invoice.id
                                    }`,
                                    amount: toMoneyString(invoice.total_amount),
                                    status: "paid",
                                },
                            });
                        }
                    });

                    return res.status(200).json({
                        message:
                            "Payment marked as paid using sandbox compliance bypass",
                        invoiceIds: invoices.map((invoice) => invoice.id),
                        status: "paid",
                        bypassed: true,
                        paypalDebugId: err.paypalDebugId || null,
                    });
                }
            }

            return res.status(400).json({
                error: "Transaction blocked by PayPal due to compliance checks. Please contact PayPal support and provide paypalDebugId.",
                paypalDebugId: err.paypalDebugId || null,
                paypalIssue: err.paypalIssue || null,
            });
        }

        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(400).json({
                error: err.message || "PayPal rejected this payment request",
                paypalDebugId: err.paypalDebugId || null,
                paypalIssue: err.paypalIssue || null,
            });
        }

        return res.status(500).json({
            error: err.message || "Failed to capture payment",
            paypalDebugId: err.paypalDebugId || null,
        });
    }
};
