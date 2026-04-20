export default {
  paths: {
    "/payments/invoices/me": {
      get: {
        tags: ["Payments"],
        summary: "Get my invoices",
        description:
          "Returns current user's invoices, grouped-by-semester view, summary totals, and current registration/payment period status.",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "query",
            name: "status",
            required: false,
            schema: {
              type: "string",
              enum: ["pending", "paid", "failed", "refunded"],
            },
          },
        ],
        responses: {
          200: {
            description: "Invoices retrieved",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MyInvoicesResponse",
                },
              },
            },
          },
          400: { description: "Invalid status filter" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/payments/me": {
      get: {
        tags: ["Payments"],
        summary: "Get my semester payment history",
        description:
          "Returns semester-level payment records from student_payments for the authenticated student/leader.",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Payment history retrieved",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MyPaymentsResponse",
                },
              },
            },
          },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/payments/manual": {
      post: {
        tags: ["Payments"],
        summary: "Record manual student payment",
        description:
          "Allows admin/super_admin to record an offline/manual payment for a student, mark matching pending invoices as paid, and create/update a student_payments semester record.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ManualPaymentRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Manual payment recorded",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ManualPaymentResponse",
                },
              },
            },
          },
          400: { description: "Validation error" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Student or pending invoices not found" },
          409: {
            description:
              "Multiple semesters match the same amount; provide semester/year",
          },
          500: { description: "Internal server error" },
        },
      },
    },
    "/payments/invoices/paypal-order": {
      post: {
        tags: ["Payments"],
        summary: "Create PayPal order for all pending semester invoices",
        description:
          "Creates one PayPal order that covers ALL pending invoices in the active semester payment period. Partial or per-invoice payments are not supported.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PayAllRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "PayPal order created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateSemesterPayPalOrderResponse",
                },
              },
            },
          },
          400: { description: "Invalid request body" },
          401: { description: "Unauthorized" },
          403: {
            description: "Payment period is closed",
          },
          404: { description: "No pending invoices found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/payments/invoices/paymob-order": {
      post: {
        tags: ["Payments"],
        summary: "Create Paymob checkout for all pending semester invoices",
        description:
          "Creates one Paymob checkout session that covers ALL pending invoices in the active semester payment period. Partial or per-invoice payments are not supported.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PayAllRequest",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Paymob checkout created",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateSemesterPaymobOrderResponse",
                },
              },
            },
          },
          400: { description: "Invalid request body" },
          401: { description: "Unauthorized" },
          403: {
            description: "Payment period is closed",
          },
          404: { description: "No pending invoices found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/payments/invoices/capture": {
      post: {
        tags: ["Payments"],
        summary: "Capture PayPal semester payment",
        description:
          "Captures a previously created PayPal order and marks all pending invoices in the active semester payment period as paid. Also creates/updates a student_payments record.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CaptureSemesterPayPalRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Semester payment captured",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CaptureSemesterPayPalResponse",
                },
              },
            },
          },
          400: {
            description: "Capture failed, invalid order, or order not approved",
          },
          401: { description: "Unauthorized" },
          403: {
            description: "Payment period is closed",
          },
          404: { description: "No pending invoices found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/payments/invoices/paymob-verify": {
      post: {
        tags: ["Payments"],
        summary: "Verify Paymob semester payment",
        description:
          "Verifies a Paymob transaction for all pending invoices in the active semester payment period, then marks them as paid and creates/updates a student_payments record. Provide transactionId directly, or provide orderId/merchantOrderId so the backend resolves the latest transaction using Paymob transaction inquiry.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/VerifySemesterPaymobRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Semester payment verified",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/VerifySemesterPaymobResponse",
                },
              },
            },
          },
          400: {
            description: "Verification failed or invalid request",
          },
          401: { description: "Unauthorized" },
          403: {
            description: "Payment period is closed",
          },
          404: { description: "No pending invoices found" },
          500: { description: "Internal server error" },
        },
      },
    },
    "/payments/invoices/paymob-webhook": {
      post: {
        tags: ["Payments"],
        summary: "Handle Paymob payment webhook",
        description:
          "Receives a Paymob webhook payload, resolves the transaction id (typically from obj.id), verifies the transaction with Paymob, then marks all matching pending semester invoices as paid.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaymobWebhookRequest",
              },
            },
          },
        },
        responses: {
          200: {
            description: "Webhook processed successfully",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/PaymobWebhookResponse",
                },
              },
            },
          },
          400: {
            description: "Invalid webhook payload or verification failure",
          },
          500: { description: "Internal server error" },
        },
      },
    },
  },
  schemas: {
    PeriodInfo: {
      type: "object",
      properties: {
        isOpen: { type: "boolean", example: true },
        semester: { type: "string", nullable: true, example: "Fall" },
        year: { type: "integer", nullable: true, example: 2026 },
        startDate: {
          type: "string",
          nullable: true,
          description: "Start date from *_start event_date.",
          example: "2026-08-16",
        },
        endDate: {
          type: "string",
          nullable: true,
          description:
            "End date from *_end event_date, or fallback to *_start.end_date when no explicit *_end event exists.",
          example: "2026-09-01",
        },
        nextOpenDate: {
          type: "string",
          nullable: true,
          example: null,
        },
      },
    },
    PaymentItem: {
      type: "object",
      properties: {
        id: { type: "integer" },
        gateway: {
          type: "string",
          enum: ["paypal", "paymob", "manual"],
        },
        transaction_id: { type: "string" },
        amount: { type: "number", example: 900 },
        status: { type: "string", example: "paid" },
        created_at: { type: "string", format: "date-time" },
      },
    },
    AdminPaymentCardsResponse: {
      type: "object",
      properties: {
        cards: {
          type: "object",
          properties: {
            outstandingBalance: { type: "number", example: 125400.5 },
            collectedThisSemester: { type: "number", example: 750200 },
            overduePaymentsPercentage: { type: "number", example: 12 },
          },
        },
        meta: {
          type: "object",
          properties: {
            unpaidInvoices: { type: "integer", example: 45 },
            overdueInvoices: { type: "integer", example: 6 },
            overdueThresholdDays: { type: "integer", example: 30 },
            semester: { type: "string", nullable: true, example: "Spring" },
            year: { type: "integer", nullable: true, example: 2026 },
            refreshedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    AdminStudentPaymentRow: {
      type: "object",
      properties: {
        id: { type: "integer" },
        invoice_id: { type: "integer" },
        student_user_id: { type: "string", format: "uuid", nullable: true },
        student_id: { type: "string", nullable: true, example: "202400123" },
        student_name: {
          type: "string",
          nullable: true,
          example: "Sarah Johnson",
        },
        semester: { type: "string", nullable: true, example: "Fall" },
        year: { type: "integer", nullable: true, example: 2026 },
        course_code: { type: "string", nullable: true, example: "CS201" },
        payment_method: {
          type: "string",
          enum: ["paypal", "paymob", "manual"],
        },
        gateway: {
          type: "string",
          enum: ["paypal", "paymob", "manual"],
        },
        transaction_id: { type: "string" },
        invoice_transaction_id: {
          type: "string",
          nullable: true,
          description:
            "Raw transaction_id stored in payments table (can include invoice suffix).",
        },
        amount: { type: "number", example: 2500 },
        status: {
          type: "string",
          enum: ["pending", "paid", "failed", "refunded"],
        },
        date: { type: "string", format: "date-time", nullable: true },
        created_at: { type: "string", format: "date-time", nullable: true },
      },
    },
    AdminStudentPaymentsTableResponse: {
      type: "object",
      properties: {
        transaction_id: {
          type: "string",
          example: "manual_8f66a5e1-62b4-45be-b80f-927ecf8e8fb0_1774089894200",
        },
        total: { type: "integer", example: 120 },
        count: { type: "integer", example: 20 },
        payments: {
          type: "array",
          items: { $ref: "#/components/schemas/AdminStudentPaymentRow" },
        },
        refreshedAt: { type: "string", format: "date-time" },
      },
    },
    AdminStudentPaymentsResponse: {
      type: "object",
      properties: {
        total: { type: "integer", example: 120 },
        count: { type: "integer", example: 20 },
        filters: {
          type: "object",
          properties: {
            date: { type: "string", nullable: true, example: "2026-04-17" },
            payMethod: {
              type: "string",
              nullable: true,
              enum: ["paypal", "paymob", "manual"],
            },
            status: {
              type: "string",
              nullable: true,
              enum: ["pending", "paid", "failed", "refunded"],
            },
            limit: { type: "integer", example: 20 },
          },
        },
        payments: {
          type: "array",
          items: { $ref: "#/components/schemas/StudentPaymentItem" },
        },
        refreshedAt: { type: "string", format: "date-time" },
      },
    },
    ManualPaymentRequest: {
      type: "object",
      required: ["student_name", "student_id", "amount", "date"],
      properties: {
        student_name: {
          type: "string",
          example: "Sara Mohamed",
        },
        student_id: {
          type: "string",
          example: "202400123",
        },
        amount: {
          type: "number",
          description:
            "Expected pending semester total that should be marked as paid.",
          example: 900,
        },
        date: {
          type: "string",
          format: "date-time",
          description: "Manual payment date/time.",
          example: "2026-04-14T10:00:00.000Z",
        },
        semester: {
          type: "string",
          enum: ["Spring", "Fall", "Summer", "Winter"],
          description:
            "Optional disambiguation when multiple pending semesters exist.",
        },
        year: {
          type: "integer",
          description:
            "Optional disambiguation when multiple pending semesters exist.",
          example: 2026,
        },
      },
    },
    ManualPaymentStudent: {
      type: "object",
      properties: {
        student_id: { type: "string", example: "202400123" },
        student_user_id: { type: "string", format: "uuid" },
        full_name: { type: "string", example: "Sara Mohamed" },
      },
    },
    PendingSemesterSummary: {
      type: "object",
      properties: {
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
        invoiceCount: { type: "integer", example: 3 },
        totalDue: { type: "number", example: 900 },
      },
    },
    ManualPaymentResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Manual payment recorded successfully",
        },
        student: {
          $ref: "#/components/schemas/ManualPaymentStudent",
        },
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
        invoiceIds: {
          type: "array",
          items: { type: "integer" },
        },
        invoiceCount: { type: "integer", example: 3 },
        totalAmount: { type: "number", example: 900 },
        gateway: {
          type: "string",
          enum: ["manual"],
        },
        transactionId: {
          type: "string",
          example: "manual_8f66a5e1-62b4-45be-b80f-927ecf8e8fb0_1774089894200",
        },
        paidAt: {
          type: "string",
          format: "date-time",
        },
        pendingSemesters: {
          type: "array",
          items: {
            $ref: "#/components/schemas/PendingSemesterSummary",
          },
          description:
            "Returned only on error responses where amount matching/disambiguation is required.",
        },
      },
    },
    InvoiceItem: {
      type: "object",
      properties: {
        id: { type: "integer" },
        student_user_id: { type: "string", format: "uuid" },
        enrollment_id: { type: "integer", nullable: true },
        course_code: { type: "string", example: "CS201" },
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
        credit_hours: { type: "integer", example: 3 },
        credit_price: { type: "number", example: 300 },
        total_amount: { type: "number", example: 900 },
        status: {
          type: "string",
          enum: ["pending", "paid", "failed", "refunded"],
        },
        paypal_order_id: { type: "string", nullable: true },
        payment_date: {
          type: "string",
          format: "date-time",
          nullable: true,
        },
        created_at: {
          type: "string",
          format: "date-time",
          nullable: true,
        },
        updated_at: {
          type: "string",
          format: "date-time",
          nullable: true,
        },
        payments: {
          type: "array",
          items: { $ref: "#/components/schemas/PaymentItem" },
        },
      },
    },
    GroupedInvoiceSummary: {
      type: "object",
      properties: {
        totalInvoices: { type: "integer", example: 3 },
        pendingInvoices: { type: "integer", example: 2 },
        totalDue: { type: "number", example: 1800 },
      },
    },
    GroupedInvoiceItem: {
      type: "object",
      properties: {
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
        invoices: {
          type: "array",
          items: { $ref: "#/components/schemas/InvoiceItem" },
        },
        summary: {
          $ref: "#/components/schemas/GroupedInvoiceSummary",
        },
      },
    },
    MyInvoicesResponse: {
      type: "object",
      properties: {
        invoices: {
          type: "array",
          items: { $ref: "#/components/schemas/InvoiceItem" },
        },
        groupedInvoices: {
          type: "array",
          items: {
            $ref: "#/components/schemas/GroupedInvoiceItem",
          },
        },
        summary: {
          $ref: "#/components/schemas/GroupedInvoiceSummary",
        },
        registrationPeriod: {
          $ref: "#/components/schemas/PeriodInfo",
        },
        paymentPeriod: {
          $ref: "#/components/schemas/PeriodInfo",
        },
      },
    },
    PayAllRequest: {
      type: "object",
      required: ["payAll"],
      properties: {
        payAll: {
          type: "boolean",
          enum: [true],
          description:
            "Must be true. Paying individual invoices is no longer supported.",
          example: true,
        },
      },
    },
    CreateSemesterPayPalOrderResponse: {
      type: "object",
      properties: {
        message: { type: "string" },
        payAll: { type: "boolean", example: true },
        orderId: { type: "string", example: "8RU61172RB300401A" },
        approveUrl: {
          type: "string",
          nullable: true,
        },
        invoiceIds: {
          type: "array",
          items: { type: "integer" },
        },
        invoiceCount: { type: "integer", example: 3 },
        totalAmount: { type: "number", example: 2700 },
        currency: { type: "string", example: "USD" },
        paymentPeriod: {
          $ref: "#/components/schemas/PeriodInfo",
        },
      },
    },
    CreateSemesterPaymobOrderResponse: {
      type: "object",
      properties: {
        message: { type: "string" },
        payAll: { type: "boolean", example: true },
        orderId: { type: "integer", example: 9944332 },
        merchantOrderId: {
          type: "string",
          example: "bulk_8f66a5e1-62b4-45be-b80f-927ecf8e8fb0_1774089894200",
        },
        iframeUrl: {
          type: "string",
        },
        paymentToken: { type: "string" },
        invoiceIds: {
          type: "array",
          items: { type: "integer" },
        },
        invoiceCount: { type: "integer", example: 3 },
        totalAmount: { type: "number", example: 2700 },
        amountCents: { type: "integer", example: 270000 },
        currency: { type: "string", example: "EGP" },
        paymentPeriod: {
          $ref: "#/components/schemas/PeriodInfo",
        },
      },
    },
    CaptureSemesterPayPalRequest: {
      type: "object",
      required: ["orderId"],
      properties: {
        orderId: {
          type: "string",
          description: "PayPal order id from create-order response",
        },
      },
    },
    CaptureSemesterPayPalResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Payment captured successfully",
        },
        invoiceIds: {
          type: "array",
          items: { type: "integer" },
        },
        transactionId: {
          type: "string",
          example: "2D723339RG245992X",
        },
        status: { type: "string", example: "paid" },
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
      },
    },
    VerifySemesterPaymobRequest: {
      type: "object",
      oneOf: [
        { required: ["transactionId"] },
        { required: ["orderId"] },
        { required: ["merchantOrderId"] },
      ],
      properties: {
        transactionId: {
          type: "string",
          description:
            "Paymob transaction id. Optional when orderId or merchantOrderId is provided.",
          example: "1122334455",
        },
        orderId: {
          type: "integer",
          description:
            "Paymob order id created by this API. If transactionId is omitted, backend uses it to inquire latest transaction.",
          example: 9944332,
        },
        merchantOrderId: {
          type: "string",
          description:
            "Merchant order id created by this API (bulk_<studentId>_<timestamp>). If transactionId is omitted, backend uses it to inquire latest transaction.",
          example: "bulk_8f66a5e1-62b4-45be-b80f-927ecf8e8fb0_1774089894200",
        },
      },
    },
    VerifySemesterPaymobResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Paymob payment verified successfully",
        },
        invoiceIds: {
          type: "array",
          items: { type: "integer" },
        },
        transactionId: { type: "string", example: "1122334455" },
        orderId: { type: "integer", nullable: true, example: 9944332 },
        status: { type: "string", example: "paid" },
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
      },
    },
    PaymobWebhookRequest: {
      type: "object",
      description:
        "Raw payload sent by Paymob webhook. Transaction id is usually available at obj.id.",
      properties: {
        obj: {
          type: "object",
          properties: {
            id: {
              oneOf: [{ type: "integer" }, { type: "string" }],
              example: 1122334455,
            },
            order: {
              type: "object",
              properties: {
                id: { type: "integer", example: 9944332 },
                merchant_order_id: {
                  type: "string",
                  example:
                    "bulk_8f66a5e1-62b4-45be-b80f-927ecf8e8fb0_1774089894200",
                },
              },
            },
          },
        },
        hmac: {
          type: "string",
          nullable: true,
          description: "Optional HMAC field provided by Paymob, if configured.",
        },
      },
    },
    PaymobWebhookResponse: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Paymob payment verified successfully",
        },
        invoiceIds: {
          type: "array",
          items: { type: "integer" },
        },
        transactionId: {
          type: "string",
          example: "1122334455",
        },
        orderId: { type: "integer", nullable: true, example: 9944332 },
        status: { type: "string", example: "paid" },
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
        source: { type: "string", example: "paymob_webhook" },
        merchantOrderId: {
          type: "string",
          nullable: true,
          example: "bulk_8f66a5e1-62b4-45be-b80f-927ecf8e8fb0_1774089894200",
        },
        studentId: {
          type: "string",
          nullable: true,
          format: "uuid",
        },
        error: {
          type: "string",
          nullable: true,
        },
      },
    },
    StudentPaymentItem: {
      type: "object",
      properties: {
        id: { type: "integer" },
        student_user_id: { type: "string", format: "uuid" },
        student_name: {
          type: "string",
          nullable: true,
          example: "Sarah Johnson",
        },
        semester: { type: "string", example: "Fall" },
        year: { type: "integer", example: 2026 },
        total_amount: { type: "number", example: 2700 },
        invoice_count: { type: "integer", example: 3 },
        gateway: {
          type: "string",
          enum: ["paypal", "paymob", "manual"],
        },
        transaction_id: { type: "string" },
        status: {
          type: "string",
          nullable: true,
          enum: ["pending", "paid", "failed", "refunded"],
        },
        paid_at: { type: "string", format: "date-time" },
        created_at: {
          type: "string",
          format: "date-time",
          nullable: true,
        },
      },
    },
    MyPaymentsResponse: {
      type: "object",
      properties: {
        payments: {
          type: "array",
          items: {
            $ref: "#/components/schemas/StudentPaymentItem",
          },
        },
        summary: {
          type: "object",
          properties: {
            totalPayments: { type: "integer", example: 4 },
            totalAmountPaid: { type: "number", example: 9900 },
          },
        },
      },
    },
  },
};
