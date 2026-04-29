import { prisma } from "../config/connection.js";
import { paypalRequest, validatePayPalConfig } from "../config/paypal.js";
import {
  buildPaymobIframeUrl,
  createPaymobPaymentKey,
  getPaymobAuthToken,
  getPaymobTransaction,
  inquirePaymobOrderTransaction,
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
const PAYMENT_STATUS_VALUES = ["pending", "paid", "failed", "refunded"];
const PAYMENT_METHOD_VALUES = ["paypal", "paymob", "manual"];
const OUTSTANDING_INVOICE_STATUSES = ["pending", "failed"];
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
      error:
        "payAll must be true. Individual invoice selection is no longer supported.",
    };
  }

  if (Array.isArray(body.invoiceIds) && body.invoiceIds.length > 0) {
    return {
      ok: false,
      error:
        "invoiceIds is no longer supported. Set payAll to true to pay all pending semester invoices.",
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

const parseDateFilter = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const [yearPart, monthPart, dayPart] = trimmed.split("-");
  const year = Number.parseInt(yearPart, 10);
  const month = Number.parseInt(monthPart, 10);
  const day = Number.parseInt(dayPart, 10);

  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
};

const mapAdminStudentPaymentRow = (invoice) => {
  const latestPayment = Array.isArray(invoice?.payments)
    ? invoice.payments[0] || null
    : null;

  return {
    id: invoice.id,
    student_user_id: invoice.student_user_id,
    student_name: invoice.users?.full_name || null,
    semester: invoice.semester,
    year: invoice.year,
    total_amount: Number.parseFloat(invoice.total_amount || 0),
    invoice_count: 1,
    gateway: latestPayment?.gateway || null,
    transaction_id: latestPayment?.transaction_id || null,
    status: invoice.status,
    paid_at: invoice.payment_date,
    created_at: invoice.created_at,
  };
};

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
  gateway,
  transactionId,
  paidAt,
}) => {
  const paidSemesterTotals = await tx.invoices.aggregate({
    where: {
      student_user_id: studentId,
      semester,
      year,
      status: "paid",
    },
    _sum: {
      total_amount: true,
    },
    _count: {
      _all: true,
    },
  });

  const cumulativeTotalAmount = Number.parseFloat(
    paidSemesterTotals?._sum?.total_amount || 0,
  );
  const cumulativeInvoiceCount = Number.parseInt(
    paidSemesterTotals?._count?._all || 0,
    10,
  );

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
      total_amount: toMoneyString(cumulativeTotalAmount),
      invoice_count: cumulativeInvoiceCount,
      gateway,
      transaction_id: transactionId,
      paid_at: paidAt,
    },
    update: {
      total_amount: toMoneyString(cumulativeTotalAmount),
      invoice_count: cumulativeInvoiceCount,
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
    orderDetails.links?.find((link) => link.rel === "approve")?.href || null;

  if (orderDetails.status !== "APPROVED") {
    return {
      ok: false,
      status: 400,
      body: {
        error:
          "Payer has not approved this order yet. Redirect the payer to approveUrl first.",
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
      gateway: "paymob",
      transactionId: String(paymobTransactionId),
      paidAt,
    });
  });
};

const toOptionalNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractStudentIdFromMerchantOrderId = (merchantOrderId) => {
  if (
    typeof merchantOrderId !== "string" ||
    !merchantOrderId.startsWith("bulk_")
  ) {
    return null;
  }

  const lastUnderscore = merchantOrderId.lastIndexOf("_");
  if (lastUnderscore <= "bulk_".length) {
    return null;
  }

  return merchantOrderId.slice("bulk_".length, lastUnderscore) || null;
};

const normalizePaymobWebhookPayload = (payload = {}) => {
  const source =
    payload?.obj || payload?.data?.obj || payload?.transaction || payload;

  const transactionIdCandidate =
    source?.id ??
    source?.transaction_id ??
    payload?.id ??
    payload?.transaction_id ??
    null;

  const orderIdCandidate =
    source?.order?.id ??
    source?.order_id ??
    payload?.order?.id ??
    payload?.order_id ??
    null;

  const merchantOrderId =
    source?.order?.merchant_order_id ??
    source?.merchant_order_id ??
    payload?.order?.merchant_order_id ??
    payload?.merchant_order_id ??
    null;

  return {
    transactionId: transactionIdCandidate
      ? String(transactionIdCandidate)
      : null,
    orderId: toOptionalNumber(orderIdCandidate),
    merchantOrderId,
    transaction:
      source && typeof source === "object"
        ? {
            ...source,
            ...(transactionIdCandidate !== null &&
            transactionIdCandidate !== undefined
              ? { id: transactionIdCandidate }
              : {}),
          }
        : null,
  };
};

const hasPaymobTransactionSnapshot = (transaction) => {
  if (!transaction || typeof transaction !== "object") {
    return false;
  }

  const hasId = transaction.id !== undefined && transaction.id !== null;
  const hasStatusFlags =
    transaction.success !== undefined && transaction.pending !== undefined;
  const hasOrderId = toOptionalNumber(transaction?.order?.id) !== null;
  const hasAmountCents = Number.isFinite(Number(transaction?.amount_cents));

  return hasId && hasStatusFlags && hasOrderId && hasAmountCents;
};

const normalizePaymobTransactionSnapshot = (candidate) => {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const normalizedTransactionId =
    candidate?.id ?? candidate?.transaction_id ?? null;
  const normalizedOrderId = candidate?.order?.id ?? candidate?.order_id ?? null;
  const normalizedMerchantOrderId =
    candidate?.order?.merchant_order_id ?? candidate?.merchant_order_id;

  return {
    ...candidate,
    ...(normalizedTransactionId !== null &&
    normalizedTransactionId !== undefined
      ? { id: normalizedTransactionId }
      : {}),
    ...(normalizedOrderId !== null || normalizedMerchantOrderId
      ? {
          order: {
            ...(candidate?.order || {}),
            ...(normalizedOrderId !== null ? { id: normalizedOrderId } : {}),
            ...(normalizedMerchantOrderId
              ? { merchant_order_id: normalizedMerchantOrderId }
              : {}),
          },
        }
      : {}),
  };
};

const pickPaymobTransactionFromInquiryResponse = (inquiryResponse) => {
  if (!inquiryResponse || typeof inquiryResponse !== "object") {
    return null;
  }

  const candidates = [
    inquiryResponse,
    inquiryResponse?.obj,
    inquiryResponse?.transaction,
    inquiryResponse?.data?.obj,
    inquiryResponse?.data?.transaction,
    ...(Array.isArray(inquiryResponse?.transactions)
      ? inquiryResponse.transactions
      : []),
  ]
    .map(normalizePaymobTransactionSnapshot)
    .filter(Boolean);

  if (candidates.length === 0) {
    return null;
  }

  return (
    candidates.find(
      (transaction) =>
        transaction?.success === true && transaction?.pending !== true,
    ) || candidates[0]
  );
};

const resolvePaymobTransactionByInquiry = async ({
  authToken,
  orderId,
  merchantOrderId,
}) => {
  if (!orderId && !merchantOrderId) {
    return null;
  }

  const inquiryResponse = await inquirePaymobOrderTransaction({
    authToken,
    orderId,
    merchantOrderId,
  });

  return pickPaymobTransactionFromInquiryResponse(inquiryResponse);
};

const verifyAndMarkPaymobSemesterPayment = async ({
  studentId,
  transactionId,
  orderId,
  preloadedTransaction,
}) => {
  if (!studentId) {
    return {
      status: 400,
      body: { error: "studentId is required" },
    };
  }

  if (!transactionId) {
    return {
      status: 400,
      body: { error: "transactionId is required" },
    };
  }

  if (!validatePaymobConfig()) {
    return {
      status: 500,
      body: {
        error: "Paymob is not configured on the server",
      },
    };
  }

  const paymentContext = await resolveOpenPaymentContext();
  if (!paymentContext.ok) {
    return {
      status: paymentContext.status,
      body: paymentContext.body,
    };
  }

  const invoices = await getPendingSemesterInvoices({
    studentId,
    semester: paymentContext.semester,
    year: paymentContext.year,
  });

  if (invoices.length === 0) {
    const existingSemesterPayment = await prisma.student_payments.findUnique({
      where: {
        student_user_id_semester_year: {
          student_user_id: studentId,
          semester: paymentContext.semester,
          year: paymentContext.year,
        },
      },
    });

    if (existingSemesterPayment) {
      return {
        status: 200,
        body: {
          message: "Semester payment already completed",
          payment: mapStudentPayment(existingSemesterPayment),
          status: "paid",
        },
      };
    }

    return {
      status: 404,
      body: {
        error: `No pending invoices found for ${paymentContext.semester} ${paymentContext.year}`,
      },
    };
  }

  let transaction = preloadedTransaction;
  if (!transaction) {
    const authToken = await getPaymobAuthToken();
    transaction = await getPaymobTransaction({
      authToken,
      transactionId,
    });
  }

  const isTransactionPaid =
    transaction?.success === true &&
    transaction?.pending !== true &&
    transaction?.is_refunded !== true &&
    transaction?.is_voided !== true;

  if (!isTransactionPaid) {
    return {
      status: 400,
      body: {
        error: "Paymob transaction is not completed",
        paymobStatus: {
          success: transaction?.success ?? null,
          pending: transaction?.pending ?? null,
          isRefunded: transaction?.is_refunded ?? null,
          isVoided: transaction?.is_voided ?? null,
        },
      },
    };
  }

  const requestedOrderId = toOptionalNumber(orderId);
  const resolvedOrderId = toOptionalNumber(transaction?.order?.id);

  if (requestedOrderId !== null && resolvedOrderId !== requestedOrderId) {
    return {
      status: 400,
      body: {
        error: "Provided orderId does not match this transaction",
      },
    };
  }

  const merchantOrderId = transaction?.order?.merchant_order_id;
  if (!merchantOrderId || !merchantOrderId.startsWith(`bulk_${studentId}_`)) {
    return {
      status: 400,
      body: {
        error: "Transaction does not belong to this user payment order",
      },
    };
  }

  const expectedAmountCents = toTotalAmountCents(invoices);
  if (Number(transaction?.amount_cents) !== expectedAmountCents) {
    return {
      status: 400,
      body: {
        error: "Transaction amount does not match semester invoices amount",
        expectedAmountCents,
        transactionAmountCents: Number(transaction?.amount_cents || 0),
      },
    };
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
    return {
      status: 200,
      body: {
        message: "Payment already verified",
        invoiceIds: [
          ...new Set(existingPayments.map((payment) => payment.invoice_id)),
        ],
        transactionId: String(transaction.id),
        orderId: resolvedOrderId,
        status: "paid",
        semester: paymentContext.semester,
        year: paymentContext.year,
      },
    };
  }

  await markInvoicesPaidWithPaymob({
    studentId,
    invoices,
    paymobTransactionId: transaction.id,
  });

  return {
    status: 200,
    body: {
      message: "Paymob payment verified successfully",
      invoiceIds: invoices.map((invoice) => invoice.id),
      transactionId: String(transaction.id),
      orderId: resolvedOrderId,
      status: "paid",
      semester: paymentContext.semester,
      year: paymentContext.year,
    },
  };
};

export const getMyInvoices = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status } = req.query;

    if (status && !PAYMENT_STATUS_VALUES.includes(status)) {
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

export const getAdminPaymentCards = async (req, res) => {
  try {
    const currentSemester = await getCurrentSemester();
    const overdueThresholdDays = 30;
    const overdueThresholdDate = new Date(
      Date.now() - overdueThresholdDays * 24 * 60 * 60 * 1000,
    );

    const [
      outstandingInvoicesAggregate,
      totalUnpaidInvoices,
      overdueInvoices,
      collectedCurrentSemesterAggregate,
    ] = await Promise.all([
      prisma.invoices.aggregate({
        where: {
          status: {
            in: OUTSTANDING_INVOICE_STATUSES,
          },
        },
        _sum: {
          total_amount: true,
        },
      }),
      prisma.invoices.count({
        where: {
          status: {
            in: OUTSTANDING_INVOICE_STATUSES,
          },
        },
      }),
      prisma.invoices.count({
        where: {
          status: {
            in: OUTSTANDING_INVOICE_STATUSES,
          },
          created_at: {
            lt: overdueThresholdDate,
          },
        },
      }),
      currentSemester
        ? prisma.invoices.aggregate({
            where: {
              status: "paid",
              semester: currentSemester.semester,
              year: currentSemester.year,
            },
            _sum: {
              total_amount: true,
            },
          })
        : Promise.resolve({
            _sum: {
              total_amount: 0,
            },
          }),
    ]);

    const outstandingBalance = Number.parseFloat(
      outstandingInvoicesAggregate?._sum?.total_amount || 0,
    );
    const collectedThisSemester = Number.parseFloat(
      collectedCurrentSemesterAggregate?._sum?.total_amount || 0,
    );
    const overduePaymentsPercentage =
      totalUnpaidInvoices > 0
        ? Number.parseFloat(
            ((overdueInvoices / totalUnpaidInvoices) * 100).toFixed(2),
          )
        : 0;

    return res.status(200).json({
      cards: {
        outstandingBalance,
        collectedThisSemester,
        overduePaymentsPercentage,
      },
      meta: {
        unpaidInvoices: totalUnpaidInvoices,
        overdueInvoices,
        overdueThresholdDays,
        semester: currentSemester?.semester || null,
        year: currentSemester?.year || null,
        refreshedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    logger.error("Error getting admin payment cards:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAdminStudentPaymentsTable = async (req, res) => {
  try {
    const { date, payMethod, status, limit } = req.query;
    const normalizedPayMethod =
      typeof payMethod === "string" ? payMethod.trim().toLowerCase() : null;
    const normalizedStatus =
      typeof status === "string" ? status.trim().toLowerCase() : null;

    if (
      normalizedPayMethod &&
      !PAYMENT_METHOD_VALUES.includes(normalizedPayMethod)
    ) {
      return res.status(400).json({
        error: "Invalid payMethod filter",
      });
    }

    if (normalizedStatus && !PAYMENT_STATUS_VALUES.includes(normalizedStatus)) {
      return res.status(400).json({
        error: "Invalid status filter",
      });
    }

    let dateRange = null;
    if (date) {
      const parsedDate = parseDateFilter(date);
      if (!parsedDate) {
        return res.status(400).json({
          error: "date must be in YYYY-MM-DD format",
        });
      }

      const nextDay = new Date(parsedDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      dateRange = {
        gte: parsedDate,
        lt: nextDay,
      };
    }

    const parsedLimit = Number.parseInt(limit, 10);
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 100)
        : 20;

    const baseWhere = {
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(dateRange ? { created_at: dateRange } : {}),
      ...(normalizedPayMethod
        ? {
            payments: {
              some: {
                gateway: normalizedPayMethod,
              },
            },
          }
        : {}),
    };

    const [studentPayments, total] = await Promise.all([
      prisma.invoices.findMany({
        where: baseWhere,
        include: {
          users: {
            select: {
              full_name: true,
            },
          },
          payments: {
            select: {
              gateway: true,
              transaction_id: true,
              created_at: true,
            },
            orderBy: [{ created_at: "desc" }, { id: "desc" }],
            take: 1,
          },
        },
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        take: safeLimit,
      }),
      prisma.invoices.count({ where: baseWhere }),
    ]);

    return res.status(200).json({
      total,
      count: studentPayments.length,
      filters: {
        date: date || null,
        payMethod: normalizedPayMethod,
        status: normalizedStatus,
        limit: safeLimit,
      },
      payments: studentPayments.map(mapAdminStudentPaymentRow),
      refreshedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Error getting admin student payments table:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const recordManualPayment = async (req, res) => {
  try {
    const {
      student_name: studentName,
      student_id: studentId,
      amount,
      date,
      semester,
      year,
    } = req.body || {};

    if (!studentName || typeof studentName !== "string") {
      return res.status(400).json({
        error: "student_name is required",
      });
    }

    if (!studentId || typeof studentId !== "string") {
      return res.status(400).json({
        error: "student_id is required",
      });
    }

    const amountNumber = Number.parseFloat(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({
        error: "amount must be a positive number",
      });
    }

    const paidAt = new Date(date);
    if (Number.isNaN(paidAt.getTime())) {
      return res.status(400).json({
        error: "date must be a valid ISO date-time",
      });
    }

    const hasSemester =
      typeof semester === "string" && semester.trim().length > 0;
    const hasYear = year !== undefined && year !== null && year !== "";

    if (hasSemester !== hasYear) {
      return res.status(400).json({
        error:
          "Provide both semester and year together when disambiguating manual payment",
      });
    }

    const targetSemester = hasSemester ? semester.trim() : null;
    const targetYear = hasYear ? Number.parseInt(year, 10) : null;

    if (hasYear && !Number.isInteger(targetYear)) {
      return res.status(400).json({
        error: "year must be an integer",
      });
    }

    const studentProfile = await prisma.student_profiles.findUnique({
      where: {
        student_id: studentId.trim(),
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    if (!studentProfile?.users) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    const normalizedProvidedName = studentName.trim().toLowerCase();
    const normalizedStoredName = studentProfile.users.full_name
      .trim()
      .toLowerCase();
    if (normalizedProvidedName !== normalizedStoredName) {
      return res.status(400).json({
        error: "student_name does not match the provided student_id",
      });
    }

    const pendingInvoices = await prisma.invoices.findMany({
      where: {
        student_user_id: studentProfile.user_id,
        status: "pending",
        ...(hasSemester
          ? {
              semester: targetSemester,
              year: targetYear,
            }
          : {}),
      },
      orderBy: {
        id: "asc",
      },
    });

    if (pendingInvoices.length === 0) {
      return res.status(404).json({
        error: "No pending invoices found for this student",
      });
    }

    const groupedPendingInvoices = new Map();

    for (const invoice of pendingInvoices) {
      const groupKey = `${invoice.semester}-${invoice.year}`;

      if (!groupedPendingInvoices.has(groupKey)) {
        groupedPendingInvoices.set(groupKey, {
          semester: invoice.semester,
          year: invoice.year,
          invoices: [],
          totalAmount: 0,
          totalAmountCents: 0,
        });
      }

      const group = groupedPendingInvoices.get(groupKey);
      const invoiceAmount = Number.parseFloat(invoice.total_amount || 0);
      group.invoices.push(invoice);
      group.totalAmount += invoiceAmount;
      group.totalAmountCents += Number.parseInt(toCents(invoiceAmount), 10);
    }

    const pendingSemesters = Array.from(groupedPendingInvoices.values()).map(
      (group) => ({
        semester: group.semester,
        year: group.year,
        invoiceCount: group.invoices.length,
        totalDue: Number.parseFloat(group.totalAmount.toFixed(2)),
      }),
    );

    const requestedAmountCents = Number.parseInt(toCents(amountNumber), 10);
    const groupedValues = Array.from(groupedPendingInvoices.values());

    const matchingGroups = groupedValues.filter(
      (group) => group.totalAmountCents === requestedAmountCents,
    );

    if (matchingGroups.length === 0) {
      return res.status(400).json({
        error: "Provided amount does not match any pending semester total",
        pendingSemesters,
      });
    }

    if (!hasSemester && matchingGroups.length > 1) {
      return res.status(409).json({
        error:
          "Multiple semesters match this amount. Provide semester and year.",
        pendingSemesters,
      });
    }

    let selectedGroup = null;

    if (hasSemester) {
      selectedGroup = groupedPendingInvoices.get(
        `${targetSemester}-${targetYear}`,
      );

      if (!selectedGroup) {
        return res.status(404).json({
          error: `No pending invoices found for ${targetSemester} ${targetYear}`,
          pendingSemesters,
        });
      }

      if (selectedGroup.totalAmountCents !== requestedAmountCents) {
        return res.status(400).json({
          error: "Provided amount does not match selected semester total",
          pendingSemesters,
        });
      }
    } else {
      selectedGroup = matchingGroups[0];
    }

    const invoiceContext = getInvoiceSemesterContext(selectedGroup.invoices);
    const invoiceIds = selectedGroup.invoices.map((invoice) => invoice.id);
    const manualTransactionId = `manual_${studentProfile.user_id}_${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      await tx.invoices.updateMany({
        where: {
          student_user_id: studentProfile.user_id,
          status: "pending",
          id: {
            in: invoiceIds,
          },
        },
        data: {
          status: "paid",
          payment_date: paidAt,
        },
      });

      for (const invoice of selectedGroup.invoices) {
        await tx.payments.create({
          data: {
            invoice_id: invoice.id,
            gateway: "manual",
            transaction_id: `${manualTransactionId}:${invoice.id}`,
            amount: toMoneyString(invoice.total_amount),
            status: "paid",
          },
        });
      }

      await createOrUpdateStudentPaymentRecord({
        tx,
        studentId: studentProfile.user_id,
        semester: invoiceContext.semester,
        year: invoiceContext.year,
        gateway: "manual",
        transactionId: manualTransactionId,
        paidAt,
      });
    });

    return res.status(201).json({
      message: "Manual payment recorded successfully",
      student: {
        student_id: studentProfile.student_id,
        student_user_id: studentProfile.user_id,
        full_name: studentProfile.users.full_name,
      },
      semester: invoiceContext.semester,
      year: invoiceContext.year,
      invoiceIds,
      invoiceCount: invoiceIds.length,
      totalAmount: Number.parseFloat(selectedGroup.totalAmount.toFixed(2)),
      gateway: "manual",
      transactionId: manualTransactionId,
      paidAt: paidAt.toISOString(),
    });
  } catch (err) {
    logger.error("Error recording manual payment:", err);
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
    const { transactionId, orderId, merchantOrderId } = req.body || {};

    if (!transactionId && !orderId && !merchantOrderId) {
      return res.status(400).json({
        error:
          "Provide at least one of transactionId, orderId, or merchantOrderId",
      });
    }

    let resolvedTransactionId = transactionId ? String(transactionId) : null;
    let preloadedTransaction = null;

    if (!resolvedTransactionId) {
      if (!validatePaymobConfig()) {
        return res.status(500).json({
          error: "Paymob is not configured on the server",
        });
      }

      const authToken = await getPaymobAuthToken();
      preloadedTransaction = await resolvePaymobTransactionByInquiry({
        authToken,
        orderId: toOptionalNumber(orderId),
        merchantOrderId,
      });

      if (!hasPaymobTransactionSnapshot(preloadedTransaction)) {
        return res.status(400).json({
          error:
            "Unable to resolve transaction from Paymob using orderId/merchantOrderId",
        });
      }

      resolvedTransactionId = String(preloadedTransaction.id);
    }

    const result = await verifyAndMarkPaymobSemesterPayment({
      studentId,
      transactionId: resolvedTransactionId,
      orderId: toOptionalNumber(orderId),
      preloadedTransaction,
    });

    return res.status(result.status).json(result.body);
  } catch (err) {
    logger.error("Error verifying Paymob payment:", err);

    if (err.statusCode === 404) {
      return res.status(400).json({
        error:
          "Paymob transaction was not found. Verify transactionId is correct and that PAYMOB_API_KEY matches the same environment (test/live) as the transaction.",
        paymobError: err.paymobResponse || null,
      });
    }

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

export const handlePaymobWebhook = async (req, res) => {
  try {
    const normalizedPayload = normalizePaymobWebhookPayload(req.body || {});

    if (
      !normalizedPayload.transactionId &&
      !normalizedPayload.orderId &&
      !normalizedPayload.merchantOrderId
    ) {
      return res.status(400).json({
        error:
          "Unable to resolve transaction identifiers from Paymob webhook payload",
      });
    }

    if (!validatePaymobConfig()) {
      return res.status(500).json({
        error: "Paymob is not configured on the server",
      });
    }

    let transaction = normalizedPayload.transaction;

    if (!hasPaymobTransactionSnapshot(transaction)) {
      const authToken = await getPaymobAuthToken();
      let transactionLookupError = null;

      if (normalizedPayload.transactionId) {
        try {
          transaction = await getPaymobTransaction({
            authToken,
            transactionId: normalizedPayload.transactionId,
          });
        } catch (err) {
          if (err.statusCode !== 404) {
            throw err;
          }

          transactionLookupError = err;
        }
      }

      if (!hasPaymobTransactionSnapshot(transaction)) {
        const inquiryOrderId =
          normalizedPayload.orderId ??
          toOptionalNumber(normalizedPayload.transactionId);

        const inquiryTransaction = await resolvePaymobTransactionByInquiry({
          authToken,
          orderId: inquiryOrderId,
          merchantOrderId: normalizedPayload.merchantOrderId,
        });

        if (hasPaymobTransactionSnapshot(inquiryTransaction)) {
          transaction = inquiryTransaction;
        }
      }

      if (!hasPaymobTransactionSnapshot(transaction)) {
        if (hasPaymobTransactionSnapshot(normalizedPayload.transaction)) {
          logger.warn(
            "Paymob transaction lookup returned 404 for webhook payload. Falling back to webhook transaction snapshot.",
          );
          transaction = normalizedPayload.transaction;
        } else if (transactionLookupError) {
          throw transactionLookupError;
        } else {
          return res.status(400).json({
            error:
              "Unable to resolve Paymob transaction details from webhook payload",
          });
        }
      }
    }

    const resolvedTransactionId =
      normalizedPayload.transactionId ||
      (transaction?.id !== undefined && transaction?.id !== null
        ? String(transaction.id)
        : null);

    if (!resolvedTransactionId) {
      return res.status(400).json({
        error: "Unable to resolve transactionId from Paymob webhook payload",
      });
    }

    const merchantOrderId =
      transaction?.order?.merchant_order_id ||
      normalizedPayload.merchantOrderId ||
      null;

    if (merchantOrderId) {
      transaction = {
        ...transaction,
        order: {
          ...(transaction?.order || {}),
          merchant_order_id: merchantOrderId,
        },
      };
    }

    const studentId = extractStudentIdFromMerchantOrderId(merchantOrderId);
    if (!studentId) {
      return res.status(400).json({
        error: "Unable to resolve student id from merchant_order_id",
        merchantOrderId,
      });
    }

    const result = await verifyAndMarkPaymobSemesterPayment({
      studentId,
      transactionId: resolvedTransactionId,
      orderId: normalizedPayload.orderId ?? transaction?.order?.id,
      preloadedTransaction: transaction,
    });

    return res.status(result.status).json({
      ...result.body,
      source: "paymob_webhook",
      merchantOrderId,
      studentId,
    });
  } catch (err) {
    logger.error("Error handling Paymob webhook:", err);

    if (err.statusCode === 404) {
      return res.status(400).json({
        error:
          "Paymob transaction was not found while processing webhook. Ensure webhook obj.id is the transaction id and that PAYMOB_API_KEY uses the same environment (test/live).",
        paymobError: err.paymobResponse || null,
      });
    }

    if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
      return res.status(400).json({
        error: err.message || "Paymob rejected this webhook request",
        paymobError: err.paymobResponse || null,
      });
    }

    return res.status(500).json({
      error: err.message || "Failed to process Paymob webhook",
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
      const existingSemesterPayment = await prisma.student_payments.findUnique({
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
        error:
          "No pending invoices found for this order in the active payment period",
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
          return res.status(paymentContext.status).json(paymentContext.body);
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

            await createOrUpdateStudentPaymentRecord({
              tx,
              studentId,
              semester: paymentContext.semester,
              year: paymentContext.year,
              gateway: "paypal",
              transactionId: `sandbox_bypass_${Date.now()}`,
              paidAt,
            });
          });

          return res.status(200).json({
            message: "Payment marked as paid using sandbox compliance bypass",
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
        error:
          "Transaction blocked by PayPal due to compliance checks. Please contact PayPal support and provide paypalDebugId.",
        paypalDebugId: err.paypalDebugId || null,
        paypalIssue: err.paypalIssue || null,
      });
    }

    if (err.message?.includes("Payer has not yet approved")) {
      return res.status(400).json({
        error:
          "Payer has not approved this order yet. Open approveUrl from create-order response, approve payment, then retry capture.",
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
