import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

const parseCreditPrice = (creditPrice) => {
    const parsed = Number.parseFloat(creditPrice);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }
    return parsed.toFixed(2);
};

export const getAllFinancials = async (req, res) => {
    try {
        const { departmentId } = req.query;
        const cacheKey = departmentId
            ? `v1:financials:by-dept:${departmentId}`
            : "v1:financials:list";

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const financials = await prisma.financials.findMany({
            where: departmentId ? { department_id: departmentId } : undefined,
            include: {
                departments: {
                    select: {
                        department_id: true,
                        name: true,
                    },
                },
            },
            orderBy: { id: "asc" },
        });

        const response = {
            financials: financials.map((item) => ({
                ...item,
                credit_price: Number.parseFloat(item.credit_price),
            })),
        };

        await setCache(cacheKey, response, 3600); // 1 hour
        res.status(200).json(response);
    } catch (err) {
        logger.error("Error getting financials:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFinancialById = async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Invalid financial id" });
        }

        const cacheKey = `v1:financials:detail:${id}`;
        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const financial = await prisma.financials.findUnique({
            where: { id },
            include: {
                departments: {
                    select: {
                        department_id: true,
                        name: true,
                    },
                },
            },
        });

        if (!financial) {
            return res
                .status(404)
                .json({ error: "Financial record not found" });
        }

        const response = {
            ...financial,
            credit_price: Number.parseFloat(financial.credit_price),
        };

        await setCache(cacheKey, response, 3600); // 1 hour
        res.status(200).json(response);
    } catch (err) {
        logger.error("Error getting financial by id:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createFinancial = async (req, res) => {
    try {
        const { department_id, credit_price } = req.body;

        if (!department_id) {
            return res.status(400).json({ error: "department_id is required" });
        }

        const parsedCreditPrice = parseCreditPrice(credit_price);
        if (!parsedCreditPrice) {
            return res
                .status(400)
                .json({ error: "credit_price must be a positive number" });
        }

        const department = await prisma.departments.findUnique({
            where: { department_id },
        });

        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        const existing = await prisma.financials.findUnique({
            where: { department_id },
        });

        if (existing) {
            return res.status(409).json({
                error: "Financial record already exists for this department",
            });
        }

        const created = await prisma.financials.create({
            data: {
                department_id,
                credit_price: parsedCreditPrice,
            },
            include: {
                departments: {
                    select: {
                        department_id: true,
                        name: true,
                    },
                },
            },
        });

        await invalidateByPattern("v1:financials:*");

        res.status(201).json({
            ...created,
            credit_price: Number.parseFloat(created.credit_price),
        });
    } catch (err) {
        logger.error("Error creating financial:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateFinancial = async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Invalid financial id" });
        }

        const { credit_price } = req.body;
        const parsedCreditPrice = parseCreditPrice(credit_price);

        if (!parsedCreditPrice) {
            return res
                .status(400)
                .json({ error: "credit_price must be a positive number" });
        }

        const existing = await prisma.financials.findUnique({ where: { id } });
        if (!existing) {
            return res
                .status(404)
                .json({ error: "Financial record not found" });
        }

        const updated = await prisma.financials.update({
            where: { id },
            data: { credit_price: parsedCreditPrice },
            include: {
                departments: {
                    select: {
                        department_id: true,
                        name: true,
                    },
                },
            },
        });

        await invalidateByPattern("v1:financials:*");

        res.status(200).json({
            ...updated,
            credit_price: Number.parseFloat(updated.credit_price),
        });
    } catch (err) {
        logger.error("Error updating financial:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deleteFinancial = async (req, res) => {
    try {
        const id = Number.parseInt(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ error: "Invalid financial id" });
        }

        const existing = await prisma.financials.findUnique({ where: { id } });
        if (!existing) {
            return res
                .status(404)
                .json({ error: "Financial record not found" });
        }

        await prisma.financials.delete({ where: { id } });

        await invalidateByPattern("v1:financials:*");

        res.status(200).json({
            message: "Financial record deleted successfully",
        });
    } catch (err) {
        logger.error("Error deleting financial:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
