import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

export const getAllTeachers = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get all teachers/doctors
    const teachers = await prisma.users.findMany({
      where: {
        role: "doctor",
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
      },
    });

    // Transform the data to match the required format
    const formattedTeachers = teachers.map((teacher) => {
      // Get department from first lecture if available
      let department = null;
      if (
        teacher.lectures.length > 0 &&
        teacher.lectures[0].course_offerings &&
        teacher.lectures[0].course_offerings.courses &&
        teacher.lectures[0].course_offerings.courses.departments
      ) {
        department =
          teacher.lectures[0].course_offerings.courses.departments.name;
      }

      return {
        id: teacher.id,
        name: teacher.full_name,
        title: "Dr.",
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
