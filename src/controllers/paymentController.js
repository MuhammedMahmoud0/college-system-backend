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
import {
    getCurrentSemester,
    getPaymentPeriod,
    getRegistrationPeriod,
} from "../utils/periodHelpers.js";
import logger from "../utils/logger.js";

const toMoneyString = (value) => Number.parseFloat(value || 0).toFixed(2);
const toCents = (value) =>
    Math.round(Number.parseFloat(value || 0) * 100).toString();
const shouldBypassSandboxCompliance =
    process.env.PAYPAL_ENV !== "live" &&
    process.env.PAYPAL_SANDBOX_BYPASS_COMPLIANCE === "true";

const EMPTY_PERIOD = {
    isOpen: false,
    semester: null,
    year: null,
    startDate: null,
    endDate: null,
    nextOpenDate: null,
};

const ensurePayAllRequest = (body = {}) => {
    if (body.payAll !== true) {
        return {
            ok: false,
            error: "payAll must be true. Individual invoice selection is no longer supported.",
        };
    }

    if (Array.isArray(body.invoiceIds) && body.invoiceIds.length > 0) {
        return {
            ok: false,
            error: "invoiceIds is no longer supported. Set payAll to true to pay all pending semester invoices.",
        };
    }

    return { ok: true };
};

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

const createOrderForInvoices = async (invoices, label = "Tuition invoices") => {
    const totalAmount = invoices.reduce(
        (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
        0,
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
        0,
    );

const buildPaymobItemsForInvoices = (invoices) =>
    invoices.map((invoice) => ({
        name: `Invoice ${invoice.id}`,
        amount_cents: toCents(invoice.total_amount),
        description: `${invoice.course_code} ${invoice.semester} ${invoice.year}`,
        quantity: 1,
    }));

const mapInvoice = (invoice) => ({
    ...invoice,
    credit_price: Number.parseFloat(invoice.credit_price),
    total_amount: Number.parseFloat(invoice.total_amount),
    payments: (invoice.payments || []).map((payment) => ({
        ...payment,
        amount: Number.parseFloat(payment.amount),
    })),
});

const mapStudentPayment = (payment) => ({
    ...payment,
    total_amount: Number.parseFloat(payment.total_amount),
});

const buildInvoiceGroups = (invoices) => {
    const bySemester = new Map();

    for (const invoice of invoices) {
        const key = `${invoice.semester}-${invoice.year}`;

        if (!bySemester.has(key)) {
            bySemester.set(key, {
                semester: invoice.semester,
                year: invoice.year,
                invoices: [],
                summary: {
                    totalInvoices: 0,
                    pendingInvoices: 0,
                    totalDue: 0,
                },
            });
        }

        const group = bySemester.get(key);
        group.invoices.push(invoice);
        group.summary.totalInvoices += 1;

        if (invoice.status === "pending") {
            group.summary.pendingInvoices += 1;
            group.summary.totalDue += Number.parseFloat(invoice.total_amount);
        }
    }

    return Array.from(bySemester.values()).map((group) => ({
        ...group,
        summary: {
            ...group.summary,
            totalDue: Number.parseFloat(group.summary.totalDue.toFixed(2)),
        },
    }));
};

const getPendingSemesterInvoices = async ({
    studentId,
    semester,
    year,
    paypalOrderId,
}) => {
    return prisma.invoices.findMany({
        where: {
            student_user_id: studentId,
            status: "pending",
            semester,
            year,
            ...(paypalOrderId ? { paypal_order_id: paypalOrderId } : {}),
        },
        orderBy: { id: "asc" },
    });
};

const getInvoiceSemesterContext = (invoices) => {
    if (!Array.isArray(invoices) || invoices.length === 0) {
        return null;
    }

    const semester = invoices[0].semester;
    const year = invoices[0].year;

    const hasMixedSemester = invoices.some(
        (invoice) => invoice.semester !== semester || invoice.year !== year,
    );

    if (hasMixedSemester) {
        throw new Error("Selected invoices must belong to a single semester");
    }

    return { semester, year };
};

const createOrUpdateStudentPaymentRecord = async ({
    tx,
    studentId,
    semester,
    year,
    totalAmount,
    invoiceCount,
    gateway,
    transactionId,
    paidAt,
}) => {
    return tx.student_payments.upsert({
        where: {
            student_user_id_semester_year: {
                student_user_id: studentId,
                semester,
                year,
            },
        },
        create: {
            student_user_id: studentId,
            semester,
            year,
            total_amount: toMoneyString(totalAmount),
            invoice_count: invoiceCount,
            gateway,
            transaction_id: transactionId,
            paid_at: paidAt,
        },
        update: {
            total_amount: toMoneyString(totalAmount),
            invoice_count: invoiceCount,
            gateway,
            transaction_id: transactionId,
            paid_at: paidAt,
        },
    });
};

const resolveCurrentSemesterPeriods = async () => {
    const currentSemester = await getCurrentSemester();

    if (!currentSemester) {
        return {
            semester: null,
            year: null,
            registrationPeriod: EMPTY_PERIOD,
            paymentPeriod: EMPTY_PERIOD,
        };
    }

    const [registrationPeriod, paymentPeriod] = await Promise.all([
        getRegistrationPeriod(currentSemester.semester, currentSemester.year),
        getPaymentPeriod(currentSemester.semester, currentSemester.year),
    ]);

    return {
        semester: currentSemester.semester,
        year: currentSemester.year,
        registrationPeriod,
        paymentPeriod,
    };
};

const resolveOpenPaymentContext = async () => {
    const currentSemester = await getCurrentSemester();

    if (!currentSemester) {
        return {
            ok: false,
            status: 404,
            body: {
                error: "No active semester found for payment",
            },
        };
    }

    const paymentPeriod = await getPaymentPeriod(
        currentSemester.semester,
        currentSemester.year,
    );

    if (!paymentPeriod.isOpen) {
        return {
            ok: false,
            status: 403,
            body: {
                error: `Payment period is currently closed for ${currentSemester.semester} ${currentSemester.year}`,
                paymentPeriod,
            },
        };
    }

    return {
        ok: true,
        semester: currentSemester.semester,
        year: currentSemester.year,
        paymentPeriod,
    };
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
        },
    );

    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureStatus = captureUnit?.status;
    const captureTransactionId = captureUnit?.id || capture.id;

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

    const invoiceContext = getInvoiceSemesterContext(invoices);
    const paidAt = new Date();
    const totalAmount = invoices.reduce(
        (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
        0,
    );

    await prisma.$transaction(async (tx) => {
        await tx.invoices.updateMany({
            where: {
                student_user_id: studentId,
                id: { in: invoices.map((invoice) => invoice.id) },
            },
            data: {
                status: "paid",
                payment_date: paidAt,
                paypal_order_id: orderId,
            },
        });

        for (const invoice of invoices) {
            await tx.payments.create({
                data: {
                    invoice_id: invoice.id,
                    gateway: "paypal",
                    transaction_id: `${captureTransactionId}:${invoice.id}`,
                    amount: toMoneyString(invoice.total_amount),
                    status: "paid",
                },
            });
        }

        await createOrUpdateStudentPaymentRecord({
            tx,
            studentId,
            semester: invoiceContext.semester,
            year: invoiceContext.year,
            totalAmount,
            invoiceCount: invoices.length,
            gateway: "paypal",
            transactionId: captureTransactionId,
            paidAt,
        });
    });

    return {
        ok: true,
        status: 200,
        body: {
            message: "Payment captured successfully",
            invoiceIds: invoices.map((invoice) => invoice.id),
            transactionId: captureTransactionId,
            status: "paid",
            semester: invoiceContext.semester,
            year: invoiceContext.year,
        },
    };
};

const markInvoicesPaidWithPaymob = async ({
    studentId,
    invoices,
    paymobTransactionId,
}) => {
    const invoiceContext = getInvoiceSemesterContext(invoices);
    const paidAt = new Date();
    const totalAmount = invoices.reduce(
        (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
        0,
    );

    await prisma.$transaction(async (tx) => {
        await tx.invoices.updateMany({
            where: {
                student_user_id: studentId,
                id: { in: invoices.map((invoice) => invoice.id) },
            },
            data: {
                status: "paid",
                payment_date: paidAt,
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

        await createOrUpdateStudentPaymentRecord({
            tx,
            studentId,
            semester: invoiceContext.semester,
            year: invoiceContext.year,
            totalAmount,
            invoiceCount: invoices.length,
            gateway: "paymob",
            transactionId: String(paymobTransactionId),
            paidAt,
        });
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

        const [invoices, periodContext] = await Promise.all([
            prisma.invoices.findMany({
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
                orderBy: [{ year: "desc" }, { created_at: "desc" }],
            }),
            resolveCurrentSemesterPeriods(),
        ]);

        const mappedInvoices = invoices.map(mapInvoice);
        const pendingInvoices = mappedInvoices.filter(
            (invoice) => invoice.status === "pending",
        );
        const totalDue = pendingInvoices.reduce(
            (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
            0,
        );

        return res.status(200).json({
            invoices: mappedInvoices,
            groupedInvoices: buildInvoiceGroups(mappedInvoices),
            summary: {
                totalInvoices: mappedInvoices.length,
                pendingInvoices: pendingInvoices.length,
                totalDue: Number.parseFloat(totalDue.toFixed(2)),
            },
            registrationPeriod: periodContext.registrationPeriod,
            paymentPeriod: periodContext.paymentPeriod,
        });
    } catch (err) {
        logger.error("Error getting my invoices:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const getMyPayments = async (req, res) => {
    try {
        const studentId = req.user.id;

        const payments = await prisma.student_payments.findMany({
            where: {
                student_user_id: studentId,
            },
            orderBy: [{ paid_at: "desc" }, { created_at: "desc" }],
        });

        const mappedPayments = payments.map(mapStudentPayment);
        const totalAmountPaid = mappedPayments.reduce(
            (sum, payment) => sum + Number.parseFloat(payment.total_amount),
            0,
        );

        return res.status(200).json({
            payments: mappedPayments,
            summary: {
                totalPayments: mappedPayments.length,
                totalAmountPaid: Number.parseFloat(totalAmountPaid.toFixed(2)),
            },
        });
    } catch (err) {
        logger.error("Error getting payment history:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const createPayPalOrder = async (req, res) => {
    try {
        const studentId = req.user.id;
        const payAllValidation = ensurePayAllRequest(req.body || {});

        if (!payAllValidation.ok) {
            return res.status(400).json({ error: payAllValidation.error });
        }

        if (!validatePayPalConfig()) {
            return res.status(500).json({
                error: "PayPal is not configured on the server",
            });
        }

        const paymentContext = await resolveOpenPaymentContext();
        if (!paymentContext.ok) {
            return res.status(paymentContext.status).json(paymentContext.body);
        }

        const invoices = await getPendingSemesterInvoices({
            studentId,
            semester: paymentContext.semester,
            year: paymentContext.year,
        });

        if (invoices.length === 0) {
            return res.status(404).json({
                error: `No pending invoices found for ${paymentContext.semester} ${paymentContext.year}`,
            });
        }

        const order = await createOrderForInvoices(
            invoices,
            `Tuition invoices for ${paymentContext.semester} ${paymentContext.year}`,
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
            0,
        );

        return res.status(201).json({
            message: `PayPal order created for all pending invoices in ${paymentContext.semester} ${paymentContext.year}`,
            payAll: true,
            orderId: order.id,
            approveUrl: approveLink,
            invoiceIds: invoices.map((invoice) => invoice.id),
            invoiceCount: invoices.length,
            totalAmount: Number.parseFloat(totalAmount.toFixed(2)),
            currency: "USD",
            paymentPeriod: paymentContext.paymentPeriod,
        });
    } catch (err) {
        logger.error("Error creating PayPal order:", err);
        return res.status(500).json({
            error: err.message || "Failed to create PayPal order",
        });
    }
};

export const createPaymobOrder = async (req, res) => {
    try {
        const studentId = req.user.id;
        const payAllValidation = ensurePayAllRequest(req.body || {});

        if (!payAllValidation.ok) {
            return res.status(400).json({ error: payAllValidation.error });
        }

        if (!validatePaymobConfig()) {
            return res.status(500).json({
                error: "Paymob is not configured on the server",
            });
        }

        const paymentContext = await resolveOpenPaymentContext();
        if (!paymentContext.ok) {
            return res.status(paymentContext.status).json(paymentContext.body);
        }

        const [invoices, user] = await Promise.all([
            getPendingSemesterInvoices({
                studentId,
                semester: paymentContext.semester,
                year: paymentContext.year,
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

        if (invoices.length === 0) {
            return res.status(404).json({
                error: `No pending invoices found for ${paymentContext.semester} ${paymentContext.year}`,
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
            0,
        );

        return res.status(201).json({
            message: `Paymob checkout created for all pending invoices in ${paymentContext.semester} ${paymentContext.year}`,
            payAll: true,
            orderId: order.id,
            merchantOrderId,
            iframeUrl: buildPaymobIframeUrl(paymentKey.token),
            paymentToken: paymentKey.token,
            invoiceIds: invoices.map((invoice) => invoice.id),
            invoiceCount: invoices.length,
            totalAmount: Number.parseFloat(totalAmount.toFixed(2)),
            amountCents: totalAmountCents,
            currency: "EGP",
            paymentPeriod: paymentContext.paymentPeriod,
        });
    } catch (err) {
        logger.error("Error creating Paymob order:", err);
        return res.status(500).json({
            error: err.message || "Failed to create Paymob checkout",
            paymobError: err.paymobResponse || null,
        });
    }
};

export const verifyPaymobPayment = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { transactionId, orderId } = req.body || {};

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

        const paymentContext = await resolveOpenPaymentContext();
        if (!paymentContext.ok) {
            return res.status(paymentContext.status).json(paymentContext.body);
        }

        const invoices = await getPendingSemesterInvoices({
            studentId,
            semester: paymentContext.semester,
            year: paymentContext.year,
        });

        if (invoices.length === 0) {
            const existingSemesterPayment =
                await prisma.student_payments.findUnique({
                    where: {
                        student_user_id_semester_year: {
                            student_user_id: studentId,
                            semester: paymentContext.semester,
                            year: paymentContext.year,
                        },
                    },
                });

            if (existingSemesterPayment) {
                return res.status(200).json({
                    message: "Semester payment already completed",
                    payment: mapStudentPayment(existingSemesterPayment),
                    status: "paid",
                });
            }

            return res.status(404).json({
                error: `No pending invoices found for ${paymentContext.semester} ${paymentContext.year}`,
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
                error: "Transaction does not belong to this user payment order",
            });
        }

        const expectedAmountCents = toTotalAmountCents(invoices);
        if (Number(transaction?.amount_cents) !== expectedAmountCents) {
            return res.status(400).json({
                error: "Transaction amount does not match semester invoices amount",
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
                    ...new Set(
                        existingPayments.map((payment) => payment.invoice_id),
                    ),
                ],
                transactionId: transaction.id,
                orderId: transaction?.order?.id || null,
                status: "paid",
                semester: paymentContext.semester,
                year: paymentContext.year,
            });
        }

        await markInvoicesPaidWithPaymob({
            studentId,
            invoices,
            paymobTransactionId: transaction.id,
        });

        return res.status(200).json({
            message: "Paymob payment verified successfully",
            invoiceIds: invoices.map((invoice) => invoice.id),
            transactionId: transaction.id,
            orderId: transaction?.order?.id || null,
            status: "paid",
            semester: paymentContext.semester,
            year: paymentContext.year,
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

export const capturePayPalOrder = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { orderId } = req.body || {};

        if (!orderId || typeof orderId !== "string") {
            return res.status(400).json({ error: "orderId is required" });
        }

        const paymentContext = await resolveOpenPaymentContext();
        if (!paymentContext.ok) {
            return res.status(paymentContext.status).json(paymentContext.body);
        }

        const invoices = await getPendingSemesterInvoices({
            studentId,
            semester: paymentContext.semester,
            year: paymentContext.year,
            paypalOrderId: orderId,
        });

        if (invoices.length === 0) {
            const existingSemesterPayment =
                await prisma.student_payments.findUnique({
                    where: {
                        student_user_id_semester_year: {
                            student_user_id: studentId,
                            semester: paymentContext.semester,
                            year: paymentContext.year,
                        },
                    },
                });

            if (existingSemesterPayment) {
                return res.status(200).json({
                    message: "Semester payment already completed",
                    payment: mapStudentPayment(existingSemesterPayment),
                    status: "paid",
                });
            }

            return res.status(404).json({
                error: "No pending invoices found for this order in the active payment period",
            });
        }

        const captureResult = await captureAndMarkInvoicesPaid({
            studentId,
            orderId,
            invoices,
        });

        return res.status(captureResult.status).json(captureResult.body);
    } catch (err) {
        logger.error("Error capturing PayPal order:", err);

        const isComplianceViolation =
            err.paypalIssue === "COMPLIANCE_VIOLATION" ||
            err.message?.toLowerCase().includes("compliance violation");

        if (isComplianceViolation) {
            if (shouldBypassSandboxCompliance) {
                const studentId = req.user.id;
                const { orderId } = req.body || {};

                const paymentContext = await resolveOpenPaymentContext();
                if (!paymentContext.ok) {
                    return res
                        .status(paymentContext.status)
                        .json(paymentContext.body);
                }

                const invoices = await getPendingSemesterInvoices({
                    studentId,
                    semester: paymentContext.semester,
                    year: paymentContext.year,
                    paypalOrderId: orderId,
                });

                if (invoices.length > 0) {
                    const paidAt = new Date();
                    await prisma.$transaction(async (tx) => {
                        await tx.invoices.updateMany({
                            where: {
                                id: {
                                    in: invoices.map((invoice) => invoice.id),
                                },
                            },
                            data: {
                                status: "paid",
                                payment_date: paidAt,
                            },
                        });

                        for (const invoice of invoices) {
                            await tx.payments.create({
                                data: {
                                    invoice_id: invoice.id,
                                    gateway: "paypal",
                                    transaction_id: `sandbox_bypass_${Date.now()}:${invoice.id}`,
                                    amount: toMoneyString(invoice.total_amount),
                                    status: "paid",
                                },
                            });
                        }

                        const totalAmount = invoices.reduce(
                            (sum, invoice) =>
                                sum + Number.parseFloat(invoice.total_amount),
                            0,
                        );

                        await createOrUpdateStudentPaymentRecord({
                            tx,
                            studentId,
                            semester: paymentContext.semester,
                            year: paymentContext.year,
                            totalAmount,
                            invoiceCount: invoices.length,
                            gateway: "paypal",
                            transactionId: `sandbox_bypass_${Date.now()}`,
                            paidAt,
                        });
                    });

                    return res.status(200).json({
                        message:
                            "Payment marked as paid using sandbox compliance bypass",
                        invoiceIds: invoices.map((invoice) => invoice.id),
                        status: "paid",
                        bypassed: true,
                        semester: paymentContext.semester,
                        year: paymentContext.year,
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
