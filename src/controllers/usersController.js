import { prisma } from "../config/connection.js";
import bcrypt from "bcrypt";
import logger from "../utils/logger.js";
import { supabase } from "../utils/supabase.js";
import path from "path";
import {
  countDataRowsFromExcelBuffer,
  processExcelStudentsBuffer,
  processExcelUsersBuffer,
} from "../utils/userImportService.js";
import {
  enqueueUserImportJob,
  getUserImportJobStatus,
  isUserImportQueueEnabled,
} from "../utils/userImportQueue.js";

const EXCEL_IMPORT_ASYNC_THRESHOLD = process.env.EXCEL_IMPORT_ASYNC_THRESHOLD
  ? Number.parseInt(process.env.EXCEL_IMPORT_ASYNC_THRESHOLD, 10)
  : 200;

const GENERAL_GROUP_NAME = "General";
const DAYS_ORDER = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const SEMESTER_ORDER = { Spring: 1, Summer: 2, Fall: 3, Winter: 4 };

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

  return dayMap[String(day || "").toLowerCase()] || day;
};

const formatTeacherSlotTime = (time) => {
  if (!time) return null;

  if (typeof time === "string" && time.match(/^\d{2}:\d{2}/)) {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  }

  return new Date(time).toLocaleTimeString("en-US", {
    timeZone: "Africa/Cairo",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const ensureUserInGeneralGroup = async (userId) => {
  let generalGroup = await prisma.community_groups.findFirst({
    where: { name: GENERAL_GROUP_NAME },
    orderBy: { id: "asc" },
  });

  if (!generalGroup) {
    generalGroup = await prisma.community_groups.create({
      data: {
        name: GENERAL_GROUP_NAME,
        description: "Default group for all users",
      },
    });
  }

  await prisma.group_members.upsert({
    where: {
      group_id_user_id: {
        group_id: generalGroup.id,
        user_id: userId,
      },
    },
    update: {},
    create: {
      group_id: generalGroup.id,
      user_id: userId,
    },
  });
};

// ── GET /users/management/students ───────────────────────────────────────────
// Returns both students and leaders (leaders are students with elevated role).
export const getStudentsForManagement = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const roleWhere = { in: ["student", "leader"] };

    const [students, total] = await prisma.$transaction([
      prisma.users.findMany({
        where: { role: roleWhere },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          national_id: true,
          address: true,
          role: true,
          avatar_url: true,
          created_at: true,
          student_profiles: {
            select: {
              student_id: true,
              year_level: true,
              departments: { select: { name: true } },
            },
          },
        },
        orderBy: { full_name: "asc" },
        skip,
        take: limit,
      }),
      prisma.users.count({ where: { role: roleWhere } }),
    ]);

    res.status(200).json({
      data: students,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/leaders ────────────────────────────────────────────
// Returns all batch representatives (role = "leader").
export const getLeaders = async (req, res) => {
  try {
    const leaders = await prisma.users.findMany({
      where: { role: "leader" },
      select: {
        id: true,
        full_name: true,
        email: true,
        avatar_url: true,
        created_at: true,
        student_profiles: {
          select: {
            student_id: true,
            year_level: true,
            departments: {
              select: { department_id: true, name: true },
            },
          },
        },
      },
      orderBy: [
        { student_profiles: { year_level: "asc" } },
        { full_name: "asc" },
      ],
    });

    res.status(200).json({ leaders });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/admins ────────────────────────────────────────────
// Returns all admin users.
export const getAdminsForManagement = async (req, res) => {
  try {
    const admins = await prisma.users.findMany({
      where: { role: "admin" },
      select: {
        id: true,
        full_name: true,
        email: true,
        national_id: true,
        phone: true,
        address: true,
        avatar_url: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({ admins });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── PATCH /users/students/:id/role ────────────────────────────────────────────
// Promotes a student to leader or demotes a leader back to student.
export const setStudentRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["student", "leader"].includes(role)) {
      return res.status(400).json({
        error: 'role must be either "student" or "leader"',
      });
    }

    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, role: true, full_name: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!["student", "leader"].includes(user.role)) {
      return res.status(400).json({
        error:
          "Only students or leaders can have their role changed with this endpoint",
      });
    }

    if (user.role === role) {
      return res.status(400).json({
        error: `User is already a ${role}`,
      });
    }

    const updated = await prisma.users.update({
      where: { id },
      data: { role },
      select: { id: true, full_name: true, email: true, role: true },
    });

    res.status(200).json({
      message: `User role updated to ${role} successfully`,
      user: updated,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/staff ───────────────────────────────────────────────
export const getStaffForManagement = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const validRoles = ["doctor", "teaching_assistant"];
    const roleFilter = req.query.role;
    const roleWhere = validRoles.includes(roleFilter)
      ? roleFilter
      : { in: validRoles };

    const [staffRaw, total] = await prisma.$transaction([
      prisma.users.findMany({
        where: { role: roleWhere },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          national_id: true,
          address: true,
          role: true,
          avatar_url: true,
          created_at: true,
          lectures: {
            select: {
              offering_id: true,
              course_offerings: {
                select: {
                  courses: {
                    select: {
                      departments: {
                        select: { name: true },
                      },
                    },
                  },
                },
              },
            },
          },
          tutorials_labs: {
            select: { offering_id: true },
          },
        },
        orderBy: { full_name: "asc" },
        skip,
        take: limit,
      }),
      prisma.users.count({ where: { role: roleWhere } }),
    ]);

    const data = staffRaw.map(({ lectures, tutorials_labs, ...member }) => ({
      ...member,
      department:
        lectures[0]?.course_offerings?.courses?.departments?.name ?? null,
      courses_count: new Set([
        ...lectures.map((l) => l.offering_id),
        ...tutorials_labs.map((t) => t.offering_id),
      ]).size,
    }));

    res.status(200).json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/students/:studentId/profile ──────────────────────
export const getStudentProfileByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await prisma.users.findFirst({
      where: {
        role: { in: ["student", "leader"] },
        student_profiles: {
          is: {
            student_id: studentId,
          },
        },
      },
      select: {
        full_name: true,
        email: true,
        phone: true,
        address: true,
        avatar_url: true,
        student_profiles: {
          select: {
            student_id: true,
            year_level: true,
            cgpa: true,
            departments: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!student || !student.student_profiles) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    return res.status(200).json({
      student: {
        name: student.full_name,
        student_id: student.student_profiles.student_id,
        avatar_url: student.avatar_url,
        email: student.email,
        phone: student.phone,
        address: student.address,
        department: student.student_profiles.departments?.name ?? null,
        year: student.student_profiles.year_level,
        cgpa: student.student_profiles.cgpa,
      },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/students/:studentId/grades-history ───────────────
export const getStudentGradesHistoryByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const studentProfile = await prisma.student_profiles.findUnique({
      where: { student_id: studentId },
      select: {
        student_id: true,
        user_id: true,
        users: {
          select: {
            role: true,
          },
        },
      },
    });

    if (
      !studentProfile ||
      !studentProfile.users ||
      !["student", "leader"].includes(studentProfile.users.role)
    ) {
      return res.status(404).json({ error: "Student profile not found" });
    }

    const enrollments = await prisma.enrollments.findMany({
      where: {
        student_user_id: studentProfile.user_id,
        grade: { not: null },
      },
      select: {
        grade: true,
        lectures: {
          select: {
            course_offerings: {
              select: {
                course_code: true,
                semester: true,
                year: true,
                courses: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const grades_history = enrollments
      .map((enrollment) => {
        const offering = enrollment.lectures?.course_offerings;

        if (!offering) {
          return null;
        }

        return {
          course_code: offering.course_code,
          course_name: offering.courses?.name ?? null,
          semester: offering.semester,
          year: offering.year,
          grade: enrollment.grade,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (
          (SEMESTER_ORDER[b.semester] ?? 0) - (SEMESTER_ORDER[a.semester] ?? 0)
        );
      });

    return res.status(200).json({
      student_id: studentProfile.student_id,
      grades_history,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/doctors/:userId/profile ──────────────────────────
export const getDoctorProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const doctor = await prisma.users.findFirst({
      where: {
        id: userId,
        role: "doctor",
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        address: true,
        avatar_url: true,
        lectures: {
          take: 1,
          select: {
            course_offerings: {
              select: {
                courses: {
                  select: {
                    departments: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    return res.status(200).json({
      doctor: {
        name: doctor.full_name,
        id: doctor.id,
        avatar_url: doctor.avatar_url,
        email: doctor.email,
        phone: doctor.phone,
        address: doctor.address,
        department:
          doctor.lectures[0]?.course_offerings?.courses?.departments?.name ??
          null,
      },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/doctors/:userId/courses ──────────────────────────
export const getDoctorCoursesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const doctor = await prisma.users.findFirst({
      where: {
        id: userId,
        role: "doctor",
      },
      select: {
        id: true,
        full_name: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const lectures = await prisma.lectures.findMany({
      where: {
        instructor_id: userId,
      },
      select: {
        lecture_id: true,
        day_of_week: true,
        start_time: true,
        end_time: true,
        location: true,
        course_offerings: {
          select: {
            course_code: true,
            courses: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const scheduleMap = new Map();

    lectures.forEach((lecture) => {
      const day = normalizeDayName(lecture.day_of_week);

      if (!scheduleMap.has(day)) {
        scheduleMap.set(day, []);
      }

      scheduleMap.get(day).push({
        lectureId: lecture.lecture_id,
        startTime: formatTeacherSlotTime(lecture.start_time),
        endTime: formatTeacherSlotTime(lecture.end_time),
        courseCode: lecture.course_offerings.course_code,
        courseName: lecture.course_offerings.courses.name,
        location: lecture.location || "TBA",
        type: "lecture",
        _sortValue: lecture.start_time,
      });
    });

    const schedule = DAYS_ORDER.map((day) => {
      const slots = (scheduleMap.get(day) || [])
        .sort((a, b) => new Date(a._sortValue) - new Date(b._sortValue))
        .map(({ _sortValue, ...slot }) => slot);

      return {
        day,
        slots,
      };
    });

    return res.status(200).json({
      teacherId: doctor.id,
      teacherName: doctor.full_name,
      schedule,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/teaching-assistants/:userId/profile ─────────────
export const getTeachingAssistantProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const teachingAssistant = await prisma.users.findFirst({
      where: {
        id: userId,
        role: "teaching_assistant",
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        address: true,
        avatar_url: true,
        tutorials_labs: {
          take: 1,
          select: {
            course_offerings: {
              select: {
                courses: {
                  select: {
                    departments: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        lectures: {
          take: 1,
          select: {
            course_offerings: {
              select: {
                courses: {
                  select: {
                    departments: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!teachingAssistant) {
      return res.status(404).json({ error: "Teaching assistant not found" });
    }

    return res.status(200).json({
      teaching_assistant: {
        name: teachingAssistant.full_name,
        id: teachingAssistant.id,
        avatar_url: teachingAssistant.avatar_url,
        email: teachingAssistant.email,
        phone: teachingAssistant.phone,
        address: teachingAssistant.address,
        department:
          teachingAssistant.tutorials_labs[0]?.course_offerings?.courses
            ?.departments?.name ??
          teachingAssistant.lectures[0]?.course_offerings?.courses?.departments
            ?.name ??
          null,
      },
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/management/teaching-assistants/:userId/courses ─────────────
export const getTeachingAssistantCoursesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const teachingAssistant = await prisma.users.findFirst({
      where: {
        id: userId,
        role: "teaching_assistant",
      },
      select: {
        id: true,
        full_name: true,
      },
    });

    if (!teachingAssistant) {
      return res.status(404).json({ error: "Teaching assistant not found" });
    }

    const [lectures, tutorialsLabs] = await Promise.all([
      prisma.lectures.findMany({
        where: {
          instructor_id: userId,
        },
        select: {
          lecture_id: true,
          day_of_week: true,
          start_time: true,
          end_time: true,
          location: true,
          course_offerings: {
            select: {
              course_code: true,
              courses: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.tutorials_labs.findMany({
        where: {
          ta_id: userId,
        },
        select: {
          tutorial_lab_id: true,
          day_of_week: true,
          start_time: true,
          end_time: true,
          location: true,
          type: true,
          course_offerings: {
            select: {
              course_code: true,
              courses: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const scheduleMap = new Map();

    lectures.forEach((lecture) => {
      const day = normalizeDayName(lecture.day_of_week);

      if (!scheduleMap.has(day)) {
        scheduleMap.set(day, []);
      }

      scheduleMap.get(day).push({
        lectureId: lecture.lecture_id,
        startTime: formatTeacherSlotTime(lecture.start_time),
        endTime: formatTeacherSlotTime(lecture.end_time),
        courseCode: lecture.course_offerings.course_code,
        courseName: lecture.course_offerings.courses.name,
        location: lecture.location || "TBA",
        type: "lecture",
        _sortValue: lecture.start_time,
      });
    });

    tutorialsLabs.forEach((tutorialLab) => {
      const day = normalizeDayName(tutorialLab.day_of_week);

      if (!scheduleMap.has(day)) {
        scheduleMap.set(day, []);
      }

      scheduleMap.get(day).push({
        tutorialLabId: tutorialLab.tutorial_lab_id,
        startTime: formatTeacherSlotTime(tutorialLab.start_time),
        endTime: formatTeacherSlotTime(tutorialLab.end_time),
        courseCode: tutorialLab.course_offerings.course_code,
        courseName: tutorialLab.course_offerings.courses.name,
        location: tutorialLab.location || "TBA",
        type: tutorialLab.type?.toLowerCase() || "tutorial",
        _sortValue: tutorialLab.start_time,
      });
    });

    const schedule = DAYS_ORDER.map((day) => {
      const slots = (scheduleMap.get(day) || [])
        .sort((a, b) => new Date(a._sortValue) - new Date(b._sortValue))
        .map(({ _sortValue, ...slot }) => slot);

      return {
        day,
        slots,
      };
    });

    return res.status(200).json({
      teacherId: teachingAssistant.id,
      teacherName: teachingAssistant.full_name,
      schedule,
    });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users ───────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        avatar_url: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });
    res.status(200).json({ users });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/profile ───────────────────────────────────────────────────────
// Returns current non-student user's profile.
export const getOwnProfile = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        avatar_url: true,
        phone: true,
        address: true,
        updated_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── PATCH /users/profile ─────────────────────────────────────────────────────
// Allows non-student users to update their own phone, address, and avatar.
export const updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const allowedFields = ["phone", "address"];
    const providedFields = Object.keys(req.body || {});
    const disallowedFields = providedFields.filter(
      (field) => !allowedFields.includes(field),
    );

    if (disallowedFields.length > 0) {
      return res.status(400).json({
        error: "Only phone, address, and avatar can be updated",
      });
    }

    const normalizeOptionalField = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }
      return value;
    };

    const { phone, address } = req.body;
    const avatarFile = req.file;

    const normalizedPhone = normalizeOptionalField(phone);
    const normalizedAddress = normalizeOptionalField(address);

    const data = {};

    if (normalizedPhone !== undefined) data.phone = normalizedPhone;
    if (normalizedAddress !== undefined) data.address = normalizedAddress;

    if (avatarFile) {
      const currentUser = await prisma.users.findUnique({
        where: { id: userId },
        select: { avatar_url: true },
      });

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const ext = path.extname(avatarFile.originalname);
      const fileName = `avatar_${userId}_${Date.now()}${ext}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile.buffer, {
          contentType: avatarFile.mimetype,
          upsert: true,
        });

      if (uploadError) {
        logger.error("Avatar upload error:", uploadError);
        return res.status(500).json({
          error: "Failed to upload avatar",
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      data.avatar_url = publicUrlData.publicUrl;

      if (currentUser?.avatar_url) {
        try {
          const oldPath = currentUser.avatar_url.split("/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([oldPath]);
          }
        } catch (deleteErr) {
          logger.warn("Failed to delete old avatar:", deleteErr);
        }
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "At least one field (phone, address, avatar) must be provided",
      });
    }

    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        avatar_url: true,
        phone: true,
        address: true,
        updated_at: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── POST /users ─────────────────────────────────────────────────────────────
// Creates a non-student user (doctor, teaching_assistant, admin, super_admin).
export const addUsers = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        error: "All fields (name, email, password, role) are required",
      });
    }

    if (role === "student") {
      return res.status(400).json({
        error: "Use POST /users/students to create student accounts",
      });
    }

    const validRoles = ["doctor", "teaching_assistant", "admin", "super_admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.users.create({
      data: {
        full_name: name,
        email,
        password_hash: hashedPassword,
        role,
      },
    });

    await ensureUserInGeneralGroup(newUser.id);

    res.status(201).json({
      message: "User created successfully",
      userId: newUser.id,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── POST /users/management/admins ───────────────────────────────────────────
// Creates a new admin user.
export const createAdminForManagement = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "All fields (name, email, password) are required",
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await prisma.users.create({
      data: {
        full_name: name,
        email,
        password_hash: hashedPassword,
        role: "admin",
      },
    });

    await ensureUserInGeneralGroup(newUser.id);

    res.status(201).json({
      message: "Admin user created successfully",
      userId: newUser.id,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── PATCH /users/:id ─────────────────────────────────────────────────────────
// Updates basic user fields and supports avatar image upload to Supabase Storage.
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const normalizeOptionalField = (value) => {
      if (value === undefined || value === null) return undefined;
      if (typeof value === "string" && value.trim() === "") {
        return undefined;
      }
      return value;
    };

    const {
      name,
      email,
      password,
      role,
      phone,
      address,
      national_id,
      department_id,
    } = req.body;
    const avatarFile = req.file;

    const normalizedName = normalizeOptionalField(name);
    const normalizedEmail = normalizeOptionalField(email);
    const normalizedPassword = normalizeOptionalField(password);
    const normalizedRole = normalizeOptionalField(role);
    const normalizedPhone = normalizeOptionalField(phone);
    const normalizedAddress = normalizeOptionalField(address);
    const normalizedNationalId = normalizeOptionalField(national_id);
    const normalizedDepartmentId = normalizeOptionalField(department_id);

    const data = {};

    if (normalizedName !== undefined) data.full_name = normalizedName;
    if (normalizedEmail !== undefined) data.email = normalizedEmail;
    if (normalizedRole !== undefined) data.role = normalizedRole;
    if (normalizedPhone !== undefined) data.phone = normalizedPhone;
    if (normalizedAddress !== undefined) data.address = normalizedAddress;
    if (normalizedNationalId !== undefined)
      data.national_id = normalizedNationalId;

    if (normalizedDepartmentId !== undefined) {
      const [targetUser, department, studentProfile] = await Promise.all([
        prisma.users.findUnique({
          where: { id },
          select: { id: true, role: true },
        }),
        prisma.departments.findUnique({
          where: { department_id: normalizedDepartmentId },
          select: { department_id: true },
        }),
        prisma.student_profiles.findUnique({
          where: { user_id: id },
          select: { user_id: true },
        }),
      ]);

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }

      if (!["student", "leader"].includes(targetUser.role)) {
        return res.status(400).json({
          error:
            "Department can only be updated for student or leader accounts",
        });
      }

      if (!studentProfile) {
        return res.status(400).json({
          error: "Student profile not found for this student/leader account",
        });
      }
    }

    if (avatarFile) {
      const currentUser = await prisma.users.findUnique({
        where: { id },
        select: { avatar_url: true },
      });

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const ext = path.extname(avatarFile.originalname);
      const fileName = `avatar_${id}_${Date.now()}${ext}`;
      const filePath = `${id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile.buffer, {
          contentType: avatarFile.mimetype,
          upsert: true,
        });

      if (uploadError) {
        logger.error("Avatar upload error:", uploadError);
        return res.status(500).json({
          error: "Failed to upload avatar",
        });
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      data.avatar_url = publicUrlData.publicUrl;

      if (currentUser?.avatar_url) {
        try {
          const oldPath = currentUser.avatar_url.split("/avatars/")[1];
          if (oldPath) {
            await supabase.storage.from("avatars").remove([oldPath]);
          }
        } catch (deleteErr) {
          logger.warn("Failed to delete old avatar:", deleteErr);
        }
      }
    }

    if (normalizedPassword !== undefined) {
      data.password_hash = await bcrypt.hash(normalizedPassword, 12);
    }

    const hasUserDataUpdate = Object.keys(data).length > 0;
    const hasDepartmentUpdate = normalizedDepartmentId !== undefined;

    if (!hasUserDataUpdate && !hasDepartmentUpdate) {
      return res.status(400).json({
        error: "At least one field must be provided for update",
      });
    }

    const userSelect = {
      id: true,
      full_name: true,
      email: true,
      role: true,
      avatar_url: true,
      phone: true,
      address: true,
      national_id: true,
      updated_at: true,
    };

    let updated;

    if (hasUserDataUpdate && hasDepartmentUpdate) {
      const [updatedUser] = await prisma.$transaction([
        prisma.users.update({
          where: { id },
          data,
          select: userSelect,
        }),
        prisma.student_profiles.update({
          where: { user_id: id },
          data: { department_id: normalizedDepartmentId },
        }),
      ]);
      updated = updatedUser;
    } else if (hasDepartmentUpdate) {
      await prisma.student_profiles.update({
        where: { user_id: id },
        data: { department_id: normalizedDepartmentId },
      });

      updated = await prisma.users.findUnique({
        where: { id },
        select: userSelect,
      });
    } else {
      updated = await prisma.users.update({
        where: { id },
        data,
        select: userSelect,
      });
    }

    return res.status(200).json({
      message: "User updated successfully",
      user: updated,
    });
  } catch (err) {
    if (err?.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    if (err?.code === "P2002") {
      return res.status(409).json({ error: "Email already exists" });
    }

    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── DELETE /users/:id ───────────────────────────────────────────────────────
// Deletes a user if no blocking foreign key dependencies exist.
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const existingUser = await prisma.users.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await prisma.users.delete({ where: { id } });

    return res.status(200).json({
      message: "User deleted successfully",
      userId: id,
    });
  } catch (err) {
    if (err?.code === "P2003") {
      return res.status(409).json({
        error: "Cannot delete user because related records exist",
      });
    }

    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ── POST /users/students ──────────────────────────────────────────────────────
// Creates a student user. Password is derived from national_id.
export const addStudent = async (req, res) => {
  try {
    const { name, email, national_id, student_id, department_id } = req.body;

    if (!name || !email || !national_id || !student_id || !department_id) {
      return res.status(400).json({
        error:
          "All fields (name, email, national_id, student_id, department_id) are required",
      });
    }

    const [existingEmail, existingStudentId, department] = await Promise.all([
      prisma.users.findUnique({ where: { email } }),
      prisma.student_profiles.findUnique({ where: { student_id } }),
      prisma.departments.findUnique({ where: { department_id } }),
    ]);

    if (existingEmail) {
      return res.status(409).json({ error: "Email already exists" });
    }
    if (existingStudentId) {
      return res.status(409).json({ error: "Student ID already exists" });
    }
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    const hashedPassword = await bcrypt.hash(national_id, 12);

    const newUser = await prisma.users.create({
      data: {
        full_name: name,
        email,
        password_hash: hashedPassword,
        role: "student",
        national_id,
      },
    });

    await ensureUserInGeneralGroup(newUser.id);

    await prisma.student_profiles.create({
      data: {
        user_id: newUser.id,
        student_id,
        department_id,
      },
    });

    res.status(201).json({
      message: "Student created successfully",
      userId: newUser.id,
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// export const addExcelUsers = async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: "No file uploaded" });
//         }

//         const workbook = new exceljs.Workbook();
//         await workbook.xlsx.load(req.file.buffer);

//         const worksheet = workbook.worksheets[0];

//         if (!worksheet) {
//             return res
//                 .status(400)
//                 .json({ error: "No worksheet found in the Excel file" });
//         }

//         const rawUsers = [];
//         const errors = [];

//         worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
//             if (rowNumber === 1) return; // Skip header row

//             const [name, email, , role] = row.values.slice(1);
//             const passwordCell = row.getCell(3);
//             const password = passwordCell.text;
//             if (!name || !email || !password || !role) {
//                 errors.push({
//                     row: rowNumber,
//                     error: "Missing required fields",
//                 });
//                 return;
//             }
//             rawUsers.push({ name, email, password, role });
//         });

//         if (rawUsers.length === 0) {
//             return res.status(400).json({
//                 error: "No valid user data found in the file",
//                 errors,
//             });
//         }

//         const usersToAdd = await Promise.all(
//             rawUsers.map(async (user) => ({
//                 full_name: user.name,
//                 email: user.email,
//                 password_hash: await bcrypt.hash(user.password, 10),
//                 role: user.role,
//             }))
//         );

//         const result = await prisma.users.createMany({
//             data: usersToAdd,
//             skipDuplicates: true,
//         });

//         // res.status(201).json({
//         //     message: "Users added successfully",
//         //     addedCount: usersToAdd.length,
//         //     skippedRows: errors.length,
//         //     errors,
//         // });

//         res.status(201).json({
//             message: "Users processed successfully",
//             insertedCount: result.count,
//             totalRows: usersToAdd.length,
//             skippedDueToValidation: errors.length,
//         });
//     } catch (err) {
//         logger.error(err);
//         res.status(500).json({ error: "Internal server error" });
//     }
// };

// ── POST /users/upload-excel ──────────────────────────────────────────────────
// Bulk-creates non-student users from an Excel file.
// Expected columns: Name | Email | Password | Role
export const addExcelUsers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const rowsCountResult = await countDataRowsFromExcelBuffer(req.file.buffer);
    if (!rowsCountResult.success) {
      return res.status(rowsCountResult.status).json(rowsCountResult.payload);
    }

    const shouldQueueLargeImport =
      rowsCountResult.rowsCount > EXCEL_IMPORT_ASYNC_THRESHOLD;

    if (shouldQueueLargeImport && isUserImportQueueEnabled()) {
      const job = await enqueueUserImportJob({
        importType: "users",
        fileBuffer: req.file.buffer,
        requestedBy: req.user?.id || null,
      });

      return res.status(202).json({
        message: "Excel import job queued successfully",
        jobId: String(job.id),
        queued: true,
        importType: "users",
        rowsCount: rowsCountResult.rowsCount,
      });
    }

    const result = await processExcelUsersBuffer(req.file.buffer);
    return res.status(result.status).json(result.payload);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── POST /users/upload-excel/students ────────────────────────────────────────
// Bulk-creates student users from an Excel file.
// Expected columns: Name | Email | NationalId | StudentId | DepartmentName
// Password is set to the national ID value.
export const addExcelStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const rowsCountResult = await countDataRowsFromExcelBuffer(req.file.buffer);
    if (!rowsCountResult.success) {
      return res.status(rowsCountResult.status).json(rowsCountResult.payload);
    }

    const shouldQueueLargeImport =
      rowsCountResult.rowsCount > EXCEL_IMPORT_ASYNC_THRESHOLD;

    if (shouldQueueLargeImport && isUserImportQueueEnabled()) {
      const job = await enqueueUserImportJob({
        importType: "students",
        fileBuffer: req.file.buffer,
        requestedBy: req.user?.id || null,
      });

      return res.status(202).json({
        message: "Excel import job queued successfully",
        jobId: String(job.id),
        queued: true,
        importType: "students",
        rowsCount: rowsCountResult.rowsCount,
      });
    }

    const result = await processExcelStudentsBuffer(req.file.buffer);
    return res.status(result.status).json(result.payload);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ── GET /users/upload-excel/jobs/:jobId ─────────────────────────────────────
// Returns current status for a queued large Excel import job.
export const getExcelImportJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!isUserImportQueueEnabled()) {
      return res.status(503).json({
        error: "Import queue is not configured",
      });
    }

    const status = await getUserImportJobStatus(jobId);
    if (!status) {
      return res.status(404).json({ error: "Import job not found" });
    }

    return res.status(200).json(status);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
