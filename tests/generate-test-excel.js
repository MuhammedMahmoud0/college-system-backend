/**
 * Generates two test Excel files for the bulk-upload endpoints:
 *
 *  1. test-staff.xlsx        → POST /api/v1/users/upload-excel
 *     Columns: Name | Email | Password | Role
 *
 *  2. test-students.xlsx     → POST /api/v1/users/upload-excel/students
 *     Columns: Name | Email | NationalId | StudentId | DepartmentName
 *
 * Run:  node tests/generate-test-excel.js
 */

import ExcelJS from "exceljs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── helpers ────────────────────────────────────────────────────────────────
function styleHeader(row) {
    row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2F5496" },
        };
        cell.alignment = { horizontal: "center" };
    });
}

function autoWidth(sheet) {
    sheet.columns.forEach((col) => {
        let max = col.header ? col.header.length : 10;
        col.eachCell({ includeEmpty: false }, (cell) => {
            const len = cell.value ? String(cell.value).length : 0;
            if (len > max) max = len;
        });
        col.width = max + 4;
    });
}

// ─── 1. Staff file ──────────────────────────────────────────────────────────
async function generateStaffFile() {
    const wb = new ExcelJS.Workbook();
    wb.creator = "College System";
    const ws = wb.addWorksheet("Staff");

    ws.columns = [
        { header: "Name", key: "name" },
        { header: "Email", key: "email" },
        { header: "Password", key: "password" },
        { header: "Role", key: "role" },
    ];

    styleHeader(ws.getRow(1));

    const rows = [
        // ── valid rows ──────────────────────────────────────────────────
        {
            name: "Dr. Ahmed Hassan",
            email: "ahmed.hassan.test@example.edu",
            password: "Pass@1234",
            role: "doctor",
        },
        {
            name: "Dr. Fatma Nour",
            email: "fatma.nour.test@example.edu",
            password: "Pass@1234",
            role: "doctor",
        },
        {
            name: "Omar Ibrahim",
            email: "omar.ibrahim.test@example.edu",
            password: "Pass@1234",
            role: "teaching_assistant",
        },
        {
            name: "Nada Samir",
            email: "nada.samir.test@example.edu",
            password: "Pass@1234",
            role: "teaching_assistant",
        },
        {
            name: "Karim Adel",
            email: "karim.adel.test@example.edu",
            password: "Pass@1234",
            role: "admin",
        },
        // ── duplicate email (should be skipped) ─────────────────────────
        {
            name: "Dr. Ahmed Hassan Dup",
            email: "ahmed.hassan.test@example.edu",
            password: "Pass@1234",
            role: "doctor",
        },
        // ── missing role (should be skipped) ────────────────────────────
        {
            name: "No Role User",
            email: "no.role.test@example.edu",
            password: "Pass@1234",
            role: "",
        },
        // ── student row (should be rejected) ────────────────────────────
        {
            name: "Student Wrong File",
            email: "student.wrong.test@example.edu",
            password: "Pass@1234",
            role: "student",
        },
    ];

    rows.forEach((r) => ws.addRow(r));
    autoWidth(ws);

    const out = path.join(__dirname, "test-staff.xlsx");
    await wb.xlsx.writeFile(out);
    console.log(`✔  Created: ${out}`);
    console.log(
        `   Expected: 5 inserted, 3 skipped (1 duplicate, 1 no role, 1 student row)`
    );
}

// ─── 2. Students file ───────────────────────────────────────────────────────
async function generateStudentsFile() {
    const wb = new ExcelJS.Workbook();
    wb.creator = "College System";
    const ws = wb.addWorksheet("Students");

    ws.columns = [
        { header: "Name", key: "name" },
        { header: "Email", key: "email" },
        { header: "NationalId", key: "nationalId" },
        { header: "StudentId", key: "studentId" },
        { header: "DepartmentName", key: "departmentName" },
    ];

    styleHeader(ws.getRow(1));

    const rows = [
        // ── valid rows ── Department names must match seeded departments ─
        {
            name: "Sara Mohamed",
            email: "sara.mohamed.test@example.edu",
            nationalId: "30001011234501",
            studentId: "TEST-2024-001",
            departmentName: "Computer Science",
        },
        {
            name: "Ali Hassan",
            email: "ali.hassan.test@example.edu",
            nationalId: "30001011234502",
            studentId: "TEST-2024-002",
            departmentName: "Computer Science",
        },
        {
            name: "Mariam Khaled",
            email: "mariam.khaled.test@example.edu",
            nationalId: "30001011234503",
            studentId: "TEST-2024-003",
            departmentName: "Mathematics",
        },
        {
            name: "Youssef Nabil",
            email: "youssef.nabil.test@example.edu",
            nationalId: "30001011234504",
            studentId: "TEST-2024-004",
            departmentName: "Mathematics",
        },
        {
            name: "Hana Tarek",
            email: "hana.tarek.test@example.edu",
            nationalId: "30001011234505",
            studentId: "TEST-2024-005",
            departmentName: "Computer Science",
        },
        {
            name: "Ziad Mostafa",
            email: "ziad.mostafa.test@example.edu",
            nationalId: "30001011234506",
            studentId: "TEST-2024-006",
            departmentName: "Computer Science",
        },
        {
            name: "Nour Sherif",
            email: "nour.sherif.test@example.edu",
            nationalId: "30001011234507",
            studentId: "TEST-2024-007",
            departmentName: "Mathematics",
        },
        {
            name: "Adham Saad",
            email: "adham.saad.test@example.edu",
            nationalId: "30001011234508",
            studentId: "TEST-2024-008",
            departmentName: "Computer Science",
        },
        {
            name: "Dina Ramadan",
            email: "dina.ramadan.test@example.edu",
            nationalId: "30001011234509",
            studentId: "TEST-2024-009",
            departmentName: "Mathematics",
        },
        {
            name: "Tarek Magdy",
            email: "tarek.magdy.test@example.edu",
            nationalId: "30001011234510",
            studentId: "TEST-2024-010",
            departmentName: "Computer Science",
        },
        // ── duplicate email (should be skipped) ─────────────────────────
        {
            name: "Sara Mohamed Dup",
            email: "sara.mohamed.test@example.edu",
            nationalId: "30001011234511",
            studentId: "TEST-2024-011",
            departmentName: "Computer Science",
        },
        // ── duplicate student ID (should be skipped) ─────────────────────
        {
            name: "Unique Email Dup SID",
            email: "unique.email.test@example.edu",
            nationalId: "30001011234512",
            studentId: "TEST-2024-001",
            departmentName: "Computer Science",
        },
        // ── unknown department (should be rejected) ───────────────────────
        {
            name: "Bad Dept Student",
            email: "bad.dept.test@example.edu",
            nationalId: "30001011234513",
            studentId: "TEST-2024-013",
            departmentName: "Unknown Department",
        },
        // ── missing fields row (should be rejected) ───────────────────────
        {
            name: "Missing Fields",
            email: "",
            nationalId: "30001011234514",
            studentId: "TEST-2024-014",
            departmentName: "Computer Science",
        },
    ];

    rows.forEach((r) => ws.addRow(r));
    autoWidth(ws);

    const out = path.join(__dirname, "test-students.xlsx");
    await wb.xlsx.writeFile(out);
    console.log(`✔  Created: ${out}`);
    console.log(
        `   Expected: 10 inserted, 4 skipped (1 dup email, 1 dup studentId, 1 bad dept, 1 missing field)`
    );
}

// ─── run ────────────────────────────────────────────────────────────────────
await generateStaffFile();
await generateStudentsFile();
console.log(
    "\nDone. Import these files in Postman / Swagger under the 'file' field."
);
