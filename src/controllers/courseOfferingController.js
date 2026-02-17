import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

/**
 * GET /api/course-offerings
 * Get all course offerings
 * Admin & Super Admin only
 */
export const getAllCourseOfferings = async (req, res) => {
  try {
    const offerings = await prisma.course_offerings.findMany({
      include: {
        courses: {
          select: {
            code: true,
            name: true,
            credits: true,
          },
        },
        _count: {
          select: {
            lectures: true,
            tutorials_labs: true,
            exams: true,
          },
        },
      },
      orderBy: [{ semester: "desc" }, { course_code: "asc" }],
    });

    const formattedOfferings = offerings.map((offering) => ({
      offering_id: offering.offering_id,
      course_code: offering.course_code,
      course_name: offering.courses.name,
      credits: offering.courses.credits,
      semester: offering.semester,
      lectures_count: offering._count.lectures,
      tutorials_labs_count: offering._count.tutorials_labs,
      exams_count: offering._count.exams,
    }));

    res.status(200).json({
      success: true,
      count: formattedOfferings.length,
      data: formattedOfferings,
    });
  } catch (err) {
    logger.error("Error fetching course offerings:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * POST /api/course-offerings
 * Create a new course offering
 * Admin & Super Admin only
 */
export const createCourseOffering = async (req, res) => {
  try {
    const { course_code, semester } = req.body;

    // Validate required fields
    if (!course_code || !semester) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: course_code, semester",
      });
    }

    // Check if course exists
    const course = await prisma.courses.findUnique({
      where: { code: course_code },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found with the provided course code",
      });
    }

    // Check if offering already exists for this course and semester
    const existingOffering = await prisma.course_offerings.findFirst({
      where: {
        course_code,
        semester,
      },
    });

    if (existingOffering) {
      return res.status(409).json({
        success: false,
        error: "Course offering already exists for this course and semester",
      });
    }

    // Create the offering
    const newOffering = await prisma.course_offerings.create({
      data: {
        course_code,
        semester,
      },
      include: {
        courses: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Course offering created successfully",
      data: {
        offering_id: newOffering.offering_id,
        course_code: newOffering.course_code,
        course_name: newOffering.courses.name,
        semester: newOffering.semester,
        credits: newOffering.courses.credits,
      },
    });
  } catch (err) {
    logger.error("Error creating course offering:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * PUT /api/course-offerings/:offering_id
 * Update a course offering
 * Admin & Super Admin only
 */
export const updateCourseOffering = async (req, res) => {
  try {
    const { offering_id } = req.params;
    const { semester } = req.body;

    // Validate offering exists
    const existingOffering = await prisma.course_offerings.findUnique({
      where: { offering_id: parseInt(offering_id) },
    });

    if (!existingOffering) {
      return res.status(404).json({
        success: false,
        error: "Course offering not found",
      });
    }

    // Update only semester (course_code should not change)
    const updateData = {};
    if (semester !== undefined) updateData.semester = semester;

    const updatedOffering = await prisma.course_offerings.update({
      where: { offering_id: parseInt(offering_id) },
      data: updateData,
      include: {
        courses: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Course offering updated successfully",
      data: {
        offering_id: updatedOffering.offering_id,
        course_code: updatedOffering.course_code,
        course_name: updatedOffering.courses.name,
        semester: updatedOffering.semester,
        credits: updatedOffering.courses.credits,
      },
    });
  } catch (err) {
    logger.error("Error updating course offering:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * DELETE /api/course-offerings/:offering_id
 * Delete a course offering
 * Admin & Super Admin only
 */
export const deleteCourseOffering = async (req, res) => {
  try {
    const { offering_id } = req.params;

    // Validate offering exists
    const existingOffering = await prisma.course_offerings.findUnique({
      where: { offering_id: parseInt(offering_id) },
      include: {
        _count: {
          select: {
            lectures: true,
            tutorials_labs: true,
            exams: true,
          },
        },
      },
    });

    if (!existingOffering) {
      return res.status(404).json({
        success: false,
        error: "Course offering not found",
      });
    }

    // Check if there are related records
    const hasRelatedRecords =
      existingOffering._count.lectures > 0 ||
      existingOffering._count.tutorials_labs > 0 ||
      existingOffering._count.exams > 0;

    if (hasRelatedRecords) {
      return res.status(400).json({
        success: false,
        error:
          "Cannot delete course offering with existing lectures, tutorials/labs, or exams. Please delete those first.",
        details: {
          lectures: existingOffering._count.lectures,
          tutorials_labs: existingOffering._count.tutorials_labs,
          exams: existingOffering._count.exams,
        },
      });
    }

    // Delete the offering
    await prisma.course_offerings.delete({
      where: { offering_id: parseInt(offering_id) },
    });

    res.status(200).json({
      success: true,
      message: "Course offering deleted successfully",
    });
  } catch (err) {
    logger.error("Error deleting course offering:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
