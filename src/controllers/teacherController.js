import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

export const getAllTeachers = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Get all teachers (doctors and teaching assistants)
        const teachers = await prisma.users.findMany({
            where: {
                OR: [{ role: "doctor" }, { role: "teaching_assistant" }],
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: {
                                    include: {
                                        departments: true,
                                    },
                                },
                            },
                        },
                    },
                    take: 1,
                },
                tutorials_labs: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: {
                                    include: {
                                        departments: true,
                                    },
                                },
                            },
                        },
                    },
                    take: 1,
                },
            },
        });

        // Transform the data to match the required format
        const formattedTeachers = teachers.map((teacher) => {
            // Get department from first lecture or tutorial/lab if available
            let department = null;

            if (
                teacher.lectures.length > 0 &&
                teacher.lectures[0].course_offerings &&
                teacher.lectures[0].course_offerings.courses &&
                teacher.lectures[0].course_offerings.courses.departments
            ) {
                department =
                    teacher.lectures[0].course_offerings.courses.departments
                        .name;
            } else if (
                teacher.tutorials_labs.length > 0 &&
                teacher.tutorials_labs[0].course_offerings &&
                teacher.tutorials_labs[0].course_offerings.courses &&
                teacher.tutorials_labs[0].course_offerings.courses.departments
            ) {
                department =
                    teacher.tutorials_labs[0].course_offerings.courses
                        .departments.name;
            }

            // Determine title based on role
            const title = teacher.role === "doctor" ? "Dr." : "TA";

            return {
                id: teacher.id,
                name: teacher.full_name,
                title: title,
                department: department,
                email: teacher.email,
            };
        });

        res.status(200).json({ teachers: formattedTeachers });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getTeacherSchedule = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const teacherId = user.userId;
        // logger.info(`Fetching schedule for teacher ID: ${teacherId}`);

        // Authorization: Teacher can only view their own schedule
        // if (user.userId !== teacherId && user.id !== teacherId) {
        //     return res.status(403).json({
        //         error: "Access denied. You can only view your own schedule.",
        //     });
        // }

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

        // Helper function to format time to HH:MM in Cairo timezone
        const formatTime = (time) => {
            if (!time) return null;

            // If it's already a string in HH:MM format, convert to 12-hour format
            if (typeof time === "string" && time.match(/^\d{2}:\d{2}/)) {
                const [hours, minutes] = time.split(":");
                const hour = parseInt(hours);
                const period = hour >= 12 ? "PM" : "AM";
                const hour12 = hour % 12 || 12;
                return `${hour12}:${minutes} ${period}`;
            }

            // If it's a Date object, format it to Cairo timezone in 12-hour format
            const date = new Date(time);
            return date.toLocaleTimeString("en-US", {
                timeZone: "Africa/Cairo",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        };

        // Get teacher information
        const teacher = await prisma.users.findUnique({
            where: {
                id: teacherId,
            },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: {
                                courses: true,
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
                    },
                },
            },
        });

        if (!teacher) {
            return res.status(404).json({ error: "Teacher not found" });
        }

        // Build schedule map by day
        const scheduleMap = new Map();

        // Add lectures (for doctors)
        teacher.lectures.forEach((lecture) => {
            const day = normalizeDayName(lecture.day_of_week);
            if (!scheduleMap.has(day)) {
                scheduleMap.set(day, []);
            }
            scheduleMap.get(day).push({
                lectureId: lecture.lecture_id,
                startTime: formatTime(lecture.start_time),
                endTime: formatTime(lecture.end_time),
                courseCode: lecture.course_offerings.course_code,
                courseName: lecture.course_offerings.courses.name,
                location: lecture.location || "TBA",
                type: "lecture",
            });
        });

        // Add tutorials/labs (for teaching assistants)
        teacher.tutorials_labs.forEach((tutorialLab) => {
            const day = normalizeDayName(tutorialLab.day_of_week);
            if (!scheduleMap.has(day)) {
                scheduleMap.set(day, []);
            }
            scheduleMap.get(day).push({
                tutorialLabId: tutorialLab.tutorial_lab_id,
                startTime: formatTime(tutorialLab.start_time),
                endTime: formatTime(tutorialLab.end_time),
                courseCode: tutorialLab.course_offerings.course_code,
                courseName: tutorialLab.course_offerings.courses.name,
                location: tutorialLab.location || "TBA",
                type: tutorialLab.type.toLowerCase(),
            });
        });

        // Convert to array format
        const daysOrder = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
        ];

        const schedule = daysOrder.map((day) => {
            const slots = scheduleMap.get(day) || [];
            // Sort slots by start time
            slots.sort((a, b) => {
                const timeA =
                    a.startTime instanceof Date
                        ? a.startTime.toISOString()
                        : a.startTime;
                const timeB =
                    b.startTime instanceof Date
                        ? b.startTime.toISOString()
                        : b.startTime;
                return timeA.localeCompare(timeB);
            });

            return {
                day: day,
                slots: slots,
            };
        });

        res.status(200).json({
            teacherId: teacher.id,
            teacherName: teacher.full_name,
            schedule: schedule,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
