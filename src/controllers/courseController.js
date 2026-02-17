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
              include: { courses: true },
            },
            users: { select: { full_name: true } }, // The Instructor
          },
        },
      },
    });

    const profile = await prisma.student_profiles.findUnique({
      where: { user_id: userId },
    });

    const formattedCourses = enrollments.map((en) => ({
      id: en.lecture_id.toString(),
      code: en.lectures.course_offerings.course_code,
      name: en.lectures.course_offerings.courses.name,
      credits: en.lectures.course_offerings.courses.credits,
      instructor: en.lectures.users.full_name,
      semester: en.lectures.course_offerings.semester,
      grade: en.grade || "N/A",
      status: en.status,
    }));

    res.status(200).json({
      courses: formattedCourses,
      cumulativeGPA: profile?.cgpa || 0,
      totalCredits: profile?.total_credits || 0,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to format time to HH:MM
const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// GET /api/courses/all
export const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.courses.findMany({
      include: {
        departments: {
          select: {
            name: true,
          },
        },
        course_prerequisites_course_prerequisites_course_codeTocourses: {
          include: {
            courses_course_prerequisites_prerequisite_codeTocourses: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    const formattedCourses = courses.map((course) => ({
      code: course.code,
      name: course.name,
      credits: course.credits,
      department: course.departments.name,
      prerequisites:
        course.course_prerequisites_course_prerequisites_course_codeTocourses.map(
          (prereq) => ({
            code: prereq.courses_course_prerequisites_prerequisite_codeTocourses
              .code,
            name: prereq.courses_course_prerequisites_prerequisite_codeTocourses
              .name,
          }),
        ),
    }));

    res.status(200).json({
      courses: formattedCourses,
      total: formattedCourses.length,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET /api/courses/:offeringId
export const getCourseDetails = async (req, res) => {
  try {
    const { offeringId } = req.params;

    const offering = await prisma.course_offerings.findUnique({
      where: { offering_id: parseInt(offeringId) },
      include: {
        courses: true,
        lectures: {
          include: {
            users: {
              select: {
                full_name: true,
                email: true,
              },
            },
          },
        },
        tutorials_labs: {
          include: {
            users: {
              select: {
                full_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!offering)
      return res.status(404).json({ error: "Course offering not found" });

    // Format lectures without IDs
    const lectures = offering.lectures.map((lecture) => ({
      instructor: lecture.users.full_name,
      instructorEmail: lecture.users.email,
      capacity: lecture.capacity,
      dayOfWeek: lecture.day_of_week,
      startTime: formatTime(lecture.start_time),
      endTime: formatTime(lecture.end_time),
      location: lecture.location,
      group: lecture.group,
    }));

    // Format tutorials/labs without IDs
    const tutorialsLabs = offering.tutorials_labs.map((lab) => ({
      ta: lab.users.full_name,
      taEmail: lab.users.email,
      type: lab.type,
      capacity: lab.capacity,
      dayOfWeek: lab.day_of_week,
      startTime: formatTime(lab.start_time),
      endTime: formatTime(lab.end_time),
      location: lab.location,
      group: lab.group,
    }));

    res.status(200).json({
      name: offering.courses.name,
      code: offering.course_code,
      credits: offering.courses.credits,
      semester: offering.semester,
      lectures: lectures,
      tutorialsLabs: tutorialsLabs,
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
        student_user_id: userId,
      },
      include: {
        lectures: {
          include: { course_offerings: { include: { courses: true } } },
        },
      },
    });

    if (!enrollment)
      return res.status(404).json({ error: "Enrollment not found" });

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
        breakdown: { mid, work, final },
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
        { category: "Final Exam", score: final, maxScore: 60 },
      ],
      letterGrade: enrollment.grade || "In Progress",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/courses
export const createCourse = async (req, res) => {
  try {
    const { code, name, credits, department, prerequisites } = req.body;

    if (!code || !name || !credits || !department) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["code", "name", "credits", "department"],
      });
    }

    // Resolve department by name
    const dept = await prisma.departments.findUnique({
      where: { name: department },
      select: { department_id: true, name: true },
    });

    if (!dept) {
      return res.status(400).json({
        error: "Invalid department",
        message: `Department with name '${department}' not found`,
      });
    }

    const courseData = {
      code,
      name,
      credits: parseInt(credits),
      department_id: dept.department_id,
    };

    const newCourse = await prisma.courses.create({
      data: courseData,
    });

    if (prerequisites && prerequisites.length > 0) {
      await prisma.course_prerequisites.createMany({
        data: prerequisites.map((prereqCode) => ({
          course_code: newCourse.code,
          prerequisite_code: prereqCode,
        })),
      });
    }

    const result = await prisma.courses.findUnique({
      where: { code: newCourse.code },
      include: {
        course_prerequisites_course_prerequisites_course_codeTocourses: {
          include: {
            courses_course_prerequisites_prerequisite_codeTocourses: true,
          },
        },
        departments: true,
      },
    });

    res.status(201).json({
      code: result.code,
      name: result.name,
      credits: result.credits,
      department: result.departments?.name || department,
      course_prerequisites_course_prerequisites_course_codeTocourses:
        result.course_prerequisites_course_prerequisites_course_codeTocourses,
    });
  } catch (err) {
    logger.error(err);
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ error: "A course with this code already exists." });
    }
    if (err.code === "P2003") {
      return res.status(400).json({ error: "Invalid prerequisite course." });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// PATCH /api/courses/:code
export const updateCourse = async (req, res) => {
  try {
    const { code } = req.params;
    const { name, prerequisites } = req.body;

    logger.info(`Updating course with code: ${code}`);

    const updateData = {};
    if (name) updateData.name = name;

    await prisma.$transaction(async (tx) => {
      if (name) {
        await tx.courses.update({
          where: { code },
          data: { name },
        });
      }

      if (prerequisites) {
        await tx.course_prerequisites.deleteMany({
          where: { course_code: code },
        });
        await tx.course_prerequisites.createMany({
          data: prerequisites.map((prereqCode) => ({
            course_code: code,
            prerequisite_code: prereqCode,
          })),
        });
      }
    });

    const updatedCourse = await prisma.courses.findUnique({
      where: { code },
      include: {
        departments: true,
        course_prerequisites_course_prerequisites_course_codeTocourses: {
          include: {
            courses_course_prerequisites_prerequisite_codeTocourses: true,
          },
        },
      },
    });

    res.status(200).json({
      code: updatedCourse.code,
      name: updatedCourse.name,
      credits: updatedCourse.credits,
      department: updatedCourse.departments?.name || undefined,
      course_prerequisites_course_prerequisites_course_codeTocourses:
        updatedCourse.course_prerequisites_course_prerequisites_course_codeTocourses,
    });
  } catch (err) {
    logger.error("Error updating course:", err);
    logger.error("Error details:", { code: err.code, message: err.message });
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Course not found." });
    }
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

// DELETE /api/courses/:code
export const deleteCourse = async (req, res) => {
  try {
    const { code } = req.params;

    logger.info(`Deleting course with code: ${code}`);

    const prerequisiteFor = await prisma.course_prerequisites.findMany({
      where: { prerequisite_code: code },
    });

    if (prerequisiteFor.length > 0) {
      return res.status(400).json({
        error: "Cannot delete course; it is a prerequisite for other modules.",
      });
    }

    await prisma.course_prerequisites.deleteMany({
      where: { course_code: code },
    });

    const deletedCourse = await prisma.courses.delete({
      where: { code },
    });

    res.status(200).json(deletedCourse);
  } catch (err) {
    logger.error("Error deleting course:", err);
    logger.error("Error details:", { code: err.code, message: err.message });
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Course not found." });
    }
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

// POST /api/courses/lectures
export const createLecture = async (req, res) => {
  try {
    const {
      offeringId,
      instructorId,
      capacity,
      dayOfWeek,
      startTime,
      endTime,
      location,
      group,
    } = req.body;

    // Validate required fields
    if (
      !offeringId ||
      !instructorId ||
      !capacity ||
      !dayOfWeek ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "offeringId",
          "instructorId",
          "capacity",
          "dayOfWeek",
          "startTime",
          "endTime",
        ],
      });
    }

    // Verify course offering exists
    const offering = await prisma.course_offerings.findUnique({
      where: { offering_id: parseInt(offeringId) },
    });

    if (!offering) {
      return res.status(404).json({ error: "Course offering not found" });
    }

    // Verify instructor exists
    const instructor = await prisma.users.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }

    // Parse time strings (HH:MM) to DateTime
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startDateTime = new Date();
    startDateTime.setUTCHours(startHour, startMin, 0, 0);

    const endDateTime = new Date();
    endDateTime.setUTCHours(endHour, endMin, 0, 0);

    const newLecture = await prisma.lectures.create({
      data: {
        offering_id: parseInt(offeringId),
        instructor_id: instructorId,
        capacity: parseInt(capacity),
        day_of_week: dayOfWeek,
        start_time: startDateTime,
        end_time: endDateTime,
        location: location || null,
        group: group || null,
      },
      include: {
        course_offerings: {
          include: {
            courses: true,
          },
        },
        users: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Lecture created successfully",
      lecture: {
        lectureId: newLecture.lecture_id,
        courseName: newLecture.course_offerings.courses.name,
        courseCode: newLecture.course_offerings.course_code,
        instructor: newLecture.users.full_name,
        capacity: newLecture.capacity,
        dayOfWeek: newLecture.day_of_week,
        startTime: formatTime(newLecture.start_time),
        endTime: formatTime(newLecture.end_time),
        location: newLecture.location,
        group: newLecture.group,
      },
    });
  } catch (err) {
    logger.error("Error creating lecture:", err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

// POST /api/courses/tutorials-labs
export const createTutorialLab = async (req, res) => {
  try {
    const {
      offeringId,
      taId,
      type,
      capacity,
      dayOfWeek,
      startTime,
      endTime,
      location,
      group,
    } = req.body;

    // Validate required fields
    if (
      !offeringId ||
      !taId ||
      !type ||
      !capacity ||
      !dayOfWeek ||
      !startTime ||
      !endTime ||
      !group
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "offeringId",
          "taId",
          "type",
          "capacity",
          "dayOfWeek",
          "startTime",
          "endTime",
          "group",
        ],
      });
    }

    // Verify course offering exists
    const offering = await prisma.course_offerings.findUnique({
      where: { offering_id: parseInt(offeringId) },
    });

    if (!offering) {
      return res.status(404).json({ error: "Course offering not found" });
    }

    // Verify TA exists
    const ta = await prisma.users.findUnique({
      where: { id: taId },
    });

    if (!ta) {
      return res.status(404).json({ error: "Teaching assistant not found" });
    }

    // Parse time strings (HH:MM) to DateTime
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startDateTime = new Date();
    startDateTime.setUTCHours(startHour, startMin, 0, 0);

    const endDateTime = new Date();
    endDateTime.setUTCHours(endHour, endMin, 0, 0);

    const newTutorialLab = await prisma.tutorials_labs.create({
      data: {
        offering_id: parseInt(offeringId),
        ta_id: taId,
        type: type,
        capacity: parseInt(capacity),
        day_of_week: dayOfWeek,
        start_time: startDateTime,
        end_time: endDateTime,
        location: location || null,
        group: group,
      },
      include: {
        course_offerings: {
          include: {
            courses: true,
          },
        },
        users: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Tutorial/Lab created successfully",
      tutorialLab: {
        tutorialLabId: newTutorialLab.tutorial_lab_id,
        courseName: newTutorialLab.course_offerings.courses.name,
        courseCode: newTutorialLab.course_offerings.course_code,
        ta: newTutorialLab.users.full_name,
        type: newTutorialLab.type,
        capacity: newTutorialLab.capacity,
        dayOfWeek: newTutorialLab.day_of_week,
        startTime: formatTime(newTutorialLab.start_time),
        endTime: formatTime(newTutorialLab.end_time),
        location: newTutorialLab.location,
        group: newTutorialLab.group,
      },
    });
  } catch (err) {
    logger.error("Error creating tutorial/lab:", err);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};
