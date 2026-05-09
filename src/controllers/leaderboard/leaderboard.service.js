import { prisma } from "../../config/connection.js";
import { badgeFor, percentileFromRank } from "./leaderboard.utils.js";
import {
    getCache,
    setCache,
    tryAcquireLock,
    releaseLock,
} from "../../services/cacheService.js";

/**
 * Returns ranked rows + userRank.
 * Cache key: v1:leaderboard:{type}:{department|all}:{level|all}:{limit}
 * TTL: 15 min for gpa, 5 min for attendance/activities
 */
export const buildLeaderboard = async ({
    type,
    department,
    level,
    limit,
    currentUserId,
}) => {
    const cacheKey = `v1:leaderboard:${type}:${department || "all"}:${level || "all"}:${limit}`;
    const ttl = type === "gpa" ? 900 : 300;

    // Try cache first
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    // Stampede prevention: only one request should compute at a time
    const gotLock = await tryAcquireLock(cacheKey, 15);
    if (!gotLock) {
        // Another request is computing — wait briefly then retry cache
        await new Promise((r) => setTimeout(r, 500));
        const retry = await getCache(cacheKey);
        if (retry) return retry;
        // Fall through to compute if still not cached
    }

    try {
        let rows = [];

        /* =========================
           GPA
        ========================== */
        if (type === "gpa") {
            const profiles = await prisma.student_profiles.findMany({
                where: {
                    cgpa: { not: null },
                    ...(level && { year_level: Number(level) }),
                    ...(department && {
                        departments: { name: department },
                    }),
                },
                select: {
                    user_id: true,
                    student_id: true,
                    year_level: true,
                    cgpa: true,
                    users: {
                        select: {
                            full_name: true,
                            avatar_url: true,
                        },
                    },
                    departments: {
                        select: { name: true },
                    },
                },
                orderBy: { cgpa: "desc" },
            });

            rows = profiles.map((p) => ({
                userId: p.user_id,
                studentId: p.student_id,
                name: p.users.full_name,
                avatar: p.users.avatar_url,
                department: p.departments?.name ?? null,
                level: p.year_level,
                score: p.cgpa,
            }));
        }

        /* =========================
           ATTENDANCE (PERCENTAGE)
        ========================== */
        if (type === "attendance") {
            const [totals, presents, students] = await Promise.all([
                prisma.attendance.groupBy({
                    by: ["student_user_id"],
                    _count: { _all: true },
                }),
                prisma.attendance.groupBy({
                    by: ["student_user_id"],
                    _count: { _all: true },
                    where: { status: "present" },
                }),
                prisma.student_profiles.findMany({
                    where: {
                        ...(level && { year_level: Number(level) }),
                        ...(department && {
                            departments: { name: department },
                        }),
                    },
                    select: {
                        user_id: true,
                        student_id: true,
                        year_level: true,
                        users: {
                            select: {
                                full_name: true,
                                avatar_url: true,
                            },
                        },
                        departments: {
                            select: { name: true },
                        },
                    },
                }),
            ]);

            const totalMap = new Map(
                totals.map((t) => [t.student_user_id, t._count._all])
            );
            const presentMap = new Map(
                presents.map((p) => [p.student_user_id, p._count._all])
            );

            rows = students
                .map((s) => {
                    const total = totalMap.get(s.user_id) || 0;
                    if (total === 0) return null;

                    const present = presentMap.get(s.user_id) || 0;
                    const score = Math.round((present / total) * 100);

                    return {
                        userId: s.user_id,
                        studentId: s.student_id,
                        name: s.users.full_name,
                        avatar: s.users.avatar_url,
                        department: s.departments?.name ?? null,
                        level: s.year_level,
                        score,
                    };
                })
                .filter(Boolean)
                .sort((a, b) => b.score - a.score);
        }

        /* =========================
           ACTIVITIES
        ========================== */
        if (type === "activities") {
            const [posts, likes, submissions, students] = await Promise.all([
                prisma.community_posts.groupBy({
                    by: ["author_id"],
                    _count: { _all: true },
                }),
                prisma.post_likes.groupBy({
                    by: ["user_id"],
                    _count: { _all: true },
                }),
                prisma.task_submissions.groupBy({
                    by: ["student_id"],
                    _count: { _all: true },
                }),
                prisma.student_profiles.findMany({
                    where: {
                        ...(level && { year_level: Number(level) }),
                        ...(department && {
                            departments: { name: department },
                        }),
                    },
                    select: {
                        user_id: true,
                        student_id: true,
                        year_level: true,
                        users: {
                            select: {
                                full_name: true,
                                avatar_url: true,
                            },
                        },
                        departments: {
                            select: { name: true },
                        },
                    },
                }),
            ]);

            const scoreMap = new Map();
            const add = (id, v) => scoreMap.set(id, (scoreMap.get(id) || 0) + v);

            posts.forEach((p) => add(p.author_id, p._count._all * 2));
            likes.forEach((l) => add(l.user_id, l._count._all));
            submissions.forEach((s) => add(s.student_id, s._count._all * 3));

            rows = students
                .map((s) => ({
                    userId: s.user_id,
                    studentId: s.student_id,
                    name: s.users.full_name,
                    avatar: s.users.avatar_url,
                    department: s.departments?.name ?? null,
                    level: s.year_level,
                    score: scoreMap.get(s.user_id) || 0,
                }))
                .sort((a, b) => b.score - a.score);
        }

        /* =========================
           RANKING + BADGES
        ========================== */
        const total = rows.length;
        const sliced = rows.slice(0, limit);

        const leaderboard = sliced.map((r, idx) => {
            const rank = idx + 1;
            const percentile = percentileFromRank(rank, total);

            return {
                rank,
                studentId: r.studentId,
                name: r.name,
                avatar: r.avatar,
                department: r.department,
                level: r.level,
                score: r.score,
                badge: badgeFor(type, r.score, percentile),
            };
        });

        const userIndex = rows.findIndex((r) => r.userId === currentUserId);
        const userRank =
            userIndex !== -1
                ? {
                      rank: userIndex + 1,
                      score: rows[userIndex].score,
                      percentile: percentileFromRank(userIndex + 1, total),
                  }
                : null;

        const result = { leaderboard, userRank };

        // Cache the computed result
        await setCache(cacheKey, result, ttl);

        return result;
    } finally {
        await releaseLock(cacheKey);
    }
};
