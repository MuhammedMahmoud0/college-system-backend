import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

export const blockIfUnpaidInvoices = async (req, res, next) => {
    try {
        if (!req.user || !["student", "leader"].includes(req.user.role)) {
            return next();
        }

        const pendingInvoices = await prisma.invoices.findMany({
            where: {
                student_user_id: req.user.id,
                status: "pending",
            },
            select: {
                id: true,
                total_amount: true,
                course_code: true,
            },
        });

        if (pendingInvoices.length === 0) {
            return next();
        }

        const totalDue = pendingInvoices.reduce(
            (sum, invoice) => sum + Number.parseFloat(invoice.total_amount),
            0
        );

        return res.status(402).json({
            error: "You have unpaid invoices. Please complete payment before continuing.",
            pendingInvoices: pendingInvoices.map((invoice) => ({
                id: invoice.id,
                course_code: invoice.course_code,
                total_amount: Number.parseFloat(invoice.total_amount),
            })),
            totalDue: Number.parseFloat(totalDue.toFixed(2)),
        });
    } catch (err) {
        logger.error("Error checking unpaid invoices:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
};
