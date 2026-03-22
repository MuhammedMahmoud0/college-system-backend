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
    paymentController.getMyInvoices
);

router.post(
    "/invoices/:invoiceId/paypal-order",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    paymentController.createPayPalOrder
);

router.post(
    "/invoices/:invoiceId/paymob-order",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    paymentController.createPaymobOrder
);

router.post(
    "/invoices/paypal-order/bulk",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    paymentController.createPayPalOrderBulk
);

router.post(
    "/invoices/paymob-order/bulk",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    paymentController.createPaymobOrderBulk
);

router.post(
    "/invoices/:invoiceId/capture",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    paymentController.capturePayPalOrder
);

router.post(
    "/invoices/:invoiceId/paymob-verify",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    paymentController.verifyPaymobPayment
);

router.post(
    "/invoices/paymob-verify/bulk",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    paymentController.verifyPaymobPaymentBulk
);

router.post(
    "/invoices/capture/bulk",
    authMiddleware,
    authorizationMiddleware("student", "leader"),
    paymentController.capturePayPalOrderBulk
);

export default router;
