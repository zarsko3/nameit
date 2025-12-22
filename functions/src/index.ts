/**
 * Firebase Cloud Functions for NameIT
 * 
 * This function sends push notifications when a new match is created.
 * 
 * To deploy:
 * 1. cd functions
 * 2. npm install
 * 3. firebase deploy --only functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface MatchData {
  nameId: string;
  roomId: string;
  timestamp: number;
  rating: number;
}

interface UserData {
  fcmToken?: string;
  name?: string;
  roomId?: string;
}

/**
 * Triggered when a new match document is created
 * Sends push notifications to all users in the room
 */
export const onMatchCreated = functions.firestore
  .document('matches/{matchId}')
  .onCreate(async (snap, context) => {
    const matchData = snap.data() as MatchData;
    const roomId = matchData.roomId;
    const nameId = matchData.nameId;

    console.log(`🎉 New match created: ${nameId} in room ${roomId}`);

    if (!roomId) {
      console.log('No roomId found in match data');
      return null;
    }

    try {
      // Get all users in this room
      const usersSnapshot = await db
        .collection('users')
        .where('roomId', '==', roomId)
        .get();

      if (usersSnapshot.empty) {
        console.log('No users found in room');
        return null;
      }

      // Collect FCM tokens
      const tokens: string[] = [];
      const userNames: string[] = [];

      usersSnapshot.forEach((doc) => {
        const userData = doc.data() as UserData;
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
          userNames.push(userData.name || 'משתמש');
        }
      });

      if (tokens.length === 0) {
        console.log('No FCM tokens found for users in room');
        return null;
      }

      console.log(`📱 Sending notifications to ${tokens.length} devices`);

      // Create the notification message
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: 'יש לכם התאמה! 👶',
          body: 'שניכם אהבתם את אותו השם!'
        },
        data: {
          type: 'match',
          nameId: nameId,
          roomId: roomId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        webpush: {
          notification: {
            title: 'יש לכם התאמה! 👶',
            body: 'שניכם אהבתם את אותו השם!',
            icon: '/LOGO.png',
            badge: '/LOGO.png',
            tag: `match-${nameId}`,
            renotify: true,
            requireInteraction: true,
            dir: 'rtl' as const,
            lang: 'he',
            vibrate: [200, 100, 200, 100, 200],
            actions: [
              { action: 'view', title: '👀 צפייה' },
              { action: 'dismiss', title: '❌ סגור' }
            ]
          },
          fcmOptions: {
            link: '/'
          }
        },
        android: {
          notification: {
            title: 'יש לכם התאמה! 👶',
            body: 'שניכם אהבתם את אותו השם!',
            icon: 'ic_notification',
            color: '#10B981',
            sound: 'default',
            channelId: 'matches'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: 'יש לכם התאמה! 👶',
                body: 'שניכם אהבתם את אותו השם!'
              },
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      // Send the notification
      const response = await messaging.sendEachForMulticast(message);
      
      console.log(`✅ Notifications sent: ${response.successCount} success, ${response.failureCount} failed`);

      // Log any failures
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`❌ Failed to send to token ${idx}:`, resp.error);
          }
        });
      }

      return { success: response.successCount, failed: response.failureCount };
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      throw error;
    }
  });

/**
 * Optional: Clean up invalid FCM tokens
 * Run this periodically to remove stale tokens
 */
export const cleanupInvalidTokens = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    console.log('🧹 Running token cleanup...');
    
    const usersSnapshot = await db.collection('users').get();
    const invalidTokenUsers: string[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data() as UserData;
      if (userData.fcmToken) {
        try {
          // Try to send a dry-run message to validate the token
          await messaging.send({
            token: userData.fcmToken,
            data: { test: 'true' }
          }, true); // dry run
        } catch (error: any) {
          if (error.code === 'messaging/registration-token-not-registered' ||
              error.code === 'messaging/invalid-registration-token') {
            invalidTokenUsers.push(userDoc.id);
          }
        }
      }
    }

    // Remove invalid tokens
    const batch = db.batch();
    for (const userId of invalidTokenUsers) {
      batch.update(db.collection('users').doc(userId), {
        fcmToken: admin.firestore.FieldValue.delete()
      });
    }
    
    if (invalidTokenUsers.length > 0) {
      await batch.commit();
      console.log(`🧹 Cleaned up ${invalidTokenUsers.length} invalid tokens`);
    } else {
      console.log('✅ No invalid tokens found');
    }

    return null;
  });







