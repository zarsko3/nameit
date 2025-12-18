import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import app, { db } from '../firebase';

// Your VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = 'YOUR_VAPID_KEY_HERE'; // TODO: Replace with your actual VAPID key

let messaging: ReturnType<typeof getMessaging> | null = null;

/**
 * Initialize Firebase Messaging (only works in browser with service worker support)
 */
export const initializeMessaging = async (): Promise<ReturnType<typeof getMessaging> | null> => {
  if (typeof window === 'undefined') return null;
  
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('⚠️ This browser does not support notifications');
    return null;
  }

  // Check if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service workers not supported');
    return null;
  }

  try {
    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging initialized');
    return messaging;
  } catch (error) {
    console.error('Failed to initialize messaging:', error);
    return null;
  }
};

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('🔕 Notification permission denied');
      return null;
    }

    console.log('🔔 Notification permission granted');

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('✅ Service Worker registered:', registration);

    // Get messaging instance
    if (!messaging) {
      messaging = getMessaging(app);
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('🔑 FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('⚠️ No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    return null;
  }
};

/**
 * Save FCM token to user's Firestore document
 */
export const saveFcmToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      fcmToken: token,
      fcmTokenUpdatedAt: new Date()
    });
    console.log('✅ FCM token saved to Firestore');
  } catch (error) {
    console.error('❌ Failed to save FCM token:', error);
    throw error;
  }
};

/**
 * Get partner's FCM token from Firestore
 */
export const getPartnerFcmToken = async (roomId: string, currentUserId: string): Promise<string | null> => {
  try {
    // Query users in the same room
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('roomId', '==', roomId));
    const querySnapshot = await getDocs(q);
    
    for (const docSnap of querySnapshot.docs) {
      if (docSnap.id !== currentUserId) {
        const data = docSnap.data();
        if (data.fcmToken) {
          return data.fcmToken;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get partner FCM token:', error);
    return null;
  }
};

/**
 * Listen for foreground messages (when app is open)
 */
export const onForegroundMessage = (callback: (payload: MessagePayload) => void): (() => void) | null => {
  if (!messaging) {
    console.warn('Messaging not initialized');
    return null;
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 Foreground message received:', payload);
    callback(payload);
  });
};

/**
 * Send push notification via Firebase Cloud Messaging REST API
 * NOTE: This is for TESTING ONLY - in production, use Firebase Cloud Functions
 * because sending from client exposes your server key
 */
export const sendMatchNotification = async (
  partnerToken: string,
  matchedNameHebrew: string
): Promise<boolean> => {
  // In production, this should be done via Firebase Cloud Functions
  // For now, we'll just log what would be sent
  console.log('📤 Would send notification to partner:', {
    token: partnerToken.substring(0, 20) + '...',
    title: 'יש לכם התאמה! 👶',
    body: `שניכם אהבתם את השם "${matchedNameHebrew}"!`
  });

  // To actually send notifications, you need a Firebase Cloud Function
  // See the CLOUD_FUNCTION_EXAMPLE below
  
  return true;
};

/**
 * CLOUD FUNCTION EXAMPLE (for reference)
 * 
 * Create a file: functions/src/index.ts
 * 
 * ```typescript
 * import * as functions from 'firebase-functions';
 * import * as admin from 'firebase-admin';
 * 
 * admin.initializeApp();
 * 
 * export const sendMatchNotification = functions.firestore
 *   .document('matches/{matchId}')
 *   .onCreate(async (snap, context) => {
 *     const match = snap.data();
 *     const roomId = match.roomId;
 *     
 *     // Get all users in the room
 *     const usersSnapshot = await admin.firestore()
 *       .collection('users')
 *       .where('roomId', '==', roomId)
 *       .get();
 *     
 *     const tokens: string[] = [];
 *     usersSnapshot.forEach(doc => {
 *       const token = doc.data().fcmToken;
 *       if (token) tokens.push(token);
 *     });
 *     
 *     if (tokens.length === 0) return;
 *     
 *     // Get the matched name
 *     // ... fetch name details ...
 *     
 *     const message = {
 *       notification: {
 *         title: 'יש לכם התאמה! 👶',
 *         body: 'שניכם אהבתם את אותו השם!'
 *       },
 *       tokens: tokens
 *     };
 *     
 *     return admin.messaging().sendEachForMulticast(message);
 *   });
 * ```
 */

