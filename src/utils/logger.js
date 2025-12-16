import { createLogger, format, transports } from "winston";
import fs from "fs";
import path from "path";

const egyTimestamp = {
    format: () => {
        const now = new Date();
        const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Africa/Cairo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).formatToParts(now);

        const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

        return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`;
    },
};

const { combine, timestamp, printf, errors, colorize } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `[${timestamp}] ${level}: ${stack || message}`;
});

// Ensure logs directory exists (so file transports don't fail if directory is missing)
const logsDir = path.join(process.cwd(), "logs");
try {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
} catch (e) {
    // If we cannot create the directory, fall back to console-only logging below
    // but still proceed — Winston file transport will throw if it can't write.
}

const level =
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "development" ? "debug" : "info");

const logger = createLogger({
    level,
    format: combine(
        errors({ stack: true }),
        timestamp(egyTimestamp),
        logFormat
    ),
    transports: [
        new transports.File({
            filename: path.join(logsDir, "error.log"),
            level: "error",
        }),
        new transports.File({ filename: path.join(logsDir, "combined.log") }),
    ],
    exitOnError: false,
});
// By default (during development or when NODE_ENV is not 'production') log to console as well.
const shouldConsoleLog =
    process.env.LOG_TO_CONSOLE === "true" ||
    process.env.NODE_ENV !== "production";
if (shouldConsoleLog) {
    logger.add(
        new transports.Console({
            format: combine(
                colorize(),
                errors({ stack: true }),
                timestamp(egyTimestamp),
                logFormat
            ),
        })
    );
}

export default logger;
