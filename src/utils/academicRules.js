/**
 * Academic business rules — level computation, registration hour caps,
 * and graduation eligibility.
 *
 * Centralised here so every controller uses the same constants.
 */

// ── Level thresholds (credit-hour ranges) ──────────────────────────
export const LEVEL_THRESHOLDS = [
    { level: 1, minCredits: 0, maxCredits: 28 },
    { level: 2, minCredits: 29, maxCredits: 64 },
    { level: 3, minCredits: 65, maxCredits: 98 },
    { level: 4, minCredits: 99, maxCredits: 140 },
];

// ── Graduation ─────────────────────────────────────────────────────
export const GRADUATION_CREDITS = 140;

// ── Semester registration hour caps ────────────────────────────────
export const DEFAULT_MAX_SEMESTER_HOURS = 18;
export const HIGH_GPA_MAX_SEMESTER_HOURS = 21;
export const HIGH_GPA_THRESHOLD = 3.3;

/**
 * Compute the academic year-level (1–4) from completed credit hours.
 * @param {number|null|undefined} totalCredits
 * @returns {number} 1–4
 */
export function computeYearLevel(totalCredits) {
    const credits = Number(totalCredits) || 0;

    for (const { level, minCredits, maxCredits } of LEVEL_THRESHOLDS) {
        if (credits >= minCredits && credits <= maxCredits) {
            return level;
        }
    }

    // Beyond 140 → still level 4
    return 4;
}

/**
 * Return the maximum credit hours a student may register for in a
 * single semester, based on their cumulative GPA.
 * @param {number|null|undefined} cgpa
 * @returns {number} 18 or 21
 */
export function getMaxSemesterHours(cgpa) {
    const gpa = Number(cgpa);
    if (!Number.isFinite(gpa)) return DEFAULT_MAX_SEMESTER_HOURS;
    return gpa > HIGH_GPA_THRESHOLD
        ? HIGH_GPA_MAX_SEMESTER_HOURS
        : DEFAULT_MAX_SEMESTER_HOURS;
}

/**
 * Check whether the student has completed enough credits to graduate.
 * @param {number|null|undefined} totalCredits
 * @returns {boolean}
 */
export function isEligibleForGraduation(totalCredits) {
    return (Number(totalCredits) || 0) >= GRADUATION_CREDITS;
}
