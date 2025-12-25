import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import app, { db } from '../firebase';

// VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = 'BDailn00RHk3B32kaE0c8-uO3TTYdAoaUXf-JEEY39fLA5coNj10DIcE5xuY-fMtIH19IbFrTcZ9LGoBGwMfMGI';

// Firebase Cloud Messaging Server Key (for testing only - in production use Cloud Functions)
// Go to Firebase Console -> Project Settings -> Cloud Messaging -> Server key
const FCM_SERVER_KEY = ''; // Leave empty for now - will use Cloud Functions

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
 * Register the Firebase Messaging Service Worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    // Register the service worker from the public folder
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registered with scope:', registration.scope);
    
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker is ready');
    
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
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

    // Register service worker first
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('Failed to register service worker');
      return null;
    }

    // Initialize messaging if not already done
    if (!messaging) {
      messaging = getMessaging(app);
    }

    // Get FCM token with VAPID key
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('🔑 FCM Token obtained:', token.substring(0, 30) + '...');
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
      fcmTokenUpdatedAt: new Date().toISOString()
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
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('roomId', '==', roomId));
    const querySnapshot = await getDocs(q);
    
    for (const docSnap of querySnapshot.docs) {
      if (docSnap.id !== currentUserId) {
        const data = docSnap.data();
        if (data.fcmToken) {
          console.log('📱 Found partner FCM token');
          return data.fcmToken;
        }
      }
    }
    console.log('⚠️ Partner has no FCM token');
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
    messaging = getMessaging(app);
  }

  return onMessage(messaging, (payload) => {
    console.log('📬 Foreground message received:', payload);
    callback(payload);
  });
};

/**
 * Send a local notification (for testing when app is in foreground)
 */
export const showLocalNotification = (title: string, body: string, icon?: string): void => {
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  new Notification(title, {
    body,
    icon: icon || '/logo_new.png',
    badge: '/logo_new.png',
    tag: 'nameit-match',
    renotify: true,
    requireInteraction: true,
  });
};

/**
 * Trigger match notification to partner
 * This uses a workaround since we can't send FCM from client directly
 * 
 * Options:
 * 1. Firebase Cloud Function (recommended for production)
 * 2. Your own backend server
 * 3. For testing: Show local notification if user is in foreground
 */
export const triggerMatchNotification = async (
  roomId: string,
  currentUserId: string,
  matchedNameHebrew: string
): Promise<boolean> => {
  try {
    // Get partner's FCM token
    const partnerToken = await getPartnerFcmToken(roomId, currentUserId);
    
    if (!partnerToken) {
      console.log('⚠️ Cannot send notification - partner has no FCM token');
      return false;
    }

    // NOTE: Sending FCM messages from client-side is NOT secure
    // because it would expose your server key.
    // 
    // For production, use one of these approaches:
    // 
    // OPTION 1: Firebase Cloud Function (Recommended)
    // The function triggers automatically when a match document is created
    // See: functions/src/index.ts
    //
    // OPTION 2: Use Firebase Extensions
    // Install "Trigger Email" or create a custom extension
    //
    // For now, we'll log what would be sent and return true
    // The actual notification will be sent by the Cloud Function

    console.log('📤 Match notification would be sent:', {
      to: partnerToken.substring(0, 20) + '...',
      notification: {
        title: 'יש לכם התאמה! 👶',
        body: `שניכם אהבתם את השם "${matchedNameHebrew}"!`
      }
    });

    return true;
  } catch (error) {
    console.error('Failed to trigger match notification:', error);
    return false;
  }
};

/**
 * Test notification locally (shows notification on current device)
 */
export const testNotification = (): void => {
  if (Notification.permission === 'granted') {
    showLocalNotification(
      'יש לכם התאמה! 👶',
      'שניכם אהבתם את אותו השם!',
      '/logo_new.png'
    );
  } else {
    console.warn('Permission not granted. Request permission first.');
  }
};
