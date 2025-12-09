import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/connection.js";

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
    const { email, password } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
        return res
            .status(400)
            .json({ message: "Invalid username or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
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
};

export const me = async (req, res) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: "not authenticated" });
    res.json({ user });
};
