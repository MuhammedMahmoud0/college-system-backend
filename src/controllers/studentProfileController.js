import { prisma } from "../config/connection.js";
import { supabase } from "../utils/supabase.js";
import logger from "../utils/logger.js";
import path from "path";
import { userPublicSelect } from "../prisma/selectors/user.selectors.js";
import { studentProfileSelect } from "../prisma/selectors/studentProfile.selectors.js";

export const getStudentProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const student = await prisma.users.findUnique({
            where: { id: user.userId },
            select: {
                ...userPublicSelect,
                student_profiles: {
                    select: {
                        ...studentProfileSelect,
                    },
                },
            },
        });

        if (!student || !student.student_profiles) {
            return res.status(404).json({ error: "Student profile not found" });
        }

        res.status(200).json({ studentProfile: student });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updateStudentProfile = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { address, phone, national_id, full_name } = req.body;
        const avatarFile = req.file; // Multer provides this

        // Prepare update data
        const updateData = {};
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (national_id !== undefined) updateData.national_id = national_id;
        if (full_name !== undefined) updateData.full_name = full_name;

        // Handle avatar upload if provided
        if (avatarFile) {
            const ext = path.extname(avatarFile.originalname);
            const fileName = `avatar_${user.userId}_${Date.now()}${ext}`;
            const filePath = `${user.userId}/${fileName}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } =
                await supabase.storage
                    .from("avatars") // or create a separate 'avatars' bucket
                    .upload(filePath, avatarFile.buffer, {
                        contentType: avatarFile.mimetype,
                        upsert: true, // Replace if exists
                    });

            if (uploadError) {
                logger.error("Avatar upload error:", uploadError);
                return res.status(500).json({
                    error: "Failed to upload avatar",
                });
            }

            // Get public URL for the uploaded avatar
            // Using getPublicUrl - make sure 'avatars' bucket is PUBLIC in Supabase dashboard
            // This will generate a preview-friendly URL if the bucket is public
            const { data: publicUrlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            updateData.avatar_url = publicUrlData.publicUrl;

            // Optional: Delete old avatar from storage if exists
            const currentUser = await prisma.users.findUnique({
                where: { id: user.userId },
                select: { avatar_url: true },
            });

            if (currentUser?.avatar_url) {
                // Extract path from old URL and delete
                try {
                    const oldPath =
                        currentUser.avatar_url.split("/avatars/")[1];
                    if (oldPath) {
                        await supabase.storage
                            .from("avatars")
                            .remove([oldPath]);
                    }
                } catch (deleteErr) {
                    logger.warn("Failed to delete old avatar:", deleteErr);
                    // Continue anyway - not critical
                }
            }
        }

        // Update user profile
        const updatedStudent = await prisma.users.update({
            where: { id: user.userId },
            data: updateData,
        });

        res.status(200).json({ message: "Profile updated", updatedStudent });
    } catch (err) {
        logger.error("Error updating profile:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};
