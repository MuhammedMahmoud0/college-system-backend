import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import {
  authMiddleware,
  authorizationMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/invoices/me",
  authMiddleware,
  authorizationMiddleware("student", "leader"),
  paymentController.getMyInvoices,
);

router.get(
  "/me",
  authMiddleware,
  authorizationMiddleware("student", "leader"),
  paymentController.getMyPayments,
);

router.get(
  "/admin/cards",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  paymentController.getAdminPaymentCards,
);

router.get(
  "/admin/student-payments",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  paymentController.getAdminStudentPaymentsTable,
);

router.post(
  "/manual",
  authMiddleware,
  authorizationMiddleware("admin", "super_admin"),
  paymentController.recordManualPayment,
);

router.post(
  "/invoices/paypal-order",
  authMiddleware,
  authorizationMiddleware("student", "leader"),
  paymentController.createPayPalOrder,
);

router.post("/invoices/paymob-webhook", paymentController.handlePaymobWebhook);

router.post(
  "/invoices/paymob-order",
  authMiddleware,
  authorizationMiddleware("student", "leader"),
  paymentController.createPaymobOrder,
);

router.post(
  "/invoices/capture",
  authMiddleware,
  authorizationMiddleware("student", "leader"),
  paymentController.capturePayPalOrder,
);

router.post(
  "/invoices/paymob-verify",
  authMiddleware,
  authorizationMiddleware("student", "leader"),
  paymentController.verifyPaymobPayment,
);

export default router;
