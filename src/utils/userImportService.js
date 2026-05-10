import { prisma } from "../config/connection.js";
import bcrypt from "bcrypt";
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

    const hashResults = await Promise.all(
        users.map((user) =>
            seenEmails.has(user.email)
                ? null
                : bcrypt.hash(user.password, 12).then((hashedPassword) => ({
                      ...user,
                      hashedPassword,
                  }))
        )
    );

    let processedUsers = 0;
    for (const result of hashResults) {
        processedUsers++;

        if (!result || seenEmails.has(result.email)) {
            onProgress?.({ processed: processedUsers, total: totalUsers });
            continue;
        }

        seenEmails.add(result.email);
        usersToInsert.push({
            full_name: result.name,
            email: result.email,
            password_hash: result.hashedPassword,
            role: result.role,
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

    const rowsToProcess = validRows.filter(
        (row) => !seenEmails.has(row.email) && !seenStudentIds.has(row.studentId)
    );

    // Hash all passwords in parallel
    const hashedPasswords = await Promise.all(
        rowsToProcess.map((row) => bcrypt.hash(row.nationalId, 12))
    );

    const usersToInsert = rowsToProcess.map((row, i) => ({
        full_name: row.name,
        email: row.email,
        password_hash: hashedPasswords[i],
        role: "student",
        national_id: row.nationalId,
    }));

    if (usersToInsert.length > 0) {
        // Batch-create all users, then fetch their IDs to create profiles
        await prisma.users.createMany({
            data: usersToInsert,
            skipDuplicates: true,
        });

        const insertedUsers = await prisma.users.findMany({
            where: { email: { in: usersToInsert.map((u) => u.email) } },
            select: { id: true, email: true },
        });

        const emailToUserId = new Map(insertedUsers.map((u) => [u.email, u.id]));

        const profilesToInsert = rowsToProcess
            .filter((row) => emailToUserId.has(row.email))
            .map((row) => ({
                user_id: emailToUserId.get(row.email),
                student_id: row.studentId,
                department_id: deptMap.get(row.departmentName.toLowerCase()),
            }));

        if (profilesToInsert.length > 0) {
            await prisma.student_profiles.createMany({
                data: profilesToInsert,
                skipDuplicates: true,
            });
        }

        insertedCount = profilesToInsert.length;
    }

    onProgress?.({ processed: totalRows, total: totalRows });

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
