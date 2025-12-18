import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

/**
 * Get all materials for a specific course code
 * Joins course_materials with lectures, tutorials_labs, and course_offerings
 * Filters by course_code and includes file details
 */
export const getMaterialsByCourseCode = async (req, res) => {
    try {
        const { courseCode } = req.params;

        if (!courseCode) {
            return res.status(400).json({ error: "Course code is required" });
        }

        // Get all materials for the course by joining through course_offerings
        const materials = await prisma.course_materials.findMany({
            where: {
                OR: [
                    {
                        lectures: {
                            course_offerings: {
                                course_code: courseCode,
                            },
                        },
                    },
                    {
                        tutorials_labs: {
                            course_offerings: {
                                course_code: courseCode,
                            },
                        },
                    },
                ],
            },
            include: {
                files: {
                    select: {
                        file_id: true,
                        file_name: true,
                        file_path: true,
                        media_type: true,
                        size_bytes: true,
                        created_at: true,
                    },
                },
                lectures: {
                    select: {
                        lecture_id: true,
                        day_of_week: true,
                        start_time: true,
                        end_time: true,
                        location: true,
                        group: true,
                    },
                },
                tutorials_labs: {
                    select: {
                        tutorial_lab_id: true,
                        type: true,
                        day_of_week: true,
                        start_time: true,
                        end_time: true,
                        location: true,
                        group: true,
                    },
                },
            },
            orderBy: {
                uploaded_at: "desc",
            },
        });

        if (!materials || materials.length === 0) {
            return res.status(200).json({
                message: "No materials found for this course code",
                courseCode,
                materials: [],
            });
        }

        res.status(200).json({
            message: "Materials retrieved successfully",
            courseCode,
            count: materials.length,
            materials,
        });
    } catch (err) {
        logger.error("Error fetching materials by course code:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

/**
 * Get all materials for a specific lecture
 */
export const getMaterialsByLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;

        if (!lectureId) {
            return res.status(400).json({ error: "Lecture ID is required" });
        }

        const materials = await prisma.course_materials.findMany({
            where: {
                lecture_id: parseInt(lectureId),
            },
            include: {
                files: {
                    select: {
                        file_id: true,
                        file_name: true,
                        file_path: true,
                        media_type: true,
                        size_bytes: true,
                        created_at: true,
                    },
                },
                lectures: {
                    select: {
                        lecture_id: true,
                        day_of_week: true,
                        start_time: true,
                        end_time: true,
                        location: true,
                    },
                },
            },
            orderBy: {
                uploaded_at: "desc",
            },
        });

        res.status(200).json({
            message: "Materials retrieved successfully",
            lectureId: parseInt(lectureId),
            count: materials.length,
            materials,
        });
    } catch (err) {
        logger.error("Error fetching materials by lecture:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

/**
 * Get all materials for a specific tutorial/lab
 */
export const getMaterialsByTutorial = async (req, res) => {
    try {
        const { tutorialLabId } = req.params;

        if (!tutorialLabId) {
            return res
                .status(400)
                .json({ error: "Tutorial/Lab ID is required" });
        }

        const materials = await prisma.course_materials.findMany({
            where: {
                tutorial_lab_id: parseInt(tutorialLabId),
            },
            include: {
                files: {
                    select: {
                        file_id: true,
                        file_name: true,
                        file_path: true,
                        media_type: true,
                        size_bytes: true,
                        created_at: true,
                    },
                },
                tutorials_labs: {
                    select: {
                        tutorial_lab_id: true,
                        type: true,
                        day_of_week: true,
                        start_time: true,
                        end_time: true,
                        location: true,
                    },
                },
            },
            orderBy: {
                uploaded_at: "desc",
            },
        });

        res.status(200).json({
            message: "Materials retrieved successfully",
            tutorialLabId: parseInt(tutorialLabId),
            count: materials.length,
            materials,
        });
    } catch (err) {
        logger.error("Error fetching materials by tutorial/lab:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

/**
 * Get a specific material by ID with full details
 */
export const getMaterialById = async (req, res) => {
    try {
        const { materialId } = req.params;

        if (!materialId) {
            return res.status(400).json({ error: "Material ID is required" });
        }

        const material = await prisma.course_materials.findUnique({
            where: {
                id: parseInt(materialId),
            },
            include: {
                files: {
                    select: {
                        file_id: true,
                        file_name: true,
                        file_path: true,
                        media_type: true,
                        size_bytes: true,
                        uploaded_by_user_id: true,
                        created_at: true,
                    },
                },
            },
        });

        if (!material) {
            return res.status(404).json({
                error: "Material not found",
                materialId: parseInt(materialId),
            });
        }

        res.status(200).json({
            message: "Material retrieved successfully",
            material,
        });
    } catch (err) {
        logger.error("Error fetching material by ID:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

/**
 * Create a new course material
 * Requires lecture_id or tutorial_lab_id, title, and optionally file_id
 */
export const createMaterial = async (req, res) => {
    try {
        const { lecture_id, tutorial_lab_id, title, url, file_id } = req.body;

        if (!title) {
            return res.status(400).json({ error: "Title is required" });
        }

        if (!lecture_id && !tutorial_lab_id) {
            return res.status(400).json({
                error: "Either lecture_id or tutorial_lab_id is required",
            });
        }

        const material = await prisma.course_materials.create({
            data: {
                title,
                url: url || null,
                lecture_id: lecture_id ? parseInt(lecture_id) : null,
                tutorial_lab_id: tutorial_lab_id
                    ? parseInt(tutorial_lab_id)
                    : null,
                file_id: file_id || null,
                uploaded_at: new Date(),
            },
            include: {
                files: {
                    select: {
                        file_id: true,
                        file_name: true,
                        file_path: true,
                        media_type: true,
                        size_bytes: true,
                        created_at: true,
                    },
                },
            },
        });

        res.status(201).json({
            message: "Material created successfully",
            material,
        });
    } catch (err) {
        logger.error("Error creating material:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

/**
 * Update a course material
 */
export const updateMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;
        const { title, url, file_id } = req.body;

        if (!materialId) {
            return res.status(400).json({ error: "Material ID is required" });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (url !== undefined) updateData.url = url;
        if (file_id !== undefined) updateData.file_id = file_id;

        const updatedMaterial = await prisma.course_materials.update({
            where: {
                id: parseInt(materialId),
            },
            data: updateData,
            include: {
                files: {
                    select: {
                        file_id: true,
                        file_name: true,
                        file_path: true,
                        media_type: true,
                        size_bytes: true,
                        created_at: true,
                    },
                },
            },
        });

        res.status(200).json({
            message: "Material updated successfully",
            material: updatedMaterial,
        });
    } catch (err) {
        logger.error("Error updating material:", err);
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Material not found" });
        }
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

/**
 * Delete a course material
 */
export const deleteMaterial = async (req, res) => {
    try {
        const { materialId } = req.params;

        if (!materialId) {
            return res.status(400).json({ error: "Material ID is required" });
        }

        await prisma.course_materials.delete({
            where: {
                id: parseInt(materialId),
            },
        });

        res.status(200).json({
            message: "Material deleted successfully",
            deletedMaterialId: parseInt(materialId),
        });
    } catch (err) {
        logger.error("Error deleting material:", err);
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Material not found" });
        }
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

/**
 * Get all files uploaded by the authenticated user
 */
export const getUserFiles = async (req, res) => {
    try {
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const files = await prisma.files.findMany({
            where: {
                uploaded_by_user_id: userId,
            },
            select: {
                file_id: true,
                file_name: true,
                file_path: true,
                media_type: true,
                size_bytes: true,
                created_at: true,
            },
            orderBy: {
                created_at: "desc",
            },
        });

        res.status(200).json({
            message: "User files retrieved successfully",
            userId,
            count: files.length,
            files,
        });
    } catch (err) {
        logger.error("Error fetching user files:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};

/**
 * Get file details by file ID
 */
export const getFileById = async (req, res) => {
    try {
        const { fileId } = req.params;

        if (!fileId) {
            return res.status(400).json({ error: "File ID is required" });
        }

        const file = await prisma.files.findUnique({
            where: {
                file_id: fileId,
            },
            select: {
                file_id: true,
                file_name: true,
                file_path: true,
                media_type: true,
                size_bytes: true,
                uploaded_by_user_id: true,
                created_at: true,
            },
        });

        if (!file) {
            return res.status(404).json({
                error: "File not found",
                fileId,
            });
        }

        res.status(200).json({
            message: "File retrieved successfully",
            file,
        });
    } catch (err) {
        logger.error("Error fetching file by ID:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message,
        });
    }
};
