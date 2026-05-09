import { prisma } from "../config/connection.js";
import { getCache, setCache } from "../services/cacheService.js";

const DATE_ONLY_OPTIONS = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
};

const normalizeSemester = (semester) => {
    if (!semester || typeof semester !== "string") return null;
    return semester.trim().split(" ")[0];
};

const toDateOnly = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const y = new Intl.DateTimeFormat("en-CA", {
        ...DATE_ONLY_OPTIONS,
    })
        .format(date)
        .split("-");

    if (y.length !== 3) return null;
    return `${y[0]}-${y[1]}-${y[2]}`;
};

const inferAcademicYear = (semester, year) => {
    if (!semester || !Number.isInteger(year)) return null;

    if (semester === "Fall") {
        return `${year}-${year + 1}`;
    }

    return `${year - 1}-${year}`;
};

const scoreCalendarEvent = ({ event, semester, year, academicYear }) => {
    let score = 0;

    const normalizedEventSemester = normalizeSemester(event.semester);
    if (normalizedEventSemester === semester) {
        score += 4;
    }

    if (event.semester === `${semester} ${year}`) {
        score += 3;
    }

    if (event.academic_year && event.academic_year === academicYear) {
        score += 3;
    }

    const eventYear = new Date(event.event_date).getUTCFullYear();
    if (eventYear === year) {
        score += 2;
    } else if (eventYear === year - 1 || eventYear === year + 1) {
        score += 1;
    }

    return score;
};

const pickBestEvent = ({ events, eventType, semester, year, academicYear }) => {
    const candidates = events
        .filter((event) => event.event_type === eventType)
        .map((event) => ({
            event,
            score: scoreCalendarEvent({ event, semester, year, academicYear }),
        }))
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return new Date(a.event.event_date) - new Date(b.event.event_date);
        });

    return candidates[0]?.event || null;
};

const buildPeriod = ({ semester, year, startEvent, endEvent }) => {
    const startDate = startEvent?.event_date
        ? new Date(startEvent.event_date)
        : null;
    // Prefer explicit *_end events, but support start-event end_date as a fallback window end.
    const resolvedEndDate =
        endEvent?.event_date || startEvent?.end_date || null;
    const endDate = resolvedEndDate ? new Date(resolvedEndDate) : null;

    const now = new Date();
    const openStart = startDate ? new Date(startDate) : null;
    const openEnd = endDate ? new Date(endDate) : null;

    if (openStart) {
        openStart.setUTCHours(0, 0, 0, 0);
    }
    if (openEnd) {
        openEnd.setUTCHours(23, 59, 59, 999);
    }

    const isOpen = Boolean(
        openStart && openEnd && now >= openStart && now <= openEnd,
    );
    const nextOpenDate =
        openStart && now < openStart ? toDateOnly(openStart) : null;

    return {
        isOpen,
        semester,
        year,
        startDate: toDateOnly(startDate),
        endDate: toDateOnly(endDate),
        nextOpenDate,
    };
};

const getPeriodWindow = async ({ startType, endType, semester, year }) => {
    if (!semester || !Number.isInteger(year)) {
        return {
            isOpen: false,
            semester,
            year,
            startDate: null,
            endDate: null,
            nextOpenDate: null,
        };
    }

    const academicYear = inferAcademicYear(semester, year);

    const events = await prisma.academic_calendar.findMany({
        where: {
            event_type: { in: [startType, endType] },
            OR: [
                { semester: semester },
                { semester: `${semester} ${year}` },
                ...(academicYear ? [{ academic_year: academicYear }] : []),
            ],
        },
        select: {
            id: true,
            event_type: true,
            event_date: true,
            end_date: true,
            semester: true,
            academic_year: true,
        },
        orderBy: { event_date: "asc" },
    });

    const startEvent = pickBestEvent({
        events,
        eventType: startType,
        semester,
        year,
        academicYear,
    });

    const endEvent = pickBestEvent({
        events,
        eventType: endType,
        semester,
        year,
        academicYear,
    });

    return buildPeriod({
        semester,
        year,
        startEvent,
        endEvent,
    });
};

export const getCurrentSemester = async () => {
    const cacheKey = "v1:semester:current";
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const latestOffering = await prisma.course_offerings.findFirst({
        orderBy: [{ year: "desc" }, { offering_id: "desc" }],
        select: {
            semester: true,
            year: true,
        },
    });

    if (!latestOffering) {
        return null;
    }

    const result = {
        semester: latestOffering.semester,
        year: latestOffering.year,
    };
    await setCache(cacheKey, result, 1800); // 30 min
    return result;
};

export const getRegistrationPeriod = async (semester, year) => {
    const normalizedSemester = normalizeSemester(semester);
    const cacheKey = `v1:period:registration:${normalizedSemester}:${year}`;

    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = await getPeriodWindow({
        startType: "registration_start",
        endType: "registration_end",
        semester: normalizedSemester,
        year,
    });

    await setCache(cacheKey, result, 600); // 10 min
    return result;
};

export const getPaymentPeriod = async (semester, year) => {
    const normalizedSemester = normalizeSemester(semester);
    const cacheKey = `v1:period:payment:${normalizedSemester}:${year}`;

    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = await getPeriodWindow({
        startType: "payment_start",
        endType: "payment_end",
        semester: normalizedSemester,
        year,
    });

    await setCache(cacheKey, result, 600); // 10 min
    return result;
};

export const isRegistrationOpen = async (semester, year) => {
    const period = await getRegistrationPeriod(semester, year);
    return period.isOpen;
};

export const isPaymentOpen = async (semester, year) => {
    const period = await getPaymentPeriod(semester, year);
    return period.isOpen;
};
