import admin from 'firebase-admin';
import logger from './logger.js';

// Initialize Firebase Admin
// Note: In production, you should use environment variables to configure Firebase (e.g., GOOGLE_APPLICATION_CREDENTIALS)
// The service account JSON can be loaded or passed as an env var.
let isFirebaseInitialized = false;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isFirebaseInitialized = true;
        logger.info('Firebase Admin initialized successfully.');
    } else {
        logger.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not set. FCM Notifications will be bypassed.');
    }
} catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error);
}

/**
 * Sends a notification to specific device tokens (unicast/multicast)
 *
 * @param {string[]} tokens - Array of FCM device tokens
 * @param {object} payload - Notification payload { title, body, data }
 * @returns {Promise<import('firebase-admin').messaging.BatchResponse | null>}
 */
export async function sendToTokens(tokens, payload) {
    if (!isFirebaseInitialized || tokens.length === 0) return null;

    const message = {
        notification: {
            title: payload.title || 'Notification',
            body: payload.body || '',
        },
        data: payload.data || {},
        tokens: tokens,
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        logger.info(`${response.successCount} messages sent successfully, ${response.failureCount} failed.`);
        return response;
    } catch (error) {
        logger.error('Error sending FCM message:', error);
        return null;
    }
}

/**
 * Sends a general broadcast by iterating over all active tokens
 * In reality, you'd batch them in chunks (Firebase limit is 500 per multicast call)
 */
export async function broadcastGlobal(activeTokens, payload) {
    if (!isFirebaseInitialized || activeTokens.length === 0) return null;

    const chunkSize = 500;
    let successCount = 0;
    let failureCount = 0;
    const failedTokens = [];

    for (let i = 0; i < activeTokens.length; i += chunkSize) {
        const chunk = activeTokens.slice(i, i + chunkSize);
        const response = await sendToTokens(chunk, payload);
        
        if (response) {
            successCount += response.successCount;
            failureCount += response.failureCount;
            
            // Collect dead tokens to deactivate them later
            response.responses.forEach((res, idx) => {
                if (!res.success) {
                    const errorCode = res.error?.code;
                    if (
                        errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered'
                    ) {
                        failedTokens.push(chunk[idx]);
                    }
                }
            });
        }
    }

    return { successCount, failureCount, failedTokens };
}
