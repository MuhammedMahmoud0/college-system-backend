import { prisma } from "../config/connection.js";
import { supabase } from "../utils/supabase.js";
import logger from "../utils/logger.js";
import path from "path";

const isSupabaseInvalidJwsError = (err) => {
    const msg = String(err?.message || "");
    return (
        err?.namespace === "storage" &&
        (msg.includes("Invalid Compact JWS") || msg.includes("JWT"))
    );
};

export const createMaterial = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { lecture_id, tutorial_lab_id, type, url, title } = req.body;
        const file = req.file;

        // 🔒 Validation
        if (!lecture_id && !tutorial_lab_id) {
            return res
                .status(400)
                .json({ message: "Lecture or tutorial must be selected" });
        }

        if (type === "link" && !url) {
            return res.status(400).json({ message: "URL is required" });
        }

        if (type === "link" && !title) {
            return res
                .status(400)
                .json({ message: "Title is required for link materials" });
        }

        if (type === "file" && !file) {
            return res.status(400).json({ message: "File is required" });
        }

        // 🔒 Verify lecture or tutorial exists and doctor is the instructor
        if (lecture_id) {
            const lecture = await prisma.lectures.findUnique({
                where: { lecture_id: Number(lecture_id) },
            });
            if (!lecture) {
                return res.status(404).json({ message: "Lecture not found" });
            }
            // Optionally: check if the doctor is the instructor
            if (
                lecture.instructor_id !== doctorId &&
                req.user.role !== "admin" &&
                req.user.role !== "super_admin"
            ) {
                return res.status(403).json({
                    message: "You are not the instructor of this lecture",
                });
            }
        }

        if (tutorial_lab_id) {
            const tutorial = await prisma.tutorials_labs.findUnique({
                where: { tutorial_lab_id: Number(tutorial_lab_id) },
            });
            if (!tutorial) {
                return res
                    .status(404)
                    .json({ message: "Tutorial/Lab not found" });
            }
            // Optionally: check if the user is the TA
            if (
                tutorial.ta_id !== doctorId &&
                req.user.role !== "admin" &&
                req.user.role !== "super_admin" &&
                req.user.role !== "doctor"
            ) {
                return res.status(403).json({
                    message: "You are not assigned to this tutorial/lab",
                });
            }
        }

        // -------------------------
        // LINK MATERIAL
        // -------------------------
        if (type === "link") {
            const material = await prisma.course_materials.create({
                data: {
                    title,
                    url,
                    lecture_id: lecture_id ? Number(lecture_id) : null,
                    tutorial_lab_id: tutorial_lab_id
                        ? Number(tutorial_lab_id)
                        : null,
                },
            });

            return res.status(201).json(material);
        }

        // -------------------------
        // FILE MATERIAL
        // -------------------------
        const ext = path.extname(file.originalname);
        const fileName = file.originalname;
        const filePath = `materials/${doctorId}/${Date.now()}${ext}`;

        // Upload to Supabase Storage
        logger.info(
            `Attempting upload to Supabase: bucket=course-materials, path=${filePath}`
        );

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from("course-materials")
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
            });

        if (uploadError) {
            // Common setup issue: SUPABASE_SERVICE_ROLE_KEY is missing/invalid (Invalid Compact JWS)
            logger.error("Supabase upload error:", uploadError);
            logger.error(
                "Full error details:",
                JSON.stringify(uploadError, null, 2)
            );

            if (isSupabaseInvalidJwsError(uploadError)) {
                return res.status(500).json({
                    message:
                        "File upload failed (Supabase auth). Check SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL in your .env.",
                });
            }

            return res.status(500).json({
                message: "File upload failed",
            });
        }

        // Save metadata + create material atomically (so we don't leave orphan rows)
        const material = await prisma.$transaction(async (tx) => {
            const savedFile = await tx.files.create({
                data: {
                    file_name: fileName,
                    file_path: filePath,
                    media_type: file.mimetype,
                    size_bytes: file.size,
                    uploaded_by_user_id: doctorId,
                },
            });

            return tx.course_materials.create({
                data: {
                    title: fileName,
                    file_id: savedFile.file_id,
                    lecture_id: lecture_id ? Number(lecture_id) : null,
                    tutorial_lab_id: tutorial_lab_id
                        ? Number(tutorial_lab_id)
                        : null,
                },
            });
        });

        res.status(201).json({
            ...material,
            upload: uploadData ?? null,
        });
    } catch (err) {
        logger.error("Failed to create material:", err);
        logger.error("Error stack:", err.stack);

        // If this is a known Supabase auth message, return a more actionable error
        if (isSupabaseInvalidJwsError(err)) {
            return res.status(500).json({
                message:
                    "File upload failed (Supabase auth). Check SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL in your .env.",
            });
        }

        // Return more detailed error in development
        res.status(500).json({
            message: "Failed to create material",
            error:
                process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined,
        });
    }
};

export const getMaterials = async (req, res) => {
    try {
        const { lecture_id, tutorial_lab_id } = req.query;

        const materials = await prisma.course_materials.findMany({
            where: {
                lecture_id: lecture_id ? Number(lecture_id) : undefined,
                tutorial_lab_id: tutorial_lab_id
                    ? Number(tutorial_lab_id)
                    : undefined,
            },
            include: {
                files: true,
            },
            orderBy: { uploaded_at: "desc" },
        });

        if (materials.length === 0) {
            return res.status(404).json({ message: "No materials found" });
        }

        res.json(materials);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch materials" });
    }
};

export const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, url } = req.body;

        const material = await prisma.course_materials.findUnique({
            where: { id: Number(id) },
        });

        if (!material) {
            return res.status(404).json({ message: "Material not found" });
        }

        if (material.file_id && url) {
            return res
                .status(400)
                .json({ message: "Cannot add URL to file material" });
        }

        const updated = await prisma.course_materials.update({
            where: { id: Number(id) },
            data: {
                title,
                url,
            },
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Failed to update material" });
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        const material = await prisma.course_materials.findUnique({
            where: { id: Number(id) },
            include: { files: true },
        });

        if (!material) {
            return res.status(404).json({ message: "Material not found" });
        }

        // Store file info before deleting material
        const fileToDelete = material.files;

        // 1. First delete the course_materials record (removes FK reference)
        await prisma.course_materials.delete({
            where: { id: Number(id) },
        });

        // 2. Then delete the file record and storage file (if exists)
        if (fileToDelete) {
            // Delete from Supabase storage
            await supabase.storage
                .from("course-materials")
                .remove([fileToDelete.file_path]);

            // Delete file record from database
            await prisma.files.delete({
                where: { file_id: fileToDelete.file_id },
            });
        }

        res.json({ message: "Material deleted successfully" });
    } catch (err) {
        logger.error("Failed to delete material:", err);
        res.status(500).json({ message: "Failed to delete material" });
    }
};

// GET /api/v1/materials/:id/download - Download a material file
export const downloadMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        const material = await prisma.course_materials.findUnique({
            where: { id: Number(id) },
            include: { files: true },
        });

        if (!material) {
            return res.status(404).json({ message: "Material not found" });
        }

        // If it's a link material, redirect to the URL
        if (material.url && !material.file_id) {
            // return res.redirect(material.url);
            return res.json({
                material: {
                    id: material.id,
                    title: material.title,
                    type: "external_link",
                },
                external_url: material.url,
            });
        }

        // If it's a file material, get download URL from Supabase
        if (!material.files) {
            return res.status(404).json({ message: "File not found" });
        }

        // Option 1: Generate a signed URL (temporary, secure)
        const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
                .from("course-materials")
                .createSignedUrl(material.files.file_path, 3600); // 1 hour expiry

        if (signedUrlError) {
            logger.error("Failed to generate signed URL:", signedUrlError);
            return res
                .status(500)
                .json({ message: "Failed to generate download link" });
        }

        // Return the download info
        res.json({
            material: {
                id: material.id,
                title: material.title,
                file_name: material.files.file_name,
                media_type: material.files.media_type,
                size_bytes: material.files.size_bytes,
            },
            download_url: signedUrlData.signedUrl,
            expires_in: 3600, // seconds
        });
    } catch (err) {
        logger.error("Failed to download material:", err);
        res.status(500).json({ message: "Failed to download material" });
    }
};

// GET /api/v1/materials/:id/stream - Stream/proxy the file directly
export const streamMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        const material = await prisma.course_materials.findUnique({
            where: { id: Number(id) },
            include: { files: true },
        });

        if (!material) {
            return res.status(404).json({ message: "Material not found" });
        }

        // If it's a link material, redirect
        if (material.url && !material.file_id) {
            return res.redirect(material.url);
        }

        if (!material.files) {
            return res.status(404).json({ message: "File not found" });
        }

        // Download the file from Supabase
        const { data, error } = await supabase.storage
            .from("course-materials")
            .download(material.files.file_path);

        if (error) {
            logger.error("Failed to download from Supabase:", error);
            return res.status(500).json({ message: "Failed to stream file" });
        }

        // Set appropriate headers
        res.setHeader(
            "Content-Type",
            material.files.media_type || "application/octet-stream"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${material.files.file_name}"`
        );

        if (material.files.size_bytes) {
            res.setHeader(
                "Content-Length",
                material.files.size_bytes.toString()
            );
        }

        // Convert Blob to Buffer and send
        const buffer = Buffer.from(await data.arrayBuffer());
        res.send(buffer);
    } catch (err) {
        logger.error("Failed to stream material:", err);
        res.status(500).json({ message: "Failed to stream material" });
    }
};
