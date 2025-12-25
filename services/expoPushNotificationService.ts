import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Expo Push Notification Service
 * 
 * NOTE: Getting Expo Push Tokens requires React Native/Expo.
 * This service handles sending notifications via Expo's HTTP API.
 * 
 * To get Expo push tokens, you'll need to:
 * 1. Install expo-notifications in your React Native app
 * 2. Use registerForPushNotificationsAsync() to get the token
 * 3. Save the token to Firestore under user.pushToken
 */

const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

export interface ExpoPushMessage {
  to: string;
  sound?: 'default';
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
}

/**
 * Send a push notification using Expo's HTTP API
 * This works from web, server, or React Native
 */
export const sendExpoPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> => {
  try {
    const message: ExpoPushMessage = {
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
      badge: 1,
    };

    const response = await fetch(EXPO_PUSH_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    
    if (result.data?.status === 'ok') {
      console.log('✅ Expo push notification sent successfully');
      return true;
    } else {
      console.error('❌ Failed to send Expo push notification:', result);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending Expo push notification:', error);
    return false;
  }
};

/**
 * Get partner's Expo push token from Firestore
 */
export const getPartnerExpoPushToken = async (
  roomId: string,
  currentUserId: string
): Promise<string | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('roomId', '==', roomId));
    const querySnapshot = await getDocs(q);
    
    for (const docSnap of querySnapshot.docs) {
      if (docSnap.id !== currentUserId) {
        const data = docSnap.data();
        if (data.pushToken) {
          console.log('📱 Found partner Expo push token');
          return data.pushToken;
        }
      }
    }
    console.log('⚠️ Partner has no Expo push token');
    return null;
  } catch (error) {
    console.error('Failed to get partner Expo push token:', error);
    return null;
  }
};

/**
 * Save Expo push token to user's Firestore document
 */
export const saveExpoPushToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      pushToken: token,
      pushTokenUpdatedAt: new Date().toISOString()
    });
    console.log('✅ Expo push token saved to Firestore');
  } catch (error) {
    console.error('❌ Failed to save Expo push token:', error);
    throw error;
  }
};

/**
 * Send match notification to partner using Expo push
 */
export const sendMatchNotificationToPartner = async (
  roomId: string,
  currentUserId: string,
  matchedNameHebrew: string
): Promise<boolean> => {
  try {
    // Get partner's Expo push token
    const partnerToken = await getPartnerExpoPushToken(roomId, currentUserId);
    
    if (!partnerToken) {
      console.log('⚠️ Cannot send notification - partner has no Expo push token');
      return false;
    }

    // Send notification via Expo API
    const success = await sendExpoPushNotification(
      partnerToken,
      'יש לכם התאמה! 👶',
      `שניכם אהבתם את השם "${matchedNameHebrew}"!`,
      {
        type: 'match',
        nameHebrew: matchedNameHebrew,
        roomId: roomId,
      }
    );

    return success;
  } catch (error) {
    console.error('Failed to send match notification:', error);
    return false;
  }
};
