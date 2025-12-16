import { prisma } from "../config/connection.js";
import bcrypt from "bcryptjs";
import exceljs from "exceljs";
import logger from "../utils/logger.js";

export const getUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany({
            select: {
                id: true,
                email: true,
                role: true,
            },
        });
        res.status(200).json({ users });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const addUsers = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.users.create({
            data: {
                full_name: name,
                email,
                password_hash: hashedPassword,
                role,
            },
        });
        res.status(201).json({
            message: "User created successfully",
            userId: newUser.id,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const addExcelUsers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const workbook = new exceljs.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const worksheet = workbook.worksheets[0];

        if (!worksheet) {
            return res
                .status(400)
                .json({ error: "No worksheet found in the Excel file" });
        }

        const usersToAdd = [];
        const errors = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const [name, email, password, role] = row.values.slice(1);
            if (!name || !email || !password || !role) {
                errors.push({
                    row: rowNumber,
                    error: "Missing required fields",
                });
                return;
            }
        });
        usersToAdd.push({
            full_name: name,
            email,
            password_hash: await bcrypt.hash(password, 10),
            role,
        });

        if (usersToAdd.length === 0) {
            return res.status(400).json({
                error: "No valid user data found in the file",
                errors,
            });
        }
        await prisma.users.createMany({
            data: usersToAdd,
            skipDuplicates: true,
        });

        res.status(201).json({
            message: "Users added successfully",
            addedCount: usersToAdd.length,
            skippedRows: errors.length,
            errors,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
