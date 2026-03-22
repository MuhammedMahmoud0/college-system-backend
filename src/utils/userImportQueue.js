import IORedis from "ioredis";
import { Queue, Worker } from "bullmq";
import logger from "./logger.js";
import {
    processExcelStudentsBuffer,
    processExcelUsersBuffer,
} from "./userImportService.js";

const USER_IMPORT_QUEUE_NAME = "user_excel_imports";

let userImportQueue;
let userImportWorker;
let isQueueReady = false;
let isQueueShuttingDown = false;

const isRedisNetworkError = (error) => {
    if (!error) {
        return false;
    }

    if (
        error.code === "ETIMEDOUT" ||
        error.code === "ECONNRESET" ||
        error.code === "ECONNREFUSED"
    ) {
        return true;
    }

    const message = (error.message || "").toLowerCase();
    return (
        message.includes("etimedout") ||
        message.includes("econnreset") ||
        message.includes("econnrefused") ||
        message.includes("connection is closed") ||
        message.includes("stream isn't writeable") ||
        message.includes("enableofflinequeue")
    );
};

const getQueueConnectionConfig = () => {
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }

    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT
        ? Number.parseInt(process.env.REDIS_PORT, 10)
        : 6379;

    if (!host) {
        return null;
    }

    return {
        host,
        port,
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB
            ? Number.parseInt(process.env.REDIS_DB, 10)
            : 0,
    };
};

const getBullMQConnectionConfig = (connectionConfig) => {
    const baseOptions = {
        connectTimeout: process.env.REDIS_CONNECT_TIMEOUT_MS
            ? Number.parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS, 10)
            : 10000,
        // ✅ FIX 1: allow buffering
        enableOfflineQueue: true,

        // ✅ REQUIRED by BullMQ
        maxRetriesPerRequest: null,

        enableReadyCheck: true,

        // ✅ FIX 2: NEVER stop retrying
        retryStrategy: (times) => {
            return Math.min(times * 500, 3000);
        },

        // ✅ FIX 3: keep connection alive
        keepAlive: 30000,
    };

    if (typeof connectionConfig === "string") {
        const parsed = new URL(connectionConfig);
        const dbFromPath = parsed.pathname
            ? Number.parseInt(parsed.pathname.replace("/", ""), 10)
            : Number.NaN;

        return {
            ...baseOptions,
            host: parsed.hostname,
            port: parsed.port ? Number.parseInt(parsed.port, 10) : 6379,
            username: parsed.username || undefined,
            password: parsed.password || undefined,
            db: Number.isNaN(dbFromPath) ? 0 : dbFromPath,
            tls: parsed.protocol === "rediss:" ? {} : undefined,
        };
    }

    return {
        ...connectionConfig,
        ...baseOptions,
    };
};

const toProgressPercent = (processed, total) => {
    if (!total || total <= 0) return 0;
    return Math.min(99, Math.round((processed / total) * 100));
};

const processImportJob = async (job) => {
    const { importType, fileBufferBase64 } = job.data;
    const fileBuffer = Buffer.from(fileBufferBase64, "base64");

    const onProgress = ({ processed, total }) => {
        job.updateProgress(toProgressPercent(processed, total));
    };

    let result;
    if (importType === "students") {
        result = await processExcelStudentsBuffer(fileBuffer, { onProgress });
    } else {
        result = await processExcelUsersBuffer(fileBuffer, { onProgress });
    }

    if (!result.success) {
        throw new Error(result.payload?.error || "Import processing failed");
    }

    await job.updateProgress(100);
    return {
        importType,
        ...result.payload,
    };
};

export const isUserImportQueueEnabled = () => isQueueReady;

const resetQueueRuntimeState = () => {
    isQueueReady = false;
    userImportQueue = undefined;
    userImportWorker = undefined;
    isQueueShuttingDown = false;
};

const closeQueueRuntime = async () => {
    const closeWorkerPromise = userImportWorker
        ? userImportWorker.close()
        : Promise.resolve();
    const closeQueuePromise = userImportQueue
        ? userImportQueue.close()
        : Promise.resolve();

    await Promise.allSettled([closeWorkerPromise, closeQueuePromise]);
};

const disableQueueOnRedisNetworkFailure = async (error) => {
    if (isQueueShuttingDown) {
        return;
    }

    if (!userImportQueue && !userImportWorker) {
        return;
    }

    isQueueShuttingDown = true;
    const reason = error?.code || error?.message || "unknown network failure";
    logger.warn(
        `[UserImportQueue] Redis became unreachable (${reason}). Disabling queue and falling back to synchronous imports.`
    );

    try {
        await closeQueueRuntime();
    } catch (closeError) {
        logger.error(
            "[UserImportQueue] Failed to close queue runtime:",
            closeError
        );
    } finally {
        resetQueueRuntimeState();
    }
};

export const initializeUserImportQueue = async () => {
    const connectionConfig = getQueueConnectionConfig();

    if (!connectionConfig) {
        logger.warn(
            "[UserImportQueue] Queue disabled: REDIS_URL or REDIS_HOST is not configured"
        );
        resetQueueRuntimeState();
        return;
    }

    if (isQueueReady && userImportQueue && userImportWorker) {
        return;
    }

    try {
        // Use a temporary IORedis instance only to verify connectivity.
        // Queue and Worker receive the raw config so BullMQ manages its own
        // connections — passing a pre-existing instance causes BullMQ to call
        // .duplicate() which inherits lazyConnect:true and never connects.
        const checkConnection = new IORedis(connectionConfig, {
            lazyConnect: true,
            connectTimeout: process.env.REDIS_CONNECT_TIMEOUT_MS
                ? Number.parseInt(process.env.REDIS_CONNECT_TIMEOUT_MS, 10)
                : 10000,
            maxRetriesPerRequest: null,
            retryStrategy: () => null,
        });

        checkConnection.on("error", (error) => {
            const message = error?.message || "Unknown Redis error";
            if (
                message.includes("NOAUTH") ||
                message.includes("WRONGPASS") ||
                message.includes("Connection is closed")
            ) {
                logger.warn(
                    `[UserImportQueue] Redis connection issue: ${message}`
                );
                return;
            }
            logger.error("[UserImportQueue] Redis connection error:", error);
        });

        await checkConnection.connect();
        await checkConnection.ping();
        await checkConnection.quit();

        // Pass normalized connection options that ioredis understands.
        const bullmqConnection = getBullMQConnectionConfig(connectionConfig);

        userImportQueue = new Queue(USER_IMPORT_QUEUE_NAME, {
            connection: bullmqConnection,
            defaultJobOptions: {
                attempts: 1,
                removeOnComplete: { count: 100 },
                removeOnFail: { count: 100 },
            },
        });

        userImportWorker = new Worker(
            USER_IMPORT_QUEUE_NAME,
            processImportJob,
            {
                connection: bullmqConnection,
                concurrency: process.env.USER_IMPORT_WORKER_CONCURRENCY
                    ? Number.parseInt(
                          process.env.USER_IMPORT_WORKER_CONCURRENCY,
                          10
                      )
                    : 3,
            }
        );

        userImportQueue.on("error", (error) => {
            if (isRedisNetworkError(error)) {
                void disableQueueOnRedisNetworkFailure(error);
                return;
            }
            logger.error("[UserImportQueue] Queue Redis error:", error);
        });

        userImportWorker.on("error", (error) => {
            if (isRedisNetworkError(error)) {
                void disableQueueOnRedisNetworkFailure(error);
                return;
            }
            logger.error("[UserImportQueue] Worker Redis error:", error);
        });

        userImportWorker.on("completed", (job) => {
            logger.info(
                `[UserImportQueue] Job ${job.id} completed for ${job.data.importType}`
            );
        });

        userImportWorker.on("failed", (job, err) => {
            logger.error(
                `[UserImportQueue] Job ${job?.id || "unknown"} failed:`,
                err
            );
        });

        isQueueReady = true;
        logger.info("[UserImportQueue] Queue and worker initialized");
    } catch (err) {
        logger.error(
            "[UserImportQueue] Failed to initialize queue. Falling back to synchronous imports. Check REDIS_PASSWORD/REDIS_URL.",
            err
        );

        resetQueueRuntimeState();
    }
};

export const enqueueUserImportJob = async ({
    importType,
    fileBuffer,
    requestedBy,
}) => {
    if (!userImportQueue) {
        throw new Error("User import queue is not initialized");
    }

    return userImportQueue.add("process-user-excel", {
        importType,
        requestedBy,
        fileBufferBase64: fileBuffer.toString("base64"),
    });
};

export const getUserImportJobStatus = async (jobId) => {
    if (!userImportQueue) {
        throw new Error("User import queue is not initialized");
    }

    const job = await userImportQueue.getJob(jobId);
    if (!job) {
        return null;
    }

    const state = await job.getState();

    return {
        jobId: String(job.id),
        state,
        progress:
            typeof job.progress === "number"
                ? job.progress
                : Number.parseInt(job.progress, 10) || 0,
        attemptsMade: job.attemptsMade,
        createdAt: job.timestamp,
        processedOn: job.processedOn || null,
        finishedOn: job.finishedOn || null,
        failedReason: job.failedReason || null,
        result: state === "completed" ? job.returnvalue : null,
    };
};
