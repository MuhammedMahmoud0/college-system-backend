import { prisma } from "../config/connection.js";
import bcrypt from "bcryptjs";
import exceljs from "exceljs";
import logger from "../utils/logger.js";

// ── GET /users/management/students ───────────────────────────────────────────
// Returns both students and leaders (leaders are students with elevated role).
export const getStudentsForManagement = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit) || 10)
        );
        const skip = (page - 1) * limit;

        const roleWhere = { in: ["student", "leader"] };

        const [students, total] = await prisma.$transaction([
            prisma.users.findMany({
                where: { role: roleWhere },
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    role: true,
                    avatar_url: true,
                    created_at: true,
                    student_profiles: {
                        select: {
                            student_id: true,
                            year_level: true,
                            departments: { select: { name: true } },
                        },
                    },
                },
                orderBy: { full_name: "asc" },
                skip,
                take: limit,
            }),
            prisma.users.count({ where: { role: roleWhere } }),
        ]);

        res.status(200).json({
            data: students,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ── GET /users/management/leaders ────────────────────────────────────────────
// Returns all batch representatives (role = "leader").
export const getLeaders = async (req, res) => {
    try {
        const leaders = await prisma.users.findMany({
            where: { role: "leader" },
            select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
                created_at: true,
                student_profiles: {
                    select: {
                        student_id: true,
                        year_level: true,
                        departments: {
                            select: { department_id: true, name: true },
                        },
                    },
                },
            },
            orderBy: [
                { student_profiles: { year_level: "asc" } },
                { full_name: "asc" },
            ],
        });

        res.status(200).json({ leaders });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ── PATCH /users/students/:id/role ────────────────────────────────────────────
// Promotes a student to leader or demotes a leader back to student.
export const setStudentRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role || !["student", "leader"].includes(role)) {
            return res.status(400).json({
                error: 'role must be either "student" or "leader"',
            });
        }

        const user = await prisma.users.findUnique({
            where: { id },
            select: { id: true, role: true, full_name: true },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!["student", "leader"].includes(user.role)) {
            return res.status(400).json({
                error: "Only students or leaders can have their role changed with this endpoint",
            });
        }

        if (user.role === role) {
            return res.status(400).json({
                error: `User is already a ${role}`,
            });
        }

        const updated = await prisma.users.update({
            where: { id },
            data: { role },
            select: { id: true, full_name: true, email: true, role: true },
        });

        res.status(200).json({
            message: `User role updated to ${role} successfully`,
            user: updated,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ── GET /users/management/staff ───────────────────────────────────────────────
export const getStaffForManagement = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit) || 10)
        );
        const skip = (page - 1) * limit;

        const validRoles = ["doctor", "teaching_assistant"];
        const roleFilter = req.query.role;
        const roleWhere = validRoles.includes(roleFilter)
            ? roleFilter
            : { in: validRoles };

        const [staffRaw, total] = await prisma.$transaction([
            prisma.users.findMany({
                where: { role: roleWhere },
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    role: true,
                    avatar_url: true,
                    created_at: true,
                    lectures: {
                        select: {
                            offering_id: true,
                            course_offerings: {
                                select: {
                                    courses: {
                                        select: {
                                            departments: {
                                                select: { name: true },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    tutorials_labs: {
                        select: { offering_id: true },
                    },
                },
                orderBy: { full_name: "asc" },
                skip,
                take: limit,
            }),
            prisma.users.count({ where: { role: roleWhere } }),
        ]);

        const data = staffRaw.map(
            ({ lectures, tutorials_labs, ...member }) => ({
                ...member,
                department:
                    lectures[0]?.course_offerings?.courses?.departments?.name ??
                    null,
                courses_count: new Set([
                    ...lectures.map((l) => l.offering_id),
                    ...tutorials_labs.map((t) => t.offering_id),
                ]).size,
            })
        );

        res.status(200).json({
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ── GET /users ───────────────────────────────────────────────────────────────
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

// ── POST /users ─────────────────────────────────────────────────────────────
// Creates a non-student user (doctor, teaching_assistant, admin, super_admin).
export const addUsers = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                error: "All fields (name, email, password, role) are required",
            });
        }

        if (role === "student") {
            return res.status(400).json({
                error: "Use POST /users/students to create student accounts",
            });
        }

        const validRoles = [
            "doctor",
            "teaching_assistant",
            "admin",
            "super_admin",
        ];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const existingUser = await prisma.users.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(409).json({ error: "Email already exists" });
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

        res.status(201).json({
            message: "User created successfully",
            userId: newUser.id,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ── POST /users/students ──────────────────────────────────────────────────────
// Creates a student user. Password is derived from national_id.
export const addStudent = async (req, res) => {
    try {
        const { name, email, national_id, student_id, department_id } =
            req.body;

        if (!name || !email || !national_id || !student_id || !department_id) {
            return res.status(400).json({
                error: "All fields (name, email, national_id, student_id, department_id) are required",
            });
        }

        const [existingEmail, existingStudentId, department] =
            await Promise.all([
                prisma.users.findUnique({ where: { email } }),
                prisma.student_profiles.findUnique({ where: { student_id } }),
                prisma.departments.findUnique({ where: { department_id } }),
            ]);

        if (existingEmail) {
            return res.status(409).json({ error: "Email already exists" });
        }
        if (existingStudentId) {
            return res.status(409).json({ error: "Student ID already exists" });
        }
        if (!department) {
            return res.status(404).json({ error: "Department not found" });
        }

        const hashedPassword = await bcrypt.hash(national_id, 10);

        const newUser = await prisma.users.create({
            data: {
                full_name: name,
                email,
                password_hash: hashedPassword,
                role: "student",
                national_id,
            },
        });

        await prisma.student_profiles.create({
            data: {
                user_id: newUser.id,
                student_id,
                department_id,
            },
        });

        res.status(201).json({
            message: "Student created successfully",
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

// ── POST /users/upload-excel ──────────────────────────────────────────────────
// Bulk-creates non-student users from an Excel file.
// Expected columns: Name | Email | Password | Role
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

        const validRoles = [
            "doctor",
            "teaching_assistant",
            "admin",
            "super_admin",
        ];
        const users = [];
        const errors = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const [name, email, password, role] = row.values.slice(1);

            if (!name || !email || !password || !role) {
                errors.push({
                    row: rowNumber,
                    error: "Missing required fields (Name, Email, Password, Role)",
                });
                return;
            }

            if (role === "student") {
                errors.push({
                    row: rowNumber,
                    error: "Use the students Excel endpoint for student accounts",
                });
                return;
            }

            if (!validRoles.includes(role)) {
                errors.push({ row: rowNumber, error: `Invalid role: ${role}` });
                return;
            }

            users.push({ name, email, password, role });
        });

        if (users.length === 0) {
            return res
                .status(400)
                .json({ error: "No valid user data found", errors });
        }

        let insertedCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const user of users) {
                const existing = await tx.users.findUnique({
                    where: { email: user.email },
                });
                if (existing) continue;

                const hashedPassword = await bcrypt.hash(user.password, 10);
                await tx.users.create({
                    data: {
                        full_name: user.name,
                        email: user.email,
                        password_hash: hashedPassword,
                        role: user.role,
                    },
                });
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

// ── POST /users/upload-excel/students ────────────────────────────────────────
// Bulk-creates student users from an Excel file.
// Expected columns: Name | Email | NationalId | StudentId | DepartmentName
// Password is set to the national ID value.
export const addExcelStudents = async (req, res) => {
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

        const rows = [];
        const errors = [];

        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header

            const [name, email, nationalId, studentId, departmentName] =
                row.values.slice(1);

            if (
                !name ||
                !email ||
                !nationalId ||
                !studentId ||
                !departmentName
            ) {
                errors.push({
                    row: rowNumber,
                    error: "Missing required fields (Name, Email, NationalId, StudentId, DepartmentName)",
                });
                return;
            }

            rows.push({ name, email, nationalId, studentId, departmentName });
        });

        if (rows.length === 0) {
            return res
                .status(400)
                .json({ error: "No valid student data found", errors });
        }

        // Pre-load all referenced departments in one query
        const uniqueDeptNames = [...new Set(rows.map((r) => r.departmentName))];
        const departments = await prisma.departments.findMany({
            where: { name: { in: uniqueDeptNames, mode: "insensitive" } },
            select: { department_id: true, name: true },
        });
        const deptMap = new Map(
            departments.map((d) => [d.name.toLowerCase(), d.department_id])
        );

        // Validate department names
        for (const row of rows) {
            if (!deptMap.has(row.departmentName.toLowerCase())) {
                errors.push({
                    row: rows.indexOf(row) + 2,
                    error: `Department not found: ${row.departmentName}`,
                });
            }
        }

        const validRows = rows.filter((r) =>
            deptMap.has(r.departmentName.toLowerCase())
        );

        if (validRows.length === 0) {
            return res
                .status(400)
                .json({ error: "No valid student data found", errors });
        }

        let insertedCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const row of validRows) {
                const [existingEmail, existingStudentId] = await Promise.all([
                    tx.users.findUnique({ where: { email: row.email } }),
                    tx.student_profiles.findUnique({
                        where: { student_id: row.studentId },
                    }),
                ]);

                if (existingEmail || existingStudentId) continue;

                const hashedPassword = await bcrypt.hash(row.nationalId, 10);

                const newUser = await tx.users.create({
                    data: {
                        full_name: row.name,
                        email: row.email,
                        password_hash: hashedPassword,
                        role: "student",
                        national_id: row.nationalId,
                    },
                });

                await tx.student_profiles.create({
                    data: {
                        user_id: newUser.id,
                        student_id: row.studentId,
                        department_id: deptMap.get(
                            row.departmentName.toLowerCase()
                        ),
                    },
                });

                insertedCount++;
            }
        });

        res.status(201).json({
            message: "Students processed successfully",
            insertedCount,
            skippedDueToValidation: errors.length,
            errors,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
