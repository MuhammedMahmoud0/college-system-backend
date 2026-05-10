import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
import bcrypt from "bcrypt";

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, confirmNewPassword, newPassword } = req.body;

        // Validate all required fields
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({
                error: "All fields (currentPassword, newPassword, confirmNewPassword) are required",
            });
        }

        // Validate password match
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                error: "New password and confirmation do not match",
            });
        }

        // Validate password strength (minimum 6 characters)
        if (newPassword.length < 6) {
            return res.status(400).json({
                error: "New password must be at least 6 characters long",
            });
        }

        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password_hash
        );
        if (!isCurrentPasswordValid) {
            return res
                .status(401)
                .json({ error: "Current password is incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await prisma.users.update({
            where: { id: userId },
            data: { password_hash: hashedNewPassword },
        });

        res.status(200).json({ message: "Password updated successfully" });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
