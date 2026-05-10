import { config } from "dotenv";
import bcrypt from "bcrypt";
import { prisma } from "../config/connection.js";
import logger from "../utils/logger.js";

config();

/*
  Customize the super admin data below.
  The script checks by email; running it again with the same email will report the user already exists.
*/
const SUPER_ADMIN = {
    full_name: "Magda Madbouly",
    email: "magda_madbouly@example.com",
    password: "123456789", // change before first run
    role: "super_admin", // must match enum user_role
    phone: "+201234567890",
    avatar_url: null,
    national_id: "20907192200123", // integer or null
    address: "123 Admin St, Cairo, Egypt",
};

async function main() {
    // check existing by email
    const existing = await prisma.users.findUnique({
        where: { email: SUPER_ADMIN.email },
    });

    if (existing) {
        logger.info(
            `Super admin already exists: id=${existing.id} email=${existing.email} role=${existing.role}`
        );
        await prisma.$disconnect();
        return;
    }

    const password_hash = await bcrypt.hash(SUPER_ADMIN.password, 12);

    const newUser = await prisma.users.create({
        data: {
            full_name: SUPER_ADMIN.full_name,
            email: SUPER_ADMIN.email,
            password_hash,
            role: SUPER_ADMIN.role,
            phone: SUPER_ADMIN.phone,
            avatar_url: SUPER_ADMIN.avatar_url,
            national_id: SUPER_ADMIN.national_id,
            address: SUPER_ADMIN.address,
        },
        select: {
            id: true,
            email: true,
            full_name: true,
            role: true,
            created_at: true,
        },
    });

    logger.info("Super admin created:", newUser);
    await prisma.$disconnect();
}

main().catch(async (err) => {
    logger.error("Failed to create super admin:", err);
    await prisma.$disconnect();
    process.exit(1);
});
