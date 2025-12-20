import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

// GET /api/courses/student
export const getStudentCourses = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        const enrollments = await prisma.enrollments.findMany({
            where: { student_user_id: userId },
            include: {
                lectures: {
                    include: {
                        course_offerings: {
                            include: { courses: true }
                        },
                        users: { select: { full_name: true } } // The Instructor
                    }
                }
            }
        });

        const profile = await prisma.student_profiles.findUnique({
            where: { user_id: userId }
        });

        const formattedCourses = enrollments.map(en => ({
            id: en.lecture_id.toString(),
            code: en.lectures.course_offerings.course_code,
            name: en.lectures.course_offerings.courses.name,
            credits: en.lectures.course_offerings.courses.credits,
            instructor: en.lectures.users.full_name,
            semester: en.lectures.course_offerings.semester,
            grade: en.grade || "N/A",
            status: en.status
        }));

        res.status(200).json({
            courses: formattedCourses,
            cumulativeGPA: profile?.cgpa || 0,
            totalCredits: profile?.total_credits || 0
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// GET /api/courses/:courseId
export const getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.params;

        const lecture = await prisma.lectures.findUnique({
            where: { lecture_id: parseInt(courseId) },
            include: {
                course_offerings: { include: { courses: true } },
                users: true // Instructor
            }
        });

        if (!lecture) return res.status(404).json({ error: "Course not found" });

        res.status(200).json({
            id: lecture.lecture_id.toString(),
            code: lecture.course_offerings.course_code,
            name: lecture.course_offerings.courses.name,
            credits: lecture.course_offerings.courses.credits,
            instructor: {
                id: lecture.users.id,
                name: lecture.users.full_name,
                email: lecture.users.email
            },
            schedule: [{
                day: lecture.day_of_week,
                startTime: lecture.start_time,
                endTime: lecture.end_time,
                location: lecture.location
            }]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/courses/:courseId/grades
export const getGradeBreakdown = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        const enrollment = await prisma.enrollments.findFirst({
            where: {
                lecture_id: parseInt(courseId),
                student_user_id: userId
            },
            include: {
                lectures: {
                    include: { course_offerings: { include: { courses: true } } }
                }
            }
        });

        if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

        // 1. Get raw values
        const mid = enrollment.mid_score || 0;
        const work = enrollment.work_score || 0;
        const final = enrollment.final_score || 0;
        
        // 2. Calculate Total
        const total = mid + work + final;

        // 3. VALIDATION: Check if total exceeds 100
        if (total > 100) {
            return res.status(400).json({ 
                error: "Data Consistency Error", 
                message: `Total score (${total}) exceeds the maximum allowed (100). Please check database records.`,
                breakdown: { mid, work, final }
            });
        }

        // 4. Send successful response if total <= 100
        res.status(200).json({
            courseId: courseId,
            courseName: enrollment.lectures.course_offerings.courses.name,
            totalGrade: total,
            breakdown: [
                { category: "Midterm", score: mid, maxScore: 30 }, 
                { category: "Work/Assignments", score: work, maxScore: 30 },
                { category: "Final Exam", score: final, maxScore: 60 }
            ],
            letterGrade: enrollment.grade || "In Progress"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};