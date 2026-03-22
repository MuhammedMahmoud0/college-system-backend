import { prisma } from "../config/connection.js";
import { paypalRequest, validatePayPalConfig } from "../config/paypal.js";
import {
    buildPaymobIframeUrl,
    createPaymobPaymentKey,
    getPaymobAuthToken,
    getPaymobTransaction,
    registerPaymobOrder,
    validatePaymobConfig,
} from "../config/paymob.js";
import logger from "../utils/logger.js";

const toMoneyString = (value) => Number.parseFloat(value).toFixed(2);
const toCents = (value) =>
    Math.round(Number.parseFloat(value || 0) * 100).toString();
const shouldBypassSandboxCompliance =
    process.env.PAYPAL_ENV !== "live" &&
    process.env.PAYPAL_SANDBOX_BYPASS_COMPLIANCE === "true";

const buildPaymobBillingData = (user) => {
    const [firstName, ...restName] = (user?.full_name || "Student User")
        .trim()
        .split(" ");

    return {
        first_name: firstName || "Student",
        last_name: restName.join(" ") || "User",
        email: user?.email || "student@example.com",
        phone_number: user?.phone || "+201000000000",
        apartment: "NA",
        floor: "NA",
        street: user?.address || "NA",
        building: "NA",
        shipping_method: "PKG",
        postal_code: "00000",
        city: "Cairo",
        country: "EG",
        state: "Cairo",
    };
};

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

const toTotalAmountCents = (invoices) =>
    invoices.reduce(
        (sum, invoice) => sum + Number.parseInt(toCents(invoice.total_amount)),
        0
    );

const buildPaymobItemsForInvoices = (invoices) =>
    invoices.map((invoice) => ({
        name: `Invoice ${invoice.id}`,
        amount_cents: toCents(invoice.total_amount),
        description: `${invoice.course_code} ${invoice.semester} ${invoice.year}`,
        quantity: 1,
    }));

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

const markInvoicesPaidWithPaymob = async ({
    studentId,
    invoices,
    paymobTransactionId,
}) => {
    await prisma.$transaction(async (tx) => {
        await tx.invoices.updateMany({
            where: {
                student_user_id: studentId,
                id: { in: invoices.map((invoice) => invoice.id) },
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
                    gateway: "paymob",
                    transaction_id: `paymob_${paymobTransactionId}:${invoice.id}`,
                    amount: toMoneyString(invoice.total_amount),
                    status: "paid",
                },
            });
        }
    });
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

export const createPaymobOrder = async (req, res) => {
    try {
        const studentId = req.user.id;
        const invoiceId = Number.parseInt(req.params.invoiceId);

        if (!Number.isInteger(invoiceId)) {
            return res.status(400).json({ error: "Invalid invoice id" });
        }

        if (!validatePaymobConfig()) {
            return res.status(500).json({
                error: "Paymob is not configured on the server",
            });
        }

        const [invoice, user] = await Promise.all([
            prisma.invoices.findFirst({
                where: {
                    id: invoiceId,
                    student_user_id: studentId,
                },
            }),
            prisma.users.findUnique({
                where: { id: studentId },
                select: {
                    full_name: true,
                    email: true,
                    phone: true,
                    address: true,
                },
            }),
        ]);

        if (!invoice) {
            return res.status(404).json({ error: "Invoice not found" });
        }

        if (invoice.status === "paid") {
            return res.status(400).json({ error: "Invoice is already paid" });
        }

        const authToken = await getPaymobAuthToken();
        const merchantOrderId = `invoice_${invoice.id}_${Date.now()}`;

        const order = await registerPaymobOrder({
            authToken,
            amountCents: toCents(invoice.total_amount),
            merchantOrderId,
            items: buildPaymobItemsForInvoices([invoice]),
        });

        const paymentKey = await createPaymobPaymentKey({
            authToken,
            amountCents: toCents(invoice.total_amount),
            orderId: order.id,
            billingData: buildPaymobBillingData(user),
        });

        return res.status(201).json({
            message: "Paymob checkout created",
            invoiceId: invoice.id,
            orderId: order.id,
            merchantOrderId,
            iframeUrl: buildPaymobIframeUrl(paymentKey.token),
            paymentToken: paymentKey.token,
            currency: "EGP",
            amountCents: Number.parseInt(toCents(invoice.total_amount)),
        });
    } catch (err) {
        logger.error("Error creating Paymob order:", err);
        return res.status(500).json({
            error: err.message || "Failed to create Paymob checkout",
            paymobError: err.paymobResponse || null,
        });
    }
};

export const createPaymobOrderBulk = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { payAll, invoiceIds } = parseInvoiceSelection(req.body || {});

        if (!validatePaymobConfig()) {
            return res.status(500).json({
                error: "Paymob is not configured on the server",
            });
        }

        const [invoices, user] = await Promise.all([
            getPendingInvoicesForPayment(studentId, invoiceIds, payAll),
            prisma.users.findUnique({
                where: { id: studentId },
                select: {
                    full_name: true,
                    email: true,
                    phone: true,
                    address: true,
                },
            }),
        ]);

        if (invoices.length === 0) {
            return res.status(404).json({
                error: "No pending invoices found for selected scope",
            });
        }

        const authToken = await getPaymobAuthToken();
        const merchantOrderId = `bulk_${studentId}_${Date.now()}`;
        const totalAmountCents = toTotalAmountCents(invoices);

        const order = await registerPaymobOrder({
            authToken,
            amountCents: totalAmountCents,
            merchantOrderId,
            items: buildPaymobItemsForInvoices(invoices),
        });

        const paymentKey = await createPaymobPaymentKey({
            authToken,
            amountCents: totalAmountCents,
            orderId: order.id,
            billingData: buildPaymobBillingData(user),
        });

        const totalAmount = invoices.reduce(
            (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
            0
        );

        return res.status(201).json({
            message: "Paymob checkout created for selected invoices",
            orderId: order.id,
            merchantOrderId,
            iframeUrl: buildPaymobIframeUrl(paymentKey.token),
            paymentToken: paymentKey.token,
            invoiceIds: invoices.map((invoice) => invoice.id),
            totalAmount: Number.parseFloat(totalAmount.toFixed(2)),
            amountCents: totalAmountCents,
            currency: "EGP",
        });
    } catch (err) {
        logger.error("Error creating bulk Paymob order:", err);
        return res.status(500).json({
            error: err.message || "Failed to create Paymob checkout",
            paymobError: err.paymobResponse || null,
        });
    }
};

export const verifyPaymobPayment = async (req, res) => {
    try {
        const studentId = req.user.id;
        const invoiceId = Number.parseInt(req.params.invoiceId);
        const { transactionId } = req.body || {};

        if (!Number.isInteger(invoiceId)) {
            return res.status(400).json({ error: "Invalid invoice id" });
        }

        if (!transactionId) {
            return res.status(400).json({ error: "transactionId is required" });
        }

        if (!validatePaymobConfig()) {
            return res.status(500).json({
                error: "Paymob is not configured on the server",
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
            return res.status(200).json({
                message: "Invoice is already paid",
                invoiceId: invoice.id,
            });
        }

        const authToken = await getPaymobAuthToken();
        const transaction = await getPaymobTransaction({
            authToken,
            transactionId,
        });

        const isTransactionPaid =
            transaction?.success === true &&
            transaction?.pending !== true &&
            transaction?.is_refunded !== true &&
            transaction?.is_voided !== true;

        if (!isTransactionPaid) {
            return res.status(400).json({
                error: "Paymob transaction is not completed",
                paymobStatus: {
                    success: transaction?.success ?? null,
                    pending: transaction?.pending ?? null,
                    isRefunded: transaction?.is_refunded ?? null,
                    isVoided: transaction?.is_voided ?? null,
                },
            });
        }

        const merchantOrderId = transaction?.order?.merchant_order_id;

        if (
            !merchantOrderId ||
            !merchantOrderId.startsWith(`invoice_${invoice.id}_`)
        ) {
            return res.status(400).json({
                error: "Transaction does not belong to this invoice",
            });
        }

        const expectedAmountCents = Number.parseInt(
            toCents(invoice.total_amount)
        );
        if (Number(transaction?.amount_cents) !== expectedAmountCents) {
            return res.status(400).json({
                error: "Transaction amount does not match invoice amount",
                expectedAmountCents,
                transactionAmountCents: Number(transaction?.amount_cents || 0),
            });
        }

        const paymentTransactionId = `paymob_${transaction.id}:${invoice.id}`;
        const existingPayment = await prisma.payments.findFirst({
            where: {
                gateway: "paymob",
                transaction_id: paymentTransactionId,
            },
        });

        if (existingPayment) {
            await prisma.invoices.update({
                where: { id: invoice.id },
                data: {
                    status: "paid",
                    payment_date: new Date(),
                },
            });

            return res.status(200).json({
                message: "Payment already verified",
                invoiceId: invoice.id,
                transactionId: transaction.id,
                status: "paid",
            });
        }

        await markInvoicesPaidWithPaymob({
            studentId,
            invoices: [invoice],
            paymobTransactionId: transaction.id,
        });

        return res.status(200).json({
            message: "Paymob payment verified successfully",
            invoiceId: invoice.id,
            transactionId: transaction.id,
            orderId: transaction?.order?.id || null,
            status: "paid",
        });
    } catch (err) {
        logger.error("Error verifying Paymob payment:", err);

        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(400).json({
                error: err.message || "Paymob rejected this payment request",
                paymobError: err.paymobResponse || null,
            });
        }

        return res.status(500).json({
            error: err.message || "Failed to verify Paymob payment",
            paymobError: err.paymobResponse || null,
        });
    }
};

export const verifyPaymobPaymentBulk = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { transactionId, orderId } = req.body || {};
        const { payAll, invoiceIds } = parseInvoiceSelection(req.body || {});

        if (!transactionId) {
            return res.status(400).json({ error: "transactionId is required" });
        }

        if (!orderId) {
            return res.status(400).json({ error: "orderId is required" });
        }

        if (!validatePaymobConfig()) {
            return res.status(500).json({
                error: "Paymob is not configured on the server",
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

        const authToken = await getPaymobAuthToken();
        const transaction = await getPaymobTransaction({
            authToken,
            transactionId,
        });

        const isTransactionPaid =
            transaction?.success === true &&
            transaction?.pending !== true &&
            transaction?.is_refunded !== true &&
            transaction?.is_voided !== true;

        if (!isTransactionPaid) {
            return res.status(400).json({
                error: "Paymob transaction is not completed",
                paymobStatus: {
                    success: transaction?.success ?? null,
                    pending: transaction?.pending ?? null,
                    isRefunded: transaction?.is_refunded ?? null,
                    isVoided: transaction?.is_voided ?? null,
                },
            });
        }

        if (Number(transaction?.order?.id) !== Number(orderId)) {
            return res.status(400).json({
                error: "Provided orderId does not match this transaction",
            });
        }

        const merchantOrderId = transaction?.order?.merchant_order_id;
        if (
            !merchantOrderId ||
            !merchantOrderId.startsWith(`bulk_${studentId}_`)
        ) {
            return res.status(400).json({
                error: "Transaction does not belong to this user bulk order",
            });
        }

        const expectedAmountCents = toTotalAmountCents(invoices);
        if (Number(transaction?.amount_cents) !== expectedAmountCents) {
            return res.status(400).json({
                error: "Transaction amount does not match selected invoices amount",
                expectedAmountCents,
                transactionAmountCents: Number(transaction?.amount_cents || 0),
            });
        }

        const existingPayments = await prisma.payments.findMany({
            where: {
                gateway: "paymob",
                transaction_id: {
                    startsWith: `paymob_${transaction.id}:`,
                },
            },
            select: {
                invoice_id: true,
            },
        });

        if (existingPayments.length > 0) {
            return res.status(200).json({
                message: "Payment already verified",
                invoiceIds: [
                    ...new Set(existingPayments.map((p) => p.invoice_id)),
                ],
                transactionId: transaction.id,
                orderId: transaction?.order?.id || null,
                status: "paid",
            });
        }

        await markInvoicesPaidWithPaymob({
            studentId,
            invoices,
            paymobTransactionId: transaction.id,
        });

        return res.status(200).json({
            message: "Paymob bulk payment verified successfully",
            invoiceIds: invoices.map((invoice) => invoice.id),
            transactionId: transaction.id,
            orderId: transaction?.order?.id || null,
            status: "paid",
        });
    } catch (err) {
        logger.error("Error verifying bulk Paymob payment:", err);

        if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
            return res.status(400).json({
                error: err.message || "Paymob rejected this payment request",
                paymobError: err.paymobResponse || null,
            });
        }

        return res.status(500).json({
            error: err.message || "Failed to verify Paymob payment",
            paymobError: err.paymobResponse || null,
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
