import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import { sendNotification } from "../utils/notificationService.js";
import { computeYearLevel } from "../utils/academicRules.js";
import { invalidateByPattern } from "../services/cacheService.js";

// Map letter grades to grade points (standard 4.0 scale)
const GRADE_POINTS = {
  A: 4.0,
  "A-": 3.67,
  "B+": 3.33,
  B: 3.0,
  "B-": 2.67,
  "C+": 2.33,
  C: 2.0,
  "C-": 1.67,
  "D+": 1.33,
  D: 1.0,
  F: 0.0,
};

/**
 * Compute a letter grade from a total score out of 100.
 * Also returns the equivalent grade points (GPA for this course).
 */
function computeGrade(total) {
  if (total >= 90) return { letter: "A", points: 4.0 };
  if (total >= 85 && total < 90) return { letter: "A-", points: 3.67 };
  if (total >= 80 && total < 85) return { letter: "B+", points: 3.33 };
  if (total >= 75 && total < 80) return { letter: "B", points: 3.0 };
  if (total >= 70 && total < 75) return { letter: "B-", points: 2.67 };
  if (total >= 65 && total < 70) return { letter: "C+", points: 2.33 };
  if (total >= 60 && total < 65) return { letter: "C", points: 2.0 };
  if (total >= 56 && total < 60) return { letter: "C-", points: 1.67 };
  if (total >= 52 && total < 56) return { letter: "D+", points: 1.33 };
  if (total >= 50 && total < 52) return { letter: "D", points: 1.0 };
  return { letter: "F", points: 0.0 };
}

/**
 * Recalculate and persist a student's CGPA based on all graded enrollments.
 * @returns {number|null} new CGPA
 */
async function recalculateCgpa(studentUserId) {
  const allEnrollments = await prisma.enrollments.findMany({
    where: {
      student_user_id: studentUserId,
      status: { in: ["enrolled", "completed"] },
    },
    include: {
      lectures: {
        include: {
          course_offerings: { include: { courses: true } },
        },
      },
    },
  });

  let totalPoints = 0;
  let totalCredits = 0;

  for (const e of allEnrollments) {
    const gp = GRADE_POINTS[e.grade];
    const credits = e.lectures?.course_offerings?.courses?.credits;
    if (gp !== undefined && credits) {
      totalPoints += gp * credits;
      totalCredits += credits;
    }
  }

  const newCgpa =
    totalCredits > 0
      ? parseFloat((totalPoints / totalCredits).toFixed(2))
      : null;

  const yearLevel = computeYearLevel(totalCredits);

  await prisma.student_profiles.updateMany({
    where: { user_id: studentUserId },
    data: {
      cgpa: newCgpa,
      year_level: yearLevel,
      ...(totalCredits > 0 && { total_credits: totalCredits }),
    },
  });

  return newCgpa;
}

/**
 * Shared helper: apply score/grade updates, notify student, recalculate CGPA.
 * Returns { updated, total_score, grade_points } for the response.
 */
async function applyGradeUpdate(enrollment, updateData, io) {
  // Strip internal tracking keys before persisting
  const { _total, _grade_points, ...dbData } = updateData;

  const updated = await prisma.enrollments.update({
    where: { id: enrollment.id },
    data: dbData,
  });

  const courseName =
    enrollment.lectures?.course_offerings?.courses?.name || "a course";

  // Always notify when scores change
  await sendNotification({
    userId: enrollment.student_user_id,
    message: `Your grades for ${courseName} have been updated. Total: ${
      _total ?? "—"
    }/100 — Grade: ${dbData.grade ?? "pending"}${
      dbData.status === "completed"
        ? " — your enrollment is now completed."
        : "."
    }`,
    type: "new_grade",
    io,
  });

  // Recalculate CGPA whenever a letter grade is now set
  if (updateData.grade) {
    const newCgpa = await recalculateCgpa(enrollment.student_user_id);

    if (newCgpa !== null) {
      const top3 = await prisma.student_profiles.findMany({
        orderBy: { cgpa: "desc" },
        take: 3,
        select: { user_id: true },
      });

      const isInTop3 = top3.some(
        (p) => p.user_id === enrollment.student_user_id,
      );
      if (isInTop3) {
        await sendNotification({
          userId: enrollment.student_user_id,
          message:
            "Congratulations! You've entered the top 3 students on the leaderboard!",
          type: "general",
          io,
        });
      }
    }
  }

  // Strip the internal _total key before returning
  return {
    updated,
    total_score: _total ?? null,
    grade_points: _grade_points ?? null,
  };
}

/**
 * Build the score update payload from request body.
 * Grade is ALWAYS auto-computed from the total — never accepted from the caller.
 *
 * Merges provided scores with the student's current enrollment values so a
 * partial update (e.g. only mid_score) still produces a correct total once
 * all three scores are present.
 *
 * If a grade_distribution is provided, each score is validated against its max.
 * Otherwise falls back to validating that the partial total ≤ 100.
 *
 * Attaches `_total` and `_grade_points` as internal keys (prefixed with _)
 * so they travel through to the response without being persisted.
 */
function buildUpdateData(body, currentEnrollment, distribution = null) {
  const { mid_score, work_score, final_score } = body;
  const updateData = {};

  if (mid_score !== undefined) updateData.mid_score = parseFloat(mid_score);
  if (work_score !== undefined) updateData.work_score = parseFloat(work_score);
  if (final_score !== undefined)
    updateData.final_score = parseFloat(final_score);

  // Reject negative scores
  for (const [key, val] of Object.entries(updateData)) {
    if (val < 0) {
      return { validationError: `${key} cannot be negative.` };
    }
  }

  // Validate against grade distribution if set
  if (distribution) {
    if (
      updateData.work_score !== undefined &&
      updateData.work_score > distribution.work_max
    ) {
      return {
        validationError: `work_score cannot exceed the distribution max of ${distribution.work_max}.`,
      };
    }
    if (
      updateData.mid_score !== undefined &&
      updateData.mid_score > distribution.mid_max
    ) {
      return {
        validationError: `mid_score cannot exceed the distribution max of ${distribution.mid_max}.`,
      };
    }
    if (
      updateData.final_score !== undefined &&
      updateData.final_score > distribution.final_max
    ) {
      return {
        validationError: `final_score cannot exceed the distribution max of ${distribution.final_max}.`,
      };
    }
  } else {
    // Fallback: validate partial total ≤ 100 when no distribution is set
    const effectiveMid = updateData.mid_score ?? currentEnrollment.mid_score;
    const effectiveWork = updateData.work_score ?? currentEnrollment.work_score;
    const effectiveFinal =
      updateData.final_score ?? currentEnrollment.final_score;

    const knownScores = [effectiveMid, effectiveWork, effectiveFinal].filter(
      (v) => v !== null && v !== undefined,
    );
    if (knownScores.length >= 2) {
      const partialTotal = knownScores.reduce((a, b) => a + b, 0);
      if (parseFloat(partialTotal.toFixed(2)) > 100) {
        return {
          validationError: `Total score exceeds 100. Current sum of provided scores: ${partialTotal.toFixed(
            2,
          )}.`,
        };
      }
    }
  }

  // Effective values after merging with stored scores
  const effectiveMid = updateData.mid_score ?? currentEnrollment.mid_score;
  const effectiveWork = updateData.work_score ?? currentEnrollment.work_score;
  const effectiveFinal =
    updateData.final_score ?? currentEnrollment.final_score;

  // Compute grade only when all three scores are available
  if (
    effectiveMid !== null &&
    effectiveMid !== undefined &&
    effectiveWork !== null &&
    effectiveWork !== undefined &&
    effectiveFinal !== null &&
    effectiveFinal !== undefined
  ) {
    const total = parseFloat(
      (effectiveMid + effectiveWork + effectiveFinal).toFixed(2),
    );
    const { letter, points } = computeGrade(total);
    updateData.grade = letter;
    updateData.status = "completed"; // all scores entered — mark enrollment as completed
    updateData._total = total;
    updateData._grade_points = points;
  }

  return { updateData };
}

/**
 * PUT /api/v1/grades/lecture/:lectureId/distribution
 * Set (upsert) the grade distribution for a lecture.
 * Accessible to: the lecture's instructor (doctor), admin, super_admin.
 * The sum of work_max + mid_max + final_max must equal 100.
 */
export const setGradeDistribution = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { work_max, mid_max, final_max } = req.body;
    const callerId = req.user.id;
    const callerRole = req.user.role;

    // Validate presence
    if (
      work_max === undefined ||
      mid_max === undefined ||
      final_max === undefined
    ) {
      return res.status(400).json({
        error: "work_max, mid_max, and final_max are all required.",
      });
    }

    const w = parseFloat(work_max);
    const m = parseFloat(mid_max);
    const f = parseFloat(final_max);

    if ([w, m, f].some((v) => isNaN(v) || v < 0)) {
      return res.status(400).json({
        error: "work_max, mid_max, and final_max must be non-negative numbers.",
      });
    }

    const total = parseFloat((w + m + f).toFixed(2));
    if (total !== 100) {
      return res.status(400).json({
        error: `work_max + mid_max + final_max must equal 100. Got ${total}.`,
      });
    }

    const lecture = await prisma.lectures.findUnique({
      where: { lecture_id: parseInt(lectureId) },
    });

    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found." });
    }

    if (callerRole === "doctor" && lecture.instructor_id !== callerId) {
      return res.status(403).json({
        error: "You are not the instructor for this lecture.",
      });
    }

    const distribution = await prisma.grade_distributions.upsert({
      where: { lecture_id: parseInt(lectureId) },
      update: { work_max: w, mid_max: m, final_max: f },
      create: {
        lecture_id: parseInt(lectureId),
        work_max: w,
        mid_max: m,
        final_max: f,
      },
    });

    logger.info(
      `Grade distribution set for lecture ${lectureId} by ${callerId}`,
    );

    return res.status(200).json({
      message: "Grade distribution saved successfully.",
      distribution,
    });
  } catch (err) {
    logger.error("Error setting grade distribution:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/v1/grades/lecture/:lectureId/distribution
 * Get the grade distribution for a lecture.
 * Accessible to: the lecture's instructor (doctor), admin, super_admin.
 */
export const getGradeDistribution = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const callerId = req.user.id;
    const callerRole = req.user.role;

    const lecture = await prisma.lectures.findUnique({
      where: { lecture_id: parseInt(lectureId) },
    });

    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found." });
    }

    if (callerRole === "doctor" && lecture.instructor_id !== callerId) {
      return res.status(403).json({
        error: "You are not the instructor for this lecture.",
      });
    }

    const distribution = await prisma.grade_distributions.findUnique({
      where: { lecture_id: parseInt(lectureId) },
    });

    if (!distribution) {
      return res.status(404).json({
        error: "No grade distribution set for this lecture yet.",
      });
    }

    return res.status(200).json({ distribution });
  } catch (err) {
    logger.error("Error fetching grade distribution:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/v1/grades/tutorial-lab/:tutorialLabId/distribution
 * Get the linked lecture grade distribution(s) for a tutorial/lab.
 * Accessible to: tutorial/lab TA, admin, super_admin.
 */
export const getTutorialLabGradeDistribution = async (req, res) => {
  try {
    const { tutorialLabId } = req.params;
    const callerId = req.user.id;
    const callerRole = req.user.role;

    const tutorialLab = await prisma.tutorials_labs.findUnique({
      where: { tutorial_lab_id: parseInt(tutorialLabId) },
    });

    if (!tutorialLab) {
      return res.status(404).json({ error: "Tutorial/Lab not found." });
    }

    if (callerRole === "teaching_assistant" && tutorialLab.ta_id !== callerId) {
      return res.status(403).json({
        error: "You are not the TA for this tutorial/lab.",
      });
    }

    const enrollments = await prisma.enrollments.findMany({
      where: { tutorial_lab_id: parseInt(tutorialLabId) },
      select: { lecture_id: true },
      distinct: ["lecture_id"],
    });

    const lectureIds = enrollments
      .map((e) => e.lecture_id)
      .filter((id) => id !== null && id !== undefined);

    if (lectureIds.length === 0) {
      return res.status(404).json({
        error: "No linked lecture distributions found for this tutorial/lab.",
      });
    }

    const distributions = await prisma.grade_distributions.findMany({
      where: { lecture_id: { in: lectureIds } },
      select: {
        lecture_id: true,
        work_max: true,
        mid_max: true,
        final_max: true,
      },
      orderBy: { lecture_id: "asc" },
    });

    if (distributions.length === 0) {
      return res.status(404).json({
        error: "No grade distribution set for linked lecture(s) yet.",
      });
    }

    return res.status(200).json({
      tutorial_lab_id: parseInt(tutorialLabId),
      linked_lectures_count: distributions.length,
      distributions,
    });
  } catch (err) {
    logger.error("Error fetching tutorial/lab grade distributions:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PUT /api/v1/grades/lecture/:lectureId/student/:studentId
 * Update a specific student's grades within a lecture.
 * Accessible to: the lecture's instructor (doctor), admin, super_admin
 */
export const updateGradeByLecture = async (req, res) => {
  try {
    const { lectureId, studentId } = req.params;
    const io = req.app.get("io");
    const callerId = req.user.id;
    const callerRole = req.user.role;

    const lecture = await prisma.lectures.findUnique({
      where: { lecture_id: parseInt(lectureId) },
    });

    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found." });
    }

    if (callerRole === "doctor" && lecture.instructor_id !== callerId) {
      return res.status(403).json({
        error: "You are not the instructor for this lecture.",
      });
    }

    const enrollment = await prisma.enrollments.findFirst({
      where: {
        lecture_id: parseInt(lectureId),
        student_user_id: studentId,
      },
      include: {
        lectures: {
          include: {
            course_offerings: { include: { courses: true } },
          },
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        error: "No enrollment found for this student in the given lecture.",
      });
    }

    // Fetch grade distribution for this lecture (if set)
    const distribution = await prisma.grade_distributions.findUnique({
      where: { lecture_id: parseInt(lectureId) },
    });

    const { updateData, validationError } = buildUpdateData(
      req.body,
      enrollment,
      distribution,
    );

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (
      Object.keys(updateData).filter((k) => !k.startsWith("_")).length === 0
    ) {
      return res.status(400).json({ error: "No updatable fields provided." });
    }

    const { updated, total_score, grade_points } = await applyGradeUpdate(
      enrollment,
      updateData,
      io,
    );

    // Invalidate leaderboard + alert caches whenever a grade changes
    await Promise.all([
      invalidateByPattern("v1:leaderboard:gpa:*"),
      invalidateByPattern("v1:doctor:alerts:*"),
      invalidateByPattern("v1:ta:alerts:*"),
      invalidateByPattern("v1:admin:alerts"),
      invalidateByPattern("v1:grades:*"),
    ]);

    return res.status(200).json({
      message: "Grade updated successfully.",
      enrollment: updated,
      ...(distribution && {
        grade_distribution: {
          work_max: distribution.work_max,
          mid_max: distribution.mid_max,
          final_max: distribution.final_max,
        },
      }),
      ...(total_score !== null && { total_score, grade_points }),
    });
  } catch (err) {
    logger.error("Error updating lecture grade:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PUT /api/v1/grades/tutorial-lab/:tutorialLabId/student/:studentId
 * Update a specific student's grades within a tutorial/lab.
 * Accessible to: doctor, the tutorial/lab's TA, admin, super_admin
 */
export const updateGradeByTutorialLab = async (req, res) => {
  try {
    const { tutorialLabId, studentId } = req.params;
    const io = req.app.get("io");
    const callerId = req.user.id;
    const callerRole = req.user.role;

    const tutorialLab = await prisma.tutorials_labs.findUnique({
      where: { tutorial_lab_id: parseInt(tutorialLabId) },
    });

    if (!tutorialLab) {
      return res.status(404).json({ error: "Tutorial/Lab not found." });
    }

    if (callerRole === "teaching_assistant" && tutorialLab.ta_id !== callerId) {
      return res.status(403).json({
        error: "You are not the TA for this tutorial/lab.",
      });
    }

    const enrollment = await prisma.enrollments.findFirst({
      where: {
        tutorial_lab_id: parseInt(tutorialLabId),
        student_user_id: studentId,
      },
      include: {
        lectures: {
          include: {
            course_offerings: { include: { courses: true } },
          },
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        error:
          "No enrollment found for this student in the given tutorial/lab.",
      });
    }

    // TA can only update work_score from tutorial/lab endpoint.
    if (
      callerRole === "teaching_assistant" &&
      (req.body.mid_score !== undefined || req.body.final_score !== undefined)
    ) {
      return res.status(403).json({
        error:
          "Teaching assistants can only modify work_score in this endpoint.",
      });
    }

    // Doctor can update all scores, but only for students in lectures they teach.
    if (callerRole === "doctor") {
      const lecture = enrollment.lecture_id
        ? await prisma.lectures.findUnique({
            where: { lecture_id: enrollment.lecture_id },
            select: { instructor_id: true },
          })
        : null;

      if (!lecture || lecture.instructor_id !== callerId) {
        return res.status(403).json({
          error:
            "You are not the instructor for this student's linked lecture.",
        });
      }
    }

    // Fetch grade distribution via the enrollment's lecture (if set)
    const distribution = enrollment.lecture_id
      ? await prisma.grade_distributions.findUnique({
          where: { lecture_id: enrollment.lecture_id },
        })
      : null;

    const { updateData, validationError } = buildUpdateData(
      req.body,
      enrollment,
      distribution,
    );

    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (
      Object.keys(updateData).filter((k) => !k.startsWith("_")).length === 0
    ) {
      return res.status(400).json({ error: "No updatable fields provided." });
    }

    const { updated, total_score, grade_points } = await applyGradeUpdate(
      enrollment,
      updateData,
      io,
    );

    // Invalidate leaderboard + alert caches whenever a grade changes
    await Promise.all([
      invalidateByPattern("v1:leaderboard:gpa:*"),
      invalidateByPattern("v1:doctor:alerts:*"),
      invalidateByPattern("v1:ta:alerts:*"),
      invalidateByPattern("v1:admin:alerts"),
      invalidateByPattern("v1:grades:*"),
    ]);

    return res.status(200).json({
      message: "Grade updated successfully.",
      enrollment: updated,
      ...(distribution && {
        grade_distribution: {
          work_max: distribution.work_max,
          mid_max: distribution.mid_max,
          final_max: distribution.final_max,
        },
      }),
      ...(total_score !== null && { total_score, grade_points }),
    });
  } catch (err) {
    logger.error("Error updating tutorial/lab grade:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/v1/grades/lecture/:lectureId
 * List all students' grades for a specific lecture.
 * Doctor who owns the lecture, or Admin/Super Admin.
 */
export const getGradesByLecture = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const callerId = req.user.id;
    const callerRole = req.user.role;

    const lecture = await prisma.lectures.findUnique({
      where: { lecture_id: parseInt(lectureId) },
      include: { course_offerings: { include: { courses: true } } },
    });

    if (!lecture) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    if (callerRole === "doctor" && lecture.instructor_id !== callerId) {
      return res.status(403).json({
        error: "You are not the instructor for this lecture.",
      });
    }

    const enrollments = await prisma.enrollments.findMany({
      where: { lecture_id: parseInt(lectureId) },
      include: {
        users: {
          select: { id: true, full_name: true, email: true },
        },
        tutorials_labs: {
          select: { tutorial_lab_id: true, group: true, type: true },
        },
      },
      orderBy: { users: { full_name: "asc" } },
    });

    return res.status(200).json({
      lecture_id: lecture.lecture_id,
      course: lecture.course_offerings.courses.name,
      course_code: lecture.course_offerings.course_code,
      group: lecture.group,
      total: enrollments.length,
      students: enrollments.map((e) => ({
        enrollment_id: e.id,
        student_id: e.users.id,
        full_name: e.users.full_name,
        email: e.users.email,
        lab_group: e.tutorials_labs?.group ?? null,
        mid_score: e.mid_score,
        work_score: e.work_score,
        final_score: e.final_score,
        grade: e.grade,
      })),
    });
  } catch (err) {
    logger.error("Error fetching lecture grades:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/v1/grades/tutorial-lab/:tutorialLabId
 * List all students' grades for a specific tutorial/lab.
 * TA who owns the tutorial/lab, or Admin/Super Admin.
 */
export const getGradesByTutorialLab = async (req, res) => {
  try {
    const { tutorialLabId } = req.params;
    const callerId = req.user.id;
    const callerRole = req.user.role;

    const tutorialLab = await prisma.tutorials_labs.findUnique({
      where: { tutorial_lab_id: parseInt(tutorialLabId) },
      include: { course_offerings: { include: { courses: true } } },
    });

    if (!tutorialLab) {
      return res.status(404).json({ error: "Tutorial/Lab not found" });
    }

    if (callerRole === "teaching_assistant" && tutorialLab.ta_id !== callerId) {
      return res.status(403).json({
        error: "You are not the TA for this tutorial/lab.",
      });
    }

    const enrollments = await prisma.enrollments.findMany({
      where: { tutorial_lab_id: parseInt(tutorialLabId) },
      include: {
        users: {
          select: { id: true, full_name: true, email: true },
        },
        lectures: {
          include: {
            course_offerings: { include: { courses: true } },
          },
        },
      },
      orderBy: { users: { full_name: "asc" } },
    });

    return res.status(200).json({
      tutorial_lab_id: tutorialLab.tutorial_lab_id,
      course: tutorialLab.course_offerings.courses.name,
      course_code: tutorialLab.course_offerings.course_code,
      type: tutorialLab.type,
      group: tutorialLab.group,
      total: enrollments.length,
      students: enrollments.map((e) => ({
        enrollment_id: e.id,
        student_id: e.users.id,
        full_name: e.users.full_name,
        email: e.users.email,
        lecture_group: e.lectures?.group ?? null,
        mid_score: e.mid_score,
        work_score: e.work_score,
        final_score: e.final_score,
        grade: e.grade,
      })),
    });
  } catch (err) {
    logger.error("Error fetching tutorial/lab grades:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Ordered position of each semester within a year (for chronological sorting)
const SEMESTER_ORDER = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 };
const VALID_SEMESTERS = ["Spring", "Summer", "Fall", "Winter"];

/**
 * GET /api/v1/grades/my/semester-gpa?year=&semester=
 * Returns the GPA for a specific year-semester for the logged-in student.
 * Admin / super_admin can pass ?studentId= to query any student.
 */
/**
 * GET /api/v1/grades/my/distribution
 * Returns how many times the authenticated student received each letter grade
 * across all completed enrollments.
 */
export const getMyGradeDistribution = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await prisma.enrollments.findMany({
      where: {
        student_user_id: userId,
        status: "completed",
        grade: { not: null },
      },
      select: { grade: true },
    });

    const map = {};
    for (const en of enrollments) {
      const g = en.grade.trim();
      map[g] = (map[g] || 0) + 1;
    }

    const distribution = Object.entries(map)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => a.grade.localeCompare(b.grade));

    res.status(200).json({ distribution });
  } catch (err) {
    logger.error("Error fetching student grade distribution:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMySemesterGpa = async (req, res) => {
  try {
    const studentId = req.user.id;

    const { year, semester } = req.query;

    if (!year || !semester) {
      return res.status(400).json({
        error: "year and semester query parameters are required.",
      });
    }

    const yearInt = parseInt(year);
    if (isNaN(yearInt)) {
      return res.status(400).json({ error: "year must be an integer." });
    }

    if (!VALID_SEMESTERS.includes(semester)) {
      return res.status(400).json({
        error: `semester must be one of: ${VALID_SEMESTERS.join(", ")}.`,
      });
    }

    const enrollments = await prisma.enrollments.findMany({
      where: {
        student_user_id: studentId,
        grade: { not: null },
        lectures: {
          course_offerings: {
            year: yearInt,
            semester: semester,
          },
        },
      },
      include: {
        lectures: {
          include: {
            course_offerings: {
              include: {
                courses: {
                  select: {
                    code: true,
                    name: true,
                    credits: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    let totalPoints = 0;
    let totalCredits = 0;
    const courses = [];

    for (const e of enrollments) {
      const co = e.lectures?.course_offerings;
      const gp = GRADE_POINTS[e.grade];
      const credits = co?.courses?.credits;
      if (gp !== undefined && credits) {
        totalPoints += gp * credits;
        totalCredits += credits;
        courses.push({
          course_code: co.course_code,
          course_name: co.courses.name,
          credits,
          grade: e.grade,
          grade_points: gp,
        });
      }
    }

    const semester_gpa =
      totalCredits > 0
        ? parseFloat((totalPoints / totalCredits).toFixed(2))
        : null;

    return res.status(200).json({
      year: yearInt,
      semester,
      semester_gpa,
      total_credits: totalCredits,
      courses_with_grade: courses.length,
      courses,
    });
  } catch (err) {
    logger.error("Error fetching semester GPA:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/v1/grades/my/cgpa-trend
 * Returns the GPA trend across all semesters for the logged-in student.
 * Also reflects the current student profile CGPA.
 * Admin / super_admin can pass ?studentId= to query any student.
 */
export const getMyCgpaTrend = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrollments = await prisma.enrollments.findMany({
      where: {
        student_user_id: studentId,
        grade: { not: null },
      },
      include: {
        lectures: {
          include: {
            course_offerings: {
              include: {
                courses: { select: { credits: true } },
              },
            },
          },
        },
      },
    });

    // Group enrollments by (year, semester)
    const semesterMap = new Map();

    for (const e of enrollments) {
      const co = e.lectures?.course_offerings;
      if (!co) continue;
      const key = `${co.year}-${co.semester}`;
      if (!semesterMap.has(key)) {
        semesterMap.set(key, {
          year: co.year,
          semester: co.semester,
          totalPoints: 0,
          totalCredits: 0,
          courses_count: 0,
        });
      }
      const entry = semesterMap.get(key);
      const gp = GRADE_POINTS[e.grade];
      const credits = co.courses?.credits;
      if (gp !== undefined && credits) {
        entry.totalPoints += gp * credits;
        entry.totalCredits += credits;
        entry.courses_count += 1;
      }
    }

    // Sort chronologically: year asc, then by semester position within the year
    const sorted = Array.from(semesterMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (
        (SEMESTER_ORDER[a.semester] ?? 0) - (SEMESTER_ORDER[b.semester] ?? 0)
      );
    });

    // Build the trend with per-semester GPA and running cumulative CGPA
    let cumulativePoints = 0;
    let cumulativeCredits = 0;

    const trend = sorted.map((s) => {
      cumulativePoints += s.totalPoints;
      cumulativeCredits += s.totalCredits;

      const semester_gpa =
        s.totalCredits > 0
          ? parseFloat((s.totalPoints / s.totalCredits).toFixed(2))
          : null;

      const cumulative_cgpa =
        cumulativeCredits > 0
          ? parseFloat((cumulativePoints / cumulativeCredits).toFixed(2))
          : null;

      return {
        year: s.year,
        semester: s.semester,
        semester_gpa,
        cumulative_cgpa,
        credits_earned: s.totalCredits,
        courses_count: s.courses_count,
      };
    });

    const current_cgpa =
      trend.length > 0 ? trend[trend.length - 1].cumulative_cgpa : null;

    return res.status(200).json({
      current_cgpa,
      total_semesters: trend.length,
      trend,
    });
  } catch (err) {
    logger.error("Error fetching CGPA trend:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
