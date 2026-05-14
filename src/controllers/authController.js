import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.users.findUnique({
            where: { email },
            select: {
                id: true,
                password_hash: true,
                role: true,
                failed_login_attempts: true,
                locked_until: true,
                must_change_password: true,
            },
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ── Account lockout check ──────────────────────────────────────────
        if (user.locked_until && new Date() < new Date(user.locked_until)) {
            const minutesLeft = Math.ceil(
                (new Date(user.locked_until) - new Date()) / 60_000,
            );
            return res.status(429).json({
                message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash,
        );

        if (!isPasswordValid) {
            const newAttempts = (user.failed_login_attempts ?? 0) + 1;
            const willLock = newAttempts >= MAX_FAILED_ATTEMPTS;

            await prisma.users.update({
                where: { id: user.id },
                data: {
                    failed_login_attempts: newAttempts,
                    locked_until: willLock
                        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
                        : undefined,
                },
            });

            logger.warn(
                `Failed login attempt ${newAttempts} for user ${user.id}${willLock ? " — account locked" : ""}`,
            );

            if (willLock) {
                return res.status(429).json({
                    message:
                        "Too many failed attempts. Account locked for 30 minutes.",
                });
            }

            return res.status(401).json({ message: "Invalid credentials" });
        }

        // ── Successful login: reset lockout counters ───────────────────────
        await prisma.users.update({
            where: { id: user.id },
            data: {
                failed_login_attempts: 0,
                locked_until: null,
            },
        });

        // ── Issue tokens ──────────────────────────────────────────────────
        const accessToken = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY },
        );

        const rawToken = crypto.randomBytes(64).toString("hex");
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

        await prisma.refresh_tokens.create({
            data: {
                token: rawToken,
                user_id: user.id,
                expires_at: expiresAt,
                ip_address: req.ip,
                user_agent: req.get("user-agent") ?? null,
            },
        });

        // Deliver refresh token as HttpOnly cookie
        res.cookie("refreshToken", rawToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: REFRESH_TOKEN_EXPIRY_MS,
            path: "/api/v1/auth",
        });

        logger.info(`User ${user.id} logged in`);

        return res.status(200).json({
            message: "Login successful",
            accessToken,
            requiresPasswordChange: user.must_change_password,
        });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ─── Refresh ──────────────────────────────────────────────────────────────────
export const refresh = async (req, res) => {
    try {
        const rawToken = req.cookies?.refreshToken;

        if (!rawToken) {
            return res.status(401).json({ message: "Refresh token required" });
        }

        const record = await prisma.refresh_tokens.findUnique({
            where: { token: rawToken },
            include: { users: { select: { id: true, role: true } } },
        });

        if (
            !record ||
            record.revoked ||
            new Date() > new Date(record.expires_at)
        ) {
            return res
                .status(401)
                .json({ message: "Invalid or expired refresh token" });
        }

        // ── Rotate refresh token ───────────────────────────────────────────
        const newRawToken = crypto.randomBytes(64).toString("hex");
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

        await prisma.$transaction([
            prisma.refresh_tokens.update({
                where: { id: record.id },
                data: { revoked: true },
            }),
            prisma.refresh_tokens.create({
                data: {
                    token: newRawToken,
                    user_id: record.user_id,
                    expires_at: expiresAt,
                    ip_address: req.ip,
                    user_agent: req.get("user-agent") ?? null,
                },
            }),
        ]);

        res.cookie("refreshToken", newRawToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: REFRESH_TOKEN_EXPIRY_MS,
            path: "/api/v1/auth",
        });

        const accessToken = jwt.sign(
            { userId: record.users.id, role: record.users.role },
            process.env.JWT_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY },
        );

        return res.status(200).json({ accessToken });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
    try {
        const rawToken = req.cookies?.refreshToken;

        if (rawToken) {
            await prisma.refresh_tokens.updateMany({
                where: { token: rawToken },
                data: { revoked: true },
            });
        }

        res.clearCookie("refreshToken", { path: "/api/v1/auth" });
        logger.info(`User ${req.user?.userId} logged out`);

        return res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ─── /me ──────────────────────────────────────────────────────────────────────
export const me = async (req, res) => {
    try {
        const user = await prisma.users.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                full_name: true,
                email: true,
                role: true,
                avatar_url: true,
                phone: true,
                address: true,
                must_change_password: true,
                created_at: true,
            },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(user);
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ─── Admin: reset a user's password ──────────────────────────────────────────
// POST /api/v1/auth/admin/reset-password
// Body: { userId, newPassword }
// Roles allowed: admin, super_admin
export const adminResetPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(422).json({
                message: "Validation failed",
                errors: {
                    userId: !userId ? ["userId is required"] : undefined,
                    newPassword: !newPassword
                        ? ["newPassword is required"]
                        : undefined,
                },
            });
        }

        const target = await prisma.users.findUnique({
            where: { id: userId },
            select: { id: true, role: true, full_name: true },
        });

        if (!target) {
            return res.status(404).json({ message: "User not found" });
        }

        // super_admin cannot be reset by a regular admin
        if (target.role === "super_admin" && req.user.role !== "super_admin") {
            return res.status(403).json({ message: "Insufficient privileges" });
        }

        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Revoke all existing refresh tokens and set must_change_password
        await prisma.$transaction([
            prisma.users.update({
                where: { id: userId },
                data: {
                    password_hash: hashed,
                    must_change_password: true,
                    failed_login_attempts: 0,
                    locked_until: null,
                },
            }),
            prisma.refresh_tokens.updateMany({
                where: { user_id: userId },
                data: { revoked: true },
            }),
        ]);

        logger.info(
            `Admin ${req.user.userId} reset password for user ${userId} (${target.full_name})`,
        );

        return res.status(200).json({
            message:
                "Password reset successfully. User must change it on next login.",
        });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// ─── Change own password (used when must_change_password is true) ─────────────
// POST /api/v1/auth/change-password
// Body: { currentPassword, newPassword }
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(422).json({
                message: "Validation failed",
                errors: {
                    currentPassword: !currentPassword
                        ? ["currentPassword is required"]
                        : undefined,
                    newPassword: !newPassword
                        ? ["newPassword is required"]
                        : undefined,
                },
            });
        }

        const user = await prisma.users.findUnique({
            where: { id: req.user.userId },
            select: { id: true, password_hash: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isValid = await bcrypt.compare(
            currentPassword,
            user.password_hash,
        );
        if (!isValid) {
            return res
                .status(401)
                .json({ message: "Current password is incorrect" });
        }

        if (currentPassword === newPassword) {
            return res.status(422).json({
                message: "New password must differ from current password",
            });
        }

        const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // Revoke all refresh tokens (forces re-login on other devices)
        await prisma.$transaction([
            prisma.users.update({
                where: { id: user.id },
                data: {
                    password_hash: hashed,
                    must_change_password: false,
                },
            }),
            prisma.refresh_tokens.updateMany({
                where: { user_id: user.id },
                data: { revoked: true },
            }),
        ]);

        // Clear current refresh-token cookie
        res.clearCookie("refreshToken", { path: "/api/v1/auth" });

        logger.info(`User ${user.id} changed their password`);

        return res
            .status(200)
            .json({ message: "Password changed successfully" });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
