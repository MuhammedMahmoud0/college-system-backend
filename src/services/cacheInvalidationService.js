/**
 * Centralized cache invalidation service.
 *
 * Each method groups all related cache patterns that need to be flushed
 * for a given mutation event. Import from any controller like:
 *
 *   import { CacheInvalidation } from "../services/cacheInvalidationService.js";
 *   await CacheInvalidation.onEnrollmentChange();
 */
import { invalidateByPattern } from "./cacheService.js";

export const CacheInvalidation = {
    async onDepartmentChange() {
        await Promise.all([
            invalidateByPattern("v1:departments:*"),
            invalidateByPattern("v1:financials:*"),
            invalidateByPattern("v1:teachers:*"),
        ]);
    },

    async onFinancialChange() {
        await invalidateByPattern("v1:financials:*");
    },

    async onEnrollmentChange() {
        await Promise.all([
            invalidateByPattern("v1:registration:available:*"),
            invalidateByPattern("v1:schedule:student:*"),
            invalidateByPattern("v1:courses:student:*"),
            invalidateByPattern("v1:admin:alerts"),
            invalidateByPattern("v1:admin:enrollment-trends:*"),
            invalidateByPattern("v1:admin:payment-aging"),
            invalidateByPattern("v1:doctor:alerts:*"),
            invalidateByPattern("v1:ta:alerts:*"),
        ]);
    },

    async onGradeChange() {
        await Promise.all([
            invalidateByPattern("v1:grades:*"),
            invalidateByPattern("v1:leaderboard:gpa:*"),
            invalidateByPattern("v1:doctor:alerts:*"),
            invalidateByPattern("v1:ta:alerts:*"),
            invalidateByPattern("v1:leaderboard:activities:*"),
        ]);
    },

    async onAttendanceChange() {
        await Promise.all([
            invalidateByPattern("v1:leaderboard:attendance:*"),
            invalidateByPattern("v1:admin:alerts"),
        ]);
    },

    async onOfferingChange() {
        await Promise.all([
            invalidateByPattern("v1:courses:*"),
            invalidateByPattern("v1:course:detail:*"),
            invalidateByPattern("v1:course-offerings:*"),
            invalidateByPattern("v1:semester:*"),
            invalidateByPattern("v1:period:*"),
            invalidateByPattern("v1:registration:available:*"),
        ]);
    },

    async onExamChange() {
        await Promise.all([
            invalidateByPattern("v1:exams:*"),
            invalidateByPattern("v1:exam:schedule:*"),
        ]);
    },

    async onAnnouncementChange() {
        await Promise.all([
            invalidateByPattern("v1:announcements:*"),
            invalidateByPattern("v1:admin:activity:*"),
        ]);
    },

    async onCalendarChange() {
        await Promise.all([
            invalidateByPattern("v1:calendar:*"),
            invalidateByPattern("v1:period:*"),
        ]);
    },

    async onCommunityChange() {
        await Promise.all([
            invalidateByPattern("v1:community:feed:*"),
            invalidateByPattern("v1:leaderboard:activities:*"),
        ]);
    },

    async onTaskSubmissionChange() {
        await Promise.all([
            invalidateByPattern("v1:leaderboard:activities:*"),
            invalidateByPattern("v1:doctor:alerts:*"),
            invalidateByPattern("v1:ta:alerts:*"),
        ]);
    },

    async onLectureChange() {
        await Promise.all([
            invalidateByPattern("v1:course:detail:*"),
            invalidateByPattern("v1:schedule:teacher:*"),
            invalidateByPattern("v1:doctor:courses:*"),
            invalidateByPattern("v1:materials:*"),
            invalidateByPattern("v1:admin:alerts"),
        ]);
    },

    async onUserChange() {
        await Promise.all([
            invalidateByPattern("v1:teachers:*"),
            invalidateByPattern("v1:admin:alerts"),
        ]);
    },
};
