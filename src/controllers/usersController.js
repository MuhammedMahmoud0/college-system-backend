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
        const { name, id, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                error: "All fields (name, id, email, password, role) are required",
            });
        }
        if (role === "student" && !id) {
            return res.status(400).json({
                error: "Student ID is required for student role",
            });
        }
        const existingUser = await prisma.users.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({ error: "Email already exist" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.users.create({
            data: {
                full_name: name,
                email,
                password_hash: hashedPassword,
                role,
            },
        });
        if (role === "student") {
            await prisma.student_profiles.create({
                data: {
                    user_id: newUser.id,
                    student_id: id,
                },
            });
        }

        res.status(201).json({
            message: "User created successfully",
            userId: newUser.id,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// export const addExcelUsers = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }

//         const workbook = new exceljs.Workbook();
//         await workbook.xlsx.load(req.file.buffer);

//         const worksheet = workbook.worksheets[0];

//         if (!worksheet) {
//             return res
//                 .status(400)
//                 .json({ error: "No worksheet found in the Excel file" });
//         }

//         const rawUsers = [];
//         const errors = [];

//         worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
//             if (rowNumber === 1) return; // Skip header row

//             const [name, email, , role] = row.values.slice(1);
//             const passwordCell = row.getCell(3);
//             const password = passwordCell.text;
//             if (!name || !email || !password || !role) {
//                 errors.push({
//                     row: rowNumber,
//                     error: "Missing required fields",
//                 });
//                 return;
//             }
//             rawUsers.push({ name, email, password, role });
//         });

//         if (rawUsers.length === 0) {
//             return res.status(400).json({
//                 error: "No valid user data found in the file",
//                 errors,
//             });
//         }

//         const usersToAdd = await Promise.all(
//             rawUsers.map(async (user) => ({
//                 full_name: user.name,
//                 email: user.email,
//                 password_hash: await bcrypt.hash(user.password, 10),
//                 role: user.role,
//             }))
//         );

//         const result = await prisma.users.createMany({
//             data: usersToAdd,
//             skipDuplicates: true,
//         });

//         // res.status(201).json({
//         //     message: "Users added successfully",
//         //     addedCount: usersToAdd.length,
//         //     skippedRows: errors.length,
//         //     errors,
//         // });

//         res.status(201).json({
//             message: "Users processed successfully",
//             insertedCount: result.count,
//             totalRows: usersToAdd.length,
//             skippedDueToValidation: errors.length,
//         });
//     } catch (err) {
//         logger.error(err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

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

        const users = [];
        const errors = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const [name, email, password, role, studentId] =
                row.values.slice(1);

            if (!name || !email || !password || !role) {
                errors.push({
                    row: rowNumber,
                    error: "Missing required fields",
                });
                return;
            }

            if (role === "student" && !studentId) {
                errors.push({
                    row: rowNumber,
                    error: "Student ID required for student role",
                });
                return;
            }

            users.push({
                name,
                email,
                password,
                role,
                studentId,
            });
        });

        if (users.length === 0) {
            return res.status(400).json({
                error: "No valid user data found",
                errors,
            });
        }

        let insertedCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const user of users) {
                const existingUser = await tx.users.findUnique({
                    where: { email: user.email },
                });

                if (existingUser) continue;

                const hashedPassword = await bcrypt.hash(user.password, 10);

                const newUser = await tx.users.create({
                    data: {
                        full_name: user.name,
                        email: user.email,
                        password_hash: hashedPassword,
                        role: user.role,
                    },
                });

                if (user.role === "student") {
                    await tx.student_profiles.create({
                        data: {
                            user_id: newUser.id,
                            student_id: user.studentId,
                        },
                    });
                }

                insertedCount++;
            }
        });

        res.status(201).json({
            message: "Users processed successfully",
            insertedCount,
            skippedDueToValidation: errors.length,
            errors,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
