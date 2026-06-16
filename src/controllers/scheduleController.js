import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { getCache, setCache } from "../services/cacheService.js";

export const getStudentSchedule = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { week, date } = req.query;

        // const cacheKey = `v1:schedule:student:${user.userId}:${week || 0}:${date || "current"}`;
        // const cachedData = await getCache(cacheKey);
        // if (cachedData) {
        //     return res.status(200).json(cachedData);
        // }

        // Get student enrollments
        const enrollments = await prisma.enrollments.findMany({
            where: {
                student_user_id: user.userId,
                status: "enrolled",
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                            },
                        },
                        users: {
                            select: {
                                full_name: true,
                            },
                        },
                    },
                },
                tutorials_labs: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
                            },
                        },
                        users: {
                            select: {
                                full_name: true,
                            },
                        },
                    },
                },
            },
        });

        // Helper: format a Prisma Time value as HH:MM in Africa/Cairo timezone
        const formatTimeCairo = (dateTime) => {
            if (!dateTime) return null;
            return new Intl.DateTimeFormat("en-US", {
                timeZone: "Africa/Cairo",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }).format(new Date(dateTime));
        };

        // Helper function to normalize day names
        const normalizeDayName = (day) => {
            const dayMap = {
                sun: "Sunday",
                mon: "Monday",
                tue: "Tuesday",
                wed: "Wednesday",
                thu: "Thursday",
                fri: "Friday",
                sat: "Saturday",
                sunday: "Sunday",
                monday: "Monday",
                tuesday: "Tuesday",
                wednesday: "Wednesday",
                thursday: "Thursday",
                friday: "Friday",
                saturday: "Saturday",
            };
            return dayMap[day.toLowerCase()] || day;
        };

        // Process the schedule data
        const scheduleMap = new Map();

        enrollments.forEach((enrollment) => {
            // Add lecture to schedule
            if (enrollment.lectures) {
                const lecture = enrollment.lectures;
                const dayOfWeek = normalizeDayName(lecture.day_of_week);

                if (!scheduleMap.has(dayOfWeek)) {
                    scheduleMap.set(dayOfWeek, []);
                }

                scheduleMap.get(dayOfWeek).push({
                    courseId: lecture.course_offerings.course_code,
                    courseCode: lecture.course_offerings.course_code,
                    courseName: lecture.course_offerings.courses.name,
                    startTime: formatTimeCairo(lecture.start_time),
                    endTime: formatTimeCairo(lecture.end_time),
                    location: lecture.location || "TBA",
                    instructor: lecture.users.full_name,
                    type: "lecture",
                });
            }

            // Add tutorial/lab to schedule
            if (enrollment.tutorials_labs) {
                const tutorialLab = enrollment.tutorials_labs;
                const dayOfWeek = normalizeDayName(tutorialLab.day_of_week);

                if (!scheduleMap.has(dayOfWeek)) {
                    scheduleMap.set(dayOfWeek, []);
                }

                scheduleMap.get(dayOfWeek).push({
                    courseId: tutorialLab.course_offerings.course_code,
                    courseCode: tutorialLab.course_offerings.course_code,
                    courseName: tutorialLab.course_offerings.courses.name,
                    startTime: formatTimeCairo(tutorialLab.start_time),
                    endTime: formatTimeCairo(tutorialLab.end_time),
                    location: tutorialLab.location || "TBA",
                    instructor: tutorialLab.users.full_name,
                    type: tutorialLab.type.toLowerCase(),
                });
            }
        });

        // Convert to array format with dates
        const daysOrder = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];

        // Calculate dates for the week
        let baseDate = new Date();
        if (date) {
            baseDate = new Date(date);
        }

        // Get the start of the week (Sunday)
        const startOfWeek = new Date(baseDate);
        startOfWeek.setDate(
            startOfWeek.getDate() -
                startOfWeek.getDay() +
                (week ? week * 7 : 0),
        );

        const schedule = daysOrder.map((day, index) => {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + index);

            return {
                day: day,
                date: currentDate.toISOString().split("T")[0],
                classes: (scheduleMap.get(day) || []).sort((a, b) => {
                    return a.startTime.localeCompare(b.startTime);
                }),
            };
        });

        const responseData = { schedule };
        // await setCache(cacheKey, responseData, 300); // Cache for 5 minutes

        res.status(200).json(responseData);
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
