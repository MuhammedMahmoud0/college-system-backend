/* eslint-disable no-console */

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const STUDENT_ID = process.env.STUDENT_ID;

const SELECTED_LECTURE_IDS = (process.env.SELECTED_LECTURE_IDS || "")
    .split(",")
    .map((id) => Number.parseInt(id.trim(), 10))
    .filter(Number.isInteger);

const SELECTED_LAB_IDS = (process.env.SELECTED_LAB_IDS || "")
    .split(",")
    .map((id) => Number.parseInt(id.trim(), 10))
    .filter(Number.isInteger);

const UPDATE_LECTURE_ID = Number.parseInt(
    process.env.UPDATE_LECTURE_ID || "",
    10,
);
const UPDATE_LAB_ID = Number.parseInt(process.env.UPDATE_LAB_ID || "", 10);

const DELETE_LECTURE_ID = Number.parseInt(
    process.env.DELETE_LECTURE_ID || "",
    10,
);
const DELETE_TUTORIAL_LAB_ID = Number.parseInt(
    process.env.DELETE_TUTORIAL_LAB_ID || "",
    10,
);

const callApi = async (path, method, token, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const json = await response.json();
    return { status: response.status, json };
};

const assertNoRegistrationPeriodBlock = (result, operationLabel) => {
    const errorMessage = String(result?.json?.error || "");
    if (
        result?.status === 403 &&
        errorMessage.toLowerCase().includes("registration is currently closed")
    ) {
        throw new Error(
            `${operationLabel} was blocked by registration period. Manual admin endpoints should bypass registration window checks.`,
        );
    }
};

const run = async () => {
    if (!ADMIN_TOKEN || !STUDENT_ID) {
        console.error(
            "Set ADMIN_TOKEN and STUDENT_ID env vars before running this script",
        );
        process.exit(1);
    }

    const basePath = `/registration/manual-course-registration/students/${STUDENT_ID}`;

    console.log("1) Read student manual registrations");
    console.log(await callApi(`${basePath}/enrollments`, "GET", ADMIN_TOKEN));

    console.log("2) Get specific student schedule");
    console.log(await callApi(`${basePath}/schedule`, "GET", ADMIN_TOKEN));

    if (SELECTED_LECTURE_IDS.length > 0 && SELECTED_LAB_IDS.length > 0) {
        console.log("3) Create manual registration (admin create)");
        const createResult = await callApi(
            `${basePath}/register`,
            "POST",
            ADMIN_TOKEN,
            {
                selectedLectureIds: SELECTED_LECTURE_IDS,
                selectedLabIds: SELECTED_LAB_IDS,
            },
        );
        assertNoRegistrationPeriodBlock(createResult, "Manual register");
        console.log(createResult);
    }

    if (
        Number.isInteger(UPDATE_LECTURE_ID) &&
        Number.isInteger(UPDATE_LAB_ID)
    ) {
        console.log("4) Update registration lab (admin update)");
        console.log(
            await callApi(`${basePath}/register-lab`, "PATCH", ADMIN_TOKEN, {
                lectureId: UPDATE_LECTURE_ID,
                labId: UPDATE_LAB_ID,
            }),
        );
    }

    if (
        Number.isInteger(DELETE_LECTURE_ID) ||
        Number.isInteger(DELETE_TUTORIAL_LAB_ID)
    ) {
        console.log("5) Delete registration (admin delete)");
        const deleteResult = await callApi(
            `${basePath}/unregister`,
            "DELETE",
            ADMIN_TOKEN,
            {
                ...(Number.isInteger(DELETE_LECTURE_ID)
                    ? { lectureId: DELETE_LECTURE_ID }
                    : {}),
                ...(Number.isInteger(DELETE_TUTORIAL_LAB_ID)
                    ? { tutorialLabId: DELETE_TUTORIAL_LAB_ID }
                    : {}),
            },
        );
        assertNoRegistrationPeriodBlock(deleteResult, "Manual unregister");
        console.log(deleteResult);
    }
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
