/**
 * Generic Zod validation middleware factory.
 *
 * Usage:
 *   router.post("/login", validate(loginSchema), loginController);
 *
 * On failure → 422 with flattened field errors.
 * On success  → req.body is replaced with the parsed (safe) data.
 */
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        return res.status(422).json({
            message: "Validation failed",
            errors: result.error.flatten().fieldErrors,
        });
    }

    req.body = result.data;
    next();
};
