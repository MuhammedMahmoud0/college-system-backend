import { prisma } from "../config/connection.js";
import bcrypt from "bcryptjs";
import exceljs from "exceljs";

const USERS_MESSAGE = "Users processed successfully";
const STUDENTS_MESSAGE = "Students processed successfully";

const toUniqueSet = (items) => [...new Set(items)];
const toNormalizedString = (value) =>
    value === null || value === undefined ? "" : String(value).trim();

const createWorkbookFromBuffer = async (fileBuffer) => {
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
        return {
            success: false,
            status: 400,
            payload: { error: "No worksheet found in the Excel file" },
        };
    }

    return { success: true, worksheet };
};

export const countDataRowsFromExcelBuffer = async (fileBuffer) => {
    const workbookResult = await createWorkbookFromBuffer(fileBuffer);
    if (!workbookResult.success) return workbookResult;

    return {
        success: true,
        rowsCount: Math.max(0, workbookResult.worksheet.actualRowCount - 1),
    };
};

export const processExcelUsersBuffer = async (
    fileBuffer,
    { onProgress } = {}
) => {
    const workbookResult = await createWorkbookFromBuffer(fileBuffer);
    if (!workbookResult.success) return workbookResult;

    const worksheet = workbookResult.worksheet;
    const validRoles = ["doctor", "teaching_assistant", "admin", "super_admin"];
    const users = [];
    const errors = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const [nameRaw, emailRaw, passwordRaw, roleRaw] = row.values.slice(1);
        const name = toNormalizedString(nameRaw);
        const email = toNormalizedString(emailRaw);
        const password = toNormalizedString(passwordRaw);
        const role = toNormalizedString(roleRaw);

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
        return {
            success: false,
            status: 400,
            payload: { error: "No valid user data found", errors },
        };
    }

    const incomingEmails = toUniqueSet(users.map((u) => u.email));
    const existingUsers = await prisma.users.findMany({
        where: { email: { in: incomingEmails } },
        select: { email: true },
    });
    const seenEmails = new Set(existingUsers.map((u) => u.email));

    const usersToInsert = [];
    const totalUsers = users.length;
    let processedUsers = 0;

    for (const user of users) {
        processedUsers++;

        if (seenEmails.has(user.email)) {
            onProgress?.({ processed: processedUsers, total: totalUsers });
            continue;
        }

        seenEmails.add(user.email);
        const hashedPassword = await bcrypt.hash(user.password, 10);

        usersToInsert.push({
            full_name: user.name,
            email: user.email,
            password_hash: hashedPassword,
            role: user.role,
        });

        onProgress?.({ processed: processedUsers, total: totalUsers });
    }

    let insertedCount = 0;
    if (usersToInsert.length > 0) {
        const result = await prisma.users.createMany({
            data: usersToInsert,
            skipDuplicates: true,
        });
        insertedCount = result.count;
    }

    return {
        success: true,
        status: 201,
        payload: {
            message: USERS_MESSAGE,
            insertedCount,
            skippedDueToValidation: errors.length,
            errors,
        },
    };
};

export const processExcelStudentsBuffer = async (
    fileBuffer,
    { onProgress } = {}
) => {
    const workbookResult = await createWorkbookFromBuffer(fileBuffer);
    if (!workbookResult.success) return workbookResult;

    const worksheet = workbookResult.worksheet;
    const rows = [];
    const errors = [];

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;

        const [
            nameRaw,
            emailRaw,
            nationalIdRaw,
            studentIdRaw,
            departmentNameRaw,
        ] = row.values.slice(1);
        const name = toNormalizedString(nameRaw);
        const email = toNormalizedString(emailRaw);
        const nationalId = toNormalizedString(nationalIdRaw);
        const studentId = toNormalizedString(studentIdRaw);
        const departmentName = toNormalizedString(departmentNameRaw);

        if (!name || !email || !nationalId || !studentId || !departmentName) {
            errors.push({
                row: rowNumber,
                error: "Missing required fields (Name, Email, NationalId, StudentId, DepartmentName)",
            });
            return;
        }

        rows.push({ name, email, nationalId, studentId, departmentName });
    });

    if (rows.length === 0) {
        return {
            success: false,
            status: 400,
            payload: { error: "No valid student data found", errors },
        };
    }

    const uniqueDeptNames = toUniqueSet(rows.map((r) => r.departmentName));
    const departments = await prisma.departments.findMany({
        where: { name: { in: uniqueDeptNames, mode: "insensitive" } },
        select: { department_id: true, name: true },
    });
    const deptMap = new Map(
        departments.map((d) => [d.name.toLowerCase(), d.department_id])
    );

    rows.forEach((row, index) => {
        if (!deptMap.has(row.departmentName.toLowerCase())) {
            errors.push({
                row: index + 2,
                error: `Department not found: ${row.departmentName}`,
            });
        }
    });

    const validRows = rows.filter((r) =>
        deptMap.has(r.departmentName.toLowerCase())
    );

    if (validRows.length === 0) {
        return {
            success: false,
            status: 400,
            payload: { error: "No valid student data found", errors },
        };
    }

    const incomingEmails = toUniqueSet(validRows.map((r) => r.email));
    const incomingStudentIds = toUniqueSet(validRows.map((r) => r.studentId));

    const [existingUsers, existingProfiles] = await Promise.all([
        prisma.users.findMany({
            where: { email: { in: incomingEmails } },
            select: { email: true },
        }),
        prisma.student_profiles.findMany({
            where: { student_id: { in: incomingStudentIds } },
            select: { student_id: true },
        }),
    ]);

    const seenEmails = new Set(existingUsers.map((u) => u.email));
    const seenStudentIds = new Set(existingProfiles.map((p) => p.student_id));

    let insertedCount = 0;
    const totalRows = validRows.length;
    let processedRows = 0;

    for (const row of validRows) {
        processedRows++;

        if (seenEmails.has(row.email) || seenStudentIds.has(row.studentId)) {
            onProgress?.({ processed: processedRows, total: totalRows });
            continue;
        }

        const hashedPassword = await bcrypt.hash(row.nationalId, 10);

        await prisma.$transaction(
            async (tx) => {
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
            },
            { timeout: 10000 }
        );

        seenEmails.add(row.email);
        seenStudentIds.add(row.studentId);
        insertedCount++;
        onProgress?.({ processed: processedRows, total: totalRows });
    }

    return {
        success: true,
        status: 201,
        payload: {
            message: STUDENTS_MESSAGE,
            insertedCount,
            skippedDueToValidation: errors.length,
            errors,
        },
    };
};
