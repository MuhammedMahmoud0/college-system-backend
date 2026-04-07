/* eslint-disable no-console */

import {
    getCurrentSemester,
    getRegistrationPeriod,
} from "../src/utils/periodHelpers.js";
import { prisma } from "../src/config/connection.js";

const parseOptionalBoolean = (value) => {
    if (value === undefined) return null;
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    return null;
};

const run = async () => {
    const semesterFromEnv = process.env.SEMESTER;
    const yearFromEnv = Number.parseInt(process.env.YEAR || "", 10);

    const current = await getCurrentSemester();

    const semester = semesterFromEnv || current?.semester;
    const year = Number.isInteger(yearFromEnv) ? yearFromEnv : current?.year;

    if (!semester || !year) {
        console.error(
            "Unable to resolve semester/year. Set SEMESTER and YEAR env vars.",
        );
        process.exit(1);
    }

    const period = await getRegistrationPeriod(semester, year);

    console.log("Registration period:", JSON.stringify(period, null, 2));

    const expectedOpen = parseOptionalBoolean(process.env.EXPECT_IS_OPEN);
    if (expectedOpen !== null && period.isOpen !== expectedOpen) {
        console.error(
            `EXPECT_IS_OPEN mismatch. Expected ${expectedOpen}, got ${period.isOpen}`,
        );
        process.exit(1);
    }

    const expectedEndDate = process.env.EXPECT_END_DATE;
    if (expectedEndDate && period.endDate !== expectedEndDate) {
        console.error(
            `EXPECT_END_DATE mismatch. Expected ${expectedEndDate}, got ${period.endDate}`,
        );
        process.exit(1);
    }

    console.log("registration-period-smoke passed");
};

run()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
