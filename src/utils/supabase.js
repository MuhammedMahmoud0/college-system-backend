import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import logger from "./logger.js";

config();

// Verify env vars are loaded
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
}

export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        db: {
            schema: 'public',
        },
    }
);

logger.info("Supabase client initialized");
