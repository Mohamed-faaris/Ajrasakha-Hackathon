import { initializeApp, cert, ServiceAccount, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { z } from 'zod';

/**
 * Firebase Admin SDK Configuration
 *
 * To set up Firebase push notifications:
 *
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Select your project → Project Settings → Service Accounts
 * 3. Click "Generate new private key" to download the service account JSON
 * 4. Either:
 *    a) Set FIREBASE_SERVICE_ACCOUNT_JSON environment variable with the full JSON content
 *    b) OR set individual environment variables:
 *       - FIREBASE_PROJECT_ID
 *       - FIREBASE_PRIVATE_KEY
 *       - FIREBASE_CLIENT_EMAIL
 *
 * Example service account JSON structure:
 * {
 *   "type": "service_account",
 *   "project_id": "your-project-id",
 *   "private_key_id": "...",
 *   "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
 *   "client_email": "firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com",
 *   "client_id": "...",
 *   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
 *   "token_uri": "https://oauth2.googleapis.com/token",
 *   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
 *   "client_x509_cert_url": "..."
 * }
 */

// Firebase configuration schema
const firebaseConfigSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
});

// Parse and validate environment variables
const configResult = firebaseConfigSchema.safeParse(process.env);

let app: App | null = null;
let messaging: Messaging | null = null;
let isFirebaseConfigured = false;
let initializationAttempted = false;

function initializeFirebase(): void {
  if (initializationAttempted) return;
  initializationAttempted = true;

  // Re-read env vars at initialization time (after dotenv has loaded)
  const configResult = firebaseConfigSchema.safeParse(process.env);
  
  if (!configResult.success) {
    console.warn('[Firebase] Environment validation failed:', configResult.error.issues);
    return;
  }

  const { FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } =
    configResult.data;

  let serviceAccount: ServiceAccount | undefined;

  try {
    // Option 1: Parse full service account JSON
    if (FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        const parsed = JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
        serviceAccount = {
          projectId: parsed.project_id,
          privateKey: parsed.private_key?.replace(/\\n/g, '\n'),
          clientEmail: parsed.client_email,
        };
      } catch (parseError) {
        console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', parseError);
        return;
      }
    }
    // Option 2: Use individual environment variables
    else if (FIREBASE_PROJECT_ID && FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL) {
      serviceAccount = {
        projectId: FIREBASE_PROJECT_ID,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: FIREBASE_CLIENT_EMAIL,
      };
    }

    if (!serviceAccount) {
      console.warn('[Firebase] No configuration found. Push notifications will be disabled.');
      console.warn('[Firebase] Set FIREBASE_SERVICE_ACCOUNT_JSON or individual FIREBASE_* environment variables.');
      return;
    }

    // Initialize Firebase Admin SDK
    app = initializeApp({
      credential: cert(serviceAccount),
    });

    // Initialize Messaging service
    messaging = getMessaging(app);
    isFirebaseConfigured = true;

    console.log(`[Firebase] Admin SDK initialized for project: ${serviceAccount.projectId}`);
  } catch (error) {
    console.error('[Firebase] Failed to initialize Firebase Admin SDK:', error);
    isFirebaseConfigured = false;
  }
}

/**
 * Check if Firebase is properly configured and initialized
 */
export function isFirebaseReady(): boolean {
  if (!initializationAttempted) {
    initializeFirebase();
  }
  return isFirebaseConfigured && app !== null && messaging !== null;
}

/**
 * Get Firebase Admin app instance
 * @returns Firebase App instance or null if not configured
 */
export function getFirebaseApp(): App | null {
  if (!initializationAttempted) {
    initializeFirebase();
  }
  return app;
}

/**
 * Get Firebase Messaging instance for sending push notifications
 * @returns Firebase Messaging instance or null if not configured
 */
export function getFirebaseMessaging(): Messaging | null {
  if (!initializationAttempted) {
    initializeFirebase();
  }
  return messaging;
}

/**
 * Send a push notification to a specific device
 *
 * @param fcmToken - The FCM registration token of the target device
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional custom data payload
 * @returns Promise resolving to the message ID or null if Firebase not configured
 */
export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<string | null> {
  if (!isFirebaseReady() || !messaging) {
    console.warn('[Firebase] Cannot send notification: Firebase not configured');
    return null;
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high' as const,
        notification: {
          channelId: 'default',
          priority: 'high' as const,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log(`[Firebase] Notification sent successfully: ${response}`);
    return response;
  } catch (error) {
    console.error('[Firebase] Failed to send notification:', error);
    throw error;
  }
}

/**
 * Send push notification to multiple devices
 *
 * @param fcmTokens - Array of FCM registration tokens
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Optional custom data payload
 * @returns Promise resolving to the batch response or null if Firebase not configured
 */
export async function sendMulticastNotification(
  fcmTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number } | null> {
  if (!isFirebaseReady() || !messaging) {
    console.warn('[Firebase] Cannot send multicast: Firebase not configured');
    return null;
  }

  if (fcmTokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  try {
    const message = {
      tokens: fcmTokens,
      notification: {
        title,
        body,
      },
      data: data || {},
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log(
      `[Firebase] Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed`
    );

    // Log failed tokens
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`[Firebase] Failed to send to token ${fcmTokens[idx]}:`, resp.error);
        }
      });
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('[Firebase] Failed to send multicast:', error);
    throw error;
  }
}

// Export the messaging instance directly (null if not configured)
export { messaging };

// Note: To use this module, install firebase-admin:
// pnpm add firebase-admin
// or
// npm install firebase-admin
