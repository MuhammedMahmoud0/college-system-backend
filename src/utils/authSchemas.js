import { z } from "zod";

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
    email: z.string().email("Invalid email format").max(255),
    password: z.string().min(1, "Password is required").max(128),
});

// ── Admin reset password ──────────────────────────────────────────────────────
export const adminResetPasswordSchema = z.object({
    userId: z.string().uuid("userId must be a valid UUID"),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters")
        .max(128),
});

// ── Change own password ───────────────────────────────────────────────────────
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: z
        .string()
        .min(8, "New password must be at least 8 characters")
        .max(128),
});
