import admin from 'firebase-admin';
import * as fs from 'fs';
import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';

let isInitialized = false;

const initializeFirebase = (): void => {
  if (isInitialized) return;

  if (!env.firebaseServiceAccountKey) {
    console.warn('⚠️  Firebase service account key not set. Push notifications disabled.');
    return;
  }

  if (!fs.existsSync(env.firebaseServiceAccountKey)) {
    console.warn(`⚠️  Firebase service account file not found at: ${env.firebaseServiceAccountKey}. Push notifications disabled.`);
    return;
  }

  try {
    const serviceAccount = JSON.parse(
      fs.readFileSync(env.firebaseServiceAccountKey, 'utf8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    isInitialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
};

initializeFirebase();

export interface FcmPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/** FCM error codes that mean the token is permanently invalid */
const STALE_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/**
 * Send notification to a single device token.
 * If the token is invalid, it is automatically cleared from the DB.
 */
export const sendToDevice = async (
  token: string,
  payload: FcmPayload,
  userId?: string
): Promise<void> => {
  if (!isInitialized || !token) return;

  try {
    await admin.messaging().send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'default_channel' },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    });
  } catch (error: unknown) {
    const code = (error as { code?: string }).code ?? '';
    if (userId && STALE_TOKEN_CODES.has(code)) {
      console.warn(`🗑️  Clearing stale FCM token for user ${userId} (${code})`);
      await userRepository.clearFcmToken(userId).catch(() => {});
    } else {
      console.error('FCM sendToDevice error:', error);
    }
  }
};

/**
 * Send notification to multiple device tokens (multicast).
 * Invalid tokens are automatically cleared from the DB per-failure.
 */
export const sendMulticast = async (
  tokens: string[],
  payload: FcmPayload,
  userIdByToken?: Record<string, string>
): Promise<void> => {
  if (!isInitialized || !tokens.length) return;

  const validTokens = tokens.filter(Boolean);
  if (!validTokens.length) return;

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: validTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'default_channel' },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    });

    console.log(
      `FCM multicast: ${response.successCount} sent, ${response.failureCount} failed`
    );

    // Clean up stale tokens per-failure
    response.responses.forEach((resp, i) => {
      if (!resp.success) {
        const code = resp.error?.code ?? '';
        const token = validTokens[i];
        if (STALE_TOKEN_CODES.has(code) && userIdByToken?.[token]) {
          const uid = userIdByToken[token];
          console.warn(`🗑️  Clearing stale FCM token for user ${uid} (${code})`);
          userRepository.clearFcmToken(uid).catch(() => {});
        } else {
          console.error(`FCM multicast failure for token[${i}]:`, resp.error);
        }
      }
    });
  } catch (error) {
    console.error('FCM sendMulticast error:', error);
  }
};
