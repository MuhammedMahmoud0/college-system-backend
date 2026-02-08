import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import logger from "../utils/logger.js";

config();

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
    log:
        process.env.NODE_ENV === "development"
            ? ["query", "info", "warn", "error"]
            : ["warn", "error"],
    adapter,
});

const connectDB = async () => {
    try {
        await prisma.$connect();
        logger.info("DB connected via Prisma");
    } catch (error) {
        logger.error(`Database connection error: ${error.message}`);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    await prisma.$disconnect();
    logger.info("Database disconnected successfully");
};

export { connectDB, disconnectDB, prisma };