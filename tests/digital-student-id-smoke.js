/* eslint-disable no-console */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000/api/v1";
const USER_TOKEN = process.env.STUDENT_TOKEN || process.env.LEADER_TOKEN;

const EXPECTED_PRIVILEGES = [
    "Library Access",
    "CS & Engineering Labs",
    "Gym & Sports Facilities",
];

const callApi = async (path, method, token) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const json = await response.json();
    return { status: response.status, json };
};

const assertDateWindow = (issuedDate, expiresDate) => {
    const issuedYear = Number.parseInt(String(issuedDate).split("-")[0], 10);
    const expiresYear = Number.parseInt(String(expiresDate).split("-")[0], 10);

    if (!String(issuedDate).endsWith("-09-01")) {
        throw new Error(
            `issued_date must be in September 1st, got ${issuedDate}`,
        );
    }

    if (!String(expiresDate).endsWith("-07-31")) {
        throw new Error(
            `expires_date must be in July 31st, got ${expiresDate}`,
        );
    }

    if (expiresYear - issuedYear !== 4) {
        throw new Error(
            `expires_date year must be 4 years after issued_date year, got ${issuedYear} -> ${expiresYear}`,
        );
    }
};

const run = async () => {
    if (!USER_TOKEN) {
        console.error(
            "Set STUDENT_TOKEN or LEADER_TOKEN before running this script",
        );
        process.exit(1);
    }

    console.log("1) Get digital student ID front side");
    const front = await callApi("/student/digital-id/front", "GET", USER_TOKEN);
    console.log(front);

    if (front.status !== 200) {
        console.error(
            `Expected 200 from /student/digital-id/front, got ${front.status}`,
        );
        process.exit(1);
    }

    if (front.json.system_name !== "Academia College") {
        console.error("Unexpected system_name in front side payload");
        process.exit(1);
    }

    if (!front.json?.holder?.student_id) {
        console.error("Missing holder.student_id in front side payload");
        process.exit(1);
    }

    assertDateWindow(
        front.json?.card_validity?.issued_date,
        front.json?.card_validity?.expires_date,
    );

    console.log("2) Get digital student ID back side");
    const back = await callApi("/student/digital-id/back", "GET", USER_TOKEN);
    console.log(back);

    if (back.status !== 200) {
        console.error(
            `Expected 200 from /student/digital-id/back, got ${back.status}`,
        );
        process.exit(1);
    }

    if (back.json?.barcode?.access !== true) {
        console.error("Expected barcode.access to be true");
        process.exit(1);
    }

    const privileges = back.json?.access_privileges || [];
    if (JSON.stringify(privileges) !== JSON.stringify(EXPECTED_PRIVILEGES)) {
        console.error(
            `Unexpected access_privileges. Expected ${JSON.stringify(EXPECTED_PRIVILEGES)}, got ${JSON.stringify(privileges)}`,
        );
        process.exit(1);
    }

    const qrStudentId = back.json?.qr_code?.student_id;
    if (!qrStudentId || qrStudentId !== front.json?.holder?.student_id) {
        console.error(
            "QR code student_id is missing or inconsistent with front side",
        );
        process.exit(1);
    }

    console.log("digital-student-id-smoke passed");
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
