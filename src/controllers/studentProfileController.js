import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";
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

        const { address, phone } = req.body;

        const updatedStudent = await prisma.users.update({
            where: { id: user.userId },
            data: {
                address: address,
                phone: phone,
            },
        });

        res.status(200).json({ message: "Profile updated", updatedStudent });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};
