import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

// export const register = async (req, res) => {
//     const { email, password } = req.body;
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//         return res.status(400).json({ message: "Username already exists" });
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const newUser = await prisma.user.create({
//         data: { email, password: hashedPassword },
//     });
//     res.status(201).json({
//         message: "User registered successfully",
//         userId: newUser.id,
//     });
// };

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            return res
                .status(400)
                .json({ message: "Invalid username or password" });
        }
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );
        if (!isPasswordValid) {
            return res
                .status(400)
                .json({ message: "Invalid username or password" });
        }
        const token = jwt.sign(
            { userId: user.id, name: user.full_name, role: user.role },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );
        res.status(200).json({
            message: "Login successful",
            token,
        });
    } catch (err) {
        logger.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const me = async (req, res) => {
    const user = req.user;

    if (!user) return res.status(401).json({ error: "not authenticated" });

    if (user.role === "student" || user.role === "leader") {
        const data = await prisma.users.findUnique({
            where: { id: user.userId },
            select: {
                email: true,
                role: true,
                avatar_url: true,
                phone: true,
                address: true,
            },
        });

        return res.json({ ...user, ...data });
    } else {
        const data = await prisma.users.findUnique({
            where: { id: user.userId },
            select: {
                email: true,
                role: true,
                avatar_url: true,
                phone: true,
                address: true,
            },
        });
        return res.json({ ...user, ...data });
    }
};
