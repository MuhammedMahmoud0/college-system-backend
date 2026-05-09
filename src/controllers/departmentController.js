import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { getCache, setCache, invalidateByPattern } from "../services/cacheService.js";

// GET /api/v1/departments
export const getAllDepartments = async (req, res) => {
    try {
        const { search } = req.query;

        // Only cache the non-search version (search results may vary per query)
        const cacheKey = !search ? "v1:departments:list" : null;

        if (cacheKey) {
            const cached = await getCache(cacheKey);
            if (cached) return res.status(200).json(cached);
        }

        const departments = await prisma.departments.findMany({
            where: search
                ? { name: { contains: search, mode: "insensitive" } }
                : undefined,
            select: {
                department_id: true,
                name: true,
                _count: {
                    select: {
                        courses: true,
                        student_profiles: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        const response = { departments };

        if (cacheKey) {
            await setCache(cacheKey, response, 1800); // 30 min
        }

        res.status(200).json(response);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/v1/departments/:id
export const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `v1:departments:detail:${id}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const department = await prisma.departments.findUnique({
            where: { department_id: id },
            select: {
                department_id: true,
                name: true,
                _count: {
                    select: {
                        courses: true,
                        student_profiles: true,
                    },
                },
            },
        });

        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        await setCache(cacheKey, department, 1800); // 30 min
        res.status(200).json(department);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// POST /api/v1/departments
export const createDepartment = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res
                .status(400)
                .json({ error: "Department name is required" });
        }

        const existing = await prisma.departments.findFirst({
            where: { name: { equals: name.trim(), mode: "insensitive" } },
        });

        if (existing) {
            return res.status(409).json({ error: "Department already exists" });
        }

        const department = await prisma.departments.create({
            data: { name: name.trim() },
            select: {
                department_id: true,
                name: true,
            },
        });

        await invalidateByPattern("v1:departments:*");

        res.status(201).json(department);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PATCH /api/v1/departments/:id
export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || typeof name !== "string" || !name.trim()) {
            return res
                .status(400)
                .json({ error: "Department name is required" });
        }

        const existing = await prisma.departments.findUnique({
            where: { department_id: id },
        });

        if (!existing) {
            return res.status(404).json({ error: "Department not found" });
        }

        const duplicate = await prisma.departments.findFirst({
            where: {
                name: { equals: name.trim(), mode: "insensitive" },
                NOT: { department_id: id },
            },
        });

        if (duplicate) {
            return res
                .status(409)
                .json({
                    error: "Another department with this name already exists",
                });
        }

        const updated = await prisma.departments.update({
            where: { department_id: id },
            data: { name: name.trim() },
            select: {
                department_id: true,
                name: true,
            },
        });

        await invalidateByPattern("v1:departments:*");

        res.status(200).json(updated);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// DELETE /api/v1/departments/:id
export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.departments.findUnique({
            where: { department_id: id },
            include: {
                _count: {
                    select: { courses: true, student_profiles: true },
                },
            },
        });

        if (!existing) {
            return res.status(404).json({ error: "Department not found" });
        }

        if (
            existing._count.courses > 0 ||
            existing._count.student_profiles > 0
        ) {
            return res.status(409).json({
                error: "Cannot delete department with existing courses or students",
            });
        }

        await prisma.departments.delete({ where: { department_id: id } });

        await invalidateByPattern("v1:departments:*");

        res.status(200).json({ message: "Department deleted successfully" });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
