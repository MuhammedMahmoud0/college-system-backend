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

const MANUAL_AMOUNT_EPSILON = 0.01;

const normalizeComparableName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const parsePositiveAmount = (value) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Number.parseFloat(parsed.toFixed(2));
};

const parseManualPaidAt = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeSemesterInput = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const supportedSemesters = {
    spring: "Spring",
    fall: "Fall",
    summer: "Summer",
    winter: "Winter",
  };

  return supportedSemesters[normalized] || null;
};

const areMoneyAmountsEqual = (left, right) =>
  Math.abs(Number(left) - Number(right)) < MANUAL_AMOUNT_EPSILON;

const buildPendingSemesterInvoiceGroups = (invoices) => {
  const groupsBySemester = new Map();

  for (const invoice of invoices) {
    const key = `${invoice.semester}-${invoice.year}`;

    if (!groupsBySemester.has(key)) {
      groupsBySemester.set(key, {
        semester: invoice.semester,
        year: invoice.year,
        invoices: [],
        totalDue: 0,
      });
    }

    const group = groupsBySemester.get(key);
    group.invoices.push(invoice);
    group.totalDue += Number.parseFloat(invoice.total_amount || 0);
  }

  return Array.from(groupsBySemester.values())
    .map((group) => ({
      ...group,
      totalDue: Number.parseFloat(group.totalDue.toFixed(2)),
    }))
    .sort((left, right) => {
      if (left.year !== right.year) {
        return right.year - left.year;
      }

      return left.semester.localeCompare(right.semester);
    });
};

const mapPendingSemesterSummary = (groups) =>
  groups.map((group) => ({
    semester: group.semester,
    year: group.year,
    invoiceCount: group.invoices.length,
    totalDue: group.totalDue,
  }));

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
  newlyPaidInvoiceIds,
}) => {
  // Get invoices that were already paid BEFORE this transaction
  const previouslyPaidSemesterTotals = await tx.invoices.aggregate({
    where: {
      student_user_id: studentId,
      semester,
      year,
      status: "paid",
      ...(newlyPaidInvoiceIds && newlyPaidInvoiceIds.length > 0
        ? { id: { notIn: newlyPaidInvoiceIds } }
        : {}),
    },
    _sum: {
      total_amount: true,
    },
    _count: {
      _all: true,
    },
  });

  // Calculate the total amount of invoices being paid in this transaction
  const newlyPaidInvoices = await tx.invoices.findMany({
    where: {
      student_user_id: studentId,
      id: { in: newlyPaidInvoiceIds || [] },
    },
    select: {
      total_amount: true,
    },
  });

  const newlyPaidAmount = newlyPaidInvoices.reduce(
    (sum, invoice) => sum + Number.parseFloat(invoice.total_amount || 0),
    0,
  );

  const cumulativeTotalAmount =
    Number.parseFloat(previouslyPaidSemesterTotals?._sum?.total_amount || 0) +
    newlyPaidAmount;
  const cumulativeInvoiceCount =
    Number.parseInt(previouslyPaidSemesterTotals?._count?._all || 0, 10) +
    (newlyPaidInvoiceIds?.length || 0);

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
      newlyPaidInvoiceIds: invoices.map((invoice) => invoice.id),
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
      newlyPaidInvoiceIds: invoices.map((invoice) => invoice.id),
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
  };
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

export const recordManualPayment = async (req, res) => {
  try {
    const {
      student_name,
      student_id,
      amount,
      date,
      semester: semesterInput,
      year: yearInput,
    } = req.body || {};

    if (!student_name || typeof student_name !== "string") {
      return res.status(400).json({
        error: "student_name is required",
      });
    }

    if (!student_id || typeof student_id !== "string") {
      return res.status(400).json({
        error: "student_id is required",
      });
    }

    const parsedAmount = parsePositiveAmount(amount);
    if (parsedAmount === null) {
      return res.status(400).json({
        error: "amount must be a positive number",
      });
    }

    const paidAt = parseManualPaidAt(date);
    if (!paidAt) {
      return res.status(400).json({
        error: "date must be a valid ISO date or datetime",
      });
    }

    const hasSemesterInput =
      semesterInput !== undefined || yearInput !== undefined;
    const normalizedSemester =
      semesterInput === undefined
        ? null
        : normalizeSemesterInput(semesterInput);
    const parsedYear =
      yearInput === undefined ? null : Number.parseInt(yearInput, 10);

    if (hasSemesterInput) {
      if (!normalizedSemester) {
        return res.status(400).json({
          error: "semester must be one of: Spring, Fall, Summer, Winter",
        });
      }

      if (!Number.isInteger(parsedYear)) {
        return res.status(400).json({
          error: "year must be a valid integer when semester is provided",
        });
      }
    }

    const studentProfile = await prisma.student_profiles.findUnique({
      where: {
        student_id: student_id.trim(),
      },
      select: {
        student_id: true,
        user_id: true,
        users: {
          select: {
            full_name: true,
          },
        },
      },
    });

    if (!studentProfile) {
      return res.status(404).json({
        error: "Student not found",
      });
    }

    const providedName = normalizeComparableName(student_name);
    const storedName = normalizeComparableName(studentProfile.users?.full_name);

    if (!providedName || providedName !== storedName) {
      return res.status(400).json({
        error: "student_name does not match the provided student_id",
      });
    }

    const pendingInvoices = await prisma.invoices.findMany({
      where: {
        student_user_id: studentProfile.user_id,
        status: "pending",
      },
      orderBy: [{ year: "desc" }, { id: "asc" }],
    });

    if (pendingInvoices.length === 0) {
      return res.status(404).json({
        error: "No pending invoices found for this student",
      });
    }

    const pendingGroups = buildPendingSemesterInvoiceGroups(pendingInvoices);

    let targetGroup = null;

    if (hasSemesterInput) {
      targetGroup = pendingGroups.find(
        (group) =>
          group.semester === normalizedSemester && group.year === parsedYear,
      );

      if (!targetGroup) {
        return res.status(404).json({
          error: `No pending invoices found for ${normalizedSemester} ${parsedYear}`,
          pendingSemesters: mapPendingSemesterSummary(pendingGroups),
        });
      }

      if (!areMoneyAmountsEqual(targetGroup.totalDue, parsedAmount)) {
        return res.status(400).json({
          error: `amount does not match pending total for ${normalizedSemester} ${parsedYear}`,
          expectedAmount: targetGroup.totalDue,
          pendingSemesters: mapPendingSemesterSummary(pendingGroups),
        });
      }
    } else {
      const currentSemester = await getCurrentSemester();
      if (currentSemester) {
        const currentSemesterGroup = pendingGroups.find(
          (group) =>
            group.semester === currentSemester.semester &&
            group.year === currentSemester.year,
        );

        if (
          currentSemesterGroup &&
          areMoneyAmountsEqual(currentSemesterGroup.totalDue, parsedAmount)
        ) {
          targetGroup = currentSemesterGroup;
        }
      }

      if (!targetGroup) {
        const matchedGroups = pendingGroups.filter((group) =>
          areMoneyAmountsEqual(group.totalDue, parsedAmount),
        );

        if (matchedGroups.length === 1) {
          [targetGroup] = matchedGroups;
        } else if (matchedGroups.length > 1) {
          return res.status(409).json({
            error:
              "Multiple semesters have the same pending total. Provide semester and year to disambiguate.",
            pendingSemesters: mapPendingSemesterSummary(matchedGroups),
          });
        }
      }
    }

    if (!targetGroup) {
      return res.status(400).json({
        error:
          "amount does not match any pending semester total for this student",
        pendingSemesters: mapPendingSemesterSummary(pendingGroups),
      });
    }

    const transactionId = `manual_${studentProfile.user_id}_${Date.now()}`;

    await prisma.$transaction(async (tx) => {
      await tx.invoices.updateMany({
        where: {
          student_user_id: studentProfile.user_id,
          id: { in: targetGroup.invoices.map((invoice) => invoice.id) },
        },
        data: {
          status: "paid",
          payment_date: paidAt,
        },
      });

      for (const invoice of targetGroup.invoices) {
        await tx.payments.create({
          data: {
            invoice_id: invoice.id,
            gateway: "manual",
            transaction_id: `${transactionId}:${invoice.id}`,
            amount: toMoneyString(invoice.total_amount),
            status: "paid",
          },
        });
      }

      await createOrUpdateStudentPaymentRecord({
        tx,
        studentId: studentProfile.user_id,
        semester: targetGroup.semester,
        year: targetGroup.year,
        gateway: "manual",
        transactionId,
        paidAt,
        newlyPaidInvoiceIds: targetGroup.invoices.map((invoice) => invoice.id),
      });
    });

    return res.status(201).json({
      message: "Manual payment recorded successfully",
      student: {
        student_id: studentProfile.student_id,
        student_user_id: studentProfile.user_id,
        full_name: studentProfile.users.full_name,
      },
      semester: targetGroup.semester,
      year: targetGroup.year,
      invoiceIds: targetGroup.invoices.map((invoice) => invoice.id),
      invoiceCount: targetGroup.invoices.length,
      totalAmount: targetGroup.totalDue,
      gateway: "manual",
      transactionId,
      paidAt,
    });
  } catch (err) {
    logger.error("Error recording manual payment:", err);
    logger.error("Manual payment error details:", {
      error: err.message,
      stack: err.stack,
      code: err.code,
      meta: err.meta,
    });
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
    const result = await verifyAndMarkPaymobSemesterPayment({
      studentId,
      transactionId: String(transactionId),
      orderId,
    });

    return res.status(result.status).json(result.body);
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

export const handlePaymobWebhook = async (req, res) => {
  try {
    const normalizedPayload = normalizePaymobWebhookPayload(req.body || {});

    if (!normalizedPayload.transactionId) {
      return res.status(400).json({
        error: "Unable to resolve transactionId from Paymob webhook payload",
      });
    }

    if (!validatePaymobConfig()) {
      return res.status(500).json({
        error: "Paymob is not configured on the server",
      });
    }

    const authToken = await getPaymobAuthToken();
    const transaction = await getPaymobTransaction({
      authToken,
      transactionId: normalizedPayload.transactionId,
    });

    const merchantOrderId =
      transaction?.order?.merchant_order_id ||
      normalizedPayload.merchantOrderId ||
      null;

    const studentId = extractStudentIdFromMerchantOrderId(merchantOrderId);
    if (!studentId) {
      return res.status(400).json({
        error: "Unable to resolve student id from merchant_order_id",
        merchantOrderId,
      });
    }

    const result = await verifyAndMarkPaymobSemesterPayment({
      studentId,
      transactionId: normalizedPayload.transactionId,
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
              newlyPaidInvoiceIds: invoices.map((invoice) => invoice.id),
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
